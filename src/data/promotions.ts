import type { Promotion } from '@/types';

export const promotions: Promotion[] = [
  {
    id: '1',
    title: '¡Verano en Europa!',
    description: '20% de descuento en todos los paquetes a Europa. Solo por esta semana.',
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80',
    discount: 20,
    validUntil: '2026-07-31',
    code: 'EUROPA20',
    destinationId: '1',
  },
  {
    id: '2',
    title: 'Escapada a Bali',
    description: 'Reserva antes del 15 de julio y obtén villa privada incluida en Bali.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    discount: 15,
    validUntil: '2026-07-15',
    code: 'BALI15',
    destinationId: '6',
  },
  {
    id: '3',
    title: 'Machu Picchu Julio',
    description: 'Paquete especial de julio a Machu Picchu con tren Vistadome upgrade incluido.',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
    discount: 10,
    validUntil: '2026-07-25',
    code: 'MACHU10',
    destinationId: '8',
  },
];
