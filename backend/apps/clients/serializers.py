from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    invoice_count = serializers.SerializerMethodField()
    total_invoiced = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone', 'address', 'created_at', 'invoice_count', 'total_invoiced']
        read_only_fields = ['id', 'created_at']

    def get_invoice_count(self, obj):
        return obj.invoices.count()

    def get_total_invoiced(self, obj):
        total = 0
        for inv in obj.invoices.exclude(status='annulee').prefetch_related('items'):
            total += inv.total_ttc
        return float(total)
