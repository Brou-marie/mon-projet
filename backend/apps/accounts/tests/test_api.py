"""
Tests API — apps.accounts

Couvre :
  - RegisterView  : inscription guest, host, validations
  - Login (JWT)   : connexion, token invalide, réponse user incluse
  - LogoutView    : blacklist refresh token
  - MeView        : GET profil, PATCH mise à jour
  - GuestProfileUpdateView / HostProfileUpdateView
"""
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, GuestProfile, HostProfile


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_guest(email='g@test.ci', password='TestPass123!'):
    user = User.objects.create_user(
        email=email, password=password, role='guest',
        first_name='Jean', last_name='Client',
    )
    GuestProfile.objects.get_or_create(user=user)
    return user


def make_host(email='h@test.ci', password='TestPass123!'):
    user = User.objects.create_user(
        email=email, password=password, role='host',
        first_name='Marie', last_name='Hôte',
    )
    HostProfile.objects.get_or_create(user=user)
    return user


# ════════════════════════════════════════════════════════════════════════════════
# Inscription
# ════════════════════════════════════════════════════════════════════════════════

class RegisterTests(APITestCase):

    def test_inscription_guest_succes(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'nouveau@test.ci',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'Kofi',
            'last_name': 'Adu',
            'role': 'guest',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertEqual(resp.data['user']['role'], 'guest')
        self.assertTrue(User.objects.filter(email='nouveau@test.ci').exists())

    def test_inscription_host_succes(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'host_new@test.ci',
            'password': 'HostPass123!',
            'password_confirm': 'HostPass123!',
            'first_name': 'Ama',
            'last_name': 'Owusu',
            'role': 'host',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['user']['role'], 'host')
        self.assertTrue(HostProfile.objects.filter(user__email='host_new@test.ci').exists())

    def test_inscription_guest_cree_guest_profile(self):
        self.client.post('/api/accounts/register/', {
            'email': 'profil@test.ci',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'A', 'last_name': 'B',
            'role': 'guest',
        }, format='json')
        self.assertTrue(GuestProfile.objects.filter(user__email='profil@test.ci').exists())

    def test_email_duplique_retourne_400(self):
        make_guest('existe@test.ci')
        resp = self.client.post('/api/accounts/register/', {
            'email': 'existe@test.ci',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'X', 'last_name': 'Y',
            'role': 'guest',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mots_de_passe_differents_retourne_400(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'mismatch@test.ci',
            'password': 'SecurePass123!',
            'password_confirm': 'AutrePass456!',
            'first_name': 'X', 'last_name': 'Y',
            'role': 'guest',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_role_admin_refuse(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'admin_hack@test.ci',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'X', 'last_name': 'Y',
            'role': 'superadmin',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_normalise_en_minuscules(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'MAJUSCULE@TEST.CI',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'A', 'last_name': 'B',
            'role': 'guest',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='majuscule@test.ci').exists())

    def test_champs_requis_manquants(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'incomplet@test.ci',
            'role': 'guest',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


# ════════════════════════════════════════════════════════════════════════════════
# Connexion JWT
# ════════════════════════════════════════════════════════════════════════════════

class LoginTests(APITestCase):

    def setUp(self):
        self.guest = make_guest()

    def test_login_succes_retourne_tokens_et_user(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'g@test.ci',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertIn('user', resp.data)
        self.assertEqual(resp.data['user']['email'], 'g@test.ci')
        self.assertEqual(resp.data['user']['role'], 'guest')

    def test_login_mauvais_mot_de_passe(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'g@test.ci',
            'password': 'MauvaisMotDePasse!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_email_inexistant(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'inconnu@test.ci',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_champs_manquants(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'g@test.ci',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh(self):
        login = self.client.post('/api/auth/login/', {
            'email': 'g@test.ci', 'password': 'TestPass123!',
        }, format='json')
        refresh = login.data['refresh']
        resp = self.client.post('/api/auth/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)


# ════════════════════════════════════════════════════════════════════════════════
# Déconnexion
# ════════════════════════════════════════════════════════════════════════════════

class LogoutTests(APITestCase):

    def setUp(self):
        self.guest = make_guest()
        self.refresh = RefreshToken.for_user(self.guest)

    def test_logout_blackliste_token(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/accounts/logout/', {
            'refresh': str(self.refresh),
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_logout_sans_token_retourne_400(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/accounts/logout/', {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_non_authentifie_retourne_401(self):
        resp = self.client.post('/api/accounts/logout/', {
            'refresh': str(self.refresh),
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_token_invalide_accepte(self):
        """Un token déjà expiré/invalide → logout quand même réussi côté client."""
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/accounts/logout/', {
            'refresh': 'token.invalide.ici',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


# ════════════════════════════════════════════════════════════════════════════════
# MeView — profil courant
# ════════════════════════════════════════════════════════════════════════════════

class MeViewTests(APITestCase):

    def setUp(self):
        self.guest = make_guest()
        self.host  = make_host()

    def test_get_me_guest(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.get('/api/accounts/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], 'g@test.ci')
        self.assertEqual(resp.data['role'], 'guest')

    def test_get_me_inclut_profil_guest(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.get('/api/accounts/me/')
        self.assertIn('profile', resp.data)

    def test_get_me_inclut_profil_host(self):
        self.client.force_authenticate(self.host)
        resp = self.client.get('/api/accounts/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('profile', resp.data)

    def test_get_me_non_authentifie(self):
        resp = self.client.get('/api/accounts/me/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_me_met_a_jour_nom(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.patch('/api/accounts/me/', {
            'first_name': 'NouveauPrénom',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.guest.refresh_from_db()
        self.assertEqual(self.guest.first_name, 'NouveauPrénom')

    def test_patch_me_ne_peut_pas_changer_role(self):
        self.client.force_authenticate(self.guest)
        self.client.patch('/api/accounts/me/', {'role': 'superadmin'}, format='json')
        self.guest.refresh_from_db()
        self.assertEqual(self.guest.role, 'guest')  # le role est read_only


# ════════════════════════════════════════════════════════════════════════════════
# Profil Voyageur
# ════════════════════════════════════════════════════════════════════════════════

class GuestProfileTests(APITestCase):

    def setUp(self):
        self.guest = make_guest()
        self.host  = make_host()

    def test_get_profil_guest(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.get('/api/accounts/profile/guest/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_host_ne_peut_pas_acceder_profil_guest(self):
        self.client.force_authenticate(self.host)
        resp = self.client.get('/api/accounts/profile/guest/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_authentifie_refuse(self):
        resp = self.client.get('/api/accounts/profile/guest/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ════════════════════════════════════════════════════════════════════════════════
# Profil Hébergeur
# ════════════════════════════════════════════════════════════════════════════════

class HostProfileTests(APITestCase):

    def setUp(self):
        self.guest = make_guest()
        self.host  = make_host()

    def test_get_profil_host(self):
        self.client.force_authenticate(self.host)
        resp = self.client.get('/api/accounts/profile/host/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_patch_profil_host(self):
        self.client.force_authenticate(self.host)
        resp = self.client.patch('/api/accounts/profile/host/', {
            'company_name': 'Résidences Abidjan SARL',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        profile = HostProfile.objects.get(user=self.host)
        self.assertEqual(profile.company_name, 'Résidences Abidjan SARL')

    def test_guest_ne_peut_pas_acceder_profil_host(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.get('/api/accounts/profile/host/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


# ════════════════════════════════════════════════════════════════════════════════
# Modèle User
# ════════════════════════════════════════════════════════════════════════════════

class UserModelTests(TestCase):

    def test_superadmin_a_is_staff_et_is_superuser(self):
        u = User.objects.create_user(
            email='sa@test.ci', password='pass', role='superadmin',
        )
        self.assertTrue(u.is_staff)
        self.assertTrue(u.is_superuser)

    def test_moderator_a_is_staff_seulement(self):
        u = User.objects.create_user(
            email='mod@test.ci', password='pass', role='moderator',
        )
        self.assertTrue(u.is_staff)
        self.assertFalse(u.is_superuser)

    def test_guest_pas_de_droits_admin(self):
        u = User.objects.create_user(
            email='guest@test.ci', password='pass', role='guest',
        )
        self.assertFalse(u.is_staff)
        self.assertFalse(u.is_superuser)

    def test_host_pas_de_droits_admin(self):
        u = User.objects.create_user(
            email='host@test.ci', password='pass', role='host',
        )
        self.assertFalse(u.is_staff)
        self.assertFalse(u.is_superuser)

    def test_is_host_property(self):
        u = User.objects.create_user(email='h@test.ci', password='pass', role='host')
        self.assertTrue(u.is_host)
        self.assertFalse(u.is_guest)

    def test_is_guest_property(self):
        u = User.objects.create_user(email='g2@test.ci', password='pass', role='guest')
        self.assertTrue(u.is_guest)
        self.assertFalse(u.is_host)

    def test_is_staff_user_property(self):
        mod = User.objects.create_user(email='m@test.ci', password='pass', role='moderator')
        sa  = User.objects.create_user(email='s@test.ci', password='pass', role='superadmin')
        g   = User.objects.create_user(email='gg@test.ci', password='pass', role='guest')
        self.assertTrue(mod.is_staff_user)
        self.assertTrue(sa.is_staff_user)
        self.assertFalse(g.is_staff_user)

    def test_str_contient_email_et_role(self):
        u = User.objects.create_user(email='str@test.ci', password='pass', role='guest')
        self.assertIn('str@test.ci', str(u))

    def test_email_requis(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='pass')

    def test_create_superuser(self):
        u = User.objects.create_superuser(
            email='super@test.ci', password='pass',
            first_name='Super', last_name='Admin',
        )
        self.assertTrue(u.is_staff)
        self.assertTrue(u.is_superuser)
        self.assertEqual(u.role, 'superadmin')
