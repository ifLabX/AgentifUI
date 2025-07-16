'use client';

import { Button } from '@components/ui/button';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Eye, EyeOff } from 'lucide-react';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createClient } from '../../lib/supabase/client';
import { SocialAuthButtons } from './social-auth-buttons';

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const { isDark } = useTheme();
  const t = useTranslations('pages.auth.register');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t('errors.nameRequired'));
      return;
    }

    if (!formData.email.trim()) {
      setError(t('errors.emailRequired'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    if (
      formData.username.trim() &&
      !/^[a-zA-Z0-9_-]{2,20}$/.test(formData.username.trim())
    ) {
      setError(t('errors.usernameInvalid'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name.trim(),
            username: formData.username.trim() || undefined,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error(t('errors.emailExists'));
        } else if (signUpError.message.includes('Password should be')) {
          throw new Error(t('errors.passwordWeak'));
        } else if (signUpError.message.includes('Invalid email')) {
          throw new Error(t('errors.emailInvalid'));
        } else {
          throw signUpError;
        }
      }

      if (data.user && !data.user.email_confirmed_at) {
        router.push('/login?registered=true&verify=true');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('errors.registerFailed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-md space-y-6 rounded-xl border p-6 font-serif shadow-lg transition-all sm:space-y-8 sm:p-8',
        isDark
          ? 'border-stone-800 bg-stone-900'
          : 'border-stone-200 bg-stone-50'
      )}
    >
      <div className="text-center">
        <h2 className="bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text py-1 font-serif text-3xl leading-normal font-bold text-transparent">
          {t('title')}
        </h2>
        <p
          className={cn(
            'mt-2 font-serif text-sm',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          {t('subtitle')}
        </p>
      </div>

      {error && (
        <div
          className={cn(
            'rounded-lg border-l-4 p-4 font-serif text-sm',
            isDark
              ? 'border-red-500 bg-red-900/30 text-red-400'
              : 'border-red-500 bg-red-50 text-red-700'
          )}
        >
          {error}
        </div>
      )}

      <SocialAuthButtons type="register" redirectTo="/chat" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div
            className={cn(
              'w-full border-t',
              isDark ? 'border-stone-700' : 'border-stone-300'
            )}
          />
        </div>
        <div className="relative flex justify-center text-sm">
          <span
            className={cn(
              'px-2 font-serif',
              isDark
                ? 'bg-stone-900 text-gray-400'
                : 'bg-stone-50 text-gray-500'
            )}
          >
            {t('orSeparator')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className={cn(
                'mb-1 block font-serif text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('nameLabel')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={cn(
                'block w-full rounded-lg border px-4 py-3 font-serif placeholder-stone-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-stone-500 focus:outline-none',
                isDark
                  ? 'border-stone-700 bg-stone-800 text-white'
                  : 'border-stone-300 bg-white'
              )}
              placeholder={t('namePlaceholder')}
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className={cn(
                'mb-1 block font-serif text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('usernameLabel')}{' '}
              <span className="font-serif text-xs text-gray-500">
                {t('usernameOptional')}
              </span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              className={cn(
                'block w-full rounded-lg border px-4 py-3 font-serif placeholder-stone-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-stone-500 focus:outline-none',
                isDark
                  ? 'border-stone-700 bg-stone-800 text-white'
                  : 'border-stone-300 bg-white'
              )}
              placeholder={t('usernamePlaceholder')}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className={cn(
                'mb-1 block font-serif text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('emailLabel')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={cn(
                'block w-full rounded-lg border px-4 py-3 font-serif placeholder-stone-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-stone-500 focus:outline-none',
                isDark
                  ? 'border-stone-700 bg-stone-800 text-white'
                  : 'border-stone-300 bg-white'
              )}
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={cn(
                'mb-1 block font-serif text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={cn(
                  'block w-full rounded-lg border px-4 py-3 pr-12 font-serif placeholder-stone-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-stone-500 focus:outline-none',
                  isDark
                    ? 'border-stone-700 bg-stone-800 text-white'
                    : 'border-stone-300 bg-white'
                )}
                placeholder={t('passwordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'absolute inset-y-0 right-0 flex items-center pr-3 text-sm leading-5 transition-colors focus:outline-none',
                  isDark
                    ? 'text-stone-400 hover:text-stone-300'
                    : 'text-stone-500 hover:text-stone-600'
                )}
                aria-label={
                  showPassword ? t('hidePassword') : t('showPassword')
                }
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className={cn(
                'mb-1 block font-serif text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {t('confirmPasswordLabel')}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={cn(
                  'block w-full rounded-lg border px-4 py-3 pr-12 font-serif placeholder-stone-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-stone-500 focus:outline-none',
                  isDark
                    ? 'border-stone-700 bg-stone-800 text-white'
                    : 'border-stone-300 bg-white'
                )}
                placeholder={t('passwordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={cn(
                  'absolute inset-y-0 right-0 flex items-center pr-3 text-sm leading-5 transition-colors focus:outline-none',
                  isDark
                    ? 'text-stone-400 hover:text-stone-300'
                    : 'text-stone-500 hover:text-stone-600'
                )}
                aria-label={
                  showConfirmPassword
                    ? t('hideConfirmPassword')
                    : t('showConfirmPassword')
                }
              >
                {showConfirmPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            isLoading={isLoading}
            className="h-12 w-full font-serif text-base"
            variant="gradient"
          >
            {t('createAccountButton')}
          </Button>
        </div>
      </form>

      <div className="space-y-3 text-center">
        {/* Phone login link */}
        <div>
          <Link
            href="/phone-login"
            className={cn(
              'font-serif text-sm font-medium hover:underline',
              isDark
                ? 'text-stone-400 hover:text-stone-300'
                : 'text-stone-600 hover:text-stone-700'
            )}
          >
            {t('phoneLoginLink')}
          </Link>
        </div>

        <p
          className={cn(
            'font-serif text-sm',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          {t('hasAccountText')}{' '}
          <Link
            href="/login"
            className={cn(
              'font-serif font-medium',
              isDark
                ? 'text-stone-400 hover:text-stone-300'
                : 'text-stone-700 hover:text-stone-600'
            )}
          >
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
