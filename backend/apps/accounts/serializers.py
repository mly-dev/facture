from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Company

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'email', 'phone', 'address', 'logo', 'subscription_plan', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.Serializer):
    # Company fields
    company_name = serializers.CharField(max_length=255)
    company_email = serializers.EmailField()
    company_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    company_address = serializers.CharField(required=False, allow_blank=True)

    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un compte avec cet email existe déjà.")
        return value

    def validate_company_email(self, value):
        if Company.objects.filter(email=value).exists():
            raise serializers.ValidationError("Une entreprise avec cet email existe déjà.")
        return value

    def create(self, validated_data):
        company = Company.objects.create(
            name=validated_data['company_name'],
            email=validated_data['company_email'],
            phone=validated_data.get('company_phone', ''),
            address=validated_data.get('company_address', ''),
        )
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            company=company,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'company']
        read_only_fields = ['id', 'email']
