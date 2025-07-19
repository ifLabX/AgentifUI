'use client';

import { useTheme } from '@lib/hooks';
import { cn } from '@lib/utils';

import React from 'react';

import { useTranslations } from 'next-intl';

interface SuggestedQuestionButtonProps {
  question: string;
  onClick: (question: string) => void;
  className?: string;
  animationDelay?: number;
}

/**
 * Recommended question button group
 * Has large rounded corners and progressive display animation
 * The text in the button is kept single line, and the button itself automatically wraps based on the container width
 */
export const SuggestedQuestionButton = ({
  question,
  onClick,
  className,
  animationDelay = 0,
}: SuggestedQuestionButtonProps) => {
  const { isDark } = useTheme();
  const t = useTranslations('components.ui.suggestedQuestionButton');

  const handleClick = () => {
    onClick(question);
  };

  // --- Dynamically set the maximum width based on the question length, ensuring single line display ---
  const getMaxWidth = () => {
    const textLength = question.length;

    if (textLength <= 6) {
      return 'max-w-[120px]'; // Very short question
    } else if (textLength <= 10) {
      return 'max-w-[200px]'; // Short question
    } else if (textLength <= 15) {
      return 'max-w-[300px]'; // Medium question
    } else if (textLength <= 20) {
      return 'max-w-[400px]'; // Long question
    } else if (textLength <= 30) {
      return 'max-w-[500px]'; // Long question
    } else {
      return 'max-w-[600px]'; // Very long question
    }
  };

  return (
    <button
      className={cn(
        // --- Base style: large rounded corners, adaptive width, border ---
        'cursor-pointer rounded-3xl border px-6 py-2.5 text-left transition-colors duration-200',
        'font-serif text-sm leading-relaxed',

        // --- 🎯 Key: text kept single line, button automatically wraps in flex container ---
        'whitespace-nowrap', // Force text not to wrap, keep single line
        'flex-shrink-0', // Prevent button from being compressed
        'w-auto', // Width adapts to content
        getMaxWidth(), // Dynamically set maximum width based on text length
        'min-w-[100px]', // Set minimum width to avoid button being too narrow

        // --- Animation effect: use fade-in animation same as title ---
        'animate-fade-in opacity-0',

        // --- Theme style: use main color background, simplify hover effect, add back border ---
        isDark
          ? 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-600 hover:bg-stone-700' // Dark: main background + border -> hover slightly brighter
          : 'border-stone-300 bg-stone-100 text-stone-700 hover:border-stone-400 hover:bg-stone-200', // Light: main background + border -> hover slightly darker

        className
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards',
      }}
      onClick={handleClick}
      aria-label={t('ariaLabel', { question })}
    >
      {question}
    </button>
  );
};
