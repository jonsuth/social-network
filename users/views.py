from collections import Counter
from datetime import date

from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password
from django.db.models import Count
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from .models import CustomUser, Hobby, Poke


def home(request):
    return render(request, "users/home.html")


@require_http_methods(["POST"])
def createUser(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = make_password(request.POST['password'])
        gender = request.POST['gender']
        email = request.POST['email']
        birthday = request.POST['birthday']
        hobbies = request.POST.getlist('hobbies[]')
        C = CustomUser.objects.create(
            username=username,
            password=password,
            gender=gender,
            email=email,
            birthday=birthday,

        )

        for hobby in hobbies:
            obj = Hobby.objects.get(name=hobby)
            C.hobbies.add(obj)

    return HttpResponse(status=200)


@require_http_methods(["POST"])
def logIn(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                return JsonResponse(userToJson(user), safe=False)

        return HttpResponse("Logged in")

    return HttpResponse(status=403)


def getProfile(request):
    if request.user.is_authenticated:
        return JsonResponse(profileToJson(request.user), safe=False)

    return HttpResponse(status=403)


def getHobbies(request):
    return JsonResponse(hobbiesToJson(Hobby.objects.all()), safe=False)


@require_http_methods(["POST"])
def poke(request):
    if request.user.is_authenticated:
        username = request.POST.get("username")
        userToPoke = CustomUser.objects.get(username=username)
        p = Poke(pokee=userToPoke, poker=request.user)
        p.save()
        return HttpResponse(status=200)

    return HttpResponse(status=403)


# Other functions


def profileToJson(user):
    suggestedUsers = CustomUser.objects \
        .exclude(pk=user.pk) \
        .filter(hobbies__in=user.hobbies.all()) \
        .distinct() \
        .annotate(mutualHobbies=Count("hobbies")) \
        .order_by("-mutualHobbies")

    poked = Poke.objects.filter(poker=user)
    pokedBy = Poke.objects.filter(pokee=user)

    json = {
        "user": userToJson(user),
        "suggestedUsers": [userToJson(user) for user in suggestedUsers],
        "poked": pokeToJson([userToJson(poke.pokee).get("username") for poke in poked]),
        "pokedBy": pokeToJson([userToJson(poke.poker).get("username") for poke in pokedBy])
    }

    return json


def userToJson(user):
    json = {
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "gender": user.gender,
        "birthday": user.birthday,
        "age": calculateAge(user.birthday),
        "hobbies": hobbiesToJson(user.hobbies)
    }
    return json


def pokeToJson(users):
    json = []
    countedPokesFromUsers = Counter(users)

    for key in countedPokesFromUsers:
        json.append({
            "username": key,
            "pokes": countedPokesFromUsers[key]
        })
    return json


def hobbiesToJson(hobbies):
    json = []
    for hobby in hobbies.all():
        json.append(hobby.name)
    return json


def calculateAge(born):
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
