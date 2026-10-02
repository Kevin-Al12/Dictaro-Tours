'use client';

import { useState, useEffect } from 'react';
import { Star, Send, User, MessageSquare, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const LS_KEY = 'ditaros-reviews-agencia';
const FEEDBACK_LS_KEY = 'ditaros-feedback-agencia';

const COLORS = ['bg-brand-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-600', 'bg-orange-500'];

const POSITIVE_TAGS = [
  'Excelente atención', 'Buena relación calidad-precio', 'Todo como se describió',
  'Buena comunicación', 'Asesoría personalizada', 'Superó mis expectativas',
];
const NEGATIVE_TAGS = [
  'Mala atención', 'No cumplió lo prometido', 'Precio elevado',
  'Demoras en responder', 'Problemas con la reserva', 'Comunicación deficiente',
];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}
function avatarColor(id: string) {
  return COLORS[parseInt(id.slice(-2), 10) % COLORS.length];
}

export default function AgencyReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setReviews(JSON.parse(stored));
    } catch {}
  }, []);

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
    setShowForm(false);
    toast.success('¡Gracias por tu opinión! Tu reseña ha sido publicada.');
  }

  const ratingLabels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

  return (
    <section className="section-padding bg-gray-50 dark:bg-navy-900/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Tu experiencia</span>
            <h2 className="text-4xl font-display font-bold text-navy-950 dark:text-white mt-2 mb-4">
              ¿Viajaste con <span className="text-gradient-brand">D'Itaros?</span>
            </h2>
            <p className="text-gray-500 dark:text-white/50 max-w-md mx-auto">
              Tu opinión nos ayuda a mejorar y a otros viajeros a elegir con confianza.
            </p>
          </motion.div>
        </div>

        {/* User reviews grid */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <AnimatePresence>
              {reviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${avatarColor(r.id)} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">{initials(r.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-semibold text-navy-950 dark:text-white text-sm">{r.name}</span>
                        <span className="text-xs text-gray-400 dark:text-white/40">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-gold-500 fill-gold-500' : 'text-gray-200 dark:text-white/20'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed line-clamp-3">{r.comment}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* CTA button or form */}
        {!showForm ? (
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="btn-primary px-8 py-4 text-base inline-flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              {reviews.length === 0 ? 'Sé el primero en opinar' : 'Dejar mi opinión'}
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-lg"
          >
            <h3 className="text-xl font-display font-bold text-navy-950 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" />
              Comparte tu experiencia
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
                <p className="text-sm text-gray-500 dark:text-white/50 mb-2">¿Cómo calificarías tu experiencia?</p>
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
                      <Star className={`w-8 h-8 ${i < (hovered || rating) ? 'text-gold-500 fill-gold-500' : 'text-gray-300 dark:text-white/20'}`} />
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
                placeholder="¿Cómo fue tu viaje? Cuéntanos los detalles..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-sm text-navy-950 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/20 text-sm font-medium text-gray-600 dark:text-white/60 hover:border-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary justify-center py-3">
                  <Send className="w-4 h-4" />
                  Publicar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
}
