# Sallah — SaaS de Facturation pour PME Africaines

Application de facturation complète pour PME d'Afrique de l'Ouest (Niger/UEMOA). Devise FCFA, TVA 18%, multi-tenant.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Django 4.2 + Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| Base de données | PostgreSQL |
| PDF | WeasyPrint |

---

## Prérequis

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Installation

### 1. Base de données PostgreSQL

```sql
CREATE DATABASE sallah_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE sallah_db TO postgres;
```

### 2. Backend

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate       # Linux/Mac
# ou: venv\Scripts\activate    # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement
cp .env.example .env
# Modifier .env avec vos paramètres DB

# Migrations
python manage.py migrate

# Créer un superuser admin (optionnel)
python manage.py createsuperuser

# Charger les données de test
python seed.py

# Lancer le serveur
python manage.py runserver
```

> Backend disponible sur http://localhost:8000  
> Admin Django sur http://localhost:8000/admin

### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

> Frontend disponible sur http://localhost:5173

---

## Compte de test (après seed)

```
Email: admin@techservices.ne
Mot de passe: Admin1234!
```

---

## Fonctionnalités

### Facturation
- Création de factures avec lignes (produit catalogue ou description libre)
- Calcul automatique HT / TVA (18%) / TTC en FCFA
- Numérotation automatique : `FAC-2024-0001`
- Statuts : Brouillon → Envoyée → Payée / Partiellement payée / Annulée

### PDF
- Génération PDF professionnelle (WeasyPrint)
- En-tête avec logo entreprise
- Tableau des lignes avec totaux
- Mention légale "Arrêtée à la somme de..."
- Historique des paiements

### Paiements
- Paiement partiel ou total
- Modes : Orange Money, Airtel Money, Virement, Espèces, Carte, Chèque
- Mise à jour automatique du statut

### Dashboard
- KPIs : total facturé, encaissé, en attente, en retard
- Graphique barres 6 derniers mois
- Répartition par statut
- Top clients
- 5 dernières factures

### Clients & Produits
- CRUD complet
- Recherche et pagination
- Fiche client avec historique des factures

---

## API Endpoints

```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/refresh/
GET    /api/auth/profile/
GET    /api/auth/company/

GET/POST   /api/clients/
GET/PUT/DELETE /api/clients/{id}/

GET/POST   /api/products/
GET/PUT/DELETE /api/products/{id}/

GET/POST   /api/invoices/
GET/PUT/DELETE /api/invoices/{id}/
POST /api/invoices/{id}/send/
POST /api/invoices/{id}/cancel/
GET  /api/invoices/{id}/pdf/
POST /api/invoices/{id}/payment/

GET /api/dashboard/stats/
```

---

## Variables d'environnement (.env)

```env
SECRET_KEY=votre-cle-secrete
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=sallah_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## WeasyPrint (génération PDF)

WeasyPrint nécessite des dépendances système. Sur Windows, consultez :
https://doc.courtbouillon.org/weasyprint/stable/first_steps.html

Sur Ubuntu/Debian :
```bash
apt-get install python3-cffi libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info
```

Si WeasyPrint n'est pas disponible, l'endpoint `/pdf/` retourne une erreur 503 (le reste de l'application fonctionne normalement).

---

## Structure du projet

```
sallah/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── seed.py
│   ├── .env.example
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   └── apps/
│       ├── accounts/    ← User, Company, auth JWT
│       ├── clients/     ← CRUD clients
│       ├── products/    ← Catalogue produits/services
│       ├── invoices/    ← Factures, lignes, paiements, PDF
│       └── dashboard/   ← Statistiques
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/         ← Couche Axios
        ├── components/  ← Sidebar, Header, Modal, etc.
        ├── contexts/    ← AuthContext
        ├── hooks/
        ├── pages/       ← Login, Dashboard, Clients, etc.
        └── utils/       ← formatCurrency, formatDate
```
