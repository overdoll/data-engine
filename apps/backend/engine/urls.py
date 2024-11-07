from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import hello_world

router = DefaultRouter()

urlpatterns = [
    path("hello/", hello_world),
]
