'use client';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Separator } from '@components/ui/separator';
import type { SupportedLocale } from '@lib/config/language-config';
import { getLanguageInfo } from '@lib/config/language-config';
import { useAboutEditorStore } from '@lib/stores/about-editor-store';
import {
  AboutTranslationData,
  ComponentInstance,
  PageContent,
  isDynamicFormat,
  migrateAboutTranslationData,
} from '@lib/types/about-page-components';
import { cn } from '@lib/utils';
import {
  useDebouncedCallback,
  useThrottledCallback,
} from '@lib/utils/performance';
import { GripVertical, Languages, Plus, Redo2, Trash2, Undo2 } from 'lucide-react';

import React, { useCallback, useEffect, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import ComponentPalette from './component-palette';
import ComponentRenderer from './component-renderer';
import { ContentTranslateDialog } from './content-translate-dialog';
import { ContextMenu } from './context-menu';
import { Droppable, Sortable, SortableContainer } from './dnd-components';
import { DndContextWrapper } from './dnd-context';
import { DragPreviewRenderer } from './drag-preview-renderer';
import { SectionDragPreview } from './section-drag-preview';

interface AboutEditorProps {
  translations: Record<SupportedLocale, AboutTranslationData>;
  currentLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  onTranslationsChange: (
    newTranslations: Record<SupportedLocale, AboutTranslationData>
  ) => void;
  onLocaleChange: (newLocale: SupportedLocale) => void;
  hasUnsavedChanges?: boolean;
  section?: string;
  onReloadTranslations?: () => void;
}

export function AboutEditor({
  translations,
  currentLocale,
  supportedLocales,
  onTranslationsChange,
  onLocaleChange,
  hasUnsavedChanges = false,
  section = 'pages.about',
  onReloadTranslations,
}: AboutEditorProps) {
  const t = useTranslations('pages.admin.content.editor');

  // Context menu state
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    componentId: string;
  } | null>(null);

  // Inline editing state
  const [editingComponent, setEditingComponent] = React.useState<{
    componentId: string;
    content: string;
  } | null>(null);

  // Translation dialog state
  const [showTranslateDialog, setShowTranslateDialog] = React.useState(false);

  // Zustand store
  const {
    pageContent,
    selectedComponentId,
    undoStack,
    redoStack,
    isDirty,
    setPageContent,
    setSelectedComponent,
    updateComponentProps,
    deleteComponent,
    deleteSection,
    handleDragEnd,
    addSection,
    undo,
    redo,
    setCurrentLanguage,
  } = useAboutEditorStore();

  // Get current translation and ensure it's in dynamic format
  const currentTranslation = useMemo(() => {
    let translation = translations[currentLocale] || {};

    // If it's not already in dynamic format, migrate it
    if (!isDynamicFormat(translation)) {
      translation = migrateAboutTranslationData(translation);
    }

    return translation;
  }, [translations, currentLocale]);

  // Get selected component from page content (currently unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedComponent = useMemo(() => {
    if (!pageContent || !selectedComponentId) return null;

    for (const section of pageContent.sections) {
      for (const column of section.columns) {
        const component = column.find(comp => comp.id === selectedComponentId);
        if (component) return component;
      }
    }
    return null;
  }, [pageContent, selectedComponentId]);

  // Get context menu component (dynamically updated)
  const contextMenuComponent = useMemo(() => {
    if (!pageContent || !contextMenu?.componentId) return null;

    for (const section of pageContent.sections) {
      for (const column of section.columns) {
        const component = column.find(
          comp => comp.id === contextMenu.componentId
        );
        if (component) return component;
      }
    }
    return null;
  }, [pageContent, contextMenu?.componentId]);

  // Initial load and locale change handling
  useEffect(() => {
    if (currentTranslation.sections) {
      const content: PageContent = {
        sections: currentTranslation.sections,
        metadata: currentTranslation.metadata || {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          author: 'admin',
        },
      };
      setPageContent(content);
    }
    setCurrentLanguage(currentLocale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocale, setPageContent, setCurrentLanguage]); // Only reload on locale change, not on translation data updates

  // Debounced auto-save function
  const debouncedSave = useDebouncedCallback(
    useCallback(() => {
      if (!pageContent) return;

      const updatedTranslation: AboutTranslationData = {
        sections: pageContent.sections,
        metadata: {
          ...pageContent.metadata,
          lastModified: new Date().toISOString(),
        },
      };

      const newTranslations = {
        ...translations,
        [currentLocale]: updatedTranslation,
      };

      onTranslationsChange(newTranslations);
    }, [pageContent, translations, currentLocale, onTranslationsChange]),
    100, // 100ms delay for near real-time sync
    [pageContent, translations, currentLocale]
  );

  // Auto-save when pageContent changes
  useEffect(() => {
    if (pageContent) {
      debouncedSave();
    }
  }, [pageContent, debouncedSave]);

  // Throttled property change handler for better performance
  const throttledPropsChange = useThrottledCallback(
    useCallback(
      (newProps: Record<string, unknown>) => {
        if (selectedComponentId) {
          updateComponentProps(selectedComponentId, newProps);
          debouncedSave(); // Auto-save after prop changes
        }
      },
      [selectedComponentId, updateComponentProps, debouncedSave]
    ),
    100, // 100ms throttle
    [selectedComponentId, updateComponentProps]
  );

  // Handle property changes (currently unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePropsChange = throttledPropsChange;

  // Handle component deletion
  const handleDeleteComponent = (componentId: string) => {
    deleteComponent(componentId);
    setContextMenu(null);
  };

  // Handle component selection
  const handleComponentClick = (componentId: string) => {
    setSelectedComponent(componentId);
    // Focus the main container so keyboard events work
    const container = document.querySelector('[tabindex="0"]') as HTMLElement;
    if (container) {
      container.focus();
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the component
    let targetComponent: ComponentInstance | null = null;
    for (const section of pageContent?.sections || []) {
      for (const column of section.columns) {
        const component = column.find(comp => comp.id === componentId);
        if (component) {
          targetComponent = component;
          break;
        }
      }
      if (targetComponent) break;
    }

    if (targetComponent) {
      setSelectedComponent(componentId); // Set as selected when right-clicking
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        componentId: componentId,
      });
      // Focus the main container so keyboard events work
      const container = document.querySelector('[tabindex="0"]') as HTMLElement;
      if (container) {
        container.focus();
      }
    }
  };

  // Handle context menu props change
  const handleContextMenuPropsChange = (newProps: Record<string, unknown>) => {
    if (contextMenu?.componentId) {
      updateComponentProps(contextMenu.componentId, newProps);
      debouncedSave(); // Auto-save after prop changes
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedComponentId) {
      e.preventDefault();
      handleDeleteComponent(selectedComponentId);
    }
    if (e.key === 'Escape' && editingComponent) {
      e.preventDefault();
      setEditingComponent(null);
    }
  };

  // Handle double-click to edit content
  const handleDoubleClick = (componentId: string) => {
    // Find the component
    let targetComponent: ComponentInstance | null = null;
    for (const section of pageContent?.sections || []) {
      for (const column of section.columns) {
        const component = column.find(comp => comp.id === componentId);
        if (component) {
          targetComponent = component;
          break;
        }
      }
      if (targetComponent) break;
    }

    if (targetComponent && targetComponent.props.content) {
      setEditingComponent({
        componentId,
        content: String(targetComponent.props.content || ''),
      });
    }
  };

  // Handle saving inline edit
  const handleSaveEdit = () => {
    if (editingComponent) {
      updateComponentProps(editingComponent.componentId, {
        content: editingComponent.content,
      });
      setEditingComponent(null);
      debouncedSave();
    }
  };

  // Handle input change during editing
  const handleEditInputChange = (value: string) => {
    if (editingComponent) {
      setEditingComponent({
        ...editingComponent,
        content: value,
      });
    }
  };

  // Global context menu handler as fallback - finds component under cursor
  const handleGlobalContextMenu = (e: React.MouseEvent) => {
    // Only handle if no specific component context menu was triggered
    if (contextMenu) return;

    // Find the closest component element
    const target = e.target as HTMLElement;
    const componentElement = target.closest(
      '[data-component-id]'
    ) as HTMLElement;

    if (componentElement) {
      const componentId = componentElement.getAttribute('data-component-id');
      if (componentId) {
        e.preventDefault();
        e.stopPropagation();
        handleContextMenu(e, componentId);
      }
    }
  };

  if (!pageContent) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <DndContextWrapper onDragEnd={handleDragEnd}>
      <div
        className="flex h-full flex-col focus:outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div
          className={cn(
            'border-b p-4',
            'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800'
          )}
        >
          {/* Language Selector and Action Buttons */}
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t('common.editLanguage')}
                </label>
                <Select
                  value={currentLocale}
                  onValueChange={value =>
                    onLocaleChange(value as SupportedLocale)
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-60">
                          {getLanguageInfo(currentLocale).code}
                        </span>
                        <span className="font-medium">
                          {getLanguageInfo(currentLocale).nativeName}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLocales.map(locale => {
                      const langInfo = getLanguageInfo(locale);
                      return (
                        <SelectItem key={locale} value={locale}>
                          <div className="flex w-full items-center justify-between">
                            <span className="font-medium">
                              {langInfo.nativeName}
                            </span>
                            <span className="ml-2 text-xs opacity-60">
                              {langInfo.code}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Translate Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranslateDialog(true)}
              >
                <Languages className="mr-2 h-4 w-4" />
                {t('contentTranslate.button')}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={undoStack.length === 0}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={redoStack.length === 0}
                >
                  <Redo2 className="mr-2 h-4 w-4" />
                  Redo
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSection('single-column')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                {isDirty && <Badge variant="secondary">Unsaved</Badge>}
                <Badge variant="outline">
                  {pageContent.sections.length} sections
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex min-h-0 flex-1">
          {/* Left Panel - Component Palette */}
          <div
            className={cn(
              'w-64 overflow-x-hidden overflow-y-auto border-r p-4',
              'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-900'
            )}
          >
            <ComponentPalette />
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto">
            <div
              className="space-y-6 p-6"
              onContextMenu={handleGlobalContextMenu}
            >
              {pageContent.sections.map((section, sectionIndex) => {
                // Create drag preview for section
                const sectionDragPreview = (
                  <SectionDragPreview
                    section={section}
                    sectionIndex={sectionIndex}
                  />
                );

                return (
                  <div key={section.id} className="space-y-4">
                    {/* Section Drop Zone (before each section) */}
                    {sectionIndex > 0 && (
                      <Droppable
                        id={`section-drop-${sectionIndex}`}
                        className="h-2 rounded-lg border-2 border-dashed border-transparent transition-all duration-200 hover:h-16 hover:border-stone-400 hover:bg-stone-100 dark:hover:border-stone-500 dark:hover:bg-stone-800"
                      >
                        {(isOver: boolean) => (
                          <div
                            className={cn(
                              'flex h-full items-center justify-center text-sm font-medium text-stone-600 transition-opacity duration-200 dark:text-stone-400',
                              isOver || undefined
                                ? 'opacity-100'
                                : 'opacity-0 hover:opacity-100'
                            )}
                          >
                            Drop here to reorder sections
                          </div>
                        )}
                      </Droppable>
                    )}

                    {/* Draggable Section Content */}
                    <Sortable
                      id={`section-${section.id}`}
                      preview={sectionDragPreview}
                      className={cn(
                        'group cursor-grab rounded-lg border p-4 transition-all',
                        'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md',
                        'dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600'
                      )}
                    >
                      <div className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical
                              className={cn(
                                'h-4 w-4 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100',
                                'dark:text-stone-500'
                              )}
                            />
                            <h3
                              className={cn(
                                'text-sm font-medium',
                                'text-stone-600 dark:text-stone-400'
                              )}
                            >
                              Section {sectionIndex + 1} • {section.layout}
                            </h3>
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              deleteSection(section.id);
                            }}
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded p-0 text-red-500 transition-colors',
                              'hover:bg-red-100 dark:hover:bg-red-900/50'
                            )}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'grid gap-4',
                          section.layout === 'single-column' && 'grid-cols-1',
                          section.layout === 'two-column' && 'grid-cols-2',
                          section.layout === 'three-column' && 'grid-cols-3'
                        )}
                      >
                        {section.columns.map((column, columnIndex) => {
                          const columnItems = column.map(comp => comp.id);
                          return (
                            <SortableContainer
                              key={`${section.id}-${columnIndex}`}
                              id={`section-${section.id}-${columnIndex}`}
                              items={columnItems}
                              className={cn(
                                'min-h-24 rounded-md border-2 border-dashed p-3 transition-all duration-200',
                                'border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100',
                                'dark:border-stone-600 dark:bg-stone-700/50 dark:hover:border-stone-500 dark:hover:bg-stone-600/50'
                              )}
                            >
                              {column.length === 0 && (
                                <div
                                  className={cn(
                                    'flex h-16 items-center justify-center text-sm',
                                    'text-stone-500 dark:text-stone-400'
                                  )}
                                >
                                  Drop components here
                                </div>
                              )}

                              {column.map(component => {
                                // Use simplified drag preview for better drag experience
                                const dragPreview = (
                                  <DragPreviewRenderer component={component} />
                                );

                                return (
                                  <Sortable
                                    key={component.id}
                                    id={component.id}
                                    preview={dragPreview}
                                    className={cn(
                                      'mb-3 cursor-pointer rounded-lg border p-3 transition-all',
                                      selectedComponentId === component.id
                                        ? 'border-stone-500 bg-stone-100 dark:border-stone-400 dark:bg-stone-700'
                                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-500 dark:hover:bg-stone-700'
                                    )}
                                    onClick={() =>
                                      handleComponentClick(component.id)
                                    }
                                    onDoubleClick={() =>
                                      handleDoubleClick(component.id)
                                    }
                                    onContextMenu={e =>
                                      handleContextMenu(e, component.id)
                                    }
                                    data-component-id={component.id}
                                  >
                                    {editingComponent?.componentId ===
                                    component.id ? (
                                      <div
                                        className="space-y-2"
                                        onClick={e => {
                                          // Prevent event bubbling to parent Sortable component
                                          e.stopPropagation();
                                        }}
                                        onMouseDown={e => {
                                          // Prevent event bubbling to parent Sortable component
                                          e.stopPropagation();
                                        }}
                                      >
                                        <textarea
                                          value={editingComponent.content}
                                          onChange={e =>
                                            handleEditInputChange(
                                              e.target.value
                                            )
                                          }
                                          onClick={e => {
                                            // Prevent event bubbling when clicking inside textarea
                                            e.stopPropagation();
                                          }}
                                          onMouseDown={e => {
                                            // Prevent event bubbling when mouse down in textarea
                                            e.stopPropagation();
                                          }}
                                          onKeyDown={e => {
                                            if (
                                              e.key === 'Enter' &&
                                              e.ctrlKey
                                            ) {
                                              e.preventDefault();
                                              handleSaveEdit();
                                            }
                                            if (e.key === 'Escape') {
                                              e.preventDefault();
                                              setEditingComponent(null);
                                            }
                                            e.stopPropagation(); // Prevent parent keyboard handlers
                                          }}
                                          className="resize-vertical min-h-[60px] w-full rounded border p-2 text-sm focus:ring-2 focus:ring-stone-500 focus:outline-none"
                                          placeholder="Enter content..."
                                          autoFocus
                                          onBlur={e => {
                                            // Only auto-save if focus is truly leaving the editing area
                                            // Check if focus is moving to another element outside the editing container
                                            const relatedTarget =
                                              e.relatedTarget as HTMLElement;
                                            const editContainer =
                                              e.currentTarget.closest(
                                                '.space-y-2'
                                              );

                                            if (
                                              !relatedTarget ||
                                              !editContainer?.contains(
                                                relatedTarget
                                              )
                                            ) {
                                              // Auto-save on blur if there are changes and focus truly left
                                              setTimeout(() => {
                                                if (editingComponent) {
                                                  handleSaveEdit();
                                                }
                                              }, 100);
                                            }
                                          }}
                                        />
                                        <div className="text-muted-foreground flex gap-2 text-xs">
                                          <span>
                                            Ctrl+Enter to save • Escape to
                                            cancel
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <ComponentRenderer
                                        component={component}
                                      />
                                    )}
                                  </Sortable>
                                );
                              })}
                            </SortableContainer>
                          );
                        })}
                      </div>
                    </Sortable>
                  </div>
                );
              })}

              {/* Final Drop Zone */}
              <Droppable
                id="section-drop-final"
                className="h-8 rounded-lg border-2 border-dashed border-transparent transition-all duration-200 hover:h-16 hover:border-stone-400 hover:bg-stone-100 dark:hover:border-stone-500 dark:hover:bg-stone-800"
              >
                {(isOver: boolean) => (
                  <div
                    className={cn(
                      'flex h-full items-center justify-center text-sm font-medium text-stone-600 transition-opacity duration-200 dark:text-stone-400',
                      isOver || undefined
                        ? 'opacity-100'
                        : 'opacity-0 hover:opacity-100'
                    )}
                  >
                    Drop here to create new section
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && contextMenuComponent && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          component={contextMenuComponent}
          onPropsChange={handleContextMenuPropsChange}
          onDelete={handleDeleteComponent}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Translation Dialog */}
      <ContentTranslateDialog
        open={showTranslateDialog}
        onOpenChange={setShowTranslateDialog}
        sourceLocale={currentLocale}
        currentContent={currentTranslation}
        section={section}
        supportedLocales={supportedLocales}
        onTranslationComplete={() => {
          setShowTranslateDialog(false);
          // Reload translations from server after successful translation
          onReloadTranslations?.();
        }}
      />
    </DndContextWrapper>
  );
}
