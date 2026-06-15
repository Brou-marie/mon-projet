#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.establishments.models import Establishment

# Update all pending establishments to active
count = Establishment.objects.filter(status='pending').update(status='active')
total_active = Establishment.objects.filter(status='active').count()

print(f'{count} établissements mis à jour de pending à active')
print(f'Total établissements actifs: {total_active}')
