from django.db import models
from django.utils import timezone
from apps.accounts.models import Company
from apps.clients.models import Client
from apps.products.models import Product


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoyee', 'Envoyée'),
        ('payee', 'Payée'),
        ('partielle', 'Partiellement payée'),
        ('annulee', 'Annulée'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invoices')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='brouillon')
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} - {self.client.name}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self._generate_number()
        super().save(*args, **kwargs)

    def _generate_number(self):
        year = timezone.now().year
        last = Invoice.objects.filter(
            company=self.company,
            invoice_number__startswith=f'FAC-{year}-'
        ).order_by('-invoice_number').first()

        if last:
            try:
                seq = int(last.invoice_number.split('-')[-1]) + 1
            except ValueError:
                seq = 1
        else:
            seq = 1
        return f'FAC-{year}-{seq:04d}'

    @property
    def total_ht(self):
        return sum(item.total_ht for item in self.items.all())

    @property
    def total_tva(self):
        return sum(item.total_tva for item in self.items.all())

    @property
    def total_ttc(self):
        return sum(item.total_ttc for item in self.items.all())

    @property
    def total_paid(self):
        return sum(p.amount for p in self.payments.all())

    @property
    def balance_due(self):
        return self.total_ttc - self.total_paid

    def update_status(self):
        paid = self.total_paid
        ttc = self.total_ttc
        if self.status == 'annulee':
            return
        if paid >= ttc and ttc > 0:
            self.status = 'payee'
        elif paid > 0:
            self.status = 'partielle'
        self.save(update_fields=['status'])


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)

    def __str__(self):
        return f"{self.description} x{self.quantity}"

    @property
    def total_ht(self):
        return self.quantity * self.unit_price

    @property
    def total_tva(self):
        return self.total_ht * self.tax_rate / 100

    @property
    def total_ttc(self):
        return self.total_ht + self.total_tva


class Payment(models.Model):
    METHOD_CHOICES = [
        ('orange_money', 'Orange Money'),
        ('airtel_money', 'Airtel Money'),
        ('virement', 'Virement bancaire'),
        ('especes', 'Espèces'),
        ('carte', 'Carte bancaire'),
        ('cheque', 'Chèque'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Paiement {self.amount} FCFA - {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.update_status()
