from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'unit_price', 'unit', 'category', 'company']
    list_filter = ['company', 'unit', 'category']
    search_fields = ['name', 'description']
