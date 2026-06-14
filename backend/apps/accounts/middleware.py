"""
Middleware pour la gestion améliorée des cookies et la sécurité
"""
from django.conf import settings
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Ajoute des headers de sécurité HTTP pour protéger contre les attaques courantes
    """
    def process_response(self, request, response):
        # Protection contre XSS
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Protection contre le clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Protection contre le sniffing de type MIME
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Politique de référence
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions Policy (anciennement Feature Policy)
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # HSTS (uniquement en HTTPS)
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        return response


class CookieSecurityMiddleware(MiddlewareMixin):
    """
    Configure les cookies avec des attributs de sécurité
    """
    def process_response(self, request, response):
        # Appliquer les attributs de sécurité aux cookies
        for cookie in response.cookies:
            # HttpOnly: empêche l'accès via JavaScript
            response.cookies[cookie]['httponly'] = True
            
            # Secure: envoie uniquement sur HTTPS
            if not settings.DEBUG:
                response.cookies[cookie]['secure'] = True
            
            # SameSite: protection CSRF
            response.cookies[cookie]['samesite'] = 'Lax'
        
        return response


class CSRFExemptPathsMiddleware(MiddlewareMixin):
    """
    Exempt certains chemins de la protection CSRF si nécessaire
    """
    def process_request(self, request):
        # Liste des chemins exemptés de CSRF
        csrf_exempt_paths = [
            '/api/auth/login/',
            '/api/accounts/register/',
        ]
        
        if request.path in csrf_exempt_paths:
            setattr(request, '_dont_enforce_csrf_checks', True)
