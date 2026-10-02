'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Heart, MessageCircle } from 'lucide-react';

const posts = [
  { id: '1', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80', place: 'París, Francia',     likes: 312, comments: 24 },
  { id: '2', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80', place: 'Isla Saona, R.D.', likes: 487, comments: 41 },
  { id: '3', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80', place: 'Dubái, EAU',       likes: 268, comments: 19 },
  { id: '4', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&q=80', place: 'Los Haitises, R.D.', likes: 356, comments: 28 },
  { id: '5', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=500&q=80', place: 'Bali, Indonesia',    likes: 421, comments: 33 },
  { id: '6', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&q=80', place: 'Punta Cana, R.D.', likes: 295, comments: 22 },
  { id: '7', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&q=80', place: 'Cancún, México',     likes: 274, comments: 17 },
  { id: '8', image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=500&q=80', place: 'Tokio, Japón',    likes: 388, comments: 30 },
];

export default function InstagramSection() {
  return (
    <section className="section-padding">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-gold-500 text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2">
            <Instagram className="w-4 h-4" />Síguenos en Instagram
          </span>
          <h2 className="text-4xl font-display font-bold text-navy-950 dark:text-white mt-2 mb-4">
            Inspírate con nuestras <span className="text-gradient">aventuras</span>
          </h2>
          <p className="text-gray-600 dark:text-white/55 max-w-xl mx-auto">
            Así vivimos y documentamos cada viaje. Descubre los destinos que estamos recorriendo ahora mismo.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
        {posts.map((p, i) => (
          <motion.a
            key={p.id}
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="group relative aspect-square rounded-2xl overflow-hidden block"
          >
            <Image
              src={p.image}
              alt={p.place}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/60 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-white text-sm font-semibold">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{p.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{p.comments}</span>
              </div>
              <span className="text-white/80 text-xs">{p.place}</span>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="text-center mt-10">
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <Instagram className="w-4 h-4" />
          Síguenos @ditarostours
        </a>
      </div>
    </section>
  );
}
