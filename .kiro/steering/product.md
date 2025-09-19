---
inclusion: always
---

# Product Overview

## Project: Affilist - Affiliate Link Aggregator

A React/TypeScript web application for managing and displaying affiliate links with comprehensive admin functionality, analytics, and user authentication.

## Core Features
- **Link Management**: Create, edit, delete, and organize affiliate links
- **Admin Dashboard**: Administrative interface with analytics and link management
- **User Authentication**: Role-based access control with protected routes
- **Analytics**: Click tracking, performance metrics, and data visualization
- **Search & Filtering**: Advanced filtering by categories, performance, and custom criteria
- **Responsive Design**: Mobile-friendly interface with modern UI components

## Architecture Patterns
- **Component-Based**: Modular React components with clear separation of concerns
- **Context Pattern**: Global state management using React Context (Auth, App state)
- **Custom Hooks**: Reusable logic encapsulated in custom hooks
- **Service Layer**: API interactions abstracted into service modules
- **Test-Driven**: Comprehensive test coverage with Vitest and React Testing Library

## Code Conventions
- Use TypeScript for type safety
- Functional components with hooks over class components
- Custom hooks for complex state logic and side effects
- Consistent file naming: PascalCase for components, camelCase for utilities
- Co-located tests in `__tests__` directories
- Barrel exports via index.ts files for clean imports

## Key Directories
- `src/components/`: React components with tests
- `src/hooks/`: Custom React hooks
- `src/contexts/`: React Context providers
- `src/services/`: API client and service layer
- `src/pages/`: Top-level page components
- `src/types/`: TypeScript type definitions
- `src/utils/`: Utility functions and helpers

## Development Guidelines
- Maintain high test coverage for all components and utilities
- Use proper TypeScript typing - avoid `any` types
- Follow React best practices for performance and accessibility
- Keep components focused and single-responsibility
- Use proper error boundaries and loading states
- Implement proper session management and security practices