from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'company', 'created_at']
    list_filter = ['company']
    search_fields = ['name', 'email']
