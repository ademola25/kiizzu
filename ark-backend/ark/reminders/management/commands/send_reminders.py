"""Run the daily reminder sweep.

The scheduler-agnostic entry point: a Render Cron Job, a VPS crontab, or any
other runner can call this. Reminders are a once-a-day batch, so this needs no
broker and no long-running worker — which is also what keeps the job portable
between hosts.
"""
from django.core.management.base import BaseCommand

from ark.reminders.tasks import run_daily_reminders


class Command(BaseCommand):
    help = "Send 30/7/1-day cheque reminders due today in each tenant's own timezone."

    def handle(self, *args, **options):
        # Let the exception escape on failure: a non-zero exit is how a cron
        # runner reports a failed sweep. Swallowing it would make a broken job
        # look like a quiet night.
        count = run_daily_reminders()
        self.stdout.write(self.style.SUCCESS(f"{count} reminder(s) processed"))
