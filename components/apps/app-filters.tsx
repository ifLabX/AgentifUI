'use client';

import { cn } from '@lib/utils';
import { ChevronLeft, ChevronRight, Grid3x3, List, Search } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface AppFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function AppFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
}: AppFiltersProps) {
  const t = useTranslations('pages.apps.market');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll =
        direction === 'left'
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  const getCategoryDisplay = (category: string) => {
    if (category === t('categoryKeys.all')) {
      return { icon: '🏪', label: t('categories.all') };
    }
    if (category === t('categoryKeys.commonApps')) {
      return { icon: '⭐', label: t('categories.favorite') };
    }

    const getCategoryMapping = (cat: string) => {
      if (cat === t('categories.writing'))
        return { icon: '✍️', label: t('categories.writing') };
      if (cat === t('categories.translation'))
        return { icon: '🌐', label: t('categories.translation') };
      if (cat === t('categories.programming'))
        return { icon: '💻', label: t('categories.programming') };
      if (cat === t('categories.codeGeneration'))
        return { icon: '🔧', label: t('categories.codeGeneration') };
      if (cat === t('categories.analysis'))
        return { icon: '📊', label: t('categories.analysis') };
      if (cat === t('categories.summary'))
        return { icon: '📝', label: t('categories.summary') };
      if (cat === t('categories.conversation'))
        return { icon: '💬', label: t('categories.conversation') };
      if (cat === t('categories.assistant'))
        return { icon: '🤖', label: t('categories.assistant') };

      if (cat === t('categories.textGeneration'))
        return { icon: '📄', label: t('categories.textGeneration') };
      if (cat === t('categories.document'))
        return { icon: '📋', label: t('categories.document') };
      if (cat === t('categories.dataAnalysis'))
        return { icon: '📈', label: t('categories.dataAnalysis') };
      if (cat === t('categories.development'))
        return { icon: '⚙️', label: t('categories.development') };
      if (cat === t('categories.generation'))
        return { icon: '✨', label: t('categories.generation') };

      if (cat === t('categories.conversationModel'))
        return { icon: '💭', label: t('categories.conversationModel') };
      if (cat === t('categories.reasoningModel'))
        return { icon: '🧠', label: t('categories.reasoningModel') };
      if (cat === t('categories.documentModel'))
        return { icon: '📚', label: t('categories.documentModel') };
      if (cat === t('categories.multimodal'))
        return { icon: '🎨', label: t('categories.multimodal') };

      if (cat === t('categories.highPrecision'))
        return { icon: '🎯', label: t('categories.highPrecision') };
      if (cat === t('categories.fastResponse'))
        return { icon: '⚡', label: t('categories.fastResponse') };
      if (cat === t('categories.localDeployment'))
        return { icon: '🏠', label: t('categories.localDeployment') };
      if (cat === t('categories.enterprise'))
        return { icon: '🏢', label: t('categories.enterprise') };
      if (cat === t('categories.private'))
        return { icon: '🔒', label: t('categories.private') };

      if (cat === t('categories.tools'))
        return { icon: '🛠️', label: t('categories.tools') };
      if (cat === t('categories.general'))
        return { icon: '🔄', label: t('categories.general') };
      if (cat === t('categories.professional'))
        return { icon: '⭐', label: t('categories.professional') };

      return { icon: '🏷️', label: category };
    };

    return getCategoryMapping(category);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-stone-500 dark:text-stone-400" />
        <input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className={cn(
            'w-full rounded-lg border py-2.5 pr-4 pl-10 font-serif',
            'focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20 focus:outline-none',
            'transition-all duration-200',
            'border-stone-200 bg-white text-stone-900 placeholder:text-stone-500',
            'dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-400'
          )}
        />
      </div>

      <div className="flex items-center gap-3">
        {canScrollLeft && (
          <button
            onClick={() => scrollCategories('left')}
            className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors',
              'border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50 hover:text-stone-700',
              'dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-300'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="no-scrollbar flex-1 overflow-x-auto"
        >
          <div className="flex gap-2 pb-1">
            {' '}
            {categories.map(category => {
              const { icon, label } = getCategoryDisplay(category);
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-serif text-sm font-medium transition-all duration-200',
                    'flex-shrink-0 whitespace-nowrap', // Prevent shrink and line break
                    isSelected
                      ? 'bg-stone-900 text-white ring-1 ring-stone-300 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600'
                      : 'border border-stone-200 bg-stone-100 text-stone-700 hover:border-stone-300 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-700'
                  )}
                >
                  <span className="text-sm">{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scrollCategories('right')}
            className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors',
              'border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50 hover:text-stone-700',
              'dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-300'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-shrink-0 rounded-lg border border-stone-200 bg-stone-100 p-1 dark:border-stone-700 dark:bg-stone-800">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-serif text-sm font-medium transition-all duration-200',
              viewMode === 'grid'
                ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100'
                : 'text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
            )}
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('viewMode.grid')}</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-serif text-sm font-medium transition-all duration-200',
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100'
                : 'text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{t('viewMode.list')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
