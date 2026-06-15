#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.accounts.models import User
from apps.establishments.models import Establishment

print("=== UTILISATEURS ===")
users = User.objects.all()
for u in users:
    print(f"- {u.email} | role: {u.role} | is_active: {u.is_active}")

print(f"\nTotal utilisateurs: {users.count()}")

print("\n=== ÉTABLISSEMENTS ===")
establishments = Establishment.objects.all()
for e in establishments:
    print(f"- {e.name} | host: {e.host.email} | status: {e.status}")

print(f"\nTotal établissements: {establishments.count()}")
