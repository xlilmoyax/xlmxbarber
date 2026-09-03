/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen, RegisteredUser } from '../types';
import { IMAGES } from '../data';
import { Scissors, Menu, X, Lock, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  loggedInClient: RegisteredUser | null;
  onLogoutClient: () => void;
}
 interface NavItem {
    label: string;
    action: Screen;
    targetId: string | null;
    tooltip: string;
  }
export default function Header({
  currentScreen,
  onNavigate,
  isAdminLoggedIn,
  onLogoutAdmin,
  loggedInClient,
  onLogoutClient,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('INICIO');
 const clientMembership = loggedInClient?.membership?.toLowerCase();

  const membershipClass =
    clientMembership === 'gold'
      ? 'membership-gold'
      : clientMembership === 'plata'
      ? 'membership-plata'
      : clientMembership === 'bronce'
      ? 'membership-bronce'
      : '';

 

  const navigationItems: NavItem[] = [
    { 
      label: 'INICIO', 
      action: 'home', 
      targetId: 'home',
      tooltip: 'Desplazamiento fluido y elegante a la sección inicial de presentación.'
    },
    { 
      label: 'SERVICIOS', 
      action: 'home', 
      targetId: 'servicios-especializados',
      tooltip: 'Acceso directo y rápido al muestrario de tratamientos especializados.'
    },
    { 
      label: 'ALIADOS', 
      action: 'home', 
      targetId: 'aliados',
      tooltip: 'Dirección suave al bloque de marcas cosméticas y dermatológicas líderes.'
    },
    { 
      label: 'AFILIADOS', 
      action: 'membresias', 
      targetId: null,
      tooltip: 'Redirección inmediata al panel de membresías y beneficios exclusivos.'
    },
    { 
      label: 'NOVEDADES', 
      action: 'home', 
      targetId: 'news',
      tooltip: 'Enlace directo a los últimos comunicados e historias de la marca.'
    },
    {
      label: 'CURSOS',
      action: 'cursos',
      targetId: null,
      tooltip: 'Consulta la información sobre nuestros próximos cursos de formación.'
    },
  ];

  // Keep menu active state correctly aligned with current view context
  React.useEffect(() => {
    if (currentScreen === 'membresias') {
      setActiveItem('AFILIADOS');
    } else if (currentScreen === 'home') {
      const target = localStorage.getItem('scroll-target');
      if (target === 'servicios-especializados') {
        setActiveItem('SERVICIOS');
      } else if (target === 'aliados') {
        setActiveItem('ALIADOS');
      } else if (target === 'news') {
        setActiveItem('NOVEDADES');
      } else {
        setActiveItem('INICIO');
      }
    }
  }, [currentScreen]);

  const handleItemClick = (item: NavItem) => {
    setActiveItem(item.label);
    if (item.action === 'home') {
      if (currentScreen === 'home') {
        const el = document.getElementById(item.targetId || '');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        localStorage.setItem('scroll-target', item.targetId || '');
        onNavigate('home');
      }
    } else {
      onNavigate(item.action);
    }
    setMobileMenuOpen(false);
  };

  const isItemActive = (item: NavItem) => {
    if (item.action === 'membresias') {
      return currentScreen === 'membresias';
    }
    if (currentScreen !== 'home') {
      return false;
    }
    return activeItem === item.label;
  };

  return (
<header
      id="main-header"
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${
        membershipClass
          ? `${membershipClass} border-transparent`
          : 'bg-zinc-950/90 border-zinc-800/60'
      }`}
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand Custom Typography / Aesthetic Accent */}
          <div 
            id="brand-logo-container"
            onClick={() => {
              localStorage.setItem('scroll-target', 'home');
              onNavigate('home');
              setActiveItem('INICIO');
            }} 
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div>
              <span className="font-display block text-lg sm:text-xl tracking-widest text-amber-100 group-hover:text-amber-400 transition-colors uppercase font-bold">
                XLMX
              </span>
            </div>
          </div>

          {/* Desktop Navigation Link Menu */}
          <nav id="desktop-nav-links" className="hidden lg:flex items-center gap-6 xl:gap-8 mx-4">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                id={`desktop-nav-${item.label.toLowerCase()}`}
                onClick={() => handleItemClick(item)}
                title={item.tooltip}
                className={`text-xs tracking-widest uppercase font-bold cursor-pointer transition-all duration-200 hover:text-amber-300 pb-1 border-b-2 ${
                  isItemActive(item)
                    ? 'text-amber-400 border-amber-400'
                    : 'text-zinc-400 border-transparent'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Direct Iniciar Sesión integrated seamlessly into the navigation menu */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2 xl:gap-3 pl-1 border-l border-zinc-800">
                <button
                  id="desktop-nav-admin"
                  onClick={() => onNavigate('dashboard-admin')}
                  className={`text-xs tracking-widest uppercase font-bold cursor-pointer transition-all duration-200 hover:text-red-300 pb-1 border-b-2 flex items-center gap-1 ${
                    currentScreen === 'dashboard-admin'
                      ? 'text-red-400 border-red-400'
                      : 'text-zinc-400 border-transparent'
                  }`}
                  title="Dashboard Administrador"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  ADMIN
                </button>
                <span className="text-zinc-700 text-xs font-mono">/</span>
                <button
                  id="desktop-nav-logout"
                  onClick={onLogoutAdmin}
                  className="text-xs tracking-widest uppercase font-bold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer pb-1 border-b-2 border-transparent"
                  title="Cerrar Sesión Administrador"
                >
                  SALIR
                </button>
              </div>
            ) : loggedInClient ? (
            <div className="flex items-center gap-3 pl-1 border-l border-zinc-800">
              
              {/* Nombre del Cliente (Clicable para ir al perfil) */}
              <button
                onClick={() => onNavigate('login-admin')}
                className="text-xs tracking-widest uppercase font-bold text-zinc-300 hover:text-amber-400 transition-all cursor-pointer border-b-2 border-transparent hover:border-amber-400 pb-0.5"
              >
                {loggedInClient.fullname.split(' ')[0].toUpperCase()}
              </button>

              {/* Etiqueta de Membresía */}
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md ${
                clientMembership === 'gold'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black'
                  : clientMembership === 'plata'
                  ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
                  : 'bg-gradient-to-r from-amber-700 to-orange-600 text-black'
              }`}>
                👑 {clientMembership?.toUpperCase() || 'BRONCE'}
              </span>

              {/* Botón Salir */}
              <button
                id="desktop-nav-client-logout"
                onClick={(e) => {
                  e.preventDefault();
                  onLogoutClient();
                }}
                className="text-xs tracking-widest uppercase font-bold text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer pb-0.5 border-b-2 border-transparent"
                title="Cerrar Sesión"
              >
                SALIR
              </button>
            </div>
            ) : (
              <button
                id="desktop-nav-login"
                onClick={() => onNavigate('login-admin')}
                title="Iniciar Sesión / Registro de Cientes"
                className={`text-xs tracking-widest uppercase font-bold cursor-pointer transition-all duration-300 hover:text-amber-300 px-4 py-2 border border-zinc-800 rounded hover:border-amber-500/80 hover:bg-amber-400/5 ${
                  currentScreen === 'login-admin'
                    ? 'text-amber-400 border-amber-400 bg-amber-400/5'
                    : 'text-zinc-300'
                }`}
              >
                INICIAR SESIÓN
              </button>
            )}
          </nav>

          {/* Right Area containing Desktop CTAs and/or Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {/* Desktop Action buttons (Register / Book) */}
            <div id="desktop-nav-actions" className="hidden lg:flex items-center">
              <a
                id="header-cta-register"
                href="https://api.whatsapp.com/send?phone=543516851403&text=Hola%20Mati%2C%20quiero%20reservar%20un%20turno%2C%20Mi%20nombre%20es"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-2 rounded text-xs uppercase tracking-widest font-bold transition-all duration-300 cursor-pointer bg-amber-500 text-zinc-950 hover:bg-amber-400 hover:shadow-md hover:shadow-amber-500/10 btn-premium`}
              >
                RESERVAR
              </a>
            </div>

            {/* Mobile Menu trigger (>= 44px for safe touch metrics) */}
            <div className="flex items-center gap-3 lg:hidden">
              {isAdminLoggedIn && (
                <button
                  onClick={() => onNavigate('dashboard-admin')}
                  className="p-2.5 rounded bg-red-900/20 border border-red-800/30 text-red-300 hover:text-red-200"
                >
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                </button>
              )}
              <button
                id="mobile-nav-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Abrir Menú"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="lg:hidden bg-zinc-950 border-b border-zinc-800 py-4 px-4 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-830">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                id={`mobile-nav-${item.label.toLowerCase()}`}
                onClick={() => handleItemClick(item)}
                className={`py-2 px-3 text-left rounded text-xs uppercase tracking-wide font-medium transition-colors cursor-pointer ${
                  isItemActive(item)
                    ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-400 font-bold'
                    : 'text-zinc-300 bg-zinc-900/40 hover:bg-zinc-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              id="mobile-cta-register"
              href="https://api.whatsapp.com/send?phone=543516851403&text=Hola%20Mati%2C%20quiero%20reservar%20un%20turno%2C%20Mi%20nombre%20es"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest text-center"
            >
              RESERVAR
            </a>

            {isAdminLoggedIn ? (
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => {
                    onNavigate('dashboard-admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-zinc-900 border border-red-900/30 text-red-200 text-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  Ir al Panel Barbería XLMX
                </button>
                <button
                  onClick={() => {
                    onLogoutAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs text-center font-light uppercase tracking-wider"
                >
                  Cerrar Sesión Administrador
                </button>
              </div>
            ) : loggedInClient ? (
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => {
                    onNavigate('login-admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold text-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  Ver Perfil ({loggedInClient.fullname.split(' ')[0]})
                </button>
                <button
                  onClick={() => {
                    onLogoutClient();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs text-center uppercase tracking-wider"
                >
                  Cerrar Sesión de Cliente
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onNavigate('login-admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-amber-200 text-xs tracking-wider"
              >
                Iniciar Sesión / Registro
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
