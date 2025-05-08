'use client';

import { LoginForm } from '@components/auth/login-form';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      {registered && (
        <Alert className="max-w-md bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          <AlertDescription className="text-green-700">
            注册成功！请查看您的邮箱以验证账户，然后登录。
          </AlertDescription>
        </Alert>
      )}
      <LoginForm />
    </main>
  );
} 