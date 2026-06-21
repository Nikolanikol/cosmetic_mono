import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/ui/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<div />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
