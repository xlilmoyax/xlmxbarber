/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen, RegisteredUser } from '../types';
import { isSupabaseConfigured, supabase, mapRowToUser } from '../lib/supabaseClient';
import { sanitizeInput, validateEmail, validatePhone } from '../lib/security';
import { 
  CornerUpLeft, Lock, User, AlertTriangle, KeyRound, 
  Mail, Phone, Calendar, Sparkles, LogOut,
  ShieldAlert, CheckCircle2, CreditCard
} from 'lucide-react';

interface AdminLoginViewProps {
  onNavigate: (screen: Screen) => void;
  onLoginSuccess: () => void;
  users: RegisteredUser[];
  onAddUser: (user: RegisteredUser) => Promise<boolean>;
  loggedInClient: RegisteredUser | null;
  setLoggedInClient: (user: RegisteredUser | null) => void;
}

export default function AdminLoginView({ 
  onNavigate, 
  onLoginSuccess,
  users,
  onAddUser,
  loggedInClient,
  setLoggedInClient
}: AdminLoginViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [clientEmail, setClientEmail] = useState('');
  
  // Registration Form States
  const [fullname, setFullname] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSocio, setIsSocio] = useState<boolean>(false);
  const [membership, setMembership] = useState<'bronce' | 'plata' | 'gold' | 'ninguno'>('ninguno');

  // Admin login states
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Notifications & animations states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [clientErrorMsg, setClientErrorMsg] = useState<string | null>(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Client email verification login using Supabase
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = sanitizeInput(clientEmail).trim().toLowerCase();
    
    if (!sanitizedEmail) {
      setClientErrorMsg('Por favor introduce tu correo electrónico.');
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      setClientErrorMsg('Por favor introduce un formato de correo electrónico válido.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    
    setLoading(true);
    setClientErrorMsg(null);

    if (!isSupabaseConfigured) {
      const localUser = users.find((user) => user.email.trim().toLowerCase() === sanitizedEmail);
      if (localUser) {
        setLoggedInClient(localUser);
        setSuccessMsg(`¡Bienvenido de vuelta, ${localUser.fullname}! Tu pasaporte digital está listo.`);
        setClientEmail('');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setClientErrorMsg('El correo ingresado no coincide con ningún cliente registrado en este dispositivo.');
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', sanitizedEmail)
        .limit(1)
        .maybeSingle();

      if (error) {
        // Permite entrar con un perfil que ya quedó guardado en este navegador
        // si la consulta remota no está disponible temporalmente.
        const localUser = users.find((user) => user.email.trim().toLowerCase() === sanitizedEmail);
        if (localUser) {
          setLoggedInClient(localUser);
          setSuccessMsg(`¡Bienvenido de vuelta, ${localUser.fullname}! Tu pasaporte digital está listo.`);
          setClientEmail('');
          setTimeout(() => setSuccessMsg(null), 5000);
          return;
        }
        throw error;
      }

      if (data) {
        const mappedUser = mapRowToUser(data);
        setLoggedInClient(mappedUser);
        setSuccessMsg(`¡Bienvenido de vuelta, ${mappedUser.fullname}! Tu pasaporte digital está listo.`);
        setClientEmail('');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        const localUser = users.find((user) => user.email.trim().toLowerCase() === sanitizedEmail);
        if (localUser) {
          setLoggedInClient(localUser);
          setSuccessMsg(`¡Bienvenido de vuelta, ${localUser.fullname}! Tu pasaporte digital está listo.`);
          setClientEmail('');
          setTimeout(() => setSuccessMsg(null), 5000);
          return;
        }
        setClientErrorMsg('El correo ingresado no coincide con ningún cliente registrado. Por favor, crea un perfil en la pestaña "Registrarse".');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err: any) {
      console.error('Error de conexión Supabase al verificar usuario:', err);
      const fallbackUser = users.find((user) => user.email.toLowerCase() === sanitizedEmail);
      if (fallbackUser) {
        setLoggedInClient(fallbackUser);
        setSuccessMsg(`¡Bienvenido de vuelta, ${fallbackUser.fullname}! Se cargó tu perfil desde el caché local.`);
        setClientEmail('');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setClientErrorMsg('Error de conexión al verificar el usuario. Por favor intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Client registration saving to Supabase
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitizing inputs
    const sanitizedName = sanitizeInput(fullname).trim();
    const sanitizedEmail = sanitizeInput(email).trim().toLowerCase();
    const sanitizedPhone = sanitizeInput(phone).trim();

    if (!sanitizedName || !sanitizedEmail || !sanitizedPhone) {
      setClientErrorMsg('Por favor completa todos los campos requeridos (*).');
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      setClientErrorMsg('Formato de correo electrónico inválido.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (!validatePhone(sanitizedPhone)) {
      setClientErrorMsg('El teléfono contiene caracteres no permitidos. Usa solo números, espacio y "+"');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 8 || parsedAge > 120) {
      setClientErrorMsg('Ingresa una edad válida entre 8 y 120 años.');
      return;
    }

    setLoading(true);
    setClientErrorMsg(null);

    try {
      const localUser = users.find((user) => user.email.trim().toLowerCase() === sanitizedEmail);
      if (localUser) {
        setClientErrorMsg('Este correo electrónico ya tiene un perfil activo. Intenta iniciar sesión en la pestaña contigua.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        return;
      }

      let existingUser: { id: string } | null = null;
      if (isSupabaseConfigured) {
        const { data, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', sanitizedEmail)
          .limit(1)
          .maybeSingle();

        if (checkError) throw checkError;
        existingUser = data;
      }

      if (existingUser) {
        setClientErrorMsg('Este correo electrónico ya tiene un perfil activo. Intenta iniciar sesión en la pestaña contigua.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setLoading(false);
        return;
      }

      const newUser: RegisteredUser = {
        id: 'usr_' + Date.now().toString(36),
        fullname: sanitizedName,
        age: parsedAge,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        isSocio,
        membership: isSocio ? (membership === 'ninguno' ? 'bronce' : membership) : 'ninguno',
        createdAt: new Date().toISOString(),
      };

      // Save to Supabase and send notifications
      const success = await onAddUser(newUser);
      if (!success) {
        throw new Error('No se pudo guardar el registro, intenta de nuevo.');
      }

      setLoggedInClient(newUser);
      setSuccessMsg(`¡Registro Exitoso para ${sanitizedName}!`);

      // Reset registration form inputs
      setFullname('');
      setEmail('');
      setPhone('');
      setAge('');
      setIsSocio(false);
      setMembership('ninguno');

      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setClientErrorMsg('Error al registrar tu cuenta en el servidor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin login handler (Credential securitization using environment variables)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Supabase Auth creates the session required by the RLS policies.
    const VALID_USER = import.meta.env.VITE_ADMIN_USER || 'xlmxbarber';
    const VALID_PASS = import.meta.env.VITE_ADMIN_PASS || '11824';

    const cleanUsername = sanitizeInput(username).trim();
    const cleanPassword = sanitizeInput(password).trim();

    if (isSupabaseConfigured) {
      setLoading(true);
      setAdminErrorMsg(null);
      const authEmail = cleanUsername.toLowerCase() === 'xlmxbarber'
        ? 'matymoya18@gmail.com'
        : cleanUsername;
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: cleanPassword,
      });

      if (!error) {
        onLoginSuccess();
        onNavigate('dashboard-admin');
        setUsername('');
        setPassword('');
      } else {
        setAdminErrorMsg('No se pudo iniciar sesión con Supabase Auth. Verifica el correo, la contraseña y el rol administrador.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
      setLoading(false);
      return;
    }

    if (cleanUsername === VALID_USER && cleanPassword === VALID_PASS) {
      setAdminErrorMsg(null);
      setIsShaking(false);
      onLoginSuccess();
      onNavigate('dashboard-admin');
      setUsername('');
      setPassword('');
    } else {
      setAdminErrorMsg('Usuario o contraseña administrativa incorrecta.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  // Quick logout helper
  const handleLogoutClient = () => {
    setLoggedInClient(null);
    setSuccessMsg('Has cerrado sesión correctamente de tu cuenta de cliente.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Get dynamic colors depending on membership
  const getBadgeStyle = (tier: string) => {
    switch(tier) {
      case 'gold': 
        return {
          bg: 'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 text-zinc-950 border-amber-400',
          desc: 'MEMBRESÍA VIP GOLD',
          perks: [
            '2 a 4 experiencias 360% totales mensuales',
            'Acceso ilimitado al VIP Lounge (PlayStation + streaming)',
            'Bebidas premium destiladas de cortesía',
            'Prioridad extrema al programar visitas personalizadas'
          ]
        };
      case 'plata':
        return {
          bg: 'bg-gradient-to-br from-zinc-300 via-slate-400 to-zinc-500 text-zinc-950 border-zinc-300',
          desc: 'MEMBRESÍA EXCLUSIVA PLATA',
          perks: [
            '2 a 4 cortes completos con spa capilar incluido',
            'Bebidas frías y cafés de especialidad de cortesía',
            'Prioridad media en asignaciones de agenda',
            'Acceso preferencial en eventos de la barbería'
          ]
        };
      case 'bronce':
        return {
          bg: 'bg-gradient-to-br from-amber-600 via-orange-700 to-amber-900 text-amber-50 border-amber-700',
          desc: 'MEMBRESÍA BRONCE',
          perks: [
            '2 a 4 cortes con ceja perfilada de precisión',
            'Cafetería de especialidad incluida',
            'Acceso prioritario mensual'
          ]
        };
      default:
        return {
          bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          desc: 'PERFIL REGISTRADO (ESTÁNDAR)',
          perks: [
            'Proceso de reserva ultrarrápido sin repetir datos',
            'Alertas sincronizadas por email/WhatsApp',
            'Monitoreo directo del estatus de tus cortes'
          ]
        };
    }
  };

  return (
    <div id="client-auth-view" className="py-12 sm:py-16 px-4 max-w-2xl mx-auto">
      
      {/* 1. Header Navigation Back */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-850">
        <button 
          id="login-back-btn"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
        >
          <CornerUpLeft className="w-4 h-4" />
          Volver al Inicio
        </button>
        <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-mono">
          Portal Premium · Sede Córdoba
        </span>
      </div>

      {/* 2. Main success notifier */}
      {successMsg && (
        <div id="auth-success-banner" className="mb-6 bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-lg flex items-start gap-3 text-emerald-200 text-xs leading-relaxed animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-grow">
            <span className="font-semibold block uppercase tracking-wider text-[11px]">Sincronización Correcta</span>
            <p className="mt-1">{successMsg}</p>
          </div>
        </div>
      )}

      {/* 3. If Client is Logged In, display their digital card! */}
      {loggedInClient ? (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] tracking-widest text-amber-500 uppercase font-semibold">PASAPORTE DIGITAL DE MIEMBRO</span>
                <h2 className="font-display text-xl font-bold text-white tracking-tight mt-0.5">
                  ¡Hola, {loggedInClient.fullname}!
                </h2>
              </div>
              <button
                onClick={handleLogoutClient}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white transition-all text-xs font-semibold"
                title="Cerrar Sesión de Cliente"
              >
                <LogOut className="w-3.5 h-3.5" />
                Salir
              </button>
            </div>

            {/* Simulated Luxury Member Card */}
            {(() => {
              const style = getBadgeStyle(loggedInClient.membership);
              return (
                <div className="space-y-4">
                  <div className={`p-6 rounded-xl border ${style.bg} relative overflow-hidden shadow-xl`}>
                    <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none">
                      <CreditCard className="w-48 h-48 rotate-12" />
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] tracking-widest font-mono uppercase opacity-85">
                          XLMX EXCLUSIVE GENTLEMEN CLUB
                        </span>
                        <h3 className="font-display font-black tracking-wider text-lg sm:text-2xl mt-1 select-all">
                          {loggedInClient.fullname.toUpperCase()}
                        </h3>
                      </div>
                      <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-current rounded backdrop-blur-sm">
                        {loggedInClient.membership.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-black/15 font-mono text-[11px]">
                      <div>
                        <span className="block opacity-60">ID DE MIEMBRO</span>
                        <span className="font-bold tracking-wider">{loggedInClient.id.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="block opacity-60">CONTACTO</span>
                        <span className="font-bold">{loggedInClient.phone}</span>
                      </div>
                      <div>
                        <span className="block opacity-60">CORREO ELECTRÓNICO</span>
                        <span className="font-bold select-all">{loggedInClient.email}</span>
                      </div>
                      <div>
                        <span className="block opacity-60">ESTADO REGISTRO</span>
                        <span className="font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          Sincronizado
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Membership Benefits Container */}
                  <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                      <span className="text-xs text-zinc-200 font-semibold uppercase tracking-wider">
                        Tus Beneficios Activos ({style.desc})
                      </span>
                    </div>
                    <ul className="space-y-2 text-zinc-400 text-xs font-light pl-6 list-disc">
                      {style.perks.map((perk, i) => (
                        <li key={i} className="leading-relaxed">{perk}</li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500">
                      <span>Coordinación Sede Córdoba</span>
                      <span className="font-mono text-amber-500/80">matymoya4@gmail.com</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 text-center">
              <button
                onClick={() => onNavigate('home')}
                className="px-6 py-2.5 rounded bg-amber-400 hover:bg-amber-305 text-zinc-950 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                Volver a Reservar en Inicio
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 4. If No Client is Logged In, display the elegant Auth options! */
        <div 
          id="login-form-card"
          className={`bg-zinc-900 border border-zinc-805 rounded-lg overflow-hidden transition-all ${
            isShaking ? 'animate-bounce shadow-lg shadow-red-500/10 border-red-500/50' : ''
          }`}
        >
          {/* Custom Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => {
                setActiveTab('login');
                setClientErrorMsg(null);
              }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-zinc-900 text-amber-400 border-b-2 border-amber-400'
                  : 'bg-zinc-950/40 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setClientErrorMsg(null);
              }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-zinc-900 text-amber-400 border-b-2 border-amber-400'
                  : 'bg-zinc-950/40 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Regístrate (Nuevo Perfil)
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Form warnings */}
            {clientErrorMsg && (
              <div id="client-error-placard" className="p-3 bg-red-950/40 border border-red-800/40 text-red-200 text-xs rounded flex gap-2.5 items-start">
                <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <span>{clientErrorMsg}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              /* TAB 1: CLIENT LOGIN */
              <div className="space-y-5">
                <div className="text-zinc-400 text-xs leading-relaxed space-y-1">
                  <h3 className="font-semibold text-white text-sm">Ingreso para Clientes Registrados</h3>
                  <p className="font-light">
                    Introduce el correo electrónico que utilizaste al registrarte para comprobar tu membresía cordobesa y ver tus beneficios exclusivos en tiempo real.
                  </p>
                </div>

                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                      <input
                        id="client-login-email"
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-3 pl-10 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors border-zinc-800"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded bg-amber-400 hover:bg-amber-305 text-zinc-950 font-bold uppercase tracking-widest text-xs transition-colors duration-300 cursor-pointer disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Ingresar a Mi Panel'}
                  </button>
                </form>
              </div>
            ) : (
              /* TAB 2: CLIENT REGISTRATION */
              <div className="space-y-5">
                <div className="text-zinc-400 text-xs leading-relaxed space-y-1">
                  <h3 className="font-semibold text-white text-sm">Crea tu Licencia de Cliente Premium</h3>
                  <p className="font-light">
                    Forma parte activa del Gentlemen Club. Gestiona tus turnos prioritarios y vincula tu registro con auditorías fluidas.
                  </p>
                </div>

                <form onSubmit={handleClientRegister} className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      Nombre y Apellido Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        placeholder=""
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                        maxLength={50}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Age & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                        Edad
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={age}
                          onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                        WhatsApp de Contacto *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder=""
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      Correo Electrónico de Acceso *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Membership Active options */}
                  <div className="p-3.5 rounded bg-zinc-950 border border-zinc-850 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-200 font-semibold uppercase tracking-wider">¿Tienes una Membresía?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSocio(!isSocio);
                          setMembership(!isSocio ? 'bronce' : 'ninguno');
                        }}
                        className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                          isSocio ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                        }`}
                        disabled={loading}
                      >
                        {isSocio ? 'Sí, tengo' : 'No tengo'}
                      </button>
                    </div>

                    {isSocio && (
                      <div className="space-y-2 pt-2.5 border-t border-zinc-900 animate-fadeIn flex flex-col">
                        <span className="block text-[9px] text-zinc-400 uppercase tracking-wider">Selecciona tu Nivel</span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['bronce', 'plata', 'gold'] as const).map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => setMembership(tier)}
                              className={`py-1.5 rounded text-[10px] uppercase font-bold tracking-widest border transition-all cursor-pointer ${
                                membership === tier
                                  ? 'bg-amber-400/10 text-amber-300 border-amber-400'
                                  : 'bg-zinc-900 text-zinc-500 border-transparent'
                              }`}
                              disabled={loading}
                            >
                              {tier}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded bg-amber-400 hover:bg-amber-305 text-zinc-950 font-bold uppercase tracking-widest text-xs transition-colors duration-300 cursor-pointer disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Registrando...' : 'Registrarme e Ingresar'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Masterful Bottom Section toggling Administrative Admin credentials */}
      <div className="mt-8 text-center space-y-3">
        {!showAdminLogin ? (
          <button
            onClick={() => {
              setShowAdminLogin(true);
              setAdminErrorMsg(null);
            }}
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-amber-500/80 text-[10px] uppercase tracking-widest font-mono transition-colors"
            title="Acceso restringido para el staff"
          >
            <Lock className="w-3 h-3" />
            ¿Sos barbero de XLMX? Acceso Administrativo
          </button>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-lg text-left max-w-sm mx-auto space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-[9px] font-mono tracking-widest text-[#ceaf7e] uppercase font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                SISTEMA DE SEGURIDAD XLMX
              </span>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-zinc-500 hover:text-red-400 text-[10px] font-mono leading-none"
              >
                [CERRAR]
              </button>
            </div>

            {adminErrorMsg && (
              <p className="text-[10.5px] text-red-400 bg-red-950/20 border border-red-900/20 p-2 rounded">
                {adminErrorMsg}
              </p>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3 font-sans">
              <div className="space-y-1 text-xs">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Usuario Barbero</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=""
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 pl-9 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors border-zinc-800"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Clave de Acceso</label>
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 pl-9 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors border-zinc-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded bg-[#977b58] hover:bg-[#866a47] text-white font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
              >
                Verificar Credenciales
              </button>
            </form>
          </div>
        )}

        <p className="text-[9px] text-zinc-600 leading-normal max-w-sm mx-auto">
          El portal de seguridad de base de datos monitoriza accesos activos en la casilla de auditoría oficial de la barbershop: <strong className="text-zinc-500">matymoya4@gmail.com</strong>.
        </p>
      </div>

    </div>
  );
}
