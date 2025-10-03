import { availableComponents } from '@components/admin/content/component-palette';
import { arrayMove } from '@components/admin/content/dnd-components';
import { DragEndEvent } from '@dnd-kit/core';
import {
  ComponentInstance,
  PageContent,
  createDefaultSection,
  generateUniqueId,
} from '@lib/types/about-page-components';
import { clonePageContent } from '@lib/utils/performance';
import { create } from 'zustand';

/**
 * Maximum number of undo/redo states to keep in memory
 */
const MAX_UNDO_STEPS = 20;

/**
 * About Editor State Interface
 *
 * Manages the state of the dynamic about page editor
 */
interface AboutEditorState {
  // Current page content being edited
  pageContent: PageContent | null;
  // ID of the currently selected component
  selectedComponentId: string | null;
  // Undo stack for history management
  undoStack: PageContent[];
  // Redo stack for history management
  redoStack: PageContent[];
  // Whether there are unsaved changes
  isDirty: boolean;
  // Whether the editor is loading
  isLoading: boolean;
  // Current language being edited
  currentLanguage: string;

  // Actions
  // Set the entire page content
  setPageContent: (content: PageContent) => void;
  // Set the currently selected component
  setSelectedComponent: (id: string | null) => void;
  // Update properties of a specific component
  updateComponentProps: (id: string, props: Record<string, unknown>) => void;
  // Add a new component to a specific section and column
  addComponent: (
    sectionId: string,
    columnIndex: number,
    component: ComponentInstance
  ) => void;
  // Delete a component by ID
  deleteComponent: (id: string) => void;
  // Handle drag and drop operations - returns true if drop was successful
  handleDragEnd: (event: DragEndEvent) => boolean;
  // Create a new section
  addSection: (
    layout?: 'single-column' | 'two-column' | 'three-column'
  ) => void;
  // Delete a section by ID
  deleteSection: (sectionId: string) => void;
  // Undo last change
  undo: () => void;
  // Redo last undone change
  redo: () => void;
  // Set loading state
  setLoading: (loading: boolean) => void;
  // Set dirty state
  setDirty: (dirty: boolean) => void;
  // Set current language
  setCurrentLanguage: (language: string) => void;
  // Reset editor to initial state
  reset: () => void;
}

/**
 * About Editor Store
 *
 * Zustand store for managing the dynamic about page editor state
 */
