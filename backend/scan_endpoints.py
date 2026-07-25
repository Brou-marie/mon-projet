"""
Script de scan des endpoints — teste le flux complet avec la vraie DB.
Lance avec : python scan_endpoints.py
"""
import os
import django
import json
import uuid
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from django.test import Client
from apps.accounts.models import User, GuestProfile, HostProfile
from apps.establishments.models import Establishment, RoomType, RoomAvailability
from apps.bookings.models import Booking
from apps.payments.models import Payment

OK    = '  ✓'
FAIL  = '  ✗'
INFO  = '  →'

results = {'ok': 0, 'fail': 0}

def check(label, status_code, expected):
    ok = status_code in expected
    results['ok' if ok else 'fail'] += 1
    icon = OK if ok else FAIL
    print(f'{icon} [{status_code}] {label}')
    return ok

# ── Setup données ─────────────────────────────────────────────────────────────
uid = str(uuid.uuid4())[:8]
host  = User.objects.create_user(email=f'h_{uid}@scan.ci', password='Scan123!pass', role='host', first_name='Hôte', last_name='Scan')
guest = User.objects.create_user(email=f'g_{uid}@scan.ci', password='Scan123!pass', role='guest', first_name='Client', last_name='Scan')
admin = User.objects.create_superuser(email=f'a_{uid}@scan.ci', password='Scan123!pass', first_name='Admin', last_name='Scan')
GuestProfile.objects.get_or_create(user=guest)

etab = Establishment.objects.create(
    host=host, name=f'Hôtel Scan {uid}', description='Description de test',
    establishment_type='hotel', address='Plateau, Abidjan', city='Abidjan',
    status='active', requires_manual_validation=False,
)
room = RoomType.objects.create(
    establishment=etab, name='Standard', base_price_per_night=Decimal('20000'),
    physical_room_count=3, capacity_adults=2, capacity_children=1,
)
check_in  = date.today() + timedelta(days=10)
check_out = check_in + timedelta(days=2)
for i in range(2):
    RoomAvailability.objects.create(room_type=room, date=check_in + timedelta(days=i), available_count=3)

c = Client()

# ── Login ─────────────────────────────────────────────────────────────────────
print('\n=== Authentification ===')

r = c.post('/api/auth/login/', json.dumps({'email': f'g_{uid}@scan.ci', 'password': 'Scan123!pass'}), content_type='application/json')
check('Login guest', r.status_code, [200])
gt = r.json().get('access', '')

r = c.post('/api/auth/login/', json.dumps({'email': f'h_{uid}@scan.ci', 'password': 'Scan123!pass'}), content_type='application/json')
check('Login host', r.status_code, [200])
ht = r.json().get('access', '')

r = c.post('/api/auth/login/', json.dumps({'email': f'a_{uid}@scan.ci', 'password': 'Scan123!pass'}), content_type='application/json')
check('Login admin', r.status_code, [200])
at = r.json().get('access', '')

# ── Endpoints publics GET ─────────────────────────────────────────────────────
print('\n=== Endpoints publics ===')

r = c.get('/api/public/hebergements/')
check('GET /api/public/hebergements/', r.status_code, [200])

r = c.get('/api/public/hebergements/vedettes/')
check('GET /api/public/hebergements/vedettes/', r.status_code, [200])

r = c.get('/api/public/destinations/populaires/')
check('GET /api/public/destinations/populaires/', r.status_code, [200])

r = c.get(f'/api/public/hebergements/{etab.slug}/')
check(f'GET /api/public/hebergements/{etab.slug}/', r.status_code, [200])

r = c.get('/api/establishments/')
check('GET /api/establishments/', r.status_code, [200])

r = c.get('/api/reviews/')
check('GET /api/reviews/', r.status_code, [200])

# ── Inscription ───────────────────────────────────────────────────────────────
print('\n=== Inscription ===')

r = c.post('/api/accounts/register/', json.dumps({
    'email': f'new_{uid}@scan.ci', 'password': 'SecurePass123!',
    'password_confirm': 'SecurePass123!', 'first_name': 'Nouv', 'last_name': 'User', 'role': 'guest',
}), content_type='application/json')
check('POST /api/accounts/register/ (guest)', r.status_code, [201])

