# Production readiness

What has to exist outside the codebase before Tentzu can launch — third-party
accounts, their lead times and costs, plus the engineering work still open.

The HTML is the source; the PDF is what gets sent. Regenerate with:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --no-pdf-header-footer --print-to-pdf=tentzu-production-accounts.pdf \
  "file://$PWD/tentzu-production-accounts.html"
```

| File | Role |
|---|---|
| `tentzu-production-accounts.html` | Source |
| `tentzu-production-accounts.pdf` | Send this one |
