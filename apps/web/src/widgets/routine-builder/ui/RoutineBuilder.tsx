'use client';

import { cn } from '@/shared/lib/cn';

const ROUTINE_STEPS = [
  { step: 1, name: 'Очищение маслом', description: 'Первое очищение' },
  { step: 2, name: 'Пенное очищение', description: 'Второе очищение' },
  { step: 3, name: 'Пилинг / Скраб', description: '1-2 раза в неделю' },
  { step: 4, name: 'Тонер', description: 'Подготовка кожи' },
  { step: 5, name: 'Эссенция', description: 'Увлажнение' },
  { step: 6, name: 'Сыворотка / Ампула', description: 'Концентрированный уход' },
  { step: 7, name: 'Листовая маска', description: '2-3 раза в неделю' },
  { step: 8, name: 'Крем для глаз', description: 'Нежный уход' },
  { step: 9, name: 'Увлажняющий крем', description: 'Защитный барьер' },
  { step: 10, name: 'SPF / Ночная маска', description: 'Защита или ночной уход' },
];

interface RoutineBuilderProps {
  activeSteps?: number[];
  className?: string;
}

export function RoutineBuilder({ activeSteps = [], className }: RoutineBuilderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {ROUTINE_STEPS.map(({ step, name, description }) => {
        const isActive = activeSteps.includes(step);
        return (
          <div
            key={step}
            className={cn(
              'flex items-center gap-3 p-3 rounded-[2px] border transition-colors',
              isActive
                ? 'border-brand-pink-500/40 bg-brand-pink-500/5'
                : 'border-brand-black-600 bg-brand-black-700'
            )}
          >
            <span className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium flex-shrink-0',
              isActive
                ? 'bg-brand-pink-500 text-white'
                : 'bg-brand-black-600 text-brand-charcoal-400'
            )}>
              {step}
            </span>
            <div>
              <p className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-brand-charcoal-300')}>
                {name}
              </p>
              <p className="text-xs text-brand-charcoal-500">{description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