r = c.post('/api/accounts/register/', json.dumps({
    'email': f'new_{uid}@scan.ci', 'password': 'SecurePass123!',
    'password_confirm': 'SecurePass123!', 'first_name': 'Dup', 'last_name': 'Dup', 'role': 'guest',
}), content_type='application/json')
check('POST /api/accounts/register/ (email dupliqué → 400)', r.status_code, [400])

# ── Profil ────────────────────────────────────────────────────────────────────
print('\n=== Profil ===')

r = c.get('/api/accounts/me/', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('GET /api/accounts/me/ (guest)', r.status_code, [200])
data = r.json()
assert data.get('role') == 'guest', f"Role attendu 'guest', obtenu '{data.get('role')}'"
print(f'{INFO} email={data.get("email")}, role={data.get("role")}')

r = c.patch('/api/accounts/me/', json.dumps({'first_name': 'ClientModifié'}),
            content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('PATCH /api/accounts/me/ (update nom)', r.status_code, [200])

# ── Disponibilité ─────────────────────────────────────────────────────────────
print('\n=== Disponibilité ===')

r = c.post('/api/public/hebergements/disponibilite/', json.dumps({
    'room_type_id': str(room.pk),
    'check_in_date': str(check_in),
    'check_out_date': str(check_out),
}), content_type='application/json')
check('POST /api/public/hebergements/disponibilite/', r.status_code, [200])
if r.status_code == 200:
    dispo = r.json()
    available = dispo.get('available')
    total = dispo.get('total_amount')
    print(f'{INFO} available={available}, total_amount={total}')
    assert available == True, 'La chambre devrait être disponible'

# ── Réservation ───────────────────────────────────────────────────────────────
print('\n=== Réservation (flux complet) ===')

r = c.post('/api/bookings/', json.dumps({
    'room_type_id': str(room.pk),
    'check_in_date': str(check_in),
    'check_out_date': str(check_out),
    'guest_count_adults': 1,
    'guest_count_children': 0,
    'guest_notes': 'Arrivée vers 15h',
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('POST /api/bookings/ (créer réservation)', r.status_code, [201])

bk_data = r.json() if r.status_code == 201 else {}
bk_id   = bk_data.get('id', '')
bk_num  = bk_data.get('booking_number', '')
bk_code = bk_data.get('reservation_code', '')
print(f'{INFO} booking_number={bk_num}, code={bk_code}, status={bk_data.get("status")}')

# Vérifier statut initial
assert bk_data.get('status') == 'pending_payment', f'Statut attendu pending_payment, obtenu {bk_data.get("status")}'

# ── Lookup code (hébergeur) ───────────────────────────────────────────────────
print('\n=== Flux accueil hébergeur ===')

if bk_code:
    r = c.post('/api/owner/bookings/lookup-code/', json.dumps({'code': bk_code}),
               content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {ht}')
    check('POST /api/owner/bookings/lookup-code/', r.status_code, [200])
    if r.status_code == 200:
        d = r.json()
        print(f'{INFO} guest_name={d.get("guest_name")}, total={d.get("total_amount")}, payment_status={d.get("payment_status")}')

    # validate-payment
    if bk_id:
        r = c.post(f'/api/owner/bookings/{bk_id}/validate-payment/', json.dumps({'payment_method': 'wave', 'payment_proof': 'TXN-TEST-001'}),
                   content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {ht}')
        check('POST /api/owner/bookings/{id}/validate-payment/ (wave)', r.status_code, [200])
        if r.status_code != 200:
            print(f'       Erreur: {r.json()}')

    # Vérifier que le booking est maintenant confirmed
    if bk_num:
        r = c.get(f'/api/bookings/{bk_num}/', HTTP_AUTHORIZATION=f'Bearer {gt}')
        bk_status = r.json().get('status', '?')
        check(f'Statut booking = confirmed (actuel: {bk_status})', bk_status == 'confirmed', [True])

# ── Dashboard owner ───────────────────────────────────────────────────────────
print('\n=== Dashboards ===')

r = c.get('/api/owner/dashboard/', HTTP_AUTHORIZATION=f'Bearer {ht}')
check('GET /api/owner/dashboard/', r.status_code, [200])

r = c.get('/api/client/dashboard/', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('GET /api/client/dashboard/', r.status_code, [200])

r = c.get('/api/client/bookings/', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('GET /api/client/bookings/', r.status_code, [200])

r = c.get('/api/owner/bookings/', HTTP_AUTHORIZATION=f'Bearer {ht}')
check('GET /api/owner/bookings/', r.status_code, [200])

# ── Permissions ──────────────────────────────────────────────────────────────
print('\n=== Contrôle des permissions ===')

r = c.get('/api/owner/dashboard/', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('Guest ne peut PAS accéder owner/dashboard (→ 403)', r.status_code, [403])

r = c.post('/api/owner/bookings/lookup-code/', json.dumps({'code': bk_code or 'XXXXXX'}),
           content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('Guest ne peut PAS lookup-code (→ 403)', r.status_code, [403])

r = c.get('/api/accounts/me/')
check('Non authentifié ne peut PAS /me (→ 401)', r.status_code, [401])

# ── Avis ─────────────────────────────────────────────────────────────────────
print('\n=== Avis ===')

# Créer un booking completed pour l'avis
bk_review = Booking.objects.create(
    guest=guest, room_type=room, establishment=etab,
    check_in_date=date.today() - timedelta(days=10),
    check_out_date=date.today() - timedelta(days=8),
    status='completed', total_amount=Decimal('44000'),
    subtotal=Decimal('40000'), base_subtotal=Decimal('40000'), host_payout=Decimal('36000'),
)

r = c.post('/api/reviews/', json.dumps({
    'booking': str(bk_review.pk),
    'rating_overall': 5,
    'comment': 'Excellent séjour, très bien !',
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('POST /api/reviews/ (créer avis)', r.status_code, [201])
rv_id = r.json().get('id', '') if r.status_code == 201 else ''

if rv_id:
    # Réponse hébergeur
    r = c.post(f'/api/reviews/{rv_id}/respond/', json.dumps({'response_text': 'Merci beaucoup !'}),
               content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {ht}')
    check('POST /api/reviews/{id}/respond/ (réponse hébergeur)', r.status_code, [201])

    # Flag par admin
    r = c.post(f'/api/reviews/{rv_id}/flag/', json.dumps({}),
               content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {at}')
    check('POST /api/reviews/{id}/flag/ (admin)', r.status_code, [200])

    # Approve par admin
    r = c.post(f'/api/reviews/{rv_id}/approve/', json.dumps({}),
               content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {at}')
    check('POST /api/reviews/{id}/approve/ (admin)', r.status_code, [200])

    # Flag par guest → 403
    r = c.post(f'/api/reviews/{rv_id}/flag/', json.dumps({}),
               content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {gt}')
    check('Guest ne peut PAS flag (→ 403)', r.status_code, [403])

# ── Refresh token ─────────────────────────────────────────────────────────────
print('\n=== JWT ===')

r = c.post('/api/auth/login/', json.dumps({'email': f'g_{uid}@scan.ci', 'password': 'Scan123!pass'}), content_type='application/json')
refresh_token = r.json().get('refresh', '')
r = c.post('/api/auth/refresh/', json.dumps({'refresh': refresh_token}), content_type='application/json')
check('POST /api/auth/refresh/ (refresh token)', r.status_code, [200])

# Logout
r = c.post('/api/accounts/logout/', json.dumps({'refresh': refresh_token}),
           content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {gt}')
check('POST /api/accounts/logout/', r.status_code, [200])

# ── Nettoyage ─────────────────────────────────────────────────────────────────
print('\n=== Nettoyage ===')
try:
    bk_review.delete()
    Booking.objects.filter(establishment=etab).delete()
    RoomAvailability.objects.filter(room_type=room).delete()
    room.delete()
    etab.delete()
    User.objects.filter(email__endswith=f'@scan.ci').delete()
    print(f'{OK} Données de test supprimées')
except Exception as e:
    print(f'  Nettoyage partiel: {e}')

# ── Résumé ────────────────────────────────────────────────────────────────────
total = results['ok'] + results['fail']
print(f'\n{"="*50}')
print(f'RÉSULTAT : {results["ok"]}/{total} tests passés')
if results['fail'] == 0:
    print('✓ Tous les endpoints fonctionnent correctement.')
else:
    print(f'✗ {results["fail"]} problème(s) détecté(s).')
print('='*50)
