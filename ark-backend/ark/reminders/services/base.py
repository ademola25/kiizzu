"""Abstract base for notification services."""
from abc import ABC, abstractmethod


class NotificationService(ABC):
    @abstractmethod
    def send_reminder(self, phone_or_email: str, message: str) -> bool:
        """Send a reminder. Returns True on success, False on failure."""
        ...
