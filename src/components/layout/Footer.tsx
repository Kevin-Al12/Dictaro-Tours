import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Mail, Phone, MapPin, Heart } from 'lucide-react';

const footerLinks = {
  'Destinos': [
    { label: 'Europa',              href: '/destinos?continente=Europa' },
    { label: 'Asia',               href: '/destinos?continente=Asia' },
    { label: 'América',            href: '/destinos?continente=América' },
    { label: 'Punta Cana',          href: '/hoteles' },
  ],
  'Servicios': [
    { label: 'Hoteles Nacionales', href: '/hoteles' },
    { label: 'Excursiones',        href: '/excursiones' },
    { label: 'Calendario',         href: '/calendario' },
    { label: 'Reservas',           href: '/reservas' },
  ],
  'Empresa': [
    { label: 'Nosotros',           href: '/contacto' },
    { label: 'Blog de viajes',     href: '/blog' },
    { label: 'Testimonios',        href: '/#testimonios' },
    { label: 'Trabaja con nosotros', href: '/contacto' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#0f0f0f] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand block */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative w-14 h-14 shrink-0 bg-white rounded-full p-1.5 shadow-md">
                <Image
                  src="/images/logo.png"
                  alt="D'Itaros Tours"
                  fill
                  className="object-contain rounded-full"
                />
              </div>
              <div>
                <span className="text-xl font-display font-bold text-white block leading-tight">
                  D'<span className="text-brand-400">Itaros</span> Tours
                </span>
                <span className="text-[10px] text-white/60 tracking-widest uppercase">
                  Agencia de viajes y excursiones
                </span>
              </div>
            </Link>

            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
              Tu agencia de viajes premium. Más de 10 años creando experiencias únicas
              e inolvidables en los destinos más soñados del mundo.
            </p>

            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Av. Abraham Lincoln, Piantini, Santo Domingo, R.D.</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+1 (809) 555-1234</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>info@ditarostours.com</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-5 h-px bg-brand-600" />
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}
                      className="text-sm text-white/70 hover:text-brand-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50 flex items-center gap-1.5 flex-wrap">
            © 2026 D'Itaros Tours. Hecho con
            <Heart className="w-3.5 h-3.5 text-brand-500 fill-brand-500" />
            en Santo Domingo, R.D.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 text-white/70 hover:text-brand-400 hover:bg-brand-600/20 transition-all">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 text-white/70 hover:text-brand-400 hover:bg-brand-600/20 transition-all">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="mailto:info@ditarostours.com"
              className="p-2 rounded-full bg-white/10 text-white/70 hover:text-brand-400 hover:bg-brand-600/20 transition-all">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
