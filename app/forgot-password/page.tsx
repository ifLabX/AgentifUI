'use client';

import { ForgotPasswordForm } from '@components/auth/forgot-password-form';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-stone-100 px-4 py-12 font-serif sm:px-6 lg:px-8 dark:bg-stone-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <ForgotPasswordForm />
      </motion.div>
    </main>
  );
}
