import random
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, Address, OTP


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'phone', 'full_name', 'role', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        if data.get('role') == 'admin':
            raise serializers.ValidationError({'role': 'Cannot register as admin.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'full_name', 'role', 'avatar',
                  'is_email_verified', 'is_phone_verified', 'date_joined')
        read_only_fields = ('id', 'email', 'role', 'date_joined')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Incorrect current password.')
        return value


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=['login', 'reset', 'verify_email'])

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('No account found with this email.')
        return value

    def create_otp(self):
        email = self.validated_data['email']
        purpose = self.validated_data['purpose']
        user = User.objects.get(email=email)

        # Invalidate any existing unused OTPs for this purpose
        OTP.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)

        otp_code = str(random.randint(100000, 999999))
        otp = OTP.objects.create(
            user=user,
            otp_code=make_password(otp_code),
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        # Store raw code temporarily so view can print/send it
        otp._raw_code = otp_code
        return otp


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)
    purpose = serializers.ChoiceField(choices=['login', 'reset', 'verify_email'])

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email.')

        # Get recent unused OTPs and check hash
        otps = OTP.objects.filter(
            user=user,
            purpose=data['purpose'],
            is_used=False,
        ).order_by('-created_at')[:5]

        matched_otp = None
        for otp in otps:
            if not otp.is_expired and check_password(data['otp_code'], otp.otp_code):
                matched_otp = otp
                break

        if not matched_otp:
            raise serializers.ValidationError('Invalid or expired OTP.')

        matched_otp.is_used = True
        matched_otp.save()
        data['user'] = user
        return data


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8)
    new_password2 = serializers.CharField(min_length=8)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        return data


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField()

    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Incorrect password.')
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'full_name', 'role', 'avatar',
                  'is_active', 'is_email_verified', 'is_phone_verified', 'date_joined')
        read_only_fields = ('id', 'email', 'role', 'date_joined')


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ('id', 'label', 'address_type', 'full_address', 'landmark',
                  'city', 'state', 'pincode', 'latitude', 'longitude',
                  'is_default', 'is_active')
        read_only_fields = ('id',)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
