from django.urls import path, include

from . import views

app_name = 'users'

urlpatterns = [
    path('', views.home),
    path('', include('django.contrib.auth.urls')),
    path('login/', views.logIn),
    path('create/', views.createUser),
    path('hobbies/', views.getHobbies),
    path('user-profile/', views.getProfile),
    path('poke/', views.poke),
]
