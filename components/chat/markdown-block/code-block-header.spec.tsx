import { render, screen } from '@testing-library/react';

import { CodeBlockHeader } from './code-block-header';

// Mock the child components
jest.mock('./copy-button', () => ({
  CopyButton: ({ content, tooltipPlacement }: any) => (
    <button
      data-testid="copy-button"
      data-content={content}
      data-tooltip={tooltipPlacement}
    >
      Copy
    </button>
  ),
}));

jest.mock('./export-button', () => ({
  ExportButton: ({ content, language, tooltipPlacement }: any) => (
    <button
      data-testid="export-button"
      data-content={content}
      data-language={language}
      data-tooltip={tooltipPlacement}
    >
      Export
    </button>
  ),
}));

describe('CodeBlockHeader', () => {
  describe('Rendering', () => {
    it('should not render when language is null', () => {
      const { container } = render(<CodeBlockHeader language={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render header with language when language is provided', () => {
      const { container } = render(<CodeBlockHeader language="javascript" />);

      expect(screen.getByText('Javascript')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument(); // CodeIcon as SVG
    });

    it('should capitalize language name correctly', () => {
      render(<CodeBlockHeader language="typescript" />);
      expect(screen.getByText('Typescript')).toBeInTheDocument();
    });

    it('should handle single character languages', () => {
      render(<CodeBlockHeader language="c" />);
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should not render when language is empty string', () => {
      const { container } = render(<CodeBlockHeader language="" />);
      // Empty string is falsy, so component should not render
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Action Buttons', () => {
    it('should not render action buttons when codeContent is not provided', () => {
      render(<CodeBlockHeader language="javascript" />);

      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });

    it('should render action buttons when codeContent is provided', () => {
      const codeContent = 'console.log("Hello World");';
      render(
        <CodeBlockHeader language="javascript" codeContent={codeContent} />
      );

      const copyButton = screen.getByTestId('copy-button');
      const exportButton = screen.getByTestId('export-button');

      expect(copyButton).toBeInTheDocument();
      expect(exportButton).toBeInTheDocument();

      expect(copyButton).toHaveAttribute('data-content', codeContent);
      expect(copyButton).toHaveAttribute('data-tooltip', 'bottom');

      expect(exportButton).toHaveAttribute('data-content', codeContent);
      expect(exportButton).toHaveAttribute('data-language', 'javascript');
      expect(exportButton).toHaveAttribute('data-tooltip', 'bottom');
    });

    it('should not render action buttons with empty codeContent', () => {
      render(<CodeBlockHeader language="javascript" codeContent="" />);

      // Empty string is falsy, so buttons should not render
      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes and Layout', () => {
    it('should apply correct base CSS classes', () => {
      const { container } = render(<CodeBlockHeader language="javascript" />);
      const header = container.firstChild as HTMLElement;

      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('transform-gpu');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('justify-between');
      expect(header).toHaveClass('rounded-t-lg');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('px-3');
      expect(header).toHaveClass('py-1');
      expect(header).toHaveClass('min-w-0'); // For text overflow fix
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <CodeBlockHeader language="javascript" className="custom-class" />
      );
      const header = container.firstChild as HTMLElement;

      expect(header).toHaveClass('custom-class');
    });

    it('should apply text truncation classes to language span', () => {
      render(<CodeBlockHeader language="javascript" />);
      const languageSpan = screen.getByText('Javascript');

      expect(languageSpan).toHaveClass('text-xs');
      expect(languageSpan).toHaveClass('font-medium');
      expect(languageSpan).toHaveClass('tracking-wide');
      expect(languageSpan).toHaveClass('select-none');
      expect(languageSpan).toHaveClass('truncate'); // For text overflow fix
    });

    it('should apply flex layout classes for overflow prevention', () => {
      const { container } = render(
        <CodeBlockHeader language="javascript" codeContent="test" />
      );
      const header = container.firstChild as HTMLElement;

      // Left section should have flex-1 and min-w-0 for text truncation
      const leftSection = header.querySelector('.flex-1');
      expect(leftSection).toHaveClass('flex-1');
      expect(leftSection).toHaveClass('min-w-0');

      // Right section should have flex-shrink-0 to prevent shrinking
      const rightSection = header.querySelector('.flex-shrink-0');
      expect(rightSection).toBeInTheDocument();
    });
  });

  describe('CSS Variables and Styling', () => {
    it('should apply correct CSS custom properties', () => {
      const { container } = render(<CodeBlockHeader language="javascript" />);
      const header = container.firstChild as HTMLElement;

      expect(header.style.backgroundColor).toBe('var(--md-code-header-bg)');
      expect(header.style.borderColor).toBe('var(--md-code-header-border)');
      expect(header.style.color).toBe('var(--md-code-header-text)');
    });
  });

  describe('Text Overflow Handling', () => {
    it('should handle very long language names', () => {
      const longLanguage = 'supercalifragilisticexpialidocious-script-language';
      render(<CodeBlockHeader language={longLanguage} codeContent="test" />);

      // Should still render the language text
      expect(
        screen.getByText('Supercalifragilisticexpialidocious-script-language')
      ).toBeInTheDocument();

      // Action buttons should still be visible
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('should maintain button visibility with long content', () => {
      const longCode = 'a'.repeat(1000); // Very long code content
      render(
        <CodeBlockHeader
          language="verylonglanguagename"
          codeContent={longCode}
        />
      );

      // Buttons should still be rendered and accessible
      const copyButton = screen.getByTestId('copy-button');
      const exportButton = screen.getByTestId('export-button');

      expect(copyButton).toBeInTheDocument();
      expect(exportButton).toBeInTheDocument();
      expect(copyButton).toHaveAttribute('data-content', longCode);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<CodeBlockHeader language="javascript" codeContent="test" />);

      // Should have a div container (not interactive element)
      const { container } = render(<CodeBlockHeader language="javascript" />);
      expect((container.firstChild as Element)?.tagName.toLowerCase()).toBe(
        'div'
      );
    });

    it('should make language text non-selectable', () => {
      render(<CodeBlockHeader language="javascript" />);
      const languageSpan = screen.getByText('Javascript');

      expect(languageSpan).toHaveClass('select-none');
    });
  });
});
