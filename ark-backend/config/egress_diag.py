"""TEMPORARY egress diagnostic — delete once mail transport is settled.

Render's free tier has no shell, so this is the only way to find out whether
outbound SMTP is reachable from inside the container. It answers one question:
does a TCP connect to each mail endpoint succeed, get refused, or hang?

  connected  -> port is open, SMTP is viable
  timeout    -> silently dropped, i.e. blocked by the platform
  refused    -> reachable but nothing listening

Targets are a fixed list. Nothing is read from the request, so this cannot be
pointed at an arbitrary host.
"""
import socket
import time

from django.http import JsonResponse

TARGETS = [
    ("smtp.gmail.com", 587, "Gmail SMTP submission (STARTTLS)"),
    ("smtp.gmail.com", 465, "Gmail SMTP implicit TLS"),
    ("smtp.gmail.com", 25, "Gmail SMTP legacy"),
    ("smtp.resend.com", 587, "Resend SMTP"),
    ("api.sendgrid.com", 443, "SendGrid HTTPS API"),
    ("api.resend.com", 443, "Resend HTTPS API"),
]

TIMEOUT = 6.0


def egress_check(request):
    results = []
    for host, port, label in TARGETS:
        started = time.monotonic()
        try:
            with socket.create_connection((host, port), timeout=TIMEOUT):
                outcome = "connected"
        except socket.timeout:
            outcome = "timeout (blocked)"
        except ConnectionRefusedError:
            outcome = "refused"
        except OSError as e:
            outcome = f"error: {e.__class__.__name__}: {e}"
        results.append(
            {
                "target": f"{host}:{port}",
                "what": label,
                "result": outcome,
                "seconds": round(time.monotonic() - started, 2),
            }
        )
    return JsonResponse({"timeout_used": TIMEOUT, "results": results})
