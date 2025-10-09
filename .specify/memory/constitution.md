<!--
═══════════════════════════════════════════════════════════════════════════
SYNC IMPACT REPORT - Constitution Update
═══════════════════════════════════════════════════════════════════════════

Version Change: INITIAL → 1.0.0 (MINOR - Initial constitution establishment)

Rationale: This is the initial ratification of the AgentifUI project constitution,
establishing foundational principles for code quality, testing standards, user
experience consistency, and performance requirements.

Modified Principles:
- NEW: I. Type Safety & Code Quality
- NEW: II. Testing & Quality Assurance
- NEW: III. User Experience Consistency
- NEW: IV. Performance & Optimization
- NEW: V. Architecture & Maintainability

Added Sections:
- Core Principles (5 principles)
- Quality Standards
- Development Workflow
- Governance

Removed Sections:
- None (initial version)

Templates Requiring Updates:
✅ spec-template.md - Already compatible with constitution requirements
✅ plan-template.md - Constitution Check section ready for validation
✅ tasks-template.md - Task structure supports principle-driven development
✅ checklist-template.md - Flexible format supports quality gates

Follow-up TODOs:
- None

═══════════════════════════════════════════════════════════════════════════
-->

# AgentifUI Constitution

## Core Principles

### I. Type Safety & Code Quality

**Rule**: Every component, function, and module MUST maintain strict TypeScript typing with zero tolerance for `any` types in production code.

**Requirements**:

- All code MUST pass `pnpm type-check` without errors
- No `any` types except in type definitions or temporary development (MUST be removed before commit)
- No `console.log` in production code except for debugging purposes (MUST be removed before deployment)
- Code MUST follow ESLint rules with zero errors (warnings acceptable with justification)
- Code MUST be formatted with Prettier before commit (automated via Husky)

**Rationale**: TypeScript's type system prevents runtime errors and improves code maintainability. The `any` type defeats this purpose and introduces risk. Strict typing ensures that refactoring is safe and IDE tooling works optimally.

**Validation**: Run `pnpm type-check` and `pnpm lint` - both MUST pass with zero errors.

---

### II. Testing & Quality Assurance

**Rule**: All critical user journeys and business logic MUST have corresponding test coverage using Jest and React Testing Library.

**Requirements**:

- New components SHOULD include unit tests for critical functionality
- Integration tests MUST exist for multi-component user flows
- Tests MUST use existing mocks from `jest.setup.js` for consistency
- Test coverage SHOULD increase incrementally (current baseline: 0%, target: >60%)
- Tests MUST pass via `pnpm test` before commit (enforced by Husky precommit hooks)
- Tests MUST focus on user behavior, not implementation details

**Rationale**: Testing ensures reliability, prevents regressions, and documents expected behavior. React Testing Library's user-centric approach aligns with our UX consistency principle.

**Validation**: Run `pnpm test` - all tests MUST pass. Coverage reports generated via `pnpm test:coverage`.

---

### III. User Experience Consistency

**Rule**: All user-facing features MUST provide consistent, internationalized, and accessible experiences across all supported languages and devices.

**Requirements**:

- **Internationalization (I18n)**:
  - ALL user-facing text MUST use `next-intl` translation keys via `t()` function
  - NEVER hardcode English strings in components (e.g., no "Loading...", use `t('common.loading')`)
  - New translation keys MUST be added to `messages/en-US.json` first (source language)
  - Structure consistency MUST be maintained across all language files
  - Run `pnpm i18n:check` after adding translations to validate structure
- **Accessibility (a11y)**:
  - Components MUST use semantic HTML and ARIA labels where appropriate
  - Interactive elements MUST be keyboard navigable
  - Color contrast MUST meet WCAG AA standards
  - Screen reader compatibility MUST be considered
- **Responsive Design**:
  - UI MUST work on desktop and mobile devices
  - Tailwind CSS responsive utilities (sm:, md:, lg:) MUST be used appropriately
  - Touch targets MUST be adequately sized for mobile interaction

**Rationale**: AgentifUI serves a global audience requiring multiple languages. Consistent UX reduces cognitive load and improves user satisfaction. Accessibility is both an ethical requirement and a legal compliance matter.

**Validation**: Run `pnpm i18n:check` and `pnpm i18n:validate` - both MUST pass. Manual testing on multiple devices and browsers required.

---

### IV. Performance & Optimization

**Rule**: Features MUST be implemented with performance considerations from the start, not as an afterthought.

**Requirements**:

- Build process MUST complete successfully via `pnpm build` with zero errors
- Bundle analysis SHOULD be performed for significant feature additions (`pnpm analyze`)
- Real-time features MUST use efficient state management (Zustand stores)
- Database queries MUST leverage Supabase RLS policies for security without performance penalties
- Image assets MUST use Next.js `next/image` for automatic optimization
- API responses MUST implement appropriate caching strategies
- Streaming responses (Dify API) MUST handle backpressure and errors gracefully

**Rationale**: Performance directly impacts user satisfaction and operational costs. Next.js 15 provides excellent optimization tools that MUST be utilized. Zustand's minimal re-render approach ensures responsive UI.

**Validation**: Run `pnpm build` - MUST succeed. Monitor bundle size with `pnpm analyze`. Lighthouse performance scores SHOULD be >90 for key pages.

