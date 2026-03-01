'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';

interface ReviewFormProps {
  productId: string;
  onSubmit?: () => void;
}

export function ReviewForm({ productId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={star <= rating ? 'text-brand-pink-500' : 'text-brand-black-600'}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ваш отзыв..."
        rows={4}
        className="w-full bg-brand-black-700 border border-brand-black-600 text-white rounded-[2px] px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-pink-500"
      />
      <Button type="submit" disabled={!rating || !text.trim()}>
        Отправить отзыв
      </Button>
    </form>
  );
}
