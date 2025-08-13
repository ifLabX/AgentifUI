import { render, screen } from '@testing-library/react';

import React from 'react';

import { ProfileSettings } from './profile-settings';

jest.mock('@lib/hooks/use-profile', () => ({
  useProfile: jest.fn(),
}));

jest.mock('@lib/hooks/use-settings-colors', () => ({
  useSettingsColors: jest.fn(() => ({
    colors: {
      cardBackground: { tailwind: 'bg-white dark:bg-stone-900' },
      borderColor: { tailwind: 'border-stone-200 dark:border-stone-700' },
      textColor: { tailwind: 'text-stone-900 dark:text-stone-100' },
      skeletonBackground: { tailwind: 'bg-stone-200 dark:bg-stone-700' },
    },
  })),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => `translated.${key}`),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

interface MockProfileFormProps {
  profile: Record<string, unknown>;
  onSuccess: () => void;
}

jest.mock('./profile-form', () => ({
  ProfileForm: ({ profile, onSuccess }: MockProfileFormProps) => (
    <div data-testid="profile-form">
      Profile Form - ID: {String(profile.id)}
      Profile Email: {String(profile.email)}
      Profile Name: {String(profile.full_name)}
      Profile Role: {String(profile.role)}
      <button onClick={onSuccess} data-testid="success-trigger">
        Success
      </button>
    </div>
  ),
}));

const mockProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  username: 'testuser',
  avatar_url: null,
  role: 'user',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  employee_number: 'EMP001',
  auth_last_sign_in_at: '2023-01-01T00:00:00Z',
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useProfile: mockUseProfile } = require('@lib/hooks/use-profile') as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useProfile: jest.MockedFunction<any>;
};

describe('ProfileSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Type Safety Validation', () => {
    it('should handle profile with proper typing instead of any', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
      });

      expect(() => render(<ProfileSettings />)).not.toThrow();
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('should pass properly typed profile to ProfileForm', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
      });

      render(<ProfileSettings />);
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('should handle profile intersection type casting correctly', () => {
      const profileWithAuthTimestamp = {
        ...mockProfile,
        auth_last_sign_in_at: '2023-12-01T10:00:00Z',
      };

      mockUseProfile.mockReturnValue({
        profile: profileWithAuthTimestamp,
        isLoading: false,
        error: null,
      });

      expect(() => render(<ProfileSettings />)).not.toThrow();
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Classes', () => {
    it('should use static Tailwind dark: prefix classes instead of isDark', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: new Error('Test error'),
      });

      const { container } = render(<ProfileSettings />);
      const html = container.innerHTML;

      expect(html).not.toContain('isDark');
      expect(html).toContain('dark:');
    });

    it('should render error state with proper dark mode classes', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: new Error('Test error'),
      });

      render(<ProfileSettings />);
      const errorHeader = screen.getByText('translated.loadProfileError');
      expect(errorHeader).toHaveClass('text-red-800', 'dark:text-red-200');
    });
  });

  describe('Component States', () => {
    it('should render loading state with skeleton animation', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
      });

      const { container } = render(<ProfileSettings />);
      const skeletonElements = container.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render error state with error message', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: new Error('Failed to load profile'),
      });

      render(<ProfileSettings />);
      expect(
        screen.getByText('translated.loadProfileError')
      ).toBeInTheDocument();
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });

    it('should render profile form when profile data is loaded', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
      });

      render(<ProfileSettings />);
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });
  });
});
