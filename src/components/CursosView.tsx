/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Screen } from '../types';
import { BookOpen, Zap } from 'lucide-react';

interface CursosViewProps {
  onNavigate: (screen: Screen) => void;
}

export default function CursosView({ onNavigate }: CursosViewProps) {
  return (
    <section className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="w-10 h-10 text-amber-400" />
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">
              Cursos
            </h1>
          </div>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Formación profesional en barbería y servicios especializados
          </p>
        </div>

        {/* Maintenance Message */}
        <div className="digital-maintenance-card rounded-2xl p-10 md:p-14 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl"></div>
              <Zap className="relative w-16 h-16 text-amber-400 animate-pulse" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-amber-50 mb-4">
            ¡Próximamente!
          </h2>

          <p className="text-lg text-amber-100/80 mb-6 leading-relaxed">
            Estamos preparando una experiencia educativa excepcional con cursos de formación profesional en barbería, técnicas avanzadas de cuidado capilar y servicios especializados.
          </p>

          <p className="text-amber-100/60 mb-8">
            Esta sección está en mantenimiento y actualización. Pronto podrás acceder a contenido educativo de calidad mundial.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('home')}
              className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Volver al inicio
            </button>
            <button
              onClick={() => onNavigate('membresias')}
              className="px-8 py-3 border-2 border-amber-400 text-amber-400 hover:bg-amber-400/10 font-semibold rounded-lg transition-all duration-300"
            >
              Ver membresías
            </button>
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          <div className="bg-zinc-900/50 border border-amber-500/20 rounded-lg p-6 text-center hover:border-amber-500/40 transition-colors">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-amber-400 font-bold mb-2">Cursos Teóricos</h3>
            <p className="text-zinc-400 text-sm">
              Aprende los fundamentos y técnicas esenciales
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-amber-500/20 rounded-lg p-6 text-center hover:border-amber-500/40 transition-colors">
            <div className="text-4xl mb-3">✂️</div>
            <h3 className="text-amber-400 font-bold mb-2">Prácticas Presenciales</h3>
            <p className="text-zinc-400 text-sm">
              Manos a la obra en nuestras instalaciones
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-amber-500/20 rounded-lg p-6 text-center hover:border-amber-500/40 transition-colors">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-amber-400 font-bold mb-2">Certificación</h3>
            <p className="text-zinc-400 text-sm">
              Obtén tu certificado profesional
            </p>
          </div>
        </div>

        {/* Stay Updated */}
        <div className="mt-16 text-center">
          <p className="text-zinc-400 mb-3">
            Estate atento a nuestras novedades
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="inline-block text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            Ir a Novedades →
          </button>
        </div>
      </div>
    </section>
  );
}
