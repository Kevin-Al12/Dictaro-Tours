'use client';

import { useRef, useState } from 'react';
import { animate, motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { MapPin, ArrowRight, X, Star } from 'lucide-react';
import { useAdminList } from '@/hooks/useAdminList';
import { formatPrice } from '@/lib/utils';
import type { Destination } from '@/types';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 1;
const FOCUS_ZOOM = 5;
const ZOOM_IN_DURATION = 4;
const ZOOM_OUT_DURATION = 1.4;

type HoverInfo = { dest: Destination; x: number; y: number };

export default function InteractiveMapSection() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<ReturnType<typeof animate> | null>(null);
  const { data: destinations } = useAdminList<Destination>('/api/destinations', 'destinations');

  const selected = selectedId ? destinations.find((d) => d.id === selectedId) ?? null : null;

  function flyTo(targetCenter: [number, number], targetZoom: number, duration: number) {
    flightRef.current?.stop();
    const fromCenter = center;
    const fromZoom = zoom;
    flightRef.current = animate(0, 1, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        setCenter([
          fromCenter[0] + (targetCenter[0] - fromCenter[0]) * t,
          fromCenter[1] + (targetCenter[1] - fromCenter[1]) * t,
        ]);
        setZoom(fromZoom + (targetZoom - fromZoom) * t);
      },
    });
  }

  function handleSelect(d: Destination) {
    setHover(null);
    setSelectedId(d.id);
    flyTo([d.lng, d.lat], FOCUS_ZOOM, ZOOM_IN_DURATION);
  }

  function handleClose() {
    setSelectedId(null);
    flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, ZOOM_OUT_DURATION);
  }

  function updateHover(d: Destination, e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ dest: d, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <section className="section-padding bg-cream dark:bg-navy-900/30">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold uppercase tracking-widest">Mapa interactivo</span>
          <h2 className="text-4xl font-display font-bold text-navy-950 dark:text-white mt-2 mb-4">
            Destinos en el <span className="text-gradient-brand">mundo</span>
          </h2>
          <p className="text-gray-600 dark:text-white/55 max-w-xl mx-auto">
            Toca o haz clic en cualquier punto del mapa para acercarte al destino y ver sus paquetes.
          </p>
        </motion.div>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-[#dde8f0] aspect-[2/1]"
        >
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 165 }}
            className="w-full h-full"
          >
            <ZoomableGroup center={center} zoom={zoom} filterZoomEvent={() => false}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#b0c4d8"
                      stroke="#8fafc8"
                      strokeWidth={0.5 / zoom}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {destinations.map((d) => {
                const active = selectedId === d.id;
                return (
                  <Marker key={d.id} coordinates={[d.lng, d.lat]}>
                    <g
                      onClick={() => handleSelect(d)}
                      onMouseEnter={(e) => updateHover(d, e)}
                      onMouseMove={(e) => updateHover(d, e)}
                      onMouseLeave={() => setHover(null)}
                      className="cursor-pointer"
                    >
                      <circle r={(active ? 7 : 5) / zoom} className={active ? 'fill-brand-500/40' : 'fill-brand-600/25'}>
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
                      </circle>
                      <circle
                        r={(active ? 4.5 : 3.5) / zoom}
                        className={active ? 'fill-brand-500' : 'fill-brand-600/80'}
                        stroke="#fff"
                        strokeWidth={1.2 / zoom}
                      />
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Label / close */}
          {!selected && (
            <div className="absolute top-4 left-4 bg-white/90 rounded-xl px-3 py-2 shadow-sm border border-gray-200 pointer-events-none">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Toca un destino para explorarlo</span>
              </div>
            </div>
          )}

          {selected && (
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 z-20 bg-white/95 hover:bg-white rounded-full p-2 shadow-md border border-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-navy-950" />
            </button>
          )}

          {/* Hover preview — desktop only */}
          <AnimatePresence>
            {hover && !selected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                style={{ left: hover.x, top: hover.y }}
                className="hidden sm:block absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+14px)]
                           pointer-events-none w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="relative w-full h-20">
                  <Image src={hover.dest.image} alt={hover.dest.name} fill className="object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-navy-950 truncate">{hover.dest.name}, {hover.dest.country}</p>
                  <p className="text-[11px] text-gold-600 font-semibold mt-0.5">desde {formatPrice(hover.dest.price)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Haz clic para ver el viaje →</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full detail panel — fades in mid-zoom */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-72
                           bg-white/95 dark:bg-navy-900/95 backdrop-blur rounded-2xl p-4
                           border border-gray-100 dark:border-white/10 shadow-2xl z-20"
              >
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <Image src={selected.image} alt={selected.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400 font-semibold mb-0.5">
                      <Star className="w-3 h-3 fill-gold-500 text-gold-500" />{selected.rating}
                    </div>
                    <h3 className="font-display font-bold text-navy-950 dark:text-white leading-tight">{selected.name}</h3>
                    <p className="text-xs text-brand-500 dark:text-brand-400 font-medium">{selected.country} · {selected.continent}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-white/55 mt-3 line-clamp-2">{selected.shortDescription}</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-gray-400">desde </span>
                    <span className="text-base font-bold text-gold-600 dark:text-gold-400">{formatPrice(selected.price)}</span>
                  </div>
                  <Link
                    href={`/destinos/${selected.slug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:gap-1.5 transition-all"
                  >
                    Ver paquete <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
