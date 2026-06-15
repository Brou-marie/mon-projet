#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.establishments.models import Establishment

# Mettre à jour tous les établissements pour exiger la validation manuelle
count = Establishment.objects.update(requires_manual_validation=True)
print(f"✓ {count} établissement(s) mis à jour pour exiger la validation manuelle")

# Vérifier
for est in Establishment.objects.all():
    print(f"- {est.name}: requires_manual_validation = {est.requires_manual_validation}")
