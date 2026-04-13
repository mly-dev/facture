from django.contrib.auth.models import AbstractUser
from django.db import models


class Company(models.Model):
    PLAN_CHOICES = [
        ('starter', 'Starter'),
        ('business', 'Business'),
        ('pro', 'Pro'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    subscription_plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='starter')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.name


class User(AbstractUser):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
