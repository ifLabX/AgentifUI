'use client';

import { Button } from '@components/ui/button';
import { cn } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface FeatureCard {
  title: string;
  description: string;
}

interface HomePageConfig {
  title: string;
  subtitle: string;
  getStarted: string;
  learnMore: string;
  features: FeatureCard[];
  copyright: {
    prefix: string;
    linkText: string;
    suffix: string;
  };
}

interface HomePreviewProps {
  config: HomePageConfig;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
}

export function HomePreview({ config, previewDevice }: HomePreviewProps) {
  // Tailwind classes for responsive dark mode
  const colors = {
    bgClass: 'bg-stone-100 dark:bg-stone-900',
    titleGradient:
      'from-stone-700 to-stone-900 dark:from-stone-300 dark:to-stone-500',
    textColor: 'text-stone-700 dark:text-gray-300',
    cardBg: 'bg-stone-100 dark:bg-stone-700',
    cardBorder: 'border-stone-200 dark:border-stone-600',
    cardShadow:
      'shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
    primaryButton:
      'bg-stone-800 hover:bg-stone-700 text-gray-100 dark:bg-stone-600 dark:hover:bg-stone-500',
    secondaryButton:
      'border-stone-400 text-stone-800 hover:bg-stone-200 dark:border-stone-500 dark:text-gray-200 dark:hover:bg-stone-600',
    featureIconBg: 'bg-stone-200 dark:bg-stone-600',
    featureTextColor: 'text-stone-700 dark:text-gray-300',
  };

  const getDeviceStyles = () => {
    switch (previewDevice) {
      case 'mobile':
        return {
          container: 'mx-auto bg-black rounded-[2rem] p-2 shadow-2xl',
          screen:
            'w-[375px] h-[667px] bg-white rounded-[1.75rem] overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'relative w-full px-4 py-12 sm:px-6 lg:px-8',
        };
      case 'tablet':
        return {
          container: 'mx-auto bg-black rounded-xl p-3 shadow-2xl mt-50',
          screen:
            'w-[768px] h-[1024px] bg-white rounded-lg overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'relative w-full px-4 py-12 sm:px-6 lg:px-8',
        };
      case 'desktop':
      default:
        return {
          container: 'w-full h-full',
          screen: 'w-full h-full overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'relative w-full px-4 py-12 sm:px-6 lg:px-8',
        };
    }
  };

  const deviceStyles = getDeviceStyles();

  const getResponsiveClasses = () => {
    switch (previewDevice) {
      case 'mobile':
        return {
          featureGrid: 'grid-cols-1',
          buttonLayout: 'flex-col',
        };
      case 'tablet':
      case 'desktop':
      default:
        return {
          featureGrid: 'grid-cols-3',
          buttonLayout: 'sm:flex-row',
        };
    }
  };

  const responsive = getResponsiveClasses();

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        previewDevice !== 'desktop' && 'p-4'
      )}
    >
      <div className={deviceStyles.container}>
        <div className={cn(deviceStyles.screen, colors.bgClass)}>
          <div className={deviceStyles.content}>
            <AnimatePresence>
              <main className={deviceStyles.mainClass}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mx-auto max-w-5xl"
                >
                  <div className="mb-16 text-center">
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className={`bg-gradient-to-r text-5xl font-bold md:text-6xl ${colors.titleGradient} mb-6 bg-clip-text py-2 leading-normal text-transparent`}
                    >
                      {config.title}
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className={`text-xl md:text-2xl ${colors.textColor} mx-auto max-w-3xl font-light`}
                    >
                      {config.subtitle}
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className={cn('mb-16 grid gap-8', responsive.featureGrid)}
                  >
                    {config.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.4 + index * 0.1,
                        }}
                        className={`${colors.cardBg} ${colors.cardShadow} border ${colors.cardBorder} flex flex-col items-center rounded-xl p-6 text-center`}
                      >
                        <div
                          className={`${colors.featureIconBg} mb-4 flex h-12 w-12 items-center justify-center rounded-full`}
                        >
                          <span className="text-xl">#{index + 1}</span>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold">
                          {feature.title}
                        </h3>
                        <p className={`${colors.featureTextColor} text-sm`}>
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className={cn(
                      'mb-16 flex justify-center gap-4',
                      responsive.buttonLayout
                    )}
                  >
                    <Button
                      size="lg"
                      className={`${colors.primaryButton} h-auto cursor-pointer rounded-lg px-8 py-3 text-base font-medium transition-all duration-200 hover:scale-105`}
                    >
                      {config.getStarted}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className={`${colors.secondaryButton} h-auto cursor-pointer rounded-lg px-8 py-3 text-base font-medium transition-all duration-200 hover:scale-105`}
                    >
                      {config.learnMore}
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className={`text-center ${colors.textColor} text-sm`}
                  >
                    <p>
                      {config.copyright.prefix.replace(
                        '{year}',
                        new Date().getFullYear().toString()
                      )}
                      <a
                        href="#"
                        onClick={e => e.preventDefault()}
                        className="transition-all duration-200 hover:underline hover:opacity-80"
                      >
                        {config.copyright.linkText}
                      </a>
                      {config.copyright.suffix}
                    </p>
                  </motion.div>
                </motion.div>
              </main>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
