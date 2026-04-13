from django.template.loader import render_to_string
from django.conf import settings
from pathlib import Path
import os


def number_to_words_fr(n):
    """Convert a number to French words for the 'Arrêtée à la somme de' line."""
    if n == 0:
        return "zéro"

    ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
            'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
            'dix-sept', 'dix-huit', 'dix-neuf']
    tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante',
            'soixante', 'quatre-vingt', 'quatre-vingt']

    def below_thousand(num):
        if num == 0:
            return ''
        elif num < 20:
            return ones[num]
        elif num < 100:
            t = num // 10
            o = num % 10
            if t == 7:
                return 'soixante-' + ones[10 + o]
            elif t == 9:
                return 'quatre-vingt-' + ones[o] if o else 'quatre-vingts'
            else:
                return tens[t] + ('-' + ones[o] if o else '')
        else:
            h = num // 100
            r = num % 100
            prefix = ('cent' if h == 1 else ones[h] + ' cent')
            if r:
                return prefix + ' ' + below_thousand(r)
            else:
                return prefix + 's' if h > 1 else prefix

    n = int(n)
    if n >= 1_000_000:
        millions = n // 1_000_000
        rest = n % 1_000_000
        word = below_thousand(millions) + ' million' + ('s' if millions > 1 else '')
        if rest:
            word += ' ' + number_to_words_fr(rest)
        return word
    elif n >= 1000:
        thousands = n // 1000
        rest = n % 1000
        if thousands == 1:
            word = 'mille'
        else:
            word = below_thousand(thousands) + ' mille'
        if rest:
            word += ' ' + below_thousand(rest)
        return word
    else:
        return below_thousand(n)


def generate_invoice_pdf(invoice):
    try:
        from weasyprint import HTML
        from weasyprint.text.fonts import FontConfiguration
    except ImportError:
        return None

    company = invoice.company

    # Build a proper file:// URI for the logo so WeasyPrint works on Windows & Linux
    logo_uri = None
    if company.logo and company.logo.name:
        logo_path = Path(settings.MEDIA_ROOT) / company.logo.name
        if logo_path.exists():
            logo_uri = logo_path.as_uri()  # → file:///C:/...  or  file:///home/...

    total_ttc_int = int(invoice.total_ttc)
    amount_in_words = number_to_words_fr(total_ttc_int).capitalize() + ' Francs CFA'

    context = {
        'invoice': invoice,
        'company': company,
        'logo_uri': logo_uri,
        'amount_in_words': amount_in_words,
        'items': invoice.items.all(),
    }

    html_string = render_to_string('invoices/invoice_pdf.html', context)

    # base_url as file URI of MEDIA_ROOT so relative paths resolve correctly
    base_url = Path(settings.MEDIA_ROOT).as_uri()

    font_config = FontConfiguration()
    html = HTML(string=html_string, base_url=base_url)
    pdf_bytes = html.write_pdf(font_config=font_config)
    return pdf_bytes
