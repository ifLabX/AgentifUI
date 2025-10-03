import type {
  PageContent,
  PageSection,
} from '@lib/types/about-page-components';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface HomeEditorState {
  pageContent: PageContent | null;
  selectedComponentId: string | null;
  undoStack: PageContent[];
  redoStack: PageContent[];
  isDirty: boolean;
  isLoading: boolean;
}

interface HomeEditorActions {
  // Core state management
  setPageContent: (content: PageContent) => void;
  setSelectedComponentId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Undo/Redo functionality
  pushToUndoStack: (content: PageContent) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Section management
  addSection: (section: PageSection, index?: number) => void;
  removeSection: (sectionId: string) => void;
  updateSection: (
    sectionId: string,
    updatedSection: Partial<PageSection>
  ) => void;
  duplicateSection: (sectionId: string) => void;

  // Utility actions
  markAsDirty: () => void;
  markAsClean: () => void;
  reset: () => void;
}

type HomeEditorStore = HomeEditorState & HomeEditorActions;

// Maximum number of undo steps to keep
const MAX_UNDO_STEPS = 50;

export const useHomeEditorStore = create<HomeEditorStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      pageContent: null,
      selectedComponentId: null,
      undoStack: [],
      redoStack: [],
      isDirty: false,
      isLoading: false,

      // Core state management
      setPageContent: content => {
        set({ pageContent: content, isDirty: false });
      },

      setSelectedComponentId: id => {
        set({ selectedComponentId: id });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      // Undo/Redo functionality
      pushToUndoStack: content => {
        const { undoStack } = get();
        const newUndoStack = [content, ...undoStack].slice(0, MAX_UNDO_STEPS);
        set({
          undoStack: newUndoStack,
          redoStack: [], // Clear redo stack when new action is performed
          isDirty: true,
        });
      },

      undo: () => {
        const { pageContent, undoStack, redoStack } = get();
        if (undoStack.length === 0 || !pageContent) return;

        const [previousContent, ...remainingUndoStack] = undoStack;
        const newRedoStack = [pageContent, ...redoStack];

        set({
          pageContent: previousContent,
          undoStack: remainingUndoStack,
          redoStack: newRedoStack,
          isDirty: remainingUndoStack.length > 0,
        });
      },

      redo: () => {
        const { pageContent, undoStack, redoStack } = get();
        if (redoStack.length === 0 || !pageContent) return;

        const [nextContent, ...remainingRedoStack] = redoStack;
        const newUndoStack = [pageContent, ...undoStack];

        set({
          pageContent: nextContent,
          undoStack: newUndoStack,
          redoStack: remainingRedoStack,
          isDirty: true,
        });
      },

      canUndo: () => {
        const { undoStack } = get();
        return undoStack.length > 0;
      },

      canRedo: () => {
        const { redoStack } = get();
        return redoStack.length > 0;
      },

      // Section management
      addSection: (section, index) => {
        const { pageContent, pushToUndoStack } = get();
        if (!pageContent) return;

        // Save current state to undo stack
        pushToUndoStack(pageContent);

        const newSections = [...pageContent.sections];
        const insertIndex = index !== undefined ? index : newSections.length;
        newSections.splice(insertIndex, 0, section);

        const updatedContent: PageContent = {
          ...pageContent,
          sections: newSections,
          metadata: {
            ...pageContent.metadata,
            lastModified: new Date().toISOString(),
          },
        };

        set({ pageContent: updatedContent, isDirty: true });
      },

      removeSection: sectionId => {
        const { pageContent, pushToUndoStack } = get();
        if (!pageContent) return;

        // Save current state to undo stack
        pushToUndoStack(pageContent);

        const newSections = pageContent.sections.filter(
          section => section.id !== sectionId
        );

        const updatedContent: PageContent = {
          ...pageContent,
          sections: newSections,
          metadata: {
            ...pageContent.metadata,
            lastModified: new Date().toISOString(),
          },
        };

        set({ pageContent: updatedContent, isDirty: true });
      },

      updateSection: (sectionId, updatedSection) => {
        const { pageContent, pushToUndoStack } = get();
        if (!pageContent) return;

        // Save current state to undo stack
        pushToUndoStack(pageContent);

        const newSections = pageContent.sections.map(section =>
          section.id === sectionId ? { ...section, ...updatedSection } : section
        );

        const updatedContent: PageContent = {
          ...pageContent,
          sections: newSections,
          metadata: {
            ...pageContent.metadata,
            lastModified: new Date().toISOString(),
          },
        };

        set({ pageContent: updatedContent, isDirty: true });
      },

      duplicateSection: sectionId => {
        const { pageContent, pushToUndoStack } = get();
        if (!pageContent) return;

        const sectionIndex = pageContent.sections.findIndex(
          section => section.id === sectionId
        );
        if (sectionIndex === -1) return;

        // Save current state to undo stack
        pushToUndoStack(pageContent);

        const originalSection = pageContent.sections[sectionIndex];
        const duplicatedSection: PageSection = {
          ...JSON.parse(JSON.stringify(originalSection)), // Deep clone
          id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate new ID
        };

        const newSections = [...pageContent.sections];
        newSections.splice(sectionIndex + 1, 0, duplicatedSection);

        const updatedContent: PageContent = {
          ...pageContent,
          sections: newSections,
          metadata: {
            ...pageContent.metadata,
            lastModified: new Date().toISOString(),
          },
        };

        set({ pageContent: updatedContent, isDirty: true });
      },

      // Utility actions
      markAsDirty: () => {
        set({ isDirty: true });
      },

      markAsClean: () => {
        set({ isDirty: false });
      },

      reset: () => {
        set({
          pageContent: null,
          selectedComponentId: null,
          undoStack: [],
          redoStack: [],
          isDirty: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'home-editor-store',
    }
  )
);
