---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Technologies
- **Framework**: React 19.1.1 with TypeScript 5.8.3
- **Build Tool**: Vite 7.1.6 with Hot Module Replacement
- **Styling**: Tailwind CSS 4.1.13 with PostCSS
- **Routing**: React Router DOM 7.9.1
- **Testing**: Vitest 3.2.4 + React Testing Library + jsdom
- **Code Quality**: ESLint 9.35.0 + Prettier 3.6.2
- **License**: MIT

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

## Code Standards
- **TypeScript**: Strict mode enabled, avoid `any` types
- **React**: Functional components with hooks, no class components
- **Imports**: Use barrel exports from `index.ts` files
- **Testing**: Minimum 80% coverage, co-located test files
- **Styling**: Tailwind utility classes, avoid inline styles
- **File Naming**: PascalCase for components, camelCase for utilities

## Architecture Patterns
- **State Management**: React Context for global state
- **Data Fetching**: Custom hooks with proper error handling
- **Component Design**: Single responsibility, composition over inheritance
- **Error Boundaries**: Implement for robust error handling
- **Performance**: Use React.memo, useMemo, useCallback appropriately

## Development Guidelines
- Always run `npm run type-check` before committing
- Write tests for all new components and utilities
- Use semantic commit messages
- Keep components under 200 lines when possible
- Extract complex logic into custom hooks
- Implement proper loading and error states