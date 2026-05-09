import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/ContexteAuth';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle, Eye, EyeOff, Home } from 'lucide-react';

export default function Inscription() {
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '', phone: '',
    password: '', password_confirm: '', role: 'guest',
  });
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [mdpVisible, setMdpVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erreurs[name]) setErreurs((prev) => ({ ...prev, [name]: undefined }));
    if (erreurGlobale) setErreurGlobale('');
  };

  const handleSoumission = async (e) => {
    e.preventDefault();
    setErreurs({});
    setErreurGlobale('');

    if (form.password !== form.password_confirm) {
      setErreurs({ password_confirm: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setChargement(true);
    try {
      await register(form);
      setSucces(true);
      try {
        await login(form.email, form.password);
        navigate('/', { replace: true });
      } catch {
        setTimeout(() => navigate('/connexion'), 2000);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const champsErreurs = {};
        Object.entries(data).forEach(([cle, val]) => {
          const msg = Array.isArray(val) ? val[0] : val;
          if (cle === 'non_field_errors' || cle === 'detail') setErreurGlobale(msg);
          else champsErreurs[cle] = msg;
        });
        if (Object.keys(champsErreurs).length) setErreurs(champsErreurs);
      } else {
        setErreurGlobale('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setChargement(false);
    }
  };

  const champClasse = (nom) =>
    `champ pl-10 ${erreurs[nom] ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`;

  if (succes) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-noam-50 via-white to-or-50 px-4">
        <div className="carte w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-noam-100">
            <CheckCircle className="h-8 w-8 text-noam-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Compte créé !</h2>
          <p className="mt-2 text-gray-500">Connexion automatique en cours...</p>
          <div className="mt-4 flex justify-center">
            <span className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-noam-50 via-white to-or-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-noam-600 to-noam-500 shadow-noam">
              <Home className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-noam-600">Noam</span>
              <span className="text-gray-900">Home</span>
            </span>
          </Link>
        </div>

        <div className="carte p-8">
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="mt-1 text-sm text-gray-500">Rejoignez NoamHome en quelques secondes</p>

          {erreurGlobale && (
            <div className="alerte-erreur mt-5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{erreurGlobale}</span>
            </div>
          )}

          <form onSubmit={handleSoumission} className="mt-6 space-y-4" noValidate>
            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'first_name', label: 'Prénom', auto: 'given-name' },
                { id: 'last_name', label: 'Nom', auto: 'family-name' },
              ].map((f) => (
                <div key={f.id} className="groupe-champ">
                  <label htmlFor={f.id} className="label">{f.label}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      id={f.id} name={f.id} required autoComplete={f.auto}
                      className={champClasse(f.id)}
                      value={form[f.id]} onChange={handleChange}
                    />
                  </div>
                  {erreurs[f.id] && <p className="text-xs text-red-600">{erreurs[f.id]}</p>}
                </div>
              ))}
            </div>

            {/* Email */}
            <div className="groupe-champ">
              <label htmlFor="email" className="label">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  className={champClasse('email')}
                  placeholder="vous@exemple.com"
                  value={form.email} onChange={handleChange}
                />
              </div>
              {erreurs.email && <p className="text-xs text-red-600">{erreurs.email}</p>}
            </div>

            {/* Téléphone */}
            <div className="groupe-champ">
              <label htmlFor="phone" className="label">
                Téléphone <span className="font-normal text-gray-400">(optionnel)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="phone" name="phone" type="tel" autoComplete="tel"
                  className="champ pl-10"
                  placeholder="+225 07 XX XX XX XX"
                  value={form.phone} onChange={handleChange}
                />
              </div>
            </div>

            {/* Type de compte */}
            <div className="groupe-champ">
              <label htmlFor="role" className="label">Je suis...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'guest', emoji: '🧳', titre: 'Voyageur', desc: 'Je cherche un hébergement' },
                  { val: 'host', emoji: '🏠', titre: 'Hôte', desc: 'Je propose un hébergement' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: opt.val }))}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all duration-150 ${
                      form.role === opt.val
                        ? 'border-noam-500 bg-noam-50 text-noam-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-sm font-semibold">{opt.titre}</span>
                    <span className="text-xs text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="groupe-champ">
              <label htmlFor="password" className="label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="password" name="password"
                  type={mdpVisible ? 'text' : 'password'}
                  required autoComplete="new-password"
                  className={`${champClasse('password')} pr-11`}
                  placeholder="8 caractères minimum"
                  value={form.password} onChange={handleChange}
                />
                <button type="button" tabIndex={-1}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setMdpVisible((v) => !v)}>
                  {mdpVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {erreurs.password && <p className="text-xs text-red-600">{erreurs.password}</p>}
            </div>

            {/* Confirmation */}
            <div className="groupe-champ">
              <label htmlFor="password_confirm" className="label">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="password_confirm" name="password_confirm"
                  type={confirmVisible ? 'text' : 'password'}
                  required autoComplete="new-password"
                  className={`${champClasse('password_confirm')} pr-11`}
                  placeholder="••••••••"
                  value={form.password_confirm} onChange={handleChange}
                />
                <button type="button" tabIndex={-1}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setConfirmVisible((v) => !v)}>
                  {confirmVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {erreurs.password_confirm && <p className="text-xs text-red-600">{erreurs.password_confirm}</p>}
            </div>

            <button type="submit" disabled={chargement} className="btn-primaire w-full py-3 text-base">
              {chargement ? (
                <><span className="spinner h-4 w-4 border-white border-t-transparent" /> Création...</>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="font-semibold text-noam-600 hover:text-noam-700 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
