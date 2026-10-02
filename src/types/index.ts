export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  continent: string;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  price: number;
  originalPrice?: number;
  duration: string;
  departureDates: string[];
  includes: string[];
  excludes: string[];
  highlights: string[];
  rating: number;
  reviews: number;
  available: number;
  featured: boolean;
  tag?: string;
  lat: number;
  lng: number;
}

export interface Hotel {
  id: string;
  slug: string;
  name: string;
  location: string;
  department: string;
  description: string;
  image: string;
  gallery: string[];
  pricePerPerson: number;
  stars: number;
  services: string[];
  rating: number;
  reviews: number;
  available: boolean;
  category: string;
}

export interface Excursion {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  price: number;
  duration: string;
  dates: string[];
  availableSpots: number;
  totalSpots: number;
  includes: string[];
  difficulty: 'Fácil' | 'Moderado' | 'Difícil';
  category: string;
  rating: number;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  destination: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  authorAvatar: string;
  date: string;
  category: string;
  readTime: string;
  tags: string[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  discount: number;
  validUntil: string;
  code: string;
  destinationId?: string;
}

export interface Booking {
  id: string;
  userId: string;
  destinationId: string;
  destinationName: string;
  date: string;
  passengers: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'partial' | 'paid';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bookings: Booking[];
  savedTrips: string[];
}

export interface SearchFilters {
  budget?: number;
  country?: string;
  date?: string;
  passengers?: number;
  type?: string;
}

export interface CalendarEvent {
  id: string;
  destinationId: string;
  destinationName: string;
  country: string;
  departureDate: string;
  returnDate: string;
  availableSpots: number;
  totalSpots: number;
  price: number;
  status: 'available' | 'limited' | 'soldout';
}
