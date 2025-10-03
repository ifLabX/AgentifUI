/**
 * Avatar utility functions
 * Used to generate user avatar initials and background color
 */

/**
 * Generate initials for user avatar
 * @param name User's full name
 * @returns Initials (up to 2 characters), defaults to 'U' if name is empty
 */
export const getInitials = (name: string): string => {
  if (!name || name.trim() === '') {
    return 'U'; // Default to 'U' (User)
  }

  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate a consistent stone color background for avatar based on username
 * @param name User's name
 * @returns Hex color string
 */
export const getAvatarBgColor = (name: string): string => {
  const colors = [
    '#78716c', // stone-500
    '#57534e', // stone-600
    '#44403c', // stone-700
    '#64748b', // slate-500
    '#475569', // slate-600
    '#6b7280', // gray-500
    '#4b5563', // gray-600
    '#737373', // neutral-500
  ];

  if (!name || name.trim() === '') {
    return colors[0]; // Default to the first color
  }

  let hash = 0;
  const trimmedName = name.trim();

  for (let i = 0; i < trimmedName.length; i++) {
    hash = trimmedName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};
