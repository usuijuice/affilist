---
inclusion: always
---

# Project Structure & Organization

## Directory Structure
```
src/
├── components/         # React components with co-located tests
│   ├── __tests__/     # Component test files
│   └── index.ts       # Barrel exports
├── contexts/          # React Context providers
│   ├── __tests__/     # Context test files
│   └── index.ts       # Barrel exports
├── hooks/             # Custom React hooks
│   ├── __tests__/     # Hook test files
│   └── index.ts       # Barrel exports
├── services/          # API clients and external services
│   ├── __tests__/     # Service test files
│   └── index.ts       # Barrel exports
├── pages/             # Top-level page components
├── types/             # TypeScript type definitions
├── utils/             # Pure utility functions
│   ├── __tests__/     # Utility test files
│   └── index.ts       # Barrel exports
└── test/              # Test utilities and setup
```

## File Naming Conventions
- **Components**: PascalCase (e.g., `AdminDashboard.tsx`, `LinkForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAffiliateLinks.ts`)
- **Services**: camelCase with descriptive suffix (e.g., `authService.ts`, `apiClient.ts`)
- **Types**: PascalCase interfaces/types in `types/index.ts`
- **Utils**: camelCase (e.g., `helpers.ts`, `validation.ts`)
- **Tests**: Match source file name with `.test.tsx/.test.ts` suffix

## Import/Export Patterns
- Use barrel exports (`index.ts`) in each directory for clean imports
- Import from barrel files: `import { Component } from '../components'`
- Avoid deep relative imports: `../../../components/SomeComponent`
- Group imports: external libraries, internal modules, relative imports

## Test Organization
- Co-locate tests in `__tests__/` directories within each module
- Test files mirror source structure and naming
- Use descriptive test file names matching the component/service being tested
- Shared test utilities in `src/test/` directory

## Component Architecture
- Keep components focused and single-responsibility
- Extract complex logic into custom hooks
- Use composition over inheritance
- Implement proper error boundaries and loading states