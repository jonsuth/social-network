from django.contrib.auth.models import AbstractUser
from django.db import models


class Hobby(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):
    # profile_image = models.ImageField(upload_to='images/', default='images/no-img.png')
    gender = models.CharField(max_length=200, default='none')
    birthday = models.DateField(auto_now=False, auto_now_add=False, default='1970-01-01')
    hobbies = models.ManyToManyField(Hobby)

    def __str__(self):
        return self.email


class Poke(models.Model):
    pokee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="pokee+")
    poker = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="poker+")
