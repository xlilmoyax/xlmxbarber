/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Screen } from '../types';
import { Crown, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';
import { IMAGES } from '../data';
import TestimonialsSection from './TestimonialsSection';

interface HomeViewProps {
  onNavigate: (screen: Screen) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  // WhatsApp redirect URL
  const WHATSAPP_BOOKING_URL = 'https://api.whatsapp.com/send?phone=543516851403&text=Hola%20Mati%2C%20quiero%20reservar%20un%20turno%2C%20Mi%20nombre%20es';

  // Smooth scroll support when landing on Home from other views
  useEffect(() => {
    const scrollTarget = localStorage.getItem('scroll-target');
    if (scrollTarget) {
      localStorage.removeItem('scroll-target');
      const timer = setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // Smooth scroll helper for anchors
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="home-view" className="relative text-[#e2e2e2] bg-[#121414] overflow-x-hidden font-sans">
      
      {/* 1. Hero Section */}
      <section 
        id="home" 
        className="relative h-[90vh] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            className="w-full h-full object-cover blur-[2px] scale-105 brightness-[0.45]" 
            alt="Interior de barbería premium XLMX" 
            src={IMAGES.mainHeroBackground}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl">
          <h1 className="font-display text-4xl sm:text-6xl md:text-[64px] text-white mb-6 leading-tight tracking-tight uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            Bienvenido a <span className="text-[#e9c176]">XLMX</span>
          </h1>
          <p className="font-sans text-lg md:text-xl text-white font-medium mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Centro Especializado en Optimización y Cuidado de tu Imagen. Más que una barbería: tu comunidad exclusiva para una experiencia premium en el cuidado de tu imagen personal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              id="hero-book-now-whatsapp"
              className="bg-[#e9c176] text-[#261900] px-10 py-5 font-bold tracking-widest text-xs uppercase hover:opacity-90 transition-opacity rounded-[0.125rem] w-full sm:w-auto text-center" 
              href={WHATSAPP_BOOKING_URL} 
              target="_blank"
              rel="noopener noreferrer"
            >
              RESERVAR CITA
            </a>
            <button 
              id="hero-learn-more"
              onClick={() => onNavigate('sobre-nosotros')}
              className="border border-[#e9c176] text-[#e9c176] px-10 py-5 font-bold tracking-widest text-xs uppercase hover:bg-[#e9c176] hover:text-[#261900] transition-all rounded-[0.125rem] w-full sm:w-auto text-center cursor-pointer"
            >
              CONOCÉ MÁS
            </button>
          </div>
        </div>
      </section>

      {/* 2. Afiliación Exclusiva Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-[#e9c176] uppercase mb-8 border-l-4 border-[#e9c176] pl-6 tracking-wide">
              Afiliación Exclusiva para Miembros VIP
            </h2>
            <div className="space-y-10">
              
              <div className="group flex gap-6">
                <div className="flex-shrink-0 mt-1">
                  <Crown className="text-[#e9c176] w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl text-[#e2e2e2] mb-2 font-semibold">
                    Sistema de Afiliación XLMX
                  </h3>
                  <p className="font-sans text-sm sm:text-base text-[#d1c5b4] leading-relaxed">
                    Formá parte de nuestra comunidad selecta y accedé a beneficios de primer nivel, cobros automatizados, descuentos preferenciales y prioridad absoluta en tus reservas.
                  </p>
                </div>
              </div>

              <div className="group flex gap-6">
                <div className="flex-shrink-0 mt-1">
                  <Sparkles className="text-[#e9c176] w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl text-[#e2e2e2] mb-2 font-semibold">
                    Servicios Premium Exclusivos
                  </h3>
                  <p className="font-sans text-sm sm:text-base text-[#d1c5b4] leading-relaxed">
                    Acceso a tratamientos de vanguardia, eventos privados y experiencias diseñadas especialmente para llevar el cuidado de tu imagen personal al siguiente nivel.
                  </p>
                </div>
              </div>

              <div className="group flex gap-6">
                <div className="flex-shrink-0 mt-1">
                  <Gamepad2 className="text-[#e9c176] w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl text-[#e2e2e2] mb-2 font-semibold">
                    Lounge y Entretenimiento VIP
                  </h3>
                  <p className="font-sans text-sm sm:text-base text-[#d1c5b4] leading-relaxed">
                    Relajate al máximo antes o durante tu servicio. Disfrutá de nuestra zona gamer con PlayStation 3 y acceso ilimitado a tus plataformas de streaming favoritas.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 border border-[#4e4639] translate-x-4 translate-y-4"></div>
            <img 
              className="relative z-10 w-full h-[550px] object-cover grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl rounded-[0.125rem]" 
              alt="Ambiente elegante y equipo sofisticado de XLMX" 
              src={IMAGES.salonToolsGreyScale}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* 3. Servicios Especializados Section */}
      <section id="servicios-especializados" className="py-24 bg-[#1a1c1c]">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#e9c176] font-mono text-xs sm:text-sm tracking-[0.2em] uppercase block mb-2">
              Experiencia XLMX
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide">
              Servicios Especializados
            </h2>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Service 1: Permanentes */}
            <div className="col-span-12 md:col-span-6 group relative overflow-hidden h-[400px] rounded-[0.125rem] border border-[#4e4639]/30">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="Proceso de permanente con rizos definidos" 
                src={IMAGES.serviceBentoCurls}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-[#121414]/40 to-transparent opacity-95"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="font-display text-xl sm:text-2xl text-[#e2e2e2] mb-2 font-semibold">Permanentes</h3>
                <p className="font-sans text-sm text-[#d1c5b4] max-w-md leading-relaxed">
                  Rizos o rulos definidos con una duración de 2 a 3 meses. El estilo que buscabas, sin esfuerzo diario.
                </p>
              </div>
            </div>

            {/* Service 2: Limpieza Facial Profunda */}
            <button 
              onClick={() => onNavigate('limpieza-facial')}
              className="col-span-12 md:col-span-6 group relative overflow-hidden h-[400px] rounded-[0.125rem] border border-[#4e4639]/30 text-left cursor-pointer"
            >
              <img 
                className="w-full h-full object-cover object-[center_60%] transition-transform duration-700 group-hover:scale-105" 
                alt="Aplicación de máscara facial e hidratante" 
                src={IMAGES.serviceBentoFacial}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-[#121414]/40 to-transparent opacity-95"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="font-display text-xl sm:text-2xl text-[#e2e2e2] mb-2 font-semibold group-hover:text-[#e9c176] transition-colors">
                  Limpieza Facial Profunda
                </h3>
                <p className="font-sans text-sm text-[#d1c5b4] max-w-md leading-relaxed">
                  Limpieza, desintoxicación, exfoliación antipolución y máscara facial para renovar tu piel.
                </p>
              </div>
            </button>

            {/* Service 3: Servicio de Spa */}
            <button 
              onClick={() => onNavigate('spa-capilar')}
              className="col-span-12 md:col-span-5 group relative overflow-hidden h-[400px] rounded-[0.125rem] border border-[#4e4639]/30 text-left cursor-pointer"
            >
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="Ambiente relajante de spa capilar" 
                src={IMAGES.serviceBentoSpa}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-[#121414]/40 to-transparent opacity-95"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="font-display text-xl text-[#e2e2e2] mb-2 font-semibold group-hover:text-[#e9c176] transition-colors font-sans">
                  Servicio de Spa
                </h3>
                <p className="font-sans text-sm text-[#d1c5b4] leading-relaxed">
                  Loción anticaída, terapia muscular, aromaterapia e instrumental relajante para un relax total.
                </p>
              </div>
            </button>

            {/* Service 4: Experiencia 360 */}
            <button 
              onClick={() => onNavigate('experiencia-360')}
              className="col-span-12 md:col-span-7 group relative overflow-hidden h-[400px] rounded-[0.125rem] border border-[#4e4639]/30 text-left cursor-pointer"
            >
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="Experiencia boutique integral 360" 
                src={IMAGES.serviceBento360}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-[#121414]/40 to-transparent opacity-95"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="font-display text-xl sm:text-2xl text-[#e2e2e2] mb-2 font-semibold group-hover:text-[#e9c176] transition-colors">
                  Experiencia 360°
                </h3>
                <p className="font-sans text-sm text-[#d1c5b4] max-w-md leading-relaxed">
                  Servicio Completo, Tratamiento capilar profundo con masajes relajantes y aceites esenciales para una experiencia de bienestar total.
                </p>
              </div>
            </button>

            {/* Service 5: Servicio a Domicilio */}
            <button 
              onClick={() => onNavigate('servicio-domicilio')}
              className="col-span-12 group relative overflow-hidden h-[400px] rounded-[0.125rem] border border-[#4e4639]/30 text-left cursor-pointer"
            >
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="Barbero profesional a domicilio" 
                src={IMAGES.serviceBentoDomicilio}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-[#121414]/40 to-transparent opacity-95"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="font-display text-xl sm:text-2xl text-[#e2e2e2] mb-2 font-semibold group-hover:text-[#e9c176] transition-colors">
                  Servicio a Domicilio
                </h3>
                <p className="font-sans text-sm text-[#d1c5b4] max-w-2xl leading-relaxed">
                  La experiencia XLMX en la comodidad de tu hogar u oficina. Privacidad y distinción sin traslados.
                </p>
              </div>
            </button>

          </div>
        </div>
      </section>

      {/* 4. Partners / Aliados Section */}
      <section id="aliados" className="py-24 bg-[#333535]">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#e9c176] font-mono text-xs sm:text-sm tracking-[0.2em] uppercase block mb-2">
              Calidad Garantizada
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide">
              Confiamos en lo Mejor para Vos
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#d1c5b4] mt-4 max-w-2xl mx-auto leading-relaxed">
              Porque tu imagen y salud son nuestra prioridad absoluta, trabajamos exclusivamente con las marcas líderes del mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Partner 1: Idraet */}
            <div className="bg-[#1e2020] border-t-2 border-[#e9c176] p-10 flex flex-col items-center text-center group hover:bg-[#282a2b] transition-colors rounded-[0.125rem]">
              <div className="h-24 flex items-center justify-center mb-8">
                <h4 className="font-display text-3xl sm:text-4xl text-[#e2e2e2] tracking-tighter group-hover:text-[#e9c176] transition-colors uppercase font-bold">
                  IDRAET
                </h4>
              </div>
              <h3 className="font-display text-lg sm:text-xl text-white mb-4 uppercase font-semibold">
                Dermatocosmética Profesional
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#d1c5b4] leading-relaxed max-w-sm">
                Productos de alta tecnología diseñados para el cuidado específico de la piel masculina y tratamientos faciales avanzados.
              </p>
            </div>

            {/* Partner 2: Sir Fausto */}
            <div className="bg-[#1e2020] border-t-2 border-[#e9c176] p-10 flex flex-col items-center text-center group hover:bg-[#282a2b] transition-colors rounded-[0.125rem]">
              <div className="h-24 flex items-center justify-center mb-8">
                <h4 className="font-display text-3xl sm:text-4xl text-[#e2e2e2] tracking-tighter group-hover:text-[#e9c176] transition-colors italic uppercase font-bold">
                  SIR FAUSTO
                </h4>
              </div>
              <h3 className="font-display text-lg sm:text-xl text-white mb-4 uppercase font-semibold">
                Cosmética Masculina de Alto Nivel
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#d1c5b4] leading-relaxed max-w-sm">
                Línea exclusiva para el cuidado del cabello y la barba, basada en fórmulas tradicionales con ingredientes de vanguardia.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. News / Novedades Section */}
      <section id="news" className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#e9c176] font-mono text-xs sm:text-sm tracking-[0.2em] uppercase block mb-2">
            Novedades
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide">
            Lo Último en XLMX
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <article className="flex flex-col md:flex-row gap-8 items-center group">
            <div className="w-full md:w-1/2 aspect-video overflow-hidden rounded-[0.125rem] border border-[#4e4639]/20">
              <img 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt="Suscripción membresías VIP" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNIj8oEPhH8uKIatLDig46N6cC8jr3Sny5LVs56VbTM98BfdHXBQTDxOVCtFYY-9j_W0s2V6Cf_ykKVqHCTu7HVsaBSo6CGO5GEMPqrjbPqyyM9J8i5JTJVDpQSVSRRTAgh5t3TGSmWsnUtrxdp7q9yVdlXgmxHiVY-p3f75LRSUDjJMIgIHb7WnSsGPMoCVM6YEiIcKgTBpu7AgaglgN44Rf71_QqkOTqqNW45ST3Pw5i5tpSp6AA2s0xV4jEIupgkmmmYllVAnBe"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              <span className="font-mono text-xs text-[#e9c176] uppercase tracking-wider font-semibold">
                membresias
              </span>
              <h3 className="font-display text-lg sm:text-xl text-white font-semibold hover:text-[#e9c176] transition-colors">
                <button 
                  onClick={() => onNavigate('membresias')}
                  className="text-left font-display font-semibold cursor-pointer"
                >
                  ¿QUERÉS SER MIEMBRO VIP?
                </button>
              </h3>
              <p className="font-sans text-sm text-[#d1c5b4] leading-relaxed">
                Conocé mas sobre el Sistema de Membresías para nuestros Miembros Afiliados...
              </p>
              <button 
                onClick={() => onNavigate('membresias')}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-white border-b border-[#9a8f80] pb-1 uppercase tracking-wider hover:text-[#e9c176] hover:border-[#e9c176] transition-colors cursor-pointer"
              >
                Leer más <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </article>
        </div>
      </section>

      <TestimonialsSection />

      {/* Floating Reservation Widget (Desktop-Only Bottom Right) */}
      <div className="fixed bottom-8 right-8 z-40 hidden lg:block">
        <div className="backdrop-blur-md bg-[#121414]/90 p-6 border border-[#e9c176] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 rounded-[0.125rem]">
          <div>
            <p className="font-mono text-xs text-[#e9c176] uppercase tracking-widest font-semibold mb-1">¿Listo para el cambio?</p>
            <p className="font-display text-base text-white font-semibold">Tu espacio te espera</p>
          </div>
          <a 
            className="bg-[#e9c176] text-[#261900] px-6 py-3 font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform rounded-[0.125rem] text-center" 
            href={WHATSAPP_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            RESERVAR YA
          </a>
        </div>
      </div>

    </div>
  );
}
