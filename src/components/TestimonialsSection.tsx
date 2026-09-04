import React, { useEffect, useState } from 'react';
import { MessageSquareQuote, Star } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type Testimonial = { id: string; author: string; quote: string; rating: number };

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [author, setAuthor] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('testimonials').select('id, author, quote, rating').eq('published', true).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setTestimonials((data || []) as Testimonial[]); });
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!author.trim() || !quote.trim() || !isSupabaseConfigured) {
      setMessage(isSupabaseConfigured ? 'Completa tu nombre y reseña.' : 'Las calificaciones estarán disponibles próximamente.');
      return;
    }
    const { error } = await supabase.from('testimonials').insert({ author: author.trim(), quote: quote.trim(), rating, published: false });
    setMessage(error ? 'No pudimos guardar tu reseña. Intenta nuevamente.' : 'Gracias. Tu reseña será revisada antes de publicarse.');
    if (!error) { setAuthor(''); setQuote(''); setRating(5); }
  };

  return <section id="testimonios" className="bg-[#1a1c1c] px-4 py-24 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-12 text-center"><MessageSquareQuote className="mx-auto mb-4 h-8 w-8 text-[#e9c176]" /><span className="font-mono text-xs uppercase tracking-[.2em] text-[#e9c176]">Experiencias reales</span><h2 className="mt-2 font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">Calificá tu experiencia</h2></div>
      <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={submit} className="border border-[#4e4639] bg-[#121414] p-6 sm:p-8"><label className="mb-4 block text-sm text-[#d1c5b4]">Tu nombre<input required value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-2 w-full border border-[#4e4639] bg-[#1e2020] px-3 py-2 text-white outline-none focus:border-[#e9c176]" /></label><fieldset className="mb-4"><legend className="mb-2 text-sm text-[#d1c5b4]">Valoración</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} estrellas`}><Star className={`h-6 w-6 ${value <= rating ? 'fill-[#e9c176] text-[#e9c176]' : 'text-[#4e4639]'}`} /></button>)}</div></fieldset><label className="block text-sm text-[#d1c5b4]">Tu reseña<textarea required value={quote} onChange={(event) => setQuote(event.target.value)} className="mt-2 min-h-28 w-full border border-[#4e4639] bg-[#1e2020] px-3 py-2 text-white outline-none focus:border-[#e9c176]" /></label><button className="mt-5 bg-[#e9c176] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#261900]">Enviar calificación</button>{message && <p className="mt-4 text-sm text-[#e9c176]">{message}</p>}</form>
        <div className="grid gap-4 sm:grid-cols-2">{testimonials.length === 0 ? <p className="text-sm text-[#9a8f80]">Todavía no hay testimonios publicados.</p> : testimonials.map((item) => <article key={item.id} className="border border-[#4e4639]/70 bg-[#121414] p-6"><div className="mb-3 flex">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= item.rating ? 'fill-[#e9c176] text-[#e9c176]' : 'text-[#4e4639]'}`} />)}</div><p className="text-sm leading-relaxed text-[#d1c5b4]">“{item.quote}”</p><p className="mt-4 font-mono text-xs uppercase tracking-widest text-[#e9c176]">{item.author}</p></article>)}</div>
      </div>
    </div>
  </section>;
}
