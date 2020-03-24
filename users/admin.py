from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser, Hobby, Poke


class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['email', 'username', 'birthday', 'password', 'gender']
    fieldsets = (
        ('User',
         {'fields': ('username', 'first_name', 'last_name', 'email', 'birthday', 'password', 'gender', 'hobbies')}),
    )


admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Hobby)
admin.site.register(Poke)
