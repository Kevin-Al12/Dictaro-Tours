'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, ChevronDown, Hotel, Compass, Calendar, BookOpen, Phone } from 'lucide-react';

const navLinks = [
  {
    label: 'Destinos',
    href:  '/destinos',
    icon:  Globe,
    submenu: [
      { label: 'Europa',             href: '/destinos?continente=Europa' },
      { label: 'Asia',               href: '/destinos?continente=Asia' },
      { label: 'América',            href: '/destinos?continente=América' },
      { label: 'Todos los destinos', href: '/destinos' },
    ],
  },
  { label: 'Hoteles',     href: '/hoteles',     icon: Hotel },
  { label: 'Excursiones', href: '/excursiones', icon: Compass },
  { label: 'Calendario',  href: '/calendario',  icon: Calendar },
  { label: 'Blog',        href: '/blog',        icon: BookOpen },
  { label: 'Contacto',    href: '/contacto',    icon: Phone },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
      scrolled ? 'shadow-md' : 'shadow-sm border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 shrink-0 bg-white rounded-full p-0.5 shadow ring-1 ring-gray-200">
              <Image
                src="/images/logo.png"
                alt="D'Itaros Tours"
                fill
                className="object-contain rounded-full"
                priority
              />
            </div>
            <div>
              <span className="text-lg font-display font-bold text-navy-950 leading-tight block">
                D'<span className="text-brand-600">Itaros</span> Tours
              </span>
              <span className="text-[9px] text-gray-400 tracking-[0.15em] uppercase -mt-0.5 block">
                Agencia de viajes y excursiones
              </span>
            </div>
          </Link>

          {/* ── Desktop links ── */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setActiveMenu(link.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                             text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
                >
                  {link.label}
                  {link.submenu && <ChevronDown className="w-3 h-3" />}
                </Link>

                {link.submenu && activeMenu === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100"
                  >
                    {link.submenu.map((sub) => (
                      <Link key={sub.href} href={sub.href}
                        className="block px-5 py-3 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        {sub.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* ── Actions ── */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth/login"
              className="text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors px-3 py-2">
              Iniciar sesión
            </Link>
            <Link href="/reservas" className="btn-primary text-sm py-2.5 px-5">
              Reservar ahora
            </Link>
          </div>

          {/* ── Mobile toggle ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-all"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 py-6 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-all">
                  <link.icon className="w-5 h-5 text-gold-500" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                  className="block text-center py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  Iniciar sesión
                </Link>
                <Link href="/reservas" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">
                  Reservar ahora
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
