import React from 'react';
import { Screen } from '../types';
import { Instagram, MapPin, Phone, Mail, Clock } from 'lucide-react';

interface FooterProps {
  onNavigate: (screen: Screen) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900/50 pt-16 pb-8 text-zinc-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Columna 1: Marca y presentación */}
          <div className="space-y-6">
            <h3 className="font-display text-2xl text-amber-400 tracking-wider">XLMX BARBER</h3>
            <p className="text-sm leading-relaxed text-zinc-500">
              Más que un corte de cabello, una experiencia de estilo, confort y exclusividad. 
              Elevamos la barbería tradicional con técnicas modernas e instalaciones de primer nivel.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com/xlmx.barber" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-amber-400 hover:border-amber-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              {/* Espacio para más redes si aplica */}
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-zinc-100 font-semibold tracking-widest text-sm uppercase mb-6">Explorar</h4>
            <ul className="space-y-4 text-sm">
              <li><button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">Inicio</button></li>
              <li><button onClick={() => onNavigate('sobre-nosotros')} className="hover:text-amber-400 transition-colors">Nuestra Historia</button></li>
              <li><button onClick={() => onNavigate('productos')} className="hover:text-amber-400 transition-colors">Catálogo de Productos</button></li>
              <li><button onClick={() => onNavigate('membresias')} className="hover:text-amber-400 transition-colors">Membresías</button></li>
              <li><button onClick={() => onNavigate('cursos')} className="hover:text-amber-400 transition-colors">Cursos Profesionales</button></li>
            </ul>
          </div>

          {/* Columna 3: Servicios */}
          <div>
            <h4 className="text-zinc-100 font-semibold tracking-widest text-sm uppercase mb-6">Servicios</h4>
            <ul className="space-y-4 text-sm">
              <li><button onClick={() => onNavigate('servicio-domicilio')} className="hover:text-amber-400 transition-colors">Atención a Domicilio</button></li>
              <li><button onClick={() => onNavigate('experiencia-360')} className="hover:text-amber-400 transition-colors">Experiencia 360°</button></li>
              <li><button onClick={() => onNavigate('spa-capilar')} className="hover:text-amber-400 transition-colors">Spa Capilar</button></li>
              <li><button onClick={() => onNavigate('limpieza-facial')} className="hover:text-amber-400 transition-colors">Limpieza Facial</button></li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h4 className="text-zinc-100 font-semibold tracking-widest text-sm uppercase mb-6">Contacto</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-amber-500 shrink-0" />
                <span>San Juan, Argentina<br/>(Dirección exacta al reservar)</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-500 shrink-0" />
                <a href="https://wa.me/5492645620967" className="hover:text-amber-400 transition-colors">+54 9 264 562-0967</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-500 shrink-0" />
                <a href="mailto:info@xlmxbarber.com" className="hover:text-amber-400 transition-colors">info@xlmxbarber.com</a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Mar a Sáb: 10:00 - 20:00<br/>Dom y Lun: Cerrado</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Separador inferior */}
        <div className="pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-zinc-600">
            &copy; {new Date().getFullYear()} XLMX Barber. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <button onClick={() => onNavigate('legal')} className="text-zinc-600 hover:text-zinc-400 transition-colors">Términos y Condiciones</button>
            <button onClick={() => onNavigate('legal')} className="text-zinc-600 hover:text-zinc-400 transition-colors">Política de Privacidad</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
