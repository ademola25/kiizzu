from django.contrib import admin
from .models import Lease
from ark.payments.models import PaymentSchedule


class PaymentInline(admin.TabularInline):
    model = PaymentSchedule
    extra = 0
    readonly_fields = ("cheque_number", "due_date", "amount", "status", "reminder_30d_sent", "reminder_7d_sent", "reminder_1d_sent")


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ("building_name", "unit_number", "user", "cheque_pattern", "rent_amount", "start_date")
    list_filter = ("cheque_pattern",)
    search_fields = ("building_name", "user__email")
    inlines = [PaymentInline]
