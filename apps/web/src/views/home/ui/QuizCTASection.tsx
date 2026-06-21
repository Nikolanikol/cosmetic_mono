import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export function QuizCTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative overflow-hidden rounded-[2px] bg-gradient-to-r from-brand-black-700 to-brand-black-800 border border-brand-black-600 p-8 sm:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-pink-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-brand-pink-500/10 border border-brand-pink-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-pink-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading text-white mb-2">
                Not sure about your skin type?
              </h2>
              <p className="text-brand-charcoal-300 text-sm sm:text-base max-w-md">
                Take a quick quiz and we&apos;ll build a skincare routine just for you.
                Less than 2 minutes.
              </p>
            </div>
          </div>
          <Button href="/en/quiz" size="lg" className="flex-shrink-0">
            Take the quiz
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
