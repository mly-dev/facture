from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from .models import Invoice, Payment
from .serializers import InvoiceListSerializer, InvoiceDetailSerializer, PaymentSerializer
from .pdf_generator import generate_invoice_pdf


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client']
    search_fields = ['invoice_number', 'client__name']
    ordering_fields = ['created_at', 'issue_date', 'due_date', 'invoice_number']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Invoice.objects.filter(
            company=self.request.user.company
        ).select_related('client', 'company').prefetch_related('items', 'payments')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(issue_date__gte=date_from)
        if date_to:
            qs = qs.filter(issue_date__lte=date_to)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceDetailSerializer

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == 'brouillon':
            invoice.status = 'envoyee'
            invoice.save(update_fields=['status'])
        return Response(InvoiceDetailSerializer(invoice).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'annulee'
        invoice.save(update_fields=['status'])
        return Response(InvoiceDetailSerializer(invoice).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_bytes = generate_invoice_pdf(invoice)
        if pdf_bytes is None:
            return Response(
                {'detail': 'WeasyPrint non disponible. Installez weasyprint pour la génération PDF.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        filename = f"{invoice.invoice_number}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'])
    def payment(self, request, pk=None):
        invoice = self.get_object()
        serializer = PaymentSerializer(data=request.data)
        if serializer.is_valid():
            payment = serializer.save(invoice=invoice)
            invoice.refresh_from_db()
            return Response({
                'payment': PaymentSerializer(payment).data,
                'invoice': InvoiceDetailSerializer(invoice).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path=r'payment/(?P<payment_id>\d+)')
    def delete_payment(self, request, pk=None, payment_id=None):
        invoice = self.get_object()
        try:
            payment = invoice.payments.get(id=payment_id)
            payment.delete()
            invoice.refresh_from_db()
            # Recalculate status: revert to original pre-payment status if no payments remain
            if invoice.status != 'annulee':
                paid = invoice.total_paid
                ttc = invoice.total_ttc
                if paid >= ttc and ttc > 0:
                    invoice.status = 'payee'
                elif paid > 0:
                    invoice.status = 'partielle'
                elif invoice.status in ['payee', 'partielle']:
                    # Had payments before, now fully reverted — go back to envoyee
                    invoice.status = 'envoyee'
                invoice.save(update_fields=['status'])
            return Response(InvoiceDetailSerializer(invoice).data)
        except Payment.DoesNotExist:
            return Response({'detail': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)
