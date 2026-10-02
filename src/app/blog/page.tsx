import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { blogPosts } from '@/data/blog';
import { formatDate } from '@/lib/utils';

const categories = ['Todos', 'Europa', 'Asia', 'América', 'Aventura', 'Gastronomía', 'Familias'];

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-navy-950">
      <div className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            Blog de Viajes
          </h1>
          <p className="text-white/70 text-lg">Consejos, guías e inspiración para tu próxima aventura.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured post */}
        <div className="relative rounded-3xl overflow-hidden mb-12 group">
          <div className="relative h-72 sm:h-96">
            <Image src={featured.image} alt={featured.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-gold-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">{featured.category}</span>
              <span className="text-white/60 text-sm flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(featured.date)}</span>
              <span className="text-white/60 text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{featured.readTime} de lectura</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">{featured.title}</h2>
            <p className="text-white/70 line-clamp-2 max-w-2xl mb-4">{featured.excerpt}</p>
            <div className="flex items-center gap-3">
              <Image src={featured.authorAvatar} alt={featured.author} width={36} height={36} className="rounded-full object-cover ring-2 ring-gold-500" />
              <span className="text-white text-sm font-medium">{featured.author}</span>
              <Link href={`/blog/${featured.slug}`} className="ml-auto btn-primary text-sm py-2.5 px-5">
                Leer artículo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post, i) => (
            <div key={post.id} className="bg-white dark:bg-navy-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm card-hover group">
              <div className="relative h-44">
                <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-4 left-4">
                  <span className="bg-gold-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">{post.category}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/40 mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime}</span>
                </div>
                <h3 className="font-display font-bold text-navy-950 dark:text-white mb-2 group-hover:text-gold-500 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Image src={post.authorAvatar} alt={post.author} width={28} height={28} className="rounded-full object-cover" />
                    <span className="text-xs text-gray-500 dark:text-white/50 font-medium">{post.author}</span>
                  </div>
                  <Link href={`/blog/${post.slug}`} className="text-gold-500 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    Leer <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
