# GitHub Actions Workflows

This directory contains all automated CI/CD workflows for the AgentifUI project. These workflows ensure code quality, security, and proper testing for every pull request and deployment.

## 🔄 Available Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:** Pull requests, pushes to main/master
**Purpose:** Primary quality assurance pipeline

**Checks:**

- 📝 Code formatting and linting
- 🔍 TypeScript type checking
- 🏗️ Application build verification
- 🌐 Internationalization validation
- 🔒 Security scanning
- 📊 Final status validation

**Smart Features:**

- Change detection to skip unnecessary jobs
- Parallel execution for faster feedback
- Caching for improved performance
- Build artifact uploads

### 2. Security Checks (`security.yml`)

**Triggers:** PRs, scheduled weekly, manual
**Purpose:** Comprehensive security scanning

**Checks:**

- 🔍 Dependency vulnerability scanning
- 🕵️ Hardcoded secrets detection
- 📋 Security audit reports

### 3. Code Quality Analysis (`code-quality.yml`)

**Triggers:** PRs, pushes to main, scheduled weekly
**Purpose:** In-depth code quality assessment

**Features:**

- 🧮 Code complexity analysis
- 📦 Bundle size monitoring
- 📝 TypeScript coverage tracking
- 📚 Documentation coverage analysis
- 💬 Automated PR comments with results

### 4. Dependency Updates (`dependency-update.yml`)

**Triggers:** Scheduled weekly, manual with options
**Purpose:** Automated dependency management

**Features:**

- 🔄 Automated dependency updates (patch/minor/major)
- 🧪 Post-update validation
- 📋 Automatic PR creation
- 🔒 Security audit after updates

### 5. Claude AI Integration

**Files:** `claude.yml`, `claude-code-review.yml`
**Purpose:** AI-powered code assistance and review

## 📋 Workflow Requirements

### Environment Variables for Build

```yaml
NEXT_PUBLIC_SUPABASE_URL: https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy_key_for_build
```

### Required Secrets

- `ANTHROPIC_API_KEY`: For Claude AI integration
- `GITHUB_TOKEN`: Automatically provided by GitHub

### Node.js & Package Manager

- **Node Version:** 18
- **Package Manager:** pnpm v9
- **Lock File:** pnpm-lock.yaml (frozen installs)

## 🚀 PR Workflow Process

When you create a pull request, the following happens automatically:

1. **Change Detection** 🔍
   - Analyzes which files changed
   - Determines which jobs need to run
   - Skips unnecessary checks for efficiency

2. **Parallel Quality Checks** ⚡
   - Code formatting and linting
   - TypeScript type checking
   - Security scanning
   - Build verification

3. **Specialized Validation** 🎯
   - I18n consistency (if translation files changed)
   - Code quality analysis (weekly or on-demand)

4. **Status Reporting** 📊
   - Clear pass/fail indicators
   - Detailed reports as artifacts
   - PR comments with quality metrics

## 🛠️ Local Development Commands

Before pushing, ensure these commands pass locally:

```bash
# Type checking
pnpm run type-check

# Code formatting
pnpm run format:check
pnpm run format  # Auto-fix formatting

# Linting
pnpm run lint

# Build verification
pnpm run build

# I18n validation
pnpm run i18n:check
pnpm run i18n:validate
```

## 📈 Quality Gates

### ✅ Required Checks (Must Pass)

- TypeScript compilation
- Code formatting
- ESLint rules
- Build success
- Security scan (no high/critical vulnerabilities)

### ⚠️ Warning Checks (Should Pass)

- Code complexity analysis
- Bundle size monitoring
- Documentation coverage
- TypeScript coverage

## 🔧 Customizing Workflows

### Adding New Checks

1. Create new job in appropriate workflow
2. Add step to install dependencies
3. Run your custom checks
4. Upload results as artifacts

### Modifying Triggers

```yaml
on:
  pull_request:
    branches: [master, main, develop]
    paths:
      - 'app/**'
      - 'components/**'
  push:
    branches: [master, main]
  schedule:
    - cron: '0 6 * * 0' # Weekly on Sunday
```

### Environment Customization

```yaml
env:
  NODE_VERSION: '18'
  PNPM_VERSION: '9'
  # Add custom environment variables
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**

- Check if all required environment variables are set
- Verify pnpm-lock.yaml is up to date
- Ensure Node.js version matches (18)

**Type Check Failures:**

- Run `pnpm run type-check` locally
- Check for missing imports or type definitions
- Verify tsconfig.json is correct

**Security Scan Failures:**

- Check for hardcoded secrets in code
- Review dependency vulnerabilities
- Update dependencies if needed

**I18n Validation Failures:**

- Ensure all translation keys are consistent
- Check for missing translations
- Validate JSON syntax in message files

### Getting Help

1. Check workflow run logs in GitHub Actions tab
2. Download and review artifacts for detailed reports
3. Run commands locally to reproduce issues
4. Check this documentation for configuration details

## 📝 Workflow Files Overview

| File                     | Purpose             | When It Runs           |
| ------------------------ | ------------------- | ---------------------- |
| `ci.yml`                 | Main CI/CD pipeline | Every PR, push to main |
| `security.yml`           | Security scanning   | PRs, weekly, manual    |
| `code-quality.yml`       | Quality analysis    | PRs, pushes, weekly    |
| `dependency-update.yml`  | Auto-updates        | Weekly, manual         |
| `claude.yml`             | AI assistance       | On @claude mentions    |
| `claude-code-review.yml` | AI code review      | On @claude review      |

## 🎯 Best Practices

1. **Always run checks locally** before pushing
2. **Keep PRs focused** on single features/fixes
3. **Update documentation** when adding new features
4. **Add tests** for new functionality
5. **Follow commit message conventions** (see git-commit-rule)
6. **Monitor workflow performance** and optimize as needed

---

_This documentation is automatically maintained. Last updated: $(date)_
