# 动态页面导航设计方案

## 概述

本文档定义了 AgentifUI 应用中动态创建的静态页面(如帮助页面、服务条款等)的导航入口设计方案。该设计使管理员能够通过管理面板创建自定义页面,并控制它们在用户界面中的显示位置。

## 问题陈述

目前,通过 `/admin/content` 创建的动态页面可以通过直接 URL 访问(如 `/help`),但在前端缺少可见的导航入口。用户无法通过 UI 发现或导航到这些页面。

## 解决方案:混合导航模式

### 策略

结合两个导航位置,平衡可访问性和灵活性:

1. **侧边栏底部** - 用于 2-3 个高优先级页面(如帮助)
2. **用户头像下拉菜单** - 用于所有静态页面,按分类列表显示

这种混合方式确保:
- 重要页面拥有突出的、始终可见的访问入口
- 所有页面可通过用户菜单被发现
- 随着更多页面的添加,具有未来可扩展性
- 管理员可控制页面放置位置

---

## 架构设计

### 1. 数据库架构增强

**表: `dynamic_pages`**

添加新列以控制导航行为:

```sql
ALTER TABLE dynamic_pages
ADD COLUMN display_location TEXT DEFAULT 'menu' CHECK (display_location IN ('sidebar', 'menu', 'both', 'none')),
ADD COLUMN display_order INTEGER DEFAULT 0,
ADD COLUMN category TEXT DEFAULT 'general',
ADD COLUMN icon TEXT;
```

**字段定义:**

| 字段 | 类型 | 描述 | 可选值 |
|------|------|------|--------|
| `display_location` | TEXT | 页面链接显示的位置 | `sidebar`, `menu`, `both`, `none` |
| `display_order` | INTEGER | 在位置内的排序顺序(数字越小优先级越高) | 0-999 |
| `category` | TEXT | 菜单显示的分组类别 | `general`, `help`, `legal`, `company` 等 |
| `icon` | TEXT | Lucide 图标名称(可选) | `HelpCircle`, `Info`, `FileText` 等 |

**迁移文件:**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_dynamic_pages_navigation.sql

-- 添加导航控制字段
ALTER TABLE dynamic_pages
ADD COLUMN IF NOT EXISTS display_location TEXT DEFAULT 'menu' CHECK (display_location IN ('sidebar', 'menu', 'both', 'none')),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS icon TEXT;

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_dynamic_pages_display ON dynamic_pages(display_location, is_published, display_order);

-- 为现有页面设置默认值
UPDATE dynamic_pages
SET display_location = 'menu',
    display_order = 0,
    category = 'general'
WHERE display_location IS NULL;

-- 示例:设置 /help 页面显示在侧边栏
UPDATE dynamic_pages
SET display_location = 'sidebar',
    display_order = 0,
    category = 'help',
    icon = 'HelpCircle'
WHERE slug = '/help';
```

---

### 2. 组件实现

#### 2.1 侧边栏导航

**文件: `components/sidebar/sidebar-navigation-links.tsx` (新建)**

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
 * 侧边栏动态页面导航链接
 * 显示 display_location 为 'sidebar' 或 'both' 的页面
 */
export function SidebarNavigationLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const { isExpanded, selectItem } = useSidebarStore();
  const { pages } = useDynamicPages();
  const t = useTranslations();

  // 筛选应显示在侧边栏的页面
  const sidebarPages = pages
    ?.filter(
      page =>
        page.is_published &&
        (page.display_location === 'sidebar' || page.display_location === 'both')
    )
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, 5); // 限制最多 5 个页面

  if (!sidebarPages || sidebarPages.length === 0) {
    return null;
  }

  // 获取当前语言环境以显示标题
  const currentLocale = t('locale') || 'en-US';

  return (
    <div className="flex flex-col gap-1.5">
      {sidebarPages.map(page => {
        const isActive = pathname === page.slug;
        const title = page.titles?.[currentLocale] || page.titles?.['en-US'] || page.slug;

        // 获取图标组件
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

        // 仅在侧边栏折叠时显示提示
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

**更新: `components/sidebar/sidebar-footer.tsx`**

```typescript
// 添加导入
import { SidebarNavigationLinks } from './sidebar-navigation-links';

// 修改返回语句,在设置按钮前添加导航链接
return (
  <div className={cn('mt-auto flex flex-col gap-1.5 p-3')}>
    {/* 动态导航链接 */}
    <SidebarNavigationLinks />

    {/* 设置按钮(现有代码) */}
    {!isMobile && (/* ... 现有设置按钮代码 ... */)}
    {isMobile && <MobileUserButton />}
  </div>
);
```

---

#### 2.2 用户头像下拉菜单

**文件: `components/nav-bar/user-menu-pages.tsx` (新建)**

```typescript
'use client';

