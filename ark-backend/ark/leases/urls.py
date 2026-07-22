from django.urls import path
from . import views

urlpatterns = [
    path("", views.LeaseListView.as_view(), name="lease-list"),
    path("create/", views.LeaseCreateView.as_view(), name="lease-create"),
    path("<int:pk>/", views.LeaseDetailView.as_view(), name="lease-detail"),
]
