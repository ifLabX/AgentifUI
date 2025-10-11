# Dynamic Pages Navigation Design

## Overview

This document defines the navigation entry points for dynamically created static pages (e.g., Help, Terms of Service) in the AgentifUI application. The design enables administrators to create custom pages via the admin panel and control where they appear in the user interface.

## Problem Statement

Currently, dynamic pages created through `/admin/content` are accessible via direct URL (e.g., `/help`) but lack visible navigation entry points in the frontend. Users cannot discover or navigate to these pages through the UI.

## Design Solution: Hybrid Navigation Approach

### Strategy

Combine two navigation locations to balance accessibility and flexibility:

1. **Sidebar Footer** - For 2-3 high-priority pages (e.g., Help)
2. **User Avatar Dropdown Menu** - For all static pages in a categorized list

This hybrid approach ensures:
- Important pages have prominent, always-visible access
- All pages remain discoverable through the user menu
- Future scalability as more pages are added
- Administrator control over page placement

---

## Architecture

### 1. Database Schema Enhancement

**Table: `dynamic_pages`**

Add new columns to control navigation behavior:

```sql
ALTER TABLE dynamic_pages
ADD COLUMN display_location TEXT DEFAULT 'menu' CHECK (display_location IN ('sidebar', 'menu', 'both', 'none')),
ADD COLUMN display_order INTEGER DEFAULT 0,
ADD COLUMN category TEXT DEFAULT 'general',
ADD COLUMN icon TEXT;
```

**Column Definitions:**

| Column | Type | Description | Values |
|--------|------|-------------|--------|
| `display_location` | TEXT | Where the page link appears | `sidebar`, `menu`, `both`, `none` |
| `display_order` | INTEGER | Sort order within location (lower = higher priority) | 0-999 |
| `category` | TEXT | Grouping category for menu display | `general`, `help`, `legal`, `company`, etc. |
| `icon` | TEXT | Lucide icon name (optional) | `HelpCircle`, `Info`, `FileText`, etc. |

**Migration File:**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_dynamic_pages_navigation.sql

-- Add navigation control columns
ALTER TABLE dynamic_pages
ADD COLUMN IF NOT EXISTS display_location TEXT DEFAULT 'menu' CHECK (display_location IN ('sidebar', 'menu', 'both', 'none')),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_dynamic_pages_display ON dynamic_pages(display_location, is_published, display_order);

-- Set default values for existing pages
UPDATE dynamic_pages
SET display_location = 'menu',
    display_order = 0,
    category = 'general'
WHERE display_location IS NULL;

-- Example: Set /help page to appear in sidebar
UPDATE dynamic_pages
SET display_location = 'sidebar',
    display_order = 0,
    category = 'help',
    icon = 'HelpCircle'
WHERE slug = '/help';
```

---

### 2. Component Implementation

#### 2.1 Sidebar Navigation

**File: `components/sidebar/sidebar-navigation-links.tsx` (NEW)**

```typescript
'use client';

import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { useDynamicPages } from '@lib/hooks/use-dynamic-pages';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarButton } from './sidebar-button';

/**
 * Sidebar navigation links for dynamic pages
 * Displays pages where display_location is 'sidebar' or 'both'
 */