export const useAboutEditorStore = create<AboutEditorState>((set, get) => ({
  // Initial state
  pageContent: null,
  selectedComponentId: null,
  undoStack: [],
  redoStack: [],
  isDirty: false,
  isLoading: false,
  currentLanguage: 'en-US',

  // Set page content
  setPageContent: (content: PageContent) => {
    set({
      pageContent: content,
      selectedComponentId: null,
      isDirty: false,
    });
  },

  // Set selected component
  setSelectedComponent: (id: string | null) => {
    set({ selectedComponentId: id });
  },

  // Update component properties
  updateComponentProps: (id: string, props: Record<string, unknown>) => {
    const { pageContent } = get();
    if (!pageContent) return;

    // Create deep copy of page content
    const newPageContent = clonePageContent(pageContent);

    // Find and update the component
    let updated = false;
    for (const section of newPageContent.sections) {
      for (const column of section.columns) {
        const componentIndex = column.findIndex(comp => comp.id === id);
        if (componentIndex !== -1) {
          column[componentIndex].props = {
            ...column[componentIndex].props,
            ...props,
          };
          updated = true;
          break;
        }
      }
      if (updated) break;
    }

    if (updated) {
      // Save current state to undo stack before updating
      set(state => ({
        pageContent: newPageContent,
        undoStack: [...state.undoStack, pageContent].slice(-MAX_UNDO_STEPS), // Keep last MAX_UNDO_STEPS states
        redoStack: [], // Clear redo stack on new change
        isDirty: true,
      }));
    }
  },

  // Add component
  addComponent: (
    sectionId: string,
    columnIndex: number,
    component: ComponentInstance
  ) => {
    const state = get();
    if (!state.pageContent) return;

    const newPageContent = clonePageContent(state.pageContent);

    const section = newPageContent.sections.find(s => s.id === sectionId);
    if (section && section.columns[columnIndex]) {
      section.columns[columnIndex].push(component);

      // Save to undo stack
      set(state => ({
        pageContent: newPageContent,
        undoStack: [...state.undoStack, state.pageContent!].slice(
          -MAX_UNDO_STEPS
        ),
        redoStack: [],
        isDirty: true,
      }));
    }
  },

  // Delete component
  deleteComponent: (id: string) => {
    const state = get();
    if (!state.pageContent) return;

    const newPageContent = clonePageContent(state.pageContent);
    let deleted = false;

    // Find and remove the component
    for (const section of newPageContent.sections) {
      for (const column of section.columns) {
        const componentIndex = column.findIndex(comp => comp.id === id);
        if (componentIndex !== -1) {
          column.splice(componentIndex, 1);
          deleted = true;
          break;
        }
      }
      if (deleted) break;
    }

    // Clean up empty sections
    const cleanedSections = newPageContent.sections.filter(section =>
      section.columns.some(column => column.length > 0)
    );

    if (deleted) {
      set(state => ({
        pageContent: { ...newPageContent, sections: cleanedSections },
        undoStack: [...state.undoStack, state.pageContent!].slice(
          -MAX_UNDO_STEPS
        ),
        redoStack: [],
        selectedComponentId:
          state.selectedComponentId === id ? null : state.selectedComponentId,
        isDirty: true,
      }));
    }
  },

  // Handle drag and drop (optimized with performance considerations)
  handleDragEnd: (event: DragEndEvent): boolean => {
    const { active, over } = event;

    if (!over) {
      console.log('❌ NO DROP TARGET - returning false');
      return false;
    }

    const state = get();
    if (!state.pageContent) {
      console.log('❌ NO PAGE CONTENT - returning false');
      return false;
    }

    // More efficient cloning - only clone what we need to modify
    const newPageContent: PageContent = {
      ...state.pageContent,
      sections: state.pageContent.sections.map(section => ({
        ...section,
        columns: section.columns.map(column => [...column]),
      })),
    };

    const activeId = String(active.id);
    const overId = String(over.id);

    console.log('Drag End - Active:', activeId, 'Over:', overId);
    console.log('Active data:', active.data.current);
    console.log('Over data:', over.data.current);

    // Handle section reordering
    if (activeId.startsWith('section-')) {
      const activeSectionId = activeId.replace('section-', '');

      // Find the active section
      const activeSectionIndex = newPageContent.sections.findIndex(
        section => section.id === activeSectionId
      );

      if (activeSectionIndex === -1) {
        console.log('❌ Active section not found:', activeSectionId);
        return false;
      }

      let targetIndex = -1;

      // Handle dropping on section drop zones
      if (overId.startsWith('section-drop-')) {
        if (overId === 'section-drop-final') {
          // Drop at the end
          targetIndex = newPageContent.sections.length;
        } else {
          // Drop before a specific section
          const dropIndex = parseInt(overId.replace('section-drop-', ''));
          targetIndex = dropIndex;
        }
      } else {
        console.log('❌ Invalid drop target for section:', overId);
        return false;
      }

      // Ensure valid target index (allow insertion at the end)
      if (targetIndex < 0 || targetIndex > newPageContent.sections.length) {
        console.log(
          '❌ Invalid target index for section reordering:',
          targetIndex
        );
        return false;
      }

      // Adjust target index if moving forward
      let finalTargetIndex = targetIndex;
      if (activeSectionIndex < targetIndex) {
        finalTargetIndex = targetIndex - 1;
      }

      // Don't move if dropping on the same position
      if (activeSectionIndex === finalTargetIndex) {
        console.log('✅ Section dropped on same position, no change needed');
        return true;
      }

      console.log('🔄 SECTION REORDER:', {
        activeSectionId,
        activeSectionIndex,
        targetIndex,
        finalTargetIndex,
        totalSections: newPageContent.sections.length,
      });

      // Remove the section from its current position
      const [movedSection] = newPageContent.sections.splice(
        activeSectionIndex,
        1
      );

      // Insert the section at the new position
      newPageContent.sections.splice(finalTargetIndex, 0, movedSection);

      // Update the state
      set({
        pageContent: newPageContent,
        isDirty: true,
      });

      console.log('✅ Section reordered successfully');
      return true;
    }

    // Handle dragging from component palette
    if (activeId.startsWith('palette-')) {
      const componentType = activeId.replace('palette-', '');
      const componentDef = availableComponents.find(
        comp => comp.type === componentType
      );
      if (!componentDef) {
        console.log('❌ Component definition not found for:', componentType);
        return false;
      }

      console.log('🎨 PALETTE DROP DETECTED:', {
        componentType,
        overId,
        overData: over.data.current,
      });

      // Parse destination - handle direct drops on containers
      let targetContainerId = overId;
      let insertIndex = -1; // -1 means append to end

      // Handle dropping on section drop zones (creates new section)
      if (overId.startsWith('section-drop-')) {
        console.log('Dropping on section drop zone:', overId);

        // Create a new section
        const newSection = createDefaultSection('single-column');
        const newComponent: ComponentInstance = {
          id: generateUniqueId('comp'),
          type: componentDef.type,
          props: { ...componentDef.defaultProps },
        };

        // Add component to the new section
        newSection.columns[0].push(newComponent);

        // Handle different drop zones
        if (overId === 'section-drop-final') {
          // Add to the end
          newPageContent.sections.push(newSection);
        } else {
          // Parse the drop zone index to insert at the right position
          const dropIndex = parseInt(overId.replace('section-drop-', ''));
          newPageContent.sections.splice(dropIndex, 0, newSection);
        }

        console.log('New section created with component:', newComponent.id);

        // Save changes and return success
        set(state => ({
          pageContent: newPageContent,
          undoStack: [...state.undoStack, state.pageContent!].slice(
            -MAX_UNDO_STEPS
          ),
          redoStack: [],
          isDirty: true,
        }));

        console.log('✅ SECTION DROP SUCCESSFUL');
        return true;
      }

      // Check if we're dropping directly on a container
      if (overId.startsWith('section-')) {
        targetContainerId = overId;
        console.log('Dropping on container:', targetContainerId);
      } else {
        // Find which container this component belongs to and get insert position
        for (const section of newPageContent.sections) {
          for (
            let colIndex = 0;
            colIndex < section.columns.length;
            colIndex++
          ) {
            const componentIndex = section.columns[colIndex].findIndex(
              comp => comp.id === overId
            );
            if (componentIndex !== -1) {
              targetContainerId = `section-${section.id}-${colIndex}`;
              insertIndex = componentIndex; // Insert before this component
              console.log(
                'Dropping before component:',
                overId,
                'at index:',
                insertIndex
              );
              break;
            }
          }
        }
      }

      const targetParts = targetContainerId.split('-');
      // Format is: section-{sectionId}-{columnIndex}
      // But sectionId might contain hyphens, so we need to handle this carefully
      const type = targetParts[0];
      const columnIndex = targetParts[targetParts.length - 1];
      const sectionId = targetParts.slice(1, -1).join('-'); // Everything between type and columnIndex

      console.log('🔍 PARSING TARGET CONTAINER:', {
        targetContainerId,
        targetParts,
        parsed: { type, sectionId, columnIndex },
        insertIndex,
      });

      if (type === 'section' && sectionId && columnIndex !== undefined) {
        const section = newPageContent.sections.find(s => s.id === sectionId);

        console.log('🎯 FOUND SECTION:', {
          section: section?.id,
          hasColumn: section?.columns[parseInt(columnIndex)] !== undefined,
          columnLength: section?.columns[parseInt(columnIndex)]?.length,
        });

        if (section && section.columns[parseInt(columnIndex)]) {
          const newComponent: ComponentInstance = {
            id: generateUniqueId('comp'),
            type: componentDef.type,
            props: { ...componentDef.defaultProps },
          };

          // Insert at the specified position or append to end
          if (insertIndex === -1) {
            section.columns[parseInt(columnIndex)].push(newComponent);
          } else {
            section.columns[parseInt(columnIndex)].splice(
              insertIndex,
              0,
              newComponent
            );
          }

          console.log('✅ COMPONENT ADDED SUCCESSFULLY:', {
            componentId: newComponent.id,
            sectionId,
            columnIndex,
            newColumnLength: section.columns[parseInt(columnIndex)].length,
          });

          // Save changes and return success for component drop
          const cleanedSections = newPageContent.sections.filter(section =>
            section.columns.some(column => column.length > 0)
          );

          set(state => ({
            pageContent: { ...newPageContent, sections: cleanedSections },
            undoStack: [...state.undoStack, state.pageContent!].slice(
              -MAX_UNDO_STEPS
            ),
            redoStack: [],
            isDirty: true,
          }));

          return true;
        } else {
          console.log('❌ FAILED TO FIND SECTION OR COLUMN:', {
            sectionFound: !!section,
            columnExists: !!section?.columns[parseInt(columnIndex)],
          });
          return false;
        }
      } else {
        console.log('❌ INVALID TARGET CONTAINER FORMAT:', {
          type,
          sectionId,
          columnIndex,
          targetContainerId,
        });
        return false;
      }
    } else {
      // Handle dropping existing components on section drop zones (creates new section)
      if (overId.startsWith('section-drop-')) {
        console.log('🔄 EXISTING COMPONENT DROP ON SECTION-DROP:', overId);

        // Find the source component
        let sourceLocation = null;
        for (
          let sectionIndex = 0;
          sectionIndex < newPageContent.sections.length;
          sectionIndex++
        ) {
          const section = newPageContent.sections[sectionIndex];
          for (
            let columnIndex = 0;
            columnIndex < section.columns.length;
            columnIndex++
          ) {
            const column = section.columns[columnIndex];
            const componentIndex = column.findIndex(
              comp => comp.id === activeId
            );
            if (componentIndex !== -1) {
              sourceLocation = {
                sectionIndex,
                columnIndex,
                componentIndex,
                section,
                column,
                component: column[componentIndex],
              };
              break;
            }
          }
          if (sourceLocation) break;
        }

        if (!sourceLocation) {
          console.log('❌ SOURCE COMPONENT NOT FOUND:', activeId);
          return false;
        }

        // Remove component from source
        const [movedComponent] = sourceLocation.column.splice(
          sourceLocation.componentIndex,
          1
        );

        // Create a new section with the moved component
        const newSection = createDefaultSection('single-column');
        newSection.columns[0].push(movedComponent);

        // Handle different drop zones
        if (overId === 'section-drop-final') {
          // Add to the end
          newPageContent.sections.push(newSection);
        } else {
          // Parse the drop zone index to insert at the right position
          const dropIndex = parseInt(overId.replace('section-drop-', ''));
          newPageContent.sections.splice(dropIndex, 0, newSection);
        }

        console.log('✅ NEW SECTION CREATED WITH EXISTING COMPONENT:', {
          componentId: movedComponent.id,
          fromSection: sourceLocation.section.id,
          fromColumn: sourceLocation.columnIndex,
          newSectionId: newSection.id,
        });

        // Clean up empty sections
        const cleanedSections = newPageContent.sections.filter(section =>
          section.columns.some(column => column.length > 0)
        );

        // Save changes and return success
        set(state => ({
          pageContent: { ...newPageContent, sections: cleanedSections },
          undoStack: [...state.undoStack, state.pageContent!].slice(
            -MAX_UNDO_STEPS
          ),
          redoStack: [],
          isDirty: true,
        }));

        console.log('✅ EXISTING COMPONENT SECTION DROP SUCCESSFUL');
        return true;
      }

      // Handle moving existing components within or between containers
      const activeContainer = active.data.current?.sortable?.containerId;
      const overContainer = over.data.current?.sortable?.containerId || overId;

      console.log('🔄 COMPONENT REORDERING:', {
        activeId,
        overId,
        activeContainer,
        overContainer,
        activeData: active.data.current,
        overData: over.data.current,
      });

      if (activeContainer && overContainer) {
        if (activeContainer === overContainer) {
          // Reordering within the same container
          console.log('📋 SAME CONTAINER REORDER - ORIGINAL:', {
            activeContainer,
            overContainer,
          });

          // DndKit generates container IDs automatically, need to map them back to our section IDs
          // Find the section and column based on the component positions
          let targetSectionId = null;
          let targetColumnIndex = null;

          // Search through all sections to find where these components are located
          for (const section of newPageContent.sections) {
            for (
              let colIndex = 0;
              colIndex < section.columns.length;
              colIndex++
            ) {
              const column = section.columns[colIndex];
              if (
                column.some(comp => comp.id === activeId) &&
                column.some(comp => comp.id === overId)
              ) {
                targetSectionId = section.id;
                targetColumnIndex = colIndex;
                break;
              }
            }
            if (targetSectionId) break;
          }

          console.log('📋 FOUND TARGET LOCATION:', {
            targetSectionId,
            targetColumnIndex,
          });

          if (targetSectionId && targetColumnIndex !== null) {
            const section = newPageContent.sections.find(
              s => s.id === targetSectionId
            );
            if (section && section.columns[targetColumnIndex]) {
              const column = section.columns[targetColumnIndex];
              const activeIndex = column.findIndex(
                comp => comp.id === activeId
              );
              const overIndex = column.findIndex(comp => comp.id === overId);

              console.log('🎯 REORDER INDICES:', {
                activeIndex,
                overIndex,
                columnLength: column.length,
                targetSectionId,
                targetColumnIndex,
              });

              if (
                activeIndex !== -1 &&
                overIndex !== -1 &&
                activeIndex !== overIndex
              ) {
                // Use arrayMove to reorder within the same container
                const originalColumn = [...column];
                section.columns[targetColumnIndex] = arrayMove(
                  column,
                  activeIndex,
                  overIndex
                );

                console.log('✅ REORDER APPLIED:', {
                  before: originalColumn.map(c => c.id),
                  after: section.columns[targetColumnIndex].map(c => c.id),
                });

                // Save changes and return success for reordering
                const cleanedSections = newPageContent.sections.filter(
                  section => section.columns.some(column => column.length > 0)
                );

                set(state => ({
                  pageContent: { ...newPageContent, sections: cleanedSections },
                  undoStack: [...state.undoStack, state.pageContent!].slice(
                    -20
                  ),
                  redoStack: [],
                  isDirty: true,
                }));

                return true;
              } else {
                console.log('❌ REORDER FAILED - Invalid indices');
                return false;
              }
            } else {
              console.log('❌ REORDER FAILED - Section or column not found');
              return false;
            }
          } else {
            console.log('❌ REORDER FAILED - Target location not found');
            return false;
          }
        } else {
          // Moving between containers - find components by their actual locations
          console.log('🔄 CROSS-CONTAINER MOVE DETECTED:', {
            activeId,
            overId,
            activeContainer,
            overContainer,
          });

          // Helper function to find component location
          const findComponentLocation = (componentId: string) => {
            for (
              let sectionIndex = 0;
              sectionIndex < newPageContent.sections.length;
              sectionIndex++
            ) {
              const section = newPageContent.sections[sectionIndex];
              for (
                let columnIndex = 0;
                columnIndex < section.columns.length;
                columnIndex++
              ) {
                const column = section.columns[columnIndex];
                const componentIndex = column.findIndex(
                  comp => comp.id === componentId
                );
                if (componentIndex !== -1) {
                  return {
                    sectionIndex,
                    columnIndex,
                    componentIndex,
                    section,
                    column,
                    component: column[componentIndex],
                  };
                }
              }
            }
            return null;
          };

          const sourceLocation = findComponentLocation(activeId);

          // Check if dropping directly on an empty container (overId is container ID)
          if (overId.startsWith('section-')) {
            const targetParts = overId.split('-');
            const sectionId = targetParts.slice(1, -1).join('-');
            const columnIndex = targetParts[targetParts.length - 1];

            console.log('📦 DROPPING ON EMPTY CONTAINER:', {
              overId,
              sectionId,
              columnIndex,
              sourceLocation: sourceLocation
                ? sourceLocation.section.id
                : 'not found',
            });

            if (sourceLocation && sectionId && columnIndex !== undefined) {
              const targetSection = newPageContent.sections.find(
                s => s.id === sectionId
              );
              if (
                targetSection &&
                targetSection.columns[parseInt(columnIndex)]
              ) {
                // Remove component from source
                const [removed] = sourceLocation.column.splice(
                  sourceLocation.componentIndex,
                  1
                );

                // Add to target empty container
                targetSection.columns[parseInt(columnIndex)].push(removed);

                console.log('✅ MOVE TO EMPTY CONTAINER SUCCESSFUL:', {
                  movedComponent: removed.id,
                  fromSection: sourceLocation.section.id,
                  fromColumn: sourceLocation.columnIndex,
                  toSection: targetSection.id,
                  toColumn: parseInt(columnIndex),
                });

                // Save changes and return success
                const cleanedSections = newPageContent.sections.filter(
                  section => section.columns.some(column => column.length > 0)
                );

                set(state => ({
                  pageContent: {
                    ...newPageContent,
                    sections: cleanedSections,
                  },
                  undoStack: [...state.undoStack, state.pageContent!].slice(
                    -20
                  ),
                  redoStack: [],
                  isDirty: true,
                }));

                return true;
              }
            }
          } else {
            // Moving to a location with existing components
            const destLocation = findComponentLocation(overId);

            console.log('📍 COMPONENT LOCATIONS:', {
              source: sourceLocation
                ? {
                    sectionId: sourceLocation.section.id,
                    sectionIndex: sourceLocation.sectionIndex,
                    columnIndex: sourceLocation.columnIndex,
                    componentIndex: sourceLocation.componentIndex,
                  }
                : null,
              dest: destLocation
                ? {
                    sectionId: destLocation.section.id,
                    sectionIndex: destLocation.sectionIndex,
                    columnIndex: destLocation.columnIndex,
                    componentIndex: destLocation.componentIndex,
                  }
                : null,
            });

            if (sourceLocation && destLocation) {
              // Remove component from source
              const [removed] = sourceLocation.column.splice(
                sourceLocation.componentIndex,
                1
              );

              // Insert into destination - insert before the target component
              destLocation.column.splice(
                destLocation.componentIndex,
                0,
                removed
              );

              console.log('✅ CROSS-CONTAINER MOVE SUCCESSFUL:', {
                movedComponent: removed.id,
                fromSection: sourceLocation.section.id,
                fromColumn: sourceLocation.columnIndex,
                toSection: destLocation.section.id,
                toColumn: destLocation.columnIndex,
                insertIndex: destLocation.componentIndex,
              });

              // Save changes and return success
              const cleanedSections = newPageContent.sections.filter(section =>
                section.columns.some(column => column.length > 0)
              );

              set(state => ({
                pageContent: {
                  ...newPageContent,
                  sections: cleanedSections,
                },
                undoStack: [...state.undoStack, state.pageContent!].slice(
                  -MAX_UNDO_STEPS
                ),
                redoStack: [],
                isDirty: true,
              }));

              return true;
            }
          }

          console.log(
            '❌ CROSS-CONTAINER MOVE FAILED - Could not find component locations or target container:',
            {
              sourceFound: !!sourceLocation,
              overId,
              activeId,
            }
          );
          return false;
        }
      } else {
        console.log('❌ NO CONTAINERS FOUND - Drag operation failed');
        return false;
      }
    }
  },

  // Add new section
  addSection: (layout = 'single-column') => {
    const { pageContent } = get();
    if (!pageContent) return;

    const newSection = createDefaultSection(layout);
    const newPageContent = {
      ...pageContent,
      sections: [...pageContent.sections, newSection],
    };

    set(state => ({
      pageContent: newPageContent,
      undoStack: [...state.undoStack, pageContent].slice(-MAX_UNDO_STEPS),
      redoStack: [],
      isDirty: true,
    }));
  },

  // Delete section
  deleteSection: (sectionId: string) => {
    const { pageContent } = get();
    if (!pageContent) return;

    const newSections = pageContent.sections.filter(s => s.id !== sectionId);
    const newPageContent = { ...pageContent, sections: newSections };

    set(state => ({
      pageContent: newPageContent,
      undoStack: [...state.undoStack, pageContent].slice(-MAX_UNDO_STEPS),
      redoStack: [],
      isDirty: true,
    }));
  },

  // Undo
  undo: () => {
    const state = get();
    if (state.undoStack.length === 0 || !state.pageContent) return;

    const previousState = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);

    set({
      pageContent: previousState,
      undoStack: newUndoStack,
      redoStack: [state.pageContent, ...state.redoStack].slice(
        0,
        MAX_UNDO_STEPS
      ),
      selectedComponentId: null,
    });
  },

  // Redo
  redo: () => {
    const state = get();
    if (state.redoStack.length === 0 || !state.pageContent) return;

    const nextState = state.redoStack[0];
    const newRedoStack = state.redoStack.slice(1);

    set({
      pageContent: nextState,
      undoStack: [...state.undoStack, state.pageContent].slice(-MAX_UNDO_STEPS),
      redoStack: newRedoStack,
      selectedComponentId: null,
    });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set dirty state
  setDirty: (dirty: boolean) => {
    set({ isDirty: dirty });
  },

  // Set current language
  setCurrentLanguage: (language: string) => {
    set({ currentLanguage: language });
  },

  // Reset editor
  reset: () => {
    set({
      pageContent: null,
      selectedComponentId: null,
      undoStack: [],
      redoStack: [],
      isDirty: false,
      isLoading: false,
      currentLanguage: 'en-US',
    });
  },
}));
