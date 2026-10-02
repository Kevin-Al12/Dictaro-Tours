'use client';

import { useState, useEffect } from 'react';
import { Star, Send, User, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewSectionProps {
  storageKey: string;
  title?: string;
  subtitle?: string;
}

const COLORS = ['bg-brand-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-600', 'bg-orange-500'];

const POSITIVE_TAGS = [
  'Excelente atención', 'Buena relación calidad-precio', 'Todo como se describió',
  'Buena ubicación', 'Limpieza impecable', 'Superó mis expectativas',
];
const NEGATIVE_TAGS = [
  'Mala atención', 'No cumplió lo prometido', 'Precio elevado',
  'Demoras / puntualidad', 'Problemas de limpieza', 'Comunicación deficiente',
];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(id: string) {
  return COLORS[parseInt(id.slice(-2), 10) % COLORS.length];
}

export default function ReviewSection({
  storageKey,
  title = 'Opiniones',
  subtitle,
}: ReviewSectionProps) {
  const LS_KEY = `ditaros-reviews-${storageKey}`;
  const FEEDBACK_LS_KEY = `ditaros-feedback-${storageKey}`;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setReviews(JSON.parse(stored));
    } catch {}
  }, [LS_KEY]);

  function selectRating(n: number) {
    setRating(n);
    setTags([]);
  }

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating === 0) {
      toast.error('Completa todos los campos y selecciona una calificación.');
      return;
    }
    const newReview: Review = {
      id: Date.now().toString(),
      name: name.trim(),
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }),
    };
    const updated = [newReview, ...reviews];
    try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}

    if (tags.length > 0) {
      try {
        const storedFeedback = localStorage.getItem(FEEDBACK_LS_KEY);
        const feedbackList = storedFeedback ? JSON.parse(storedFeedback) : [];
        feedbackList.unshift({ id: newReview.id, rating, tags, date: newReview.date });
        localStorage.setItem(FEEDBACK_LS_KEY, JSON.stringify(feedbackList));
      } catch {}
    }

    setReviews(updated);
    setName('');
    setRating(0);
    setTags([]);
    setComment('');
    toast.success('¡Gracias por tu opinión!');
  }

  const ratingLabels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

  return (
    <div className="mt-12 pt-10 border-t border-gray-100 dark:border-white/10">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-navy-950 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-white/50 mt-1">{subtitle}</p>}
      </div>

      {/* Review list */}
      {reviews.length > 0 && (
        <div className="space-y-4 mb-10">
          <AnimatePresence>
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-gray-50 dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full ${avatarColor(r.id)} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-bold">{initials(r.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-navy-950 dark:text-white text-sm">{r.name}</span>
                      <span className="text-xs text-gray-400 dark:text-white/40">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-gold-500 fill-gold-500' : 'text-gray-200 dark:text-white/20'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">{r.comment}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {reviews.length === 0 && (
        <p className="text-gray-400 dark:text-white/40 text-sm mb-8 italic">
          Sé el primero en dejar tu opinión.
        </p>
      )}

      {/* Submit form */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
        <h3 className="text-lg font-display font-bold text-navy-950 dark:text-white mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" />
          Escribe tu opinión
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors"
          />

          <div>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-2">Calificación</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHovered(i + 1)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => selectRating(i + 1)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-7 h-7 ${i < (hovered || rating) ? 'text-gold-500 fill-gold-500' : 'text-gray-300 dark:text-white/20'}`} />
                </button>
              ))}
              {(hovered || rating) > 0 && (
                <span className="ml-2 text-sm font-medium text-gray-500 dark:text-white/50">
                  {ratingLabels[hovered || rating]}
                </span>
              )}
            </div>
          </div>

          <AnimatePresence>
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2.5">
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    {rating >= 4 ? '¿Qué fue lo que más te gustó?' : '¿Qué podemos mejorar?'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-white/35">
                    <Lock className="w-3 h-3" />privado, no se publica
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(rating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        tags.includes(tag)
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-gray-50 dark:bg-navy-800 border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-brand-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            placeholder="Comparte tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors resize-none"
          />

          <button type="submit" className="btn-primary w-full justify-center py-3">
            <Send className="w-4 h-4" />
            Publicar opinión
          </button>
        </form>
      </div>
    </div>
  );
}
