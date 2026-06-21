import Link from 'next/link';
import { ArrowRight, Sparkles, FlaskConical } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-black-900 via-brand-black-800 to-brand-black-900" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-pink-500/5 via-transparent to-brand-pink-500/10" />

      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-pink-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-pink-500/10 border border-brand-pink-500/20 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink-400" />
            <span className="text-xs text-brand-pink-300 font-medium tracking-wide">
              Korean & European Skincare
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Your perfect
            <br />
            <span className="text-gradient-pink">skincare routine</span>
          </h1>

          <p className="text-brand-charcoal-300 text-lg leading-relaxed mb-10 max-w-lg">
            We curate cosmetics for your skin type. Trusted brands, honest formulas,
            worldwide delivery.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button href="/en/catalog" size="lg">
              Browse catalog
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button href="/en/quiz" variant="outline" size="lg">
              <FlaskConical className="w-4 h-4 mr-2" />
              Find your skin type
            </Button>
          </div>

          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-brand-black-600">
            {[
              { value: '500+', label: 'Products' },
              { value: '8+', label: 'Brands' },
              { value: 'Free', label: 'Worldwide shipping' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-brand-charcoal-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