export function SidebarNavigationLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const { isExpanded, selectItem } = useSidebarStore();
  const { pages } = useDynamicPages();
  const t = useTranslations();

  // Filter pages that should appear in sidebar
  const sidebarPages = pages
    ?.filter(
      page =>
        page.is_published &&
        (page.display_location === 'sidebar' || page.display_location === 'both')
    )
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, 5); // Limit to max 5 pages

  if (!sidebarPages || sidebarPages.length === 0) {
    return null;
  }

  // Get current locale for title display
  const currentLocale = t('locale') || 'en-US';

  return (
    <div className="flex flex-col gap-1.5">
      {sidebarPages.map(page => {
        const isActive = pathname === page.slug;
        const title = page.titles?.[currentLocale] || page.titles?.['en-US'] || page.slug;

        // Get icon component
        const IconComponent = page.icon
          ? (LucideIcons[page.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
          : LucideIcons.FileText;

        const button = (
          <SidebarButton
            key={page.slug}
            icon={<IconComponent className="h-5 w-5" />}
            active={isActive}
            onClick={() => {
              selectItem(null, null);
              router.push(page.slug);
            }}
            aria-label={title}
            variant="transparent"
            className="group"
          >
            {isExpanded && <span className="font-serif">{title}</span>}
          </SidebarButton>
        );

        // Show tooltip only when sidebar is collapsed
        return isExpanded ? (
          button
        ) : (
          <TooltipWrapper
            key={page.slug}
            content={title}
            id={`sidebar-nav-${page.slug}`}
            placement="right"
            size="sm"
            showArrow={false}
          >
            {button}
          </TooltipWrapper>
        );
      })}
    </div>
  );
}
```

**Update: `components/sidebar/sidebar-footer.tsx`**

```typescript
// Add import
import { SidebarNavigationLinks } from './sidebar-navigation-links';

// Modify return statement to add navigation links before settings
return (
  <div className={cn('mt-auto flex flex-col gap-1.5 p-3')}>
    {/* Dynamic navigation links */}
    <SidebarNavigationLinks />

    {/* Settings button (existing code) */}
    {!isMobile && (/* ... existing settings button code ... */)}
    {isMobile && <MobileUserButton />}
  </div>
);
```

---

#### 2.2 User Avatar Dropdown Menu

**File: `components/nav-bar/user-menu-pages.tsx` (NEW)**

```typescript
'use client';

import { useDynamicPages } from '@lib/hooks/use-dynamic-pages';
import { cn } from '@lib/utils';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

/**
 * Dynamic pages menu items for user avatar dropdown
 * Groups pages by category and displays all published pages
 */
export function UserMenuPages() {
  const router = useRouter();
  const { pages } = useDynamicPages();
  const t = useTranslations();

  // Filter pages that should appear in menu
  const menuPages = pages
    ?.filter(
      page =>
        page.is_published &&
        (page.display_location === 'menu' || page.display_location === 'both')
    )
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  if (!menuPages || menuPages.length === 0) {
    return null;
  }

  // Get current locale for title display
  const currentLocale = t('locale') || 'en-US';

  // Group pages by category
  const groupedPages = menuPages.reduce((acc, page) => {
    const category = page.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(page);
    return acc;
  }, {} as Record<string, typeof menuPages>);

  // Category display order and labels
  const categoryOrder = ['help', 'company', 'legal', 'general'];
  const categoryLabels: Record<string, string> = {
    help: t('userMenu.categories.help', { defaultValue: 'Help & Support' }),
    company: t('userMenu.categories.company', { defaultValue: 'Company' }),
    legal: t('userMenu.categories.legal', { defaultValue: 'Legal' }),
    general: t('userMenu.categories.general', { defaultValue: 'General' }),
  };

  return (
    <>
      {/* Divider before pages section */}
      <div className="h-px bg-stone-200 dark:bg-stone-700" />

      {categoryOrder.map(category => {
        const categoryPages = groupedPages[category];
        if (!categoryPages || categoryPages.length === 0) return null;

        return (
          <div key={category}>
            {/* Category label */}
            <div className="px-2 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
              {categoryLabels[category] || category}
            </div>

            {/* Category pages */}
            {categoryPages.map(page => {
              const title = page.titles?.[currentLocale] || page.titles?.['en-US'] || page.slug;
              const IconComponent = page.icon
                ? (LucideIcons[page.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
                : LucideIcons.FileText;

              return (
                <button
                  key={page.slug}
                  onClick={() => router.push(page.slug)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
                    'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{title}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
```

**Update: `components/nav-bar/desktop-user-avatar.tsx`**

Add `<UserMenuPages />` component inside the dropdown menu, before the logout button:

```typescript
// Add import
import { UserMenuPages } from './user-menu-pages';

// Inside dropdown menu content, add before logout:
<UserMenuPages />

{/* Existing logout button */}
<button onClick={handleLogout}>...</button>
```

---

### 3. API Enhancement

**File: `app/api/admin/dynamic-pages/route.ts`**

Update POST handler to accept new fields:

```typescript
// Update body destructuring
const {
  slug,
  titles = {},
  isPublished = false,
  displayLocation = 'menu',
  displayOrder = 0,
  category = 'general',
  icon = null,
} = body;

// Update insert
const { data: newPage, error: createError } = await supabase
  .from('dynamic_pages')
  .insert({
    slug,
    titles,
    is_published: isPublished,
    display_location: displayLocation,
    display_order: displayOrder,
    category,
    icon,
    created_by: user.id,
  })
  .select()
  .single();
```

Add PATCH endpoint for updating page settings:

```typescript
/**
 * PATCH /api/admin/dynamic-pages?slug=/path
 * Update dynamic page navigation settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check (same as POST/DELETE)
    // ... auth code ...

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { displayLocation, displayOrder, category, icon, titles, isPublished } = body;

    const updateData: any = {};
    if (displayLocation !== undefined) updateData.display_location = displayLocation;
    if (displayOrder !== undefined) updateData.display_order = displayOrder;
    if (category !== undefined) updateData.category = category;
    if (icon !== undefined) updateData.icon = icon;
    if (titles !== undefined) updateData.titles = titles;
    if (isPublished !== undefined) updateData.is_published = isPublished;

    const { data, error } = await supabase
      .from('dynamic_pages')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Failed to update page:', error);
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      );
    }

    return NextResponse.json({ page: data });
  } catch (error) {
    console.error('PATCH /api/admin/dynamic-pages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### 4. Type Definitions

**File: `lib/hooks/use-dynamic-pages.ts`**

Update `DynamicPage` interface:

```typescript
export interface DynamicPage {
  id: string;
  slug: string;
  titles: Record<string, string>;
  is_published: boolean;
  display_location?: 'sidebar' | 'menu' | 'both' | 'none';
  display_order?: number;
  category?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}
```

---

### 5. Admin UI Enhancement

**File: `components/admin/content/page-settings-dialog.tsx` (NEW)**

Create a dialog for configuring page navigation settings:

```typescript
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import type { DynamicPage } from '@lib/hooks/use-dynamic-pages';
import { cn } from '@lib/utils';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: DynamicPage;
  onSuccess: () => void;
}

export function PageSettingsDialog({
  open,
  onOpenChange,
  page,
  onSuccess,
}: PageSettingsDialogProps) {
  const [displayLocation, setDisplayLocation] = useState(page.display_location || 'menu');
  const [displayOrder, setDisplayOrder] = useState(page.display_order || 0);
  const [category, setCategory] = useState(page.category || 'general');
  const [icon, setIcon] = useState(page.icon || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/dynamic-pages?slug=${page.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayLocation,
          displayOrder,
          category,
          icon: icon || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update page settings');
      }

      toast.success('Page settings updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to update page settings:', error);
      toast.error('Failed to update page settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Common Lucide icon names
  const iconOptions = [
    'HelpCircle',
    'Info',
    'FileText',
    'BookOpen',
    'Mail',
    'Phone',
    'Users',
    'Briefcase',
    'Shield',
    'Lock',
    'Globe',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Page Navigation Settings</DialogTitle>
          <DialogDescription>
            Configure where and how "{page.slug}" appears in the navigation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Location</label>
            <Select value={displayLocation} onValueChange={setDisplayLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Hidden (URL only)</SelectItem>
                <SelectItem value="menu">User Menu Only</SelectItem>
                <SelectItem value="sidebar">Sidebar Only</SelectItem>
                <SelectItem value="both">Both Sidebar & Menu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Order</label>
            <input
              type="number"
              min="0"
              max="999"
              value={displayOrder}
              onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                'border-stone-300 bg-white text-stone-900',
                'dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'
              )}
            />
            <p className="text-xs text-stone-500">Lower numbers appear first</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="help">Help & Support</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Icon (Optional)</label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Icon</SelectItem>
                {iconOptions.map(iconName => {
                  const IconComponent = LucideIcons[
                    iconName as keyof typeof LucideIcons
                  ] as React.ComponentType<{ className?: string }>;
                  return (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{iconName}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Update: `components/admin/content/content-tabs.tsx`**

Add settings icon button next to each dynamic page tab:

```typescript
import { Settings } from 'lucide-react';
import { PageSettingsDialog } from './page-settings-dialog';

// Add state for settings dialog
const [settingsDialogState, setSettingsDialogState] = useState<{
  open: boolean;
  page: DynamicPage | null;
}>({ open: false, page: null });

// Add settings button next to page tabs
<button
  onClick={(e) => {
    e.stopPropagation();
    setSettingsDialogState({ open: true, page });
  }}
  className="ml-1 p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"
>
  <Settings className="h-3 w-3" />
</button>

// Add dialog component
<PageSettingsDialog
  open={settingsDialogState.open}
  onOpenChange={(open) => setSettingsDialogState({ ...settingsDialogState, open })}
  page={settingsDialogState.page!}
  onSuccess={() => {
    // Refresh pages list
    refetchPages();
  }}
/>
```

---

## Implementation Phases

### Phase 1: Database & API (Priority: High)
- [ ] Create migration file for new columns
- [ ] Run migration on database
- [ ] Update API endpoints (POST, PATCH)
- [ ] Update TypeScript types

### Phase 2: Sidebar Navigation (Priority: High)
- [ ] Create `sidebar-navigation-links.tsx` component
- [ ] Update `sidebar-footer.tsx` to include navigation links
- [ ] Test responsive behavior (collapsed/expanded states)

### Phase 3: User Menu Navigation (Priority: Medium)
- [ ] Create `user-menu-pages.tsx` component
- [ ] Update `desktop-user-avatar.tsx` dropdown menu
- [ ] Implement category grouping logic
- [ ] Add i18n translations for category labels

### Phase 4: Admin UI (Priority: Medium)
- [ ] Create `page-settings-dialog.tsx` component
- [ ] Add settings button to content tabs
- [ ] Update `create-page-dialog.tsx` to include navigation fields
- [ ] Test admin workflow

### Phase 5: Mobile Optimization (Priority: Low)
- [ ] Ensure mobile user menu includes page links
- [ ] Test mobile navigation behavior
- [ ] Adjust spacing/styling for mobile devices

---

## Internationalization (i18n)

Add to `messages/en-US.json`:

```json
{
  "sidebar": {
    "dynamicPages": {
      "help": "Help",
      "about": "About"
    }
  },
  "userMenu": {
    "categories": {
      "help": "Help & Support",
      "company": "Company",
      "legal": "Legal",
      "general": "General"
    }
  },
  "pages": {
    "admin": {
      "content": {
        "pageSettings": {
          "title": "Page Navigation Settings",
          "displayLocation": "Display Location",
          "displayOrder": "Display Order",
          "category": "Category",
          "icon": "Icon",
          "save": "Save Settings"
        }
      }
    }
  }
}
```

Replicate for all supported locales: `zh-CN`, `es-ES`, `zh-TW`, `ja-JP`, `de-DE`, `fr-FR`, `ru-RU`, `it-IT`, `pt-PT`.

---

## Usage Examples

### Example 1: Help Page in Sidebar

Admin creates `/help` page with settings:
- `display_location`: `sidebar`
- `display_order`: `0`
- `category`: `help`
- `icon`: `HelpCircle`

**Result**: Help link appears at top of sidebar footer, always visible to users.

---

### Example 2: Legal Pages in Menu Only

Admin creates `/terms`, `/privacy`, `/cookies` with settings:
- `display_location`: `menu`
- `display_order`: `10`, `11`, `12`
- `category`: `legal`
- `icon`: `FileText`

**Result**: Pages grouped under "Legal" section in user menu dropdown, not in sidebar.

---

### Example 3: About Page in Both Locations

Admin creates `/about` with settings:
- `display_location`: `both`
- `display_order`: `1`
- `category`: `company`
- `icon`: `Info`

**Result**: About link appears in both sidebar (below Help) and user menu (under "Company" category).

---

## Testing Checklist

### Functional Testing
- [ ] Sidebar links appear for pages with `display_location` = `sidebar` or `both`
- [ ] Menu links appear for pages with `display_location` = `menu` or `both`
- [ ] Pages with `display_location` = `none` are hidden but accessible via URL
- [ ] Unpublished pages (`is_published` = false) do not appear in navigation
- [ ] Page order follows `display_order` values
- [ ] Category grouping works correctly in menu
- [ ] Icons display properly (or fallback to default)

### UI/UX Testing
- [ ] Sidebar links show tooltips when collapsed
- [ ] Menu categories are properly labeled and localized
- [ ] Navigation links highlight active page
- [ ] Mobile user menu includes all menu pages
- [ ] Admin settings dialog saves correctly
- [ ] Page limit (5) enforced in sidebar

### Edge Cases
- [ ] No dynamic pages created (components render nothing)
- [ ] Page with missing title (fallback to slug)
- [ ] Page with invalid icon name (fallback to FileText)
- [ ] Multiple pages with same `display_order` (sorted by creation date)
- [ ] Very long page title (truncate with ellipsis)

---

## Future Enhancements

### Potential Features (Not in Current Scope)

1. **Drag-and-Drop Ordering**
   - Admin UI to reorder pages visually
   - Auto-save display_order changes

2. **Custom Categories**
   - Allow admins to create custom categories
   - Category icons and colors

3. **Access Control**
   - Show/hide pages based on user role
   - Guest vs authenticated user visibility

4. **Analytics**
   - Track page view counts
   - Popular pages dashboard

5. **External Links**
   - Support external URLs in navigation
   - Open in new tab option

6. **Nested Pages**
   - Parent-child page relationships
   - Submenu navigation

---

## Rollback Plan

If issues arise after deployment:

1. **Quick Fix**: Set all pages to `display_location = 'none'`
   ```sql
   UPDATE dynamic_pages SET display_location = 'none';
   ```

2. **Component Disable**: Comment out `<SidebarNavigationLinks />` and `<UserMenuPages />` imports

3. **Full Rollback**: Revert migration
   ```sql
   ALTER TABLE dynamic_pages
   DROP COLUMN display_location,
   DROP COLUMN display_order,
   DROP COLUMN category,
   DROP COLUMN icon;
   ```

---

## Questions & Decisions Log

**Q1**: Should sidebar have a maximum number of links?
**A1**: Yes, limit to 5 pages maximum to avoid clutter. Admin can control via `display_order`.

**Q2**: What happens if no pages have `display_location = 'sidebar'`?
**A2**: Sidebar footer shows only Settings button (current behavior). No empty state needed.

**Q3**: Should admins be warned when setting more than 5 pages to sidebar?
**A3**: Phase 2 implementation: show warning in admin UI, allow override.

**Q4**: Mobile navigation - where do pages appear?
**A4**: Mobile user button already has dropdown menu. Add `<UserMenuPages />` there.

---

## References

- **Related Files**:
  - `app/[...slug]/page.tsx` - Dynamic page renderer
  - `app/admin/content/page.tsx` - Admin content management
  - `components/sidebar/sidebar-footer.tsx` - Sidebar footer component
  - `components/nav-bar/desktop-user-avatar.tsx` - User menu dropdown
  - `lib/hooks/use-dynamic-pages.ts` - Pages data fetching hook

- **Database Tables**:
  - `dynamic_pages` - Dynamic page storage
  - `profiles` - User role checking

- **API Endpoints**:
  - `GET /api/admin/dynamic-pages` - Fetch all pages
  - `POST /api/admin/dynamic-pages` - Create page
  - `PATCH /api/admin/dynamic-pages?slug=X` - Update page settings
  - `DELETE /api/admin/dynamic-pages?slug=X` - Delete page

---

## Document Metadata

- **Version**: 1.0
- **Author**: System Design Team
- **Date**: 2025-10-07
- **Status**: Ready for Implementation
- **Approved By**: Product Owner (Pending)

---

## Appendix: Example Data

### Sample Database Records

```sql
-- Example 1: Help page in sidebar
INSERT INTO dynamic_pages (slug, titles, is_published, display_location, display_order, category, icon)
VALUES (
  '/help',
  '{"en-US": "Help", "zh-CN": "帮助", "es-ES": "Ayuda"}',
  true,
  'sidebar',
  0,
  'help',
  'HelpCircle'
);

-- Example 2: Privacy policy in menu only
INSERT INTO dynamic_pages (slug, titles, is_published, display_location, display_order, category, icon)
VALUES (
  '/privacy',
  '{"en-US": "Privacy Policy", "zh-CN": "隐私政策", "es-ES": "Política de privacidad"}',
  true,
  'menu',
  10,
  'legal',
  'Shield'
);

-- Example 3: About page in both
INSERT INTO dynamic_pages (slug, titles, is_published, display_location, display_order, category, icon)
VALUES (
  '/about',
  '{"en-US": "About Us", "zh-CN": "关于我们", "es-ES": "Acerca de"}',
  true,
  'both',
  1,
  'company',
  'Info'
);

-- Example 4: Hidden page (accessible via URL only)
INSERT INTO dynamic_pages (slug, titles, is_published, display_location, display_order, category, icon)
VALUES (
  '/internal-docs',
  '{"en-US": "Internal Documentation", "zh-CN": "内部文档"}',
  true,
  'none',
  999,
  'general',
  NULL
);
```

---

## Contact

For questions or clarifications about this design document, contact:
- **Technical Lead**: [Your Name]
- **Product Owner**: [Product Owner Name]
- **Design Review**: [Date TBD]
