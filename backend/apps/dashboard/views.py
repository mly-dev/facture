from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import (
    Sum, Count, F, ExpressionWrapper, DecimalField, Value
)
from django.db.models.functions import Coalesce
from datetime import date, timedelta
from decimal import Decimal
import calendar

from apps.invoices.models import Invoice, InvoiceItem, Payment

# Reusable ORM expression: item TTC = qty * unit_price * (1 + tax_rate/100)
ITEM_TTC = ExpressionWrapper(
    F('quantity') * F('unit_price') + F('quantity') * F('unit_price') * F('tax_rate') / 100,
    output_field=DecimalField(max_digits=20, decimal_places=4)
)

ZERO = Value(Decimal('0'), output_field=DecimalField(max_digits=20, decimal_places=4))

MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']


def _sum_ttc(items_qs):
    return items_qs.aggregate(total=Coalesce(Sum(ITEM_TTC), ZERO))['total']


def _sum_paid(payments_qs):
    return payments_qs.aggregate(total=Coalesce(Sum('amount'), ZERO))['total']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    company = request.user.company
    now = timezone.now().date()
    first_of_month = now.replace(day=1)

    invoices_qs = Invoice.objects.filter(company=company)

    # ── All-time totals via ORM (no Python loops) ──────────────────────────
    total_invoiced = _sum_ttc(
        InvoiceItem.objects.filter(invoice__company=company).exclude(invoice__status='annulee')
    )

    total_paid = _sum_paid(
        Payment.objects.filter(invoice__company=company).exclude(invoice__status='annulee')
    )

    # Pending = TTC of open invoices − their payments
    pending_ttc = _sum_ttc(
        InvoiceItem.objects.filter(
            invoice__company=company,
            invoice__status__in=['envoyee', 'partielle']
        )
    )
    pending_paid = _sum_paid(
        Payment.objects.filter(
            invoice__company=company,
            invoice__status__in=['envoyee', 'partielle']
        )
    )
    total_pending = max(pending_ttc - pending_paid, Decimal('0'))

    # ── This month ─────────────────────────────────────────────────────────
    month_total = _sum_ttc(
        InvoiceItem.objects.filter(
            invoice__company=company,
            invoice__issue_date__gte=first_of_month
        ).exclude(invoice__status='annulee')
    )
    month_paid = _sum_paid(
        Payment.objects.filter(
            invoice__company=company,
            invoice__issue_date__gte=first_of_month
        ).exclude(invoice__status='annulee')
    )

    # ── Counts ─────────────────────────────────────────────────────────────
    invoice_count = invoices_qs.exclude(status='annulee').count()
    overdue_count = invoices_qs.filter(
        status__in=['envoyee', 'partielle'],
        due_date__lt=now
    ).count()

    status_counts = {
        s: invoices_qs.filter(status=s).count()
        for s, _ in Invoice.STATUS_CHOICES
    }

    # ── Monthly chart: last 6 calendar months ──────────────────────────────
    monthly_data = []
    for i in range(5, -1, -1):
        # Step back i months from current month
        month_date = now.replace(day=1) - timedelta(days=i * 28)
        month_start = month_date.replace(day=1)
        last_day = calendar.monthrange(month_start.year, month_start.month)[1]
        month_end = month_start.replace(day=last_day)

        m_ttc = _sum_ttc(
            InvoiceItem.objects.filter(
                invoice__company=company,
                invoice__issue_date__gte=month_start,
                invoice__issue_date__lte=month_end,
            ).exclude(invoice__status='annulee')
        )
        m_paid = _sum_paid(
            Payment.objects.filter(
                invoice__company=company,
                invoice__issue_date__gte=month_start,
                invoice__issue_date__lte=month_end,
            ).exclude(invoice__status='annulee')
        )
        m_count = invoices_qs.filter(
            issue_date__gte=month_start,
            issue_date__lte=month_end
        ).exclude(status='annulee').count()

        monthly_data.append({
            'month': f"{MONTHS_FR[month_start.month - 1]} {month_start.year}",
            'month_short': MONTHS_FR[month_start.month - 1],
            'year': month_start.year,
            'month_num': month_start.month,
            'total': float(m_ttc),
            'paid': float(m_paid),
            'count': m_count,
        })

    # ── Recent invoices (5) — prefetch to avoid N+1 ────────────────────────
    recent_qs = invoices_qs.select_related('client').prefetch_related(
        'items', 'payments'
    ).order_by('-created_at')[:5]
    recent_invoices = [
        {
            'id': inv.id,
            'invoice_number': inv.invoice_number,
            'client_name': inv.client.name,
            'status': inv.status,
            'total_ttc': float(inv.total_ttc),
            'issue_date': inv.issue_date.strftime('%Y-%m-%d'),
        }
        for inv in recent_qs
    ]

    # ── Top clients via ORM ────────────────────────────────────────────────
    top_clients_qs = InvoiceItem.objects.filter(
        invoice__company=company
    ).exclude(invoice__status='annulee').values(
        client_id=F('invoice__client__id'),
        client_name=F('invoice__client__name'),
    ).annotate(
        total=Coalesce(Sum(ITEM_TTC), ZERO),
        count=Count('invoice', distinct=True),
    ).order_by('-total')[:5]

    top_clients = [
        {
            'id': c['client_id'],
            'name': c['client_name'],
            'total': float(c['total']),
            'count': c['count'],
        }
        for c in top_clients_qs
    ]

    return Response({
        'total_invoiced': float(total_invoiced),
        'total_paid': float(total_paid),
        'total_pending': float(total_pending),
        'invoice_count': invoice_count,
        'month_total': float(month_total),
        'month_paid': float(month_paid),
        'overdue_count': overdue_count,
        'status_counts': status_counts,
        'monthly_data': monthly_data,
        'recent_invoices': recent_invoices,
        'top_clients': top_clients,
    })
