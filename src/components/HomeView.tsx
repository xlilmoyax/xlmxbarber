/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Screen } from '../types';
import { Crown, Sparkles, Gamepad2, ArrowRight, BookOpen } from 'lucide-react';
import { IMAGES } from '../data';
import TestimonialsSection from './TestimonialsSection';
import { renderBlocks } from '../lib/pageBlocks';
import { usePageBlocks } from '../lib/usePageBlocks';
import { SitePage } from '../lib/pageStore';

function PageSection({ page, children }: { page: { loading: boolean; page: SitePage | null }; children: React.ReactNode }) {
  if (!page || !page.page) return <>{children}</>;
  return <div className="bg-[#FAF9F6]">{renderBlocks(page.page.blocks)}</div>;
}

const VERSICULOS_RVR1960: { ref: string; text: string }[] = [
  { ref: 'Salmos 51:10', text: 'Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto dentro de mí.' },
  { ref: 'Jeremías 29:11', text: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.' },
  { ref: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.' },
  { ref: 'Salmos 23:1', text: 'Jehová es mi pastor; nada me faltará.' },
  { ref: 'Isaías 41:10', text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.' },
  { ref: 'Romanos 8:28', text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien.' },
  { ref: 'Proverbios 3:5-6', text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.' },
  { ref: 'Josué 1:9', text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.' },
  { ref: 'Salmos 46:1', text: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.' },
  { ref: '2 Corintios 5:17', text: 'De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.' },
  { ref: 'Mateo 11:28', text: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.' },
  { ref: 'Salmos 119:105', text: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.' },
  { ref: 'Isaías 40:31', text: 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas.' },
  { ref: 'Juan 14:6', text: 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.' },
  { ref: 'Salmos 27:1', text: 'Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?' },
  { ref: 'Romanos 12:2', text: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento.' },
  { ref: 'Filipenses 4:6-7', text: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios guardará vuestros corazones.' },
  { ref: 'Salmos 37:4', text: 'Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.' },
  { ref: '1 Pedro 5:7', text: 'Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.' },
  { ref: 'Santiago 1:5', text: 'Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche.' },
  { ref: 'Salmos 91:1-2', text: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío.' },
  { ref: 'Efesios 2:10', text: 'Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano.' },
  { ref: 'Lamentaciones 3:22-23', text: 'Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.' },
  { ref: 'Colosenses 3:23', text: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.' },
  { ref: 'Juan 3:16', text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.' },
  { ref: 'Salmos 34:8', text: 'Gustad, y ved que es bueno Jehová; dichoso el hombre que confía en él.' },
  { ref: 'Hebreos 11:1', text: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.' },
  { ref: 'Mateo 5:9', text: 'Bienaventurados los pacificadores, porque ellos serán llamados hijos de Dios.' },
  { ref: 'Gálatas 5:22-23', text: 'Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza.' },
  { ref: 'Salmos 121:1-2', text: 'Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene de Jehová, que hizo los cielos y la tierra.' },
];

function getVersiculoDelDia() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return VERSICULOS_RVR1960[dayOfYear % VERSICULOS_RVR1960.length];
}

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

  const inicio = usePageBlocks('inicio');
  const servicios = usePageBlocks('servicios');
  const aliados = usePageBlocks('aliados');
  const afiliados = usePageBlocks('afiliados');
  const novedades = usePageBlocks('novedades');
  const versiculo = React.useMemo(() => getVersiculoDelDia(), []);

  return (
    <div id="home-view" className="relative text-[#e2e2e2] bg-[#121414] overflow-x-hidden font-sans">

      <PageSection page={inicio}>
      {/* 1. Hero Section */}
      <section 
        id="home" 
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-12"
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

          {/* Versículo del día — RVR1960 — vidrio moderno reflectante */}
          <div className="mt-10 flex justify-center">
            <div className="group relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-[1px] shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
              {/* brillo superior reflectante */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60" />
              {/* reflejo diagonal sutil */}
              <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rotate-12 bg-gradient-to-br from-white/10 via-white/5 to-transparent blur-2xl opacity-40" />
              <div className="relative rounded-[15px] bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e9c176]/90">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e9c176]/15 ring-1 ring-[#e9c176]/30"><BookOpen className="h-3.5 w-3.5" /></span>
                  Versículo del día · RVR1960
                  <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block" />
                  <span className="hidden font-normal normal-case tracking-normal text-white/60 sm:inline">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <p className="mt-3 text-center font-serif text-base leading-relaxed text-white/90 sm:text-lg">
                  <span className="text-white/40">“</span>
                  <span className="italic">{versiculo.text}</span>
                  <span className="text-white/40">”</span>
                </p>
                <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#e9c176]">{versiculo.ref}</p>
                {/* reflejo inferior vidrio */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#e9c176]/20 to-transparent opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>
      </PageSection>

      {/* 2. Afiliación Exclusiva Section */}
      <PageSection page={afiliados}>
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
      </PageSection>

      {/* 3. Servicios Especializados Section */}
      <PageSection page={servicios}>
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
      </PageSection>

      {/* 4. Partners / Aliados Section */}
      <PageSection page={aliados}>
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
      </PageSection>

      {/* 5. News / Novedades Section */}
      <PageSection page={novedades}>
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
      </PageSection>

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
