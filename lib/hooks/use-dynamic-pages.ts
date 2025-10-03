import { useEffect, useState } from 'react';

export interface DynamicPage {
  id: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useDynamicPages() {
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/dynamic-pages');

      if (!response.ok) {
        throw new Error('Failed to fetch dynamic pages');
      }

      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      console.error('Failed to fetch dynamic pages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return {
    pages,
    isLoading,
    error,
    refetch: fetchPages,
  };
}