---

### V. Architecture & Maintainability

**Rule**: Code MUST follow the established layered architecture with clear separation of concerns.

**Requirements**:

- **Layered Architecture MUST be respected**:
  - UI Layer: `components/` - Presentation only, no business logic
  - Route Layer: `app/` - Next.js App Router pages and API routes
  - Service Layer: `lib/services/` - Business logic and API integration
  - Data Access Layer: `lib/db/` - Direct database operations
  - State Layer: `lib/stores/` - Zustand state management
- **Dify API Integration MUST follow 3-layer pattern**:
  1. Proxy Layer: `app/api/dify/[appId]/[...slug]/route.ts`
  2. Service Layer: `lib/services/dify/*.ts`
  3. Type Layer: `lib/services/dify/types.ts`
- **File Organization**:
  - New files MUST be placed in appropriate directories
  - Test files MUST be co-located with source or in `__tests__/` directory
  - Shared types MUST be in `lib/types/` or feature-specific type files
- **Code Comments**:
  - MUST be in English (per `.cursor/rules/comment-rule.mdc`)
  - MUST use JSDoc format for functions and interfaces
  - MUST explain "why", not just "what"
  - MUST be concise and clear

**Rationale**: Layered architecture prevents tight coupling, enables independent testing, and makes the codebase navigable for new developers. The 3-layer Dify pattern ensures security (proxy layer) and maintainability (service abstraction).

**Validation**: Code review MUST verify layer boundaries are respected. No direct database access from components, no business logic in UI components.

---

## Quality Standards

### Code Review Requirements

All code changes MUST pass the following gates before merge:

1. **TypeScript Validation**: `pnpm type-check` passes with zero errors
2. **Linting**: `pnpm lint` passes with zero errors (warnings acceptable with justification)
3. **Testing**: `pnpm test` passes all tests (enforced by Husky precommit)
4. **Build Verification**: `pnpm build` succeeds without errors
5. **I18n Validation**: `pnpm i18n:check` and `pnpm i18n:validate` pass (for i18n changes)
6. **Architecture Compliance**: Code follows layered architecture principles
7. **Git Commit Standards**: Commits follow conventional format per `.cursor/rules/git-commit-rule.mdc`

### Acceptable Deviations

Deviations from principles MUST be:

- **Documented**: Include comment explaining why deviation is necessary
- **Justified**: Technical or business reason MUST be compelling
- **Temporary**: Include TODO with timeline for resolution (if applicable)
- **Reviewed**: Requires explicit approval in code review

Example of acceptable deviation:

```typescript
// TODO: Remove 'any' type after upgrading @types/legacy-library to v2.x
// Current version has incomplete type definitions
const legacyData: any = await legacyLibrary.fetch();
```

---

## Development Workflow

### Mandatory Pre-Development Steps

1. **Consult Rules**: Read `.cursor/rules/cursor-rules.mdc` master index
2. **Understand Requirements**: Review feature spec or issue description
3. **Check Architecture**: Verify understanding of affected layers
4. **Plan Changes**: Identify minimal, safe modifications

### Development Process

1. **Create Feature Branch**: `git checkout -b <type>/<scope>-<description>`
2. **Implement Changes**: Follow principles and layer boundaries
3. **Run Validations**: Execute all quality gate commands
4. **Write Tests**: Add or update tests for changed functionality
5. **Format Code**: `pnpm format` (or automated via Husky)
6. **Commit**: Follow conventional commit format
7. **Create PR**: Use template in `.github/PULL_REQUEST_TEMPLATE.md`

### Validation Commands (Run Before Commit)

```bash
# Essential validation sequence
pnpm type-check        # TypeScript validation
pnpm lint              # ESLint validation
pnpm test              # Run all tests
pnpm build             # Build verification

# I18n validation (when adding translations)
pnpm i18n:check        # Quick structure check
pnpm i18n:validate     # Detailed validation
```

### Critical Development Server Note

**⚠️ NEVER run `pnpm dev` unless explicitly needed or confirmed safe**

- Developer usually already has dev server running
- Use `pnpm build` and `pnpm type-check` for validation instead
- MUST ask before starting development server if uncertain

---

## Governance

### Constitution Authority

This constitution represents the highest-level technical governance for the AgentifUI project. All development practices, code reviews, and architectural decisions MUST align with these principles.

### Amendment Process

Amendments to this constitution require:

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Technical lead or core maintainer review
3. **Approval**: Explicit approval required before amendment
4. **Documentation**: Update this file with sync impact report
5. **Versioning**: Increment version following semantic versioning:
   - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review

- All PRs MUST verify compliance with applicable principles
- Code reviews MUST explicitly check for principle violations
- Complexity or deviations MUST be justified with business/technical rationale
- Quarterly reviews SHOULD assess principle effectiveness and update guidance

### Continuous Improvement

This constitution is a living document. As the project evolves:

- Principles SHOULD be refined based on team feedback
- New principles MAY be added for emerging concerns
- Obsolete principles SHOULD be removed or updated
- Success metrics SHOULD be collected and reviewed

---

**Version**: 1.0.0 | **Ratified**: 2025-01-09 | **Last Amended**: 2025-01-09
