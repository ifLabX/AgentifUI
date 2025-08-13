'use client';

import { cn } from '@lib/utils';
import { ArrowUpIcon, Paperclip } from 'lucide-react';

// Theme card component - high-quality version
// Simulate a real chat interface preview, including input box, message bubbles, buttons, etc.
// Use the actual design style and color scheme in the project
interface ThemeCardProps {
  title: string;
  theme: 'light' | 'dark' | 'system';
  currentTheme: string;
  onClick: () => void;
}

export function ThemeCard({
  title,
  theme,
  currentTheme,
  onClick,
}: ThemeCardProps) {
  const isActive = currentTheme === theme;

  // Get preview style configuration based on theme type
  // Completely based on the actual colors in the project
  const getPreviewStyles = () => {
    switch (theme) {
      case 'light':
        return {
          // Main background - corresponds to stone-100
          mainBg: 'bg-stone-100',
          // Sidebar background - corresponds to the expanded state of stone-200
          sidebarBg: 'bg-stone-200',
          // User message background - corresponds to stone-200
          userMessageBg: 'bg-stone-200',
          // Assistant message background - transparent
          assistantMessageBg: 'bg-transparent',
          // Input box background - white
          inputBg: 'bg-white',
          // Border color
          borderColor: 'border-stone-300',
          // Text color
          textColor: 'text-stone-900',
          secondaryTextColor: 'text-stone-600',
          // Button style
          buttonBg: 'bg-black',
          buttonText: 'text-white',
          functionButtonBg: 'bg-transparent',
          functionButtonBorder: 'border-stone-300',
          functionButtonText: 'text-stone-600',
        };
      case 'dark':
        return {
          // Main background - corresponds to stone-800
          mainBg: 'bg-stone-800',
          // Sidebar background - corresponds to the expanded state of stone-700
          sidebarBg: 'bg-stone-700',
          // User message background - corresponds to stone-700
          userMessageBg: 'bg-stone-700/90',
          // Assistant message background - transparent
          assistantMessageBg: 'bg-transparent',
          // Input box background - stone-800
          inputBg: 'bg-stone-800',
          // Border color
          borderColor: 'border-stone-600',
          // Text color
          textColor: 'text-stone-100',
          secondaryTextColor: 'text-stone-400',
          // Button style
          buttonBg: 'bg-stone-900',
          buttonText: 'text-white',
          functionButtonBg: 'bg-stone-600/30',
          functionButtonBorder: 'border-stone-600',
          functionButtonText: 'text-stone-300',
        };
      case 'system':
        // System theme uses gradient effect to display two modes
        return {
          mainBg: 'bg-gradient-to-r from-stone-100 to-stone-800',
          sidebarBg: 'bg-gradient-to-r from-stone-200 to-stone-700',
          userMessageBg: 'bg-gradient-to-r from-stone-200 to-stone-700/90',
          assistantMessageBg: 'bg-transparent',
          inputBg: 'bg-gradient-to-r from-white to-stone-800',
          borderColor: 'border-stone-400',
          textColor: 'text-stone-800',
          secondaryTextColor: 'text-stone-600',
          buttonBg: 'bg-gradient-to-r from-black to-stone-900',
          buttonText: 'text-white',
          functionButtonBg: 'bg-transparent',
          functionButtonBorder: 'border-stone-400',
          functionButtonText: 'text-stone-600',
        };
    }
  };

  const styles = getPreviewStyles();

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg',
        isActive
          ? // Use deep blue selected state, thinner line
            'border-blue-800 shadow-md ring-1 ring-blue-800/20'
          : 'border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600'
      )}
    >
      {/* Chat interface preview simulation */}
      {/* Contains sidebar, main content area, message bubbles, input box and other real elements */}
      <div className={cn('h-32 w-full', styles.mainBg)}>
        <div className="flex h-full">
          {/* Simulate sidebar */}
          <div className={cn('flex h-full w-8 flex-col', styles.sidebarBg)}>
            <div className="flex-1 space-y-1 p-1.5">
              {/* Simulate new conversation button */}
              <div
                className={cn(
                  'h-3 w-5 rounded-sm',
                  styles.functionButtonBg,
                  styles.functionButtonBorder,
                  'border'
                )}
              />
              {/* Simulate chat list item */}
              <div className="space-y-0.5">
                <div className="h-1 w-4 rounded-full bg-current opacity-30" />
                <div className="h-1 w-3 rounded-full bg-current opacity-20" />
                <div className="h-1 w-4 rounded-full bg-current opacity-25" />
              </div>
            </div>
          </div>

          {/* Simulate main chat area */}
          <div className="flex h-full flex-1 flex-col">
            {/* Simulate message area */}
            <div className="flex-1 px-3 py-2">
              {/* Message area - more centered layout, Hello message at the top */}
              <div className="mx-auto max-w-[70%]">
                {/* Simulate user message - at the top */}
                <div className="flex justify-end">
                  <div
                    className={cn(
                      'max-w-[60%] rounded-lg px-2 py-1 text-[6px] leading-tight',
                      styles.userMessageBg,
                      theme === 'dark' ? 'text-stone-100' : 'text-stone-800'
                    )}
                  >
                    Hello
                  </div>
                </div>
              </div>
            </div>

            {/* Simulate input box area - more centered layout */}
            <div className="px-3 pb-1.5">
              <div className="mx-auto max-w-[70%]">
                <div
                  className={cn(
                    'flex flex-col rounded-lg border',
                    styles.inputBg,
                    styles.borderColor
                  )}
                >
                  {/* Input text area */}
                  <div className="px-2 pt-1.5 pb-2">
                    <div className="space-y-0.5">
                      <div
                        className={cn(
                          'h-0.5 w-10 rounded-full opacity-30',
                          styles.secondaryTextColor
                        )}
                      />
                      <div
                        className={cn(
                          'h-0.5 w-6 rounded-full opacity-20',
                          styles.secondaryTextColor
                        )}
                      />
                    </div>
                  </div>

                  {/* Button area */}
                  <div className="relative px-1.5 pb-1.5">
                    {/* Lower left attachment button */}
                    <div
                      className={cn(
                        'absolute bottom-1.5 left-1.5 flex h-2.5 w-2.5 items-center justify-center rounded border',
                        styles.functionButtonBg,
                        styles.functionButtonBorder
                      )}
                    >
                      <Paperclip
                        className={cn('h-1 w-1', styles.functionButtonText)}
                      />
                    </div>

                    {/* Lower right send button */}
                    <div
                      className={cn(
                        'absolute right-1.5 bottom-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full',
                        styles.buttonBg
                      )}
                    >
                      <ArrowUpIcon
                        className={cn('h-1 w-1', styles.buttonText)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme title */}
      <div className="p-3">
        <p
          className={cn(
            'text-center text-sm font-medium',
            isActive
              ? 'text-stone-700 dark:text-stone-300'
              : 'text-stone-900 dark:text-stone-200'
          )}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
