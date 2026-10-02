'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phone   = '18095551234';
  const message = encodeURIComponent(
    '¡Hola! Me interesa reservar un viaje con D\'Itaros Tours. ¿Me pueden ayudar?'
  );

  return (
    <motion.a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: 'spring' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green-500 shadow-lg
                 shadow-green-500/40 flex items-center justify-center
                 hover:bg-green-400 transition-colors"
      title="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px]
                       text-white flex items-center justify-center font-bold animate-pulse">
        1
      </span>
    </motion.a>
  );
}
