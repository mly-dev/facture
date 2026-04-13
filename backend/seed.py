#!/usr/bin/env python
"""
Script de seed pour données de test.
Usage: python manage.py shell < seed.py
  OR:  python seed.py  (depuis le dossier backend, avec l'env Django activé)
"""
import os
import sys
import django
from datetime import date, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Company, User
from apps.clients.models import Client
from apps.products.models import Product
from apps.invoices.models import Invoice, InvoiceItem, Payment

print("Suppression des données existantes...")
Payment.objects.all().delete()
InvoiceItem.objects.all().delete()
Invoice.objects.all().delete()
Product.objects.all().delete()
Client.objects.all().delete()
User.objects.filter(is_superuser=False).delete()
Company.objects.all().delete()

print("Création de l'entreprise de test...")
company = Company.objects.create(
    name="TechServices Niger SARL",
    email="contact@techservices-niger.ne",
    phone="+227 20 35 45 55",
    address="Avenue de l'Indépendance, Niamey, Niger",
    subscription_plan="business",
)

user = User.objects.create_user(
    username="admin@techservices.ne",
    email="admin@techservices.ne",
    password="Admin1234!",
    first_name="Moussa",
    last_name="Ibrahim",
    company=company,
)
print(f"  Utilisateur créé: {user.email} / Admin1234!")

print("Création des clients...")
clients_data = [
    {"name": "SONITEL SA", "email": "daf@sonitel.ne", "phone": "+227 20 72 20 20", "address": "Boulevard Mali Béro, Niamey"},
    {"name": "Nigelec", "email": "comptabilite@nigelec.ne", "phone": "+227 20 72 25 25", "address": "Rue du Sahel, Niamey"},
    {"name": "Banque Atlantique Niger", "email": "finance@ba-niger.com", "phone": "+227 20 73 45 00", "address": "Avenue Luebke, Niamey"},
    {"name": "ONG Sahel Vert", "email": "admin@sahelvert.org", "phone": "+227 90 12 34 56", "address": "Quartier Plateau, Niamey"},
    {"name": "Agadez Tourisme SARL", "email": "contact@agadeztourisme.ne", "phone": "+227 96 78 90 12", "address": "Agadez, Niger"},
    {"name": "Maradi Import-Export", "email": "direction@maradi-ie.com", "phone": "+227 91 23 45 67", "address": "Maradi, Niger"},
]
clients = [Client.objects.create(company=company, **d) for d in clients_data]
print(f"  {len(clients)} clients créés")

print("Création du catalogue produits...")
products_data = [
    {"name": "Développement web", "description": "Création et développement de sites web", "unit_price": 150000, "unit": "forfait", "category": "Développement"},
    {"name": "Maintenance informatique", "description": "Maintenance préventive et corrective", "unit_price": 50000, "unit": "forfait", "category": "Maintenance"},
    {"name": "Formation informatique", "description": "Formation sur mesure en informatique", "unit_price": 25000, "unit": "heure", "category": "Formation"},
    {"name": "Audit système", "description": "Audit complet du système informatique", "unit_price": 200000, "unit": "forfait", "category": "Conseil"},
    {"name": "Licence logiciel", "description": "Licence d'utilisation annuelle", "unit_price": 75000, "unit": "piece", "category": "Logiciels"},
    {"name": "Hébergement web", "description": "Hébergement serveur mensuel", "unit_price": 15000, "unit": "forfait", "category": "Hébergement"},
    {"name": "Support technique", "description": "Support et assistance technique", "unit_price": 10000, "unit": "heure", "category": "Support"},
    {"name": "Câblage réseau", "description": "Installation câblage réseau LAN", "unit_price": 5000, "unit": "metre", "category": "Infrastructure"},
]
products = [Product.objects.create(company=company, **p) for p in products_data]
print(f"  {len(products)} produits créés")

print("Création des factures...")
statuses = ['payee', 'payee', 'payee', 'envoyee', 'envoyee', 'partielle', 'brouillon', 'annulee']
invoice_count = 0

for i in range(18):
    client = random.choice(clients)
    days_ago = random.randint(0, 180)
    issue_date = date.today() - timedelta(days=days_ago)
    due_date = issue_date + timedelta(days=30)
    status = random.choice(statuses)

    invoice = Invoice.objects.create(
        company=company,
        client=client,
        status='brouillon',
        issue_date=issue_date,
        due_date=due_date,
        notes="Merci de régler dans les délais impartis. En cas de retard, des pénalités de 1,5% par mois seront appliquées.",
    )

    num_items = random.randint(1, 4)
    for _ in range(num_items):
        product = random.choice(products)
        qty = random.choice([1, 1, 2, 3, 5, 10])
        InvoiceItem.objects.create(
            invoice=invoice,
            product=product,
            description=product.name,
            quantity=qty,
            unit_price=product.unit_price,
            tax_rate=18.00,
        )

    # Update status
    invoice.status = status
    invoice.save(update_fields=['status'])

    # Add payments for paid/partial invoices
    if status == 'payee':
        Payment.objects.create(
            invoice=invoice,
            amount=invoice.total_ttc,
            payment_date=issue_date + timedelta(days=random.randint(5, 25)),
            method=random.choice(['orange_money', 'virement', 'especes', 'carte']),
            reference=f"REF-{random.randint(10000, 99999)}",
        )
    elif status == 'partielle':
        partial_amount = invoice.total_ttc * 0.5
        Payment.objects.create(
            invoice=invoice,
            amount=partial_amount,
            payment_date=issue_date + timedelta(days=random.randint(5, 15)),
            method='orange_money',
            reference=f"OM-{random.randint(10000, 99999)}",
        )

    invoice_count += 1

print(f"  {invoice_count} factures créées")
print("\nSeed terminé avec succès!")
print(f"  URL: http://localhost:8000")
print(f"  Email: admin@techservices.ne")
print(f"  Mot de passe: Admin1234!")
