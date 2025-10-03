'use client';

import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { cn } from '@lib/utils';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePageDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePageDialogProps) {
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    // Validate slug
    if (!slug.trim()) {
      toast.error('Please enter a route path');
      return;
    }

    if (!slug.startsWith('/')) {
      toast.error('Route path must start with /');
      return;
    }

    if (!/^\/[a-zA-Z0-9/_-]+$/.test(slug)) {
      toast.error('Route path contains invalid characters. Use only letters, numbers, /, _, and -');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/dynamic-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: slug.trim(),
          isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create page');
        return;
      }

      toast.success(`Page "${slug}" created successfully!`);
      setSlug('');
      setIsPublished(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create page:', error);
      toast.error('Failed to create page');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Page
          </DialogTitle>
          <DialogDescription>
            Create a new dynamic page route. The page will be accessible at the
            specified path.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Route Path Input */}
          <div className="space-y-2">
            <label
              htmlFor="slug"
              className={cn(
                'text-sm font-medium',
                'text-stone-700 dark:text-stone-300'
              )}
            >
              Route Path <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="/contact"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm font-mono',
                'border-stone-300 bg-white text-stone-900',
                'dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100',
                'focus:ring-2 focus:ring-stone-500 focus:outline-none'
              )}
              disabled={isCreating}
            />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Examples: /contact, /services, /services/consulting
            </p>
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className={cn(
                'h-4 w-4 rounded border-stone-300',
                'text-stone-900 focus:ring-2 focus:ring-stone-500',
                'dark:border-stone-600 dark:bg-stone-800'
              )}
              disabled={isCreating}
            />
            <label
              htmlFor="isPublished"
              className={cn(
                'text-sm font-medium',
                'text-stone-700 dark:text-stone-300'
              )}
            >
              Publish immediately
            </label>
          </div>

          {/* Info Note */}
          <div
            className={cn(
              'rounded-lg border p-3',
              'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
            )}
          >
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> After creating the page, you can edit its
              content using the visual editor in the content tabs above.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
