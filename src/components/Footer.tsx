import React from 'react';
import { Screen } from '../types';
import { Award, Share2, Mail, MapPin, Clock } from 'lucide-react';

interface FooterProps {
  onNavigate: (screen: Screen) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#0c0f0f] w-full py-16 border-t border-[#4e4639]/30 text-sm font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto text-center md:text-left">
        
        <div className="space-y-4">
          <div className="font-display text-lg sm:text-xl text-[#e9c176] uppercase tracking-widest font-semibold">
            BARBERÍA XLMX
          </div>
          <p className="font-sans text-sm text-[#d1c5b4] leading-relaxed max-w-sm mx-auto md:mx-0">
            Tu comunidad exclusiva para una experiencia premium en el cuidado de tu imagen personal.
          </p>
          <div className="flex justify-center md:justify-start space-x-4 pt-2">
            <a href="#" className="text-[#d1c5b4] hover:text-[#e9c176] transition-colors">
              <Award className="w-5 h-5" />
            </a>
            <a href="#" className="text-[#d1c5b4] hover:text-[#e9c176] transition-colors">
              <Share2 className="w-5 h-5" />
            </a>
            <a href="#" className="text-[#d1c5b4] hover:text-[#e9c176] transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-mono text-xs sm:text-sm text-[#e2e2e2] uppercase tracking-widest font-semibold">
            Enlaces Rápidos
          </h4>
          <ul className="space-y-3 font-mono text-xs text-[#d1c5b4] uppercase">
            <li>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onNavigate('legal'); }}
                className="hover:text-[#e9c176] transition-colors"
              >
                Política de Privacidad
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onNavigate('legal'); }}
                className="hover:text-[#e9c176] transition-colors"
              >
                Términos del Servicio
              </a>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('sobre-nosotros')}
                className="hover:text-[#e9c176] transition-colors uppercase cursor-pointer"
              >
                Conocenos
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('registro')}
                className="hover:text-[#e9c176] transition-colors uppercase cursor-pointer"
              >
                Afiliación
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="font-mono text-xs sm:text-sm text-[#e2e2e2] uppercase tracking-widest font-semibold">
            Ubicación Central
          </h4>
          <div className="font-sans text-sm text-[#d1c5b4] space-y-2 leading-relaxed">
            <p className="flex items-start justify-center md:justify-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#e9c176] shrink-0 mt-0.5" />
              <span>
                Villa Allende Parque<br />
                Sede Única XLMX, Ciudad de Córdoba
              </span>
            </p>
            <p className="flex items-start justify-center md:justify-start gap-2.5 pt-2">
              <Clock className="w-4 h-4 text-[#e9c176] shrink-0 mt-0.5" />
              <span>
                Lunes - Viernes: 07:00 - 16:00<br />
                Sábados: 07:00 - 15:00<br />
                <span className="text-[#e9c176] font-medium block mt-1">Trabajamos exclusivamente en la mañana.</span>
              </span>
            </p>
          </div>
        </div>

      </div>

      <div className="mt-16 pt-8 border-t border-[#4e4639]/10 text-center px-4">
        <p className="font-mono text-xs text-[#d1c5b4] uppercase tracking-widest leading-relaxed">
          © {new Date().getFullYear()} BARBERÍA XLMX. EXCLUSIVIDAD Y ESTILO EN CADA DETALLE. SEDE CÓRDOBA.
        </p>
      </div>
    </footer>
  );
}
