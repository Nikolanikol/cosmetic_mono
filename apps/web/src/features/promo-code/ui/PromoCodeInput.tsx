'use client';

import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

interface PromoCodeInputProps {
  onApply?: (code: string) => void;
}

export function PromoCodeInput({ onApply }: PromoCodeInputProps) {
  const [code, setCode] = useState('');

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Промокод"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => onApply?.(code)}
        disabled={!code.trim()}
      >
        Применить
      </Button>
    </div>
  );
}
