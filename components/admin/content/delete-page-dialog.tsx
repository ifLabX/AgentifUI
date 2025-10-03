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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeletePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  title?: string;
  onSuccess: () => void;
}

export function DeletePageDialog({
  open,
  onOpenChange,
  slug,
  title,
  onSuccess,
}: DeletePageDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/dynamic-pages?slug=${encodeURIComponent(slug)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete page');
        return;
      }

      toast.success(`Page "${title || slug}" deleted successfully!`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast.error('Failed to delete page');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete Page
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this page? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            className={cn(
              'rounded-lg border p-4',
              'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-900 dark:text-red-100">
                  Route Path:
                </span>
                <code className="rounded bg-red-100 px-2 py-1 text-sm font-mono text-red-900 dark:bg-red-900 dark:text-red-100">
                  {slug}
                </code>
              </div>
              {title && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">
                    Page Title:
                  </span>
                  <span className="text-sm text-red-800 dark:text-red-200">
                    {title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <p className="font-medium">This will:</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Remove the page from the database</li>
              <li>Delete all translation content</li>
              <li>Remove the route from the system</li>
              <li>Make the page URL inaccessible</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
