/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen, RegisteredUser } from '../types';
import { CornerUpLeft, User, Mail, Phone, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

interface RegistroViewProps {
  onNavigate: (screen: Screen) => void;
  onAddUser: (user: RegisteredUser) => Promise<boolean>;
  isSection?: boolean;
  setLoggedInClient?: (user: RegisteredUser | null) => void; 
}

export default function RegistroView({ onNavigate, onAddUser, isSection = false, setLoggedInClient }: RegistroViewProps) {
  const [fullname, setFullname] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSocio, setIsSocio] = useState<boolean>(false);
  const [membership, setMembership] = useState<'bronce' | 'plata' | 'gold' | 'ninguno'>('ninguno');
  
  // Registration UI state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!fullname.trim() || fullname.trim().length < 3) {
      setErrorMsg('Ingresa tu nombre completo (mínimo 3 caracteres).');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Ingresa un email válido (ej: nombre@dominio.com).');
      return false;
    }
    if (!phone.trim() || !/^\+?[\d\s\-()]{8,20}$/.test(phone.trim())) {
      setErrorMsg('Ingresa un teléfono válido (8 a 20 dígitos, puede incluir +).');
      return false;
    }
    const parsedAge = Number(age);
    if (!age.trim() || !Number.isInteger(parsedAge) || parsedAge < 8 || parsedAge > 120) {
      setErrorMsg('Ingresa una edad válida entre 8 y 120 años.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg(null);
    
    if (!validate()) return;

    const parsedAge = Number(age);

    const newUser: RegisteredUser = {
      id: crypto.randomUUID(),
      fullname: fullname.trim(),
      age: parsedAge,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      isSocio,
      membership: isSocio ? membership : 'ninguno',
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const success = await onAddUser(newUser);
      if (!success) {
        setErrorMsg('No se pudo completar el registro. Si el email ya existe, usa otro o inicia sesión.');
        return;
      }

      if (setLoggedInClient) {
        setLoggedInClient(newUser);
      }

      setSuccessMsg(`¡Registro exitoso para ${fullname.trim()}!`);
      setFullname('');
      setAge('');
      setEmail('');
      setPhone('');
      setIsSocio(false);
      setMembership('ninguno');
      setTimeout(() => setSuccessMsg(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const inputBase = "w-full bg-zinc-950 border rounded px-3 py-3 pl-10 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors";
  const inputOk = "border-zinc-800 focus:border-amber-400/80";
  const inputErr = "border-red-500/50 focus:border-red-400";

  return (
    <div id="registro-view" className={`${isSection ? 'py-6' : 'py-12'} px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto`}>
      
      {/* 1. Header Back links */}
      {!isSection && (
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <button 
            id="registro-back-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            <CornerUpLeft className="w-4 h-4" />
            Volver al Inicio
          </button>
          <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-mono">
            Registro de Cliente · XLMX Sede Córdoba
          </span>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-6">
        
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Registra tu Perfil de Cliente Premium
          </h1>
          <p className="text-zinc-400 text-xs mt-1.5 font-light">
            Únete a nuestra base de datos para simplificar tus reservas futuras, acumular visitas exclusivas y registrar tu estatus de membresía.
          </p>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div role="alert" className="bg-red-950/40 border border-red-500/30 p-3 rounded-lg flex items-center gap-2 text-red-200 text-xs">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" aria-hidden />
            {errorMsg}
          </div>
        )}

        {/* Dynamic success alert placard */}
        {successMsg && (
          <div id="registro-success-banner" role="status" className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-lg flex items-start gap-3 text-emerald-200 text-xs leading-relaxed">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
            <div>
              <span className="font-semibold block uppercase tracking-wider text-[11px]">Procesamiento de Base de Datos Correcto</span>
              <p className="mt-1">{successMsg}</p>
              <button 
                onClick={() => onNavigate('home')}
                className="text-[10px] text-amber-300 underline font-semibold mt-2 block"
              >
                Volver al Hub Principal
              </button>
            </div>
          </div>
        )}

        <form id="client-registration-form" onSubmit={handleSubmit} noValidate className="space-y-5">
          
          {/* Form input: Name */}
          <div className="space-y-1.5">
            <label htmlFor="reg-input-fullname" className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Nombre y Apellido Completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" aria-hidden />
              <input
                id="reg-input-fullname"
                type="text"
                autoComplete="name"
                required
                aria-invalid={!!errorMsg && !fullname.trim()}
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className={`${inputBase} ${errorMsg && !fullname.trim() ? inputErr : inputOk}`}
                maxLength={60}
              />
            </div>
          </div>

          {/* Form grids: Age & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label htmlFor="reg-input-age" className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Edad del Cliente (Años) *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" aria-hidden />
                <input
                  id="reg-input-age"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  required
                  aria-invalid={!!errorMsg && (!age || Number(age)<8)}
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 28"
                  className={`${inputBase} ${inputOk}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-input-phone" className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Teléfono de Contacto (WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" aria-hidden />
                <input
                  id="reg-input-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  aria-invalid={!!errorMsg && !phone.trim()}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 351 123 4567"
                  className={`${inputBase} ${inputOk}`}
                />
              </div>
            </div>

          </div>

          {/* Form input: Email */}
          <div className="space-y-1.5">
            <label htmlFor="reg-input-email" className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Email Electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" aria-hidden />
              <input
                id="reg-input-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                aria-invalid={!!errorMsg && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={`${inputBase} ${inputOk}`}
              />
            </div>
          </div>

          {/* Socio Level Option fields */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-200 font-semibold uppercase tracking-wider">¿Posees Membresía Activa?</span>
              <button
                type="button"
                id="reg-btn-socio-toggle"
                onClick={() => {
                  setIsSocio(!isSocio);
                  if (!isSocio) {
                    setMembership('bronce');
                  } else {
                    setMembership('ninguno');
                  }
                }}
                className={`px-4 py-1.5 rounded text-[10px] tracking-widest font-bold uppercase transition-all duration-300 cursor-pointer ${
                  isSocio
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isSocio ? 'Sí, soy Socio' : 'No en este momento'}
              </button>
            </div>

            {isSocio && (
              <div className="space-y-2 pt-3.5 border-t border-zinc-800">
                <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Selecciona tu Nivel de Membresía</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['bronce', 'plata', 'gold'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      id={`reg-membership-select-${tier}`}
                      onClick={() => setMembership(tier)}
                      className={`py-2 px-3 rounded text-[10px] uppercase font-bold tracking-widest border transition-all cursor-pointer ${
                        membership === tier
                          ? 'bg-amber-400/10 text-amber-300 border-amber-400'
                          : 'bg-zinc-900 text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action trigger button */}
          <button
            id="reg-btn-submit"
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="w-full py-4 rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-zinc-950 font-bold uppercase tracking-widest text-xs transition-colors duration-300 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {saving ? 'Registrando...' : 'Registrar Perfil Completo'}
          </button>
          <p className="text-center text-[10px] text-zinc-500">Al registrarte aceptas el tratamiento de tus datos según nuestra política de privacidad.</p>

        </form>

      </div>

    </div>
  );
}