import { useDynamicPages } from '@lib/hooks/use-dynamic-pages';
import { cn } from '@lib/utils';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

/**
 * 用户头像下拉菜单中的动态页面菜单项
 * 按类别分组显示所有已发布页面
 */
export function UserMenuPages() {
  const router = useRouter();
  const { pages } = useDynamicPages();
  const t = useTranslations();

  // 筛选应显示在菜单中的页面
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

  // 获取当前语言环境以显示标题
  const currentLocale = t('locale') || 'en-US';

  // 按类别分组页面
  const groupedPages = menuPages.reduce((acc, page) => {
    const category = page.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(page);
    return acc;
  }, {} as Record<string, typeof menuPages>);

  // 类别显示顺序和标签
  const categoryOrder = ['help', 'company', 'legal', 'general'];
  const categoryLabels: Record<string, string> = {
    help: t('userMenu.categories.help', { defaultValue: '帮助与支持' }),
    company: t('userMenu.categories.company', { defaultValue: '公司' }),
    legal: t('userMenu.categories.legal', { defaultValue: '法律' }),
    general: t('userMenu.categories.general', { defaultValue: '通用' }),
  };

  return (
    <>
      {/* 页面区域前的分隔线 */}
      <div className="h-px bg-stone-200 dark:bg-stone-700" />

      {categoryOrder.map(category => {
        const categoryPages = groupedPages[category];
        if (!categoryPages || categoryPages.length === 0) return null;

        return (
          <div key={category}>
            {/* 类别标签 */}
            <div className="px-2 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
              {categoryLabels[category] || category}
            </div>

            {/* 类别页面 */}
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

**更新: `components/nav-bar/desktop-user-avatar.tsx`**

在下拉菜单中添加 `<UserMenuPages />` 组件,放在退出登录按钮之前:

```typescript
// 添加导入
import { UserMenuPages } from './user-menu-pages';

// 在下拉菜单内容中,在退出登录前添加:
<UserMenuPages />

{/* 现有退出登录按钮 */}
<button onClick={handleLogout}>...</button>
```

---

### 3. API 增强

**文件: `app/api/admin/dynamic-pages/route.ts`**

更新 POST 处理程序以接受新字段:

```typescript
// 更新请求体解构
const {
  slug,
  titles = {},
  isPublished = false,
  displayLocation = 'menu',
  displayOrder = 0,
  category = 'general',
  icon = null,
} = body;

// 更新插入操作
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

添加 PATCH 端点用于更新页面设置:

```typescript
/**
 * PATCH /api/admin/dynamic-pages?slug=/path
 * 更新动态页面导航设置
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 权限检查(与 POST/DELETE 相同)
    // ... 权限验证代码 ...

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug 参数是必需的' },
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
      console.error('更新页面失败:', error);
      return NextResponse.json(
        { error: '更新页面失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ page: data });
  } catch (error) {
    console.error('PATCH /api/admin/dynamic-pages 错误:', error);
    return NextResponse.json(
      { error: '内部服务器错误' },
      { status: 500 }
    );
  }
}
```

---

### 4. 类型定义

**文件: `lib/hooks/use-dynamic-pages.ts`**

更新 `DynamicPage` 接口:

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

### 5. 管理界面增强

**文件: `components/admin/content/page-settings-dialog.tsx` (新建)**

创建用于配置页面导航设置的对话框:

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
        throw new Error('更新页面设置失败');
      }

      toast.success('页面设置更新成功');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('更新页面设置失败:', error);
      toast.error('更新页面设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 常用 Lucide 图标名称
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
          <DialogTitle>页面导航设置</DialogTitle>
          <DialogDescription>
            配置 "{page.slug}" 在导航中的显示方式和位置
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 显示位置 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">显示位置</label>
            <Select value={displayLocation} onValueChange={setDisplayLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">隐藏(仅通过 URL 访问)</SelectItem>
                <SelectItem value="menu">仅用户菜单</SelectItem>
                <SelectItem value="sidebar">仅侧边栏</SelectItem>
                <SelectItem value="both">侧边栏和菜单都显示</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 显示顺序 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">显示顺序</label>
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
            <p className="text-xs text-stone-500">数字越小,排序越靠前</p>
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">分类</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">通用</SelectItem>
                <SelectItem value="help">帮助与支持</SelectItem>
                <SelectItem value="company">公司</SelectItem>
                <SelectItem value="legal">法律</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 图标 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">图标(可选)</label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue placeholder="选择图标" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">无图标</SelectItem>
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
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            保存设置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**更新: `components/admin/content/content-tabs.tsx`**

在每个动态页面标签旁添加设置图标按钮:

```typescript
import { Settings } from 'lucide-react';
import { PageSettingsDialog } from './page-settings-dialog';

// 添加设置对话框状态
const [settingsDialogState, setSettingsDialogState] = useState<{
  open: boolean;
  page: DynamicPage | null;
}>({ open: false, page: null });

// 在页面标签旁添加设置按钮
<button
  onClick={(e) => {
    e.stopPropagation();
    setSettingsDialogState({ open: true, page });
  }}
  className="ml-1 p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"
>
  <Settings className="h-3 w-3" />
</button>

// 添加对话框组件
<PageSettingsDialog
  open={settingsDialogState.open}
  onOpenChange={(open) => setSettingsDialogState({ ...settingsDialogState, open })}
  page={settingsDialogState.page!}
  onSuccess={() => {
    // 刷新页面列表
    refetchPages();
  }}
/>
```

---

## 实施阶段

### 第一阶段:数据库和 API(优先级:高)
- [ ] 创建迁移文件添加新字段
- [ ] 在数据库上运行迁移
- [ ] 更新 API 端点(POST、PATCH)
- [ ] 更新 TypeScript 类型定义

### 第二阶段:侧边栏导航(优先级:高)
- [ ] 创建 `sidebar-navigation-links.tsx` 组件
- [ ] 更新 `sidebar-footer.tsx` 包含导航链接
- [ ] 测试响应式行为(折叠/展开状态)

### 第三阶段:用户菜单导航(优先级:中)
- [ ] 创建 `user-menu-pages.tsx` 组件
- [ ] 更新 `desktop-user-avatar.tsx` 下拉菜单
- [ ] 实现类别分组逻辑
- [ ] 添加类别标签的国际化翻译

### 第四阶段:管理界面(优先级:中)
- [ ] 创建 `page-settings-dialog.tsx` 组件
- [ ] 在内容标签页添加设置按钮
- [ ] 更新 `create-page-dialog.tsx` 包含导航字段
- [ ] 测试管理工作流

### 第五阶段:移动端优化(优先级:低)
- [ ] 确保移动端用户菜单包含页面链接
- [ ] 测试移动端导航行为
- [ ] 调整移动设备的间距/样式

---

## 国际化(i18n)

在 `messages/zh-CN.json` 中添加:

```json
{
  "sidebar": {
    "dynamicPages": {
      "help": "帮助",
      "about": "关于"
    }
  },
  "userMenu": {
    "categories": {
      "help": "帮助与支持",
      "company": "公司",
      "legal": "法律",
      "general": "通用"
    }
  },
  "pages": {
    "admin": {
      "content": {
        "pageSettings": {
          "title": "页面导航设置",
          "displayLocation": "显示位置",
          "displayOrder": "显示顺序",
          "category": "分类",
          "icon": "图标",
          "save": "保存设置"
        }
      }
    }
  }
}
```

同样在其他所有支持的语言环境中复制:`en-US`、`es-ES`、`zh-TW`、`ja-JP`、`de-DE`、`fr-FR`、`ru-RU`、`it-IT`、`pt-PT`。

---

## 使用示例

### 示例 1: 帮助页面显示在侧边栏

管理员创建 `/help` 页面,设置如下:
- `display_location`: `sidebar`
- `display_order`: `0`
- `category`: `help`
- `icon`: `HelpCircle`

**结果**: 帮助链接显示在侧边栏底部顶部位置,始终对用户可见。

---

### 示例 2: 法律页面仅在菜单中

管理员创建 `/terms`、`/privacy`、`/cookies`,设置如下:
- `display_location`: `menu`
- `display_order`: `10`、`11`、`12`
- `category`: `legal`
- `icon`: `FileText`

**结果**: 页面在用户菜单下拉列表中分组显示在"法律"部分,不在侧边栏中。

---

### 示例 3: 关于页面同时显示在两个位置

管理员创建 `/about`,设置如下:
- `display_location`: `both`
- `display_order`: `1`
- `category`: `company`
- `icon`: `Info`

**结果**: 关于链接同时显示在侧边栏(在帮助下方)和用户菜单("公司"类别下)。

---

## 测试清单

### 功能测试
- [ ] `display_location` 为 `sidebar` 或 `both` 的页面显示在侧边栏
- [ ] `display_location` 为 `menu` 或 `both` 的页面显示在菜单
- [ ] `display_location` 为 `none` 的页面隐藏但可通过 URL 访问
- [ ] 未发布的页面(`is_published` = false)不出现在导航中
- [ ] 页面顺序遵循 `display_order` 值
- [ ] 菜单中的类别分组正常工作
- [ ] 图标正确显示(或回退到默认图标)

### UI/UX 测试
- [ ] 侧边栏折叠时链接显示提示
- [ ] 菜单类别正确标记并本地化
- [ ] 导航链接高亮显示活动页面
- [ ] 移动端用户菜单包含所有菜单页面
- [ ] 管理设置对话框正确保存
- [ ] 侧边栏强制执行页面限制(5 个)

### 边界情况
- [ ] 未创建动态页面(组件不渲染任何内容)
- [ ] 缺少标题的页面(回退到 slug)
- [ ] 无效图标名称的页面(回退到 FileText)
- [ ] 多个页面具有相同的 `display_order`(按创建日期排序)
- [ ] 非常长的页面标题(用省略号截断)

---

## 未来增强功能

### 潜在功能(不在当前范围内)

1. **拖放排序**
   - 管理界面可视化重新排序页面
   - 自动保存 display_order 更改

2. **自定义类别**
   - 允许管理员创建自定义类别
   - 类别图标和颜色

3. **访问控制**
   - 基于用户角色显示/隐藏页面
   - 访客 vs 已认证用户可见性

4. **分析统计**
   - 跟踪页面浏览次数
   - 热门页面仪表板

5. **外部链接**
   - 支持导航中的外部 URL
   - 在新标签页中打开选项

6. **嵌套页面**
   - 父子页面关系
   - 子菜单导航

---

## 回滚计划

如果部署后出现问题:

1. **快速修复**: 将所有页面设置为 `display_location = 'none'`
   ```sql
   UPDATE dynamic_pages SET display_location = 'none';
   ```

2. **组件禁用**: 注释掉 `<SidebarNavigationLinks />` 和 `<UserMenuPages />` 导入

3. **完全回滚**: 还原迁移
   ```sql
   ALTER TABLE dynamic_pages
   DROP COLUMN display_location,
   DROP COLUMN display_order,
   DROP COLUMN category,
   DROP COLUMN icon;
   ```

---

## 问题与决策日志

**Q1**: 侧边栏应该有最大链接数限制吗?
**A1**: 是的,限制最多 5 个页面以避免混乱。管理员可通过 `display_order` 控制。

**Q2**: 如果没有页面 `display_location = 'sidebar'` 会怎样?
**A2**: 侧边栏底部仅显示设置按钮(当前行为)。不需要空状态。

**Q3**: 当管理员设置超过 5 个页面到侧边栏时应该警告吗?
**A3**: 第二阶段实现:在管理界面中显示警告,允许覆盖。

**Q4**: 移动端导航 - 页面出现在哪里?
**A4**: 移动用户按钮已有下拉菜单。在那里添加 `<UserMenuPages />`。

---

## 参考

- **相关文件**:
  - `app/[...slug]/page.tsx` - 动态页面渲染器
  - `app/admin/content/page.tsx` - 管理内容管理
  - `components/sidebar/sidebar-footer.tsx` - 侧边栏底部组件
  - `components/nav-bar/desktop-user-avatar.tsx` - 用户菜单下拉
  - `lib/hooks/use-dynamic-pages.ts` - 页面数据获取钩子

- **数据库表**:
  - `dynamic_pages` - 动态页面存储
  - `profiles` - 用户角色检查

- **API 端点**:
  - `GET /api/admin/dynamic-pages` - 获取所有页面
  - `POST /api/admin/dynamic-pages` - 创建页面
  - `PATCH /api/admin/dynamic-pages?slug=X` - 更新页面设置
  - `DELETE /api/admin/dynamic-pages?slug=X` - 删除页面

---

## 文档元数据

- **版本**: 1.0
- **作者**: 系统设计团队
- **日期**: 2025-10-07
- **状态**: 准备实施
- **批准人**: 产品负责人(待定)

---

## 附录:示例数据

### 示例数据库记录

```sql
-- 示例 1: 帮助页面显示在侧边栏
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

-- 示例 2: 隐私政策仅在菜单中
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

-- 示例 3: 关于页面同时显示在两处
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

-- 示例 4: 隐藏页面(仅通过 URL 访问)
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

## 联系方式

关于此设计文档的问题或澄清,请联系:
- **技术负责人**: [你的名字]
- **产品负责人**: [产品负责人名字]
- **设计评审**: [待定日期]
