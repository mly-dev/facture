from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment
from apps.clients.serializers import ClientSerializer
from apps.products.serializers import ProductSerializer


class InvoiceItemSerializer(serializers.ModelSerializer):
    total_ht = serializers.ReadOnlyField()
    total_tva = serializers.ReadOnlyField()
    total_ttc = serializers.ReadOnlyField()
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'product', 'product_detail', 'description',
            'quantity', 'unit_price', 'tax_rate',
            'total_ht', 'total_tva', 'total_ttc'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'payment_date', 'method', 'reference', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class InvoiceListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    total_ttc = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()
    balance_due = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'client_name',
            'status', 'issue_date', 'due_date',
            'total_ttc', 'total_paid', 'balance_due', 'created_at'
        ]


class InvoiceDetailSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    payments = PaymentSerializer(many=True, read_only=True)
    client_detail = ClientSerializer(source='client', read_only=True)
    total_ht = serializers.ReadOnlyField()
    total_tva = serializers.ReadOnlyField()
    total_ttc = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()
    balance_due = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'client_detail',
            'status', 'issue_date', 'due_date', 'notes',
            'items', 'payments',
            'total_ht', 'total_tva', 'total_ttc', 'total_paid', 'balance_due',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)

        return instance
