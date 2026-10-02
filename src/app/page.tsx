import HeroSection from '@/components/home/HeroSection';
import SearchWidget from '@/components/home/SearchWidget';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import StatsSection from '@/components/home/StatsSection';
import InteractiveMapSection from '@/components/home/InteractiveMapSection';
import FounderSection from '@/components/home/FounderSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import AgencyReviewsSection from '@/components/home/AgencyReviewsSection';
import InstagramSection from '@/components/home/InstagramSection';
import NewsletterSection from '@/components/home/NewsletterSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SearchWidget />
      <FeaturedPackages />
      <StatsSection />
      <InteractiveMapSection />
      <FounderSection />
      <TestimonialsSection />
      <AgencyReviewsSection />
      <InstagramSection />
      <NewsletterSection />
    </>
  );
}
