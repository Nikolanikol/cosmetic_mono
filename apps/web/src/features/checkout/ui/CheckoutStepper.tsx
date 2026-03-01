import { cn } from '@/shared/lib/cn';
import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface CheckoutStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function CheckoutStepper({ steps, currentStep, className }: CheckoutStepperProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  isCompleted && 'bg-brand-pink-500 text-white',
                  isActive && 'border-2 border-brand-pink-500 text-brand-pink-500',
                  !isCompleted && !isActive && 'border border-brand-black-600 text-brand-charcoal-500'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={cn(
                'text-xs mt-1 whitespace-nowrap',
                isActive ? 'text-white' : 'text-brand-charcoal-500'
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-2 mb-4',
                isCompleted ? 'bg-brand-pink-500' : 'bg-brand-black-600'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
