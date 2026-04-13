from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subscription_plan', 'created_at']
    search_fields = ['name', 'email']


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'company', 'is_active']
    list_filter = ['is_active', 'company']
    fieldsets = UserAdmin.fieldsets + (
        ('Entreprise', {'fields': ('company',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Entreprise', {'fields': ('company',)}),
    )
