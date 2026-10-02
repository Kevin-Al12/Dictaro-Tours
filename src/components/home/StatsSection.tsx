'use client';

import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Users, Globe, Award, ThumbsUp } from 'lucide-react';

const stats = [
  { icon: Users,    value: '15,000+', label: 'Viajeros felices',      color: 'text-brand-400' },
  { icon: Globe,    value: '50+',     label: 'Destinos disponibles',  color: 'text-gold-400'  },
  { icon: Award,    value: '10+',     label: 'Años de experiencia',   color: 'text-blue-400'  },
  { icon: ThumbsUp, value: '98%',     label: 'Clientes satisfechos',  color: 'text-green-400' },
];

export default function StatsSection() {
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <section className="py-16 bg-navy-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px brand-gradient opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-px brand-gradient opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,30,44,0.06),transparent_70%)]" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.15, type: 'spring' }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 mb-4 ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-4xl font-display font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/45">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
