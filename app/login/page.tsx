'use client';

import { LoginForm } from '@components/auth/login-form';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { Alert, AlertDescription } from '../../components/ui/alert';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const resetSuccess = searchParams.get('reset');
  const oauthError = searchParams.get('error');
  const t = useTranslations('pages.auth.login');
  const [mounted, setMounted] = useState(false);

  // ensure client-side rendering consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  // get error message
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'oauth_failed':
        return t('errors.oauthFailed');
      case 'sso_callback_failed':
        return t('errors.ssoCallbackFailed');
      case 'ticket_validation_failed':
        return t('errors.ticketValidationFailed');
      case 'invalid_employee_number':
        return t('errors.invalidEmployeeNumber');
      case 'user_creation_failed':
        return t('errors.userCreationFailed');
      case 'account_data_inconsistent':
        return t('errors.accountDataInconsistent');
      case 'profile_creation_failed':
        return t('errors.profileCreationFailed');
      case 'sso_provider_not_found':
        return t('errors.ssoProviderNotFound');
      case 'missing_ticket':
        return t('errors.missingTicket');
      default:
        return t('errors.default');
    }
  };

  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 py-12 sm:px-6 lg:px-8 bg-stone-100 dark:bg-stone-800 font-serif"
    >
      {registered && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert
            className={`max-w-md border-l-4 ${colors.alertBg} ${colors.alertBorder}`}
          >
            <CheckCircle className={`h-4 w-4 ${colors.iconColor}`} />
            <AlertDescription className={`${colors.alertText} font-serif`}>
              {t('alerts.registered')}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      {resetSuccess === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert
            className={`max-w-md border-l-4 ${colors.alertBg} ${colors.alertBorder}`}
          >
            <CheckCircle className={`h-4 w-4 ${colors.iconColor}`} />
            <AlertDescription className={`${colors.alertText} font-serif`}>
              {t('alerts.resetSuccess')}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      {oauthError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert
            className={`max-w-md border-l-4 ${colors.errorAlertBg} ${colors.errorAlertBorder}`}
          >
            <AlertTriangle className={`h-4 w-4 ${colors.errorIconColor}`} />
            <AlertDescription className={`${colors.errorAlertText} font-serif`}>
              {getErrorMessage(oauthError)}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <LoginForm />
      </motion.div>
    </main>
  );
}
