# Development Tools Guide

This document provides guidelines for contributors on using development tools and maintaining code quality.

## Tool Overview

| Tool           | Purpose             | Automatic Run             |
| -------------- | ------------------- | ------------------------- |
| **Prettier**   | Code formatting     | ✅ On save and pre-commit |
| **ESLint**     | Code quality checks | ✅ On pre-commit          |
| **Husky**      | Git hook management | ✅ Automatic              |
| **TypeScript** | Type checking       | Manual                    |

## Available Commands

### Code Formatting

```bash
# Format the entire project\pnpm run format

# Check if formatting is needed
pnpm run format:check
```

### Code Quality

```bash
# TypeScript type checking
pnpm run type-check

# Build the project (includes type checking)
pnpm run build
```

## Automated Workflow

### Development Environment (VSCode)

- **On save**: Prettier automatically formats the current file
- **Live**: ESLint displays warnings and errors in real time

### Git Commit

- **Pre-commit hook**: Automatically runs lint-staged
- **Staged files only**: Formats only staged files
- **Auto-fix**: ESLint automatically fixes fixable issues

### CI/CD Recommendations

```bash
pnpm run format:check    # Verify formatting
pnpm run lint            # Run code quality checks
pnpm run type-check      # Perform type checking
pnpm run build           # Build the project
```

## Best Practices

### Developer Setup

1. **Install VSCode extensions**:
   - Prettier – Code formatter
   - ESLint
   - Tailwind CSS IntelliSense

2. **Use project commands**:
   - Run `pnpm run type-check` before committing
   - Enable VSCode to auto-format code on save
   - Leverage automation tools for consistency

### Team Collaboration

- Ensure all developers share the same configuration
- Focus code reviews on logic rather than formatting
- Rely on automated formatting to maintain consistency

## Troubleshooting

### Prettier Not Working in VSCode

1. Install the **Prettier – Code formatter** extension
2. Verify your `.vscode/settings.json` configuration
3. Restart VSCode

### Pre-commit Hooks Failing

```bash
# Identify issues
pnpm run format:check
pnpm run lint

# Retry commit
git commit -m "your message"
```

### Formatting Conflicts

```bash
# Stash current changes
git stash

# Format all files
pnpm run format

# Reapply stashed changes
git stash pop

# Resolve any merge conflicts
```

## Supported File Types

| File Type | Prettier | ESLint | Auto-format |
| --------- | -------- | ------ | ----------- |
| `.ts`     | ✅       | ✅     | ✅          |
| `.tsx`    | ✅       | ✅     | ✅          |
| `.js`     | ✅       | ✅     | ✅          |
| `.jsx`    | ✅       | ✅     | ✅          |
| `.json`   | ✅       | ❌     | ✅          |
| `.md`     | ✅       | ❌     | ✅          |
| `.css`    | ✅       | ❌     | ✅          |

## Configuration Files

- **`.prettierrc.json`** – Prettier formatting rules
- **`.prettierignore`** – Files and directories to ignore
- **`.husky/pre-commit`** – Git pre-commit hook scripts
- **`package.json`** – lint-staged configuration
- **`.vscode/settings.json`** – VSCode workspace settings

Adhering to these tools and workflows ensures consistent code quality across the project.
