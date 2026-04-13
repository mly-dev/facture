from django.db import models
from apps.accounts.models import Company


class Product(models.Model):
    UNIT_CHOICES = [
        ('piece', 'Pièce'),
        ('heure', 'Heure'),
        ('forfait', 'Forfait'),
        ('kg', 'Kilogramme'),
        ('litre', 'Litre'),
        ('metre', 'Mètre'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='piece')
    category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company.name})"
