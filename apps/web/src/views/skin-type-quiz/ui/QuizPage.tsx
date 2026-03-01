'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';

const QUESTIONS = [
  {
    id: 1,
    question: 'Как выглядит ваша кожа к середине дня?',
    options: [
      { value: 'dry', label: 'Стянутая и сухая' },
      { value: 'oily', label: 'Блестящая и жирная' },
      { value: 'combination', label: 'Жирная в Т-зоне, сухая на щеках' },
      { value: 'normal', label: 'Нормальная, без особых изменений' },
    ],
  },
  {
    id: 2,
    question: 'Как ваша кожа реагирует на новые средства?',
    options: [
      { value: 'sensitive', label: 'Часто краснеет или раздражается' },
      { value: 'oily', label: 'Появляется жирный блеск' },
      { value: 'dry', label: 'Ощущение стянутости' },
      { value: 'normal', label: 'Реагирует нейтрально' },
    ],
  },
  {
    id: 3,
    question: 'Как часто появляются высыпания?',
    options: [
      { value: 'oily', label: 'Часто, особенно в Т-зоне' },
      { value: 'sensitive', label: 'Периодически, в виде реакции' },
      { value: 'combination', label: 'Иногда в Т-зоне' },
      { value: 'normal', label: 'Редко' },
    ],
  },
];

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: 'Сухой',
  oily: 'Жирный',
  combination: 'Комбинированный',
  sensitive: 'Чувствительный',
  normal: 'Нормальный',
};

export function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[step];

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      // Calculate result (most frequent answer)
      const counts = newAnswers.reduce<Record<string, number>>((acc, a) => {
        acc[a] = (acc[a] || 0) + 1;
        return acc;
      }, {});
      const skinType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(skinType);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-brand-black-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-brand-pink-500/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">✨</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Ваш тип кожи</h1>
            <div className="text-4xl font-bold text-gradient-pink mb-4">
              {SKIN_TYPE_LABELS[result]}
            </div>
            <p className="text-brand-charcoal-300">
              Подобрали специальные рекомендации для вашего типа кожи
            </p>
          </div>
          <div className="flex gap-3">
            <Button href={`/catalog?skin_type=${result}`} fullWidth>
              Смотреть товары
            </Button>
            <Button variant="outline" onClick={reset} fullWidth>
              Пройти снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors duration-300',
                i <= step ? 'bg-brand-pink-500' : 'bg-brand-black-600'
              )}
            />
          ))}
        </div>

        <p className="text-brand-charcoal-400 text-sm mb-2">
          Вопрос {step + 1} из {QUESTIONS.length}
        </p>
        <h2 className="text-xl font-medium text-white mb-8">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={cn(
                'w-full text-left p-4 border rounded-[2px] transition-all duration-200',
                'border-brand-black-600 bg-brand-black-700 text-brand-charcoal-300',
                'hover:border-brand-pink-500 hover:text-white hover:bg-brand-pink-500/5'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
