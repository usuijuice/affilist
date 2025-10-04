// Component exports
export { Header } from './Header';
export { Footer } from './Footer';
export { Layout } from './Layout';
export { AffiliateLinkCard } from './AffiliateLinkCard';
export { AffiliateLinkGrid } from './AffiliateLinkGrid';
export { SearchInput } from './SearchInput';
export { SearchResults } from './SearchResults';
export { HighlightedText } from './HighlightedText';
export { CategoryFilter } from './CategoryFilter';
export { SortControls } from './SortControls';
export { AdvancedFilters } from './AdvancedFilters';
export { FilterPanel } from './FilterPanel';

// Analytics components
export { AnalyticsDashboard } from './AnalyticsDashboard';
export { AnalyticsChart, TrendIndicator, MiniChart } from './AnalyticsChart';
export {
  MetricsSummary,
  ClickMetrics,
  RevenueMetrics,
  PerformanceMetrics,
  ComparisonMetrics,
} from './MetricsSummary';
export { PerformanceTable, CategoryPerformanceTable } from './PerformanceTable';

// Authentication components
export { Login } from './Login';
export {
  ProtectedRoute,
  withProtectedRoute,
  usePermissions,
} from './ProtectedRoute';
export { AdminLayout } from './AdminLayout';
export {
  AdminRoute,
  AdminOnlyRoute,
  EditorRoute,
  withAdminRoute,
} from './AdminRoute';
export { UnauthorizedPage } from './UnauthorizedPage';
export { SessionWarning } from './SessionWarning';

// Admin components
export { AdminDashboard } from './AdminDashboard';
export { LinkForm } from './LinkForm';
export { LinkManagementTable } from './LinkManagementTable';

// Utility components
export {
  LoadingSpinner,
  LoadingOverlay,
  InlineLoading,
} from './LoadingSpinner';
export { ErrorBoundary, useErrorHandler } from './ErrorBoundary';
export { ToastProvider, useToast } from './Toast';
export { ConfirmDialog, useConfirmDialog } from './ConfirmDialog';

// Performance components
export { LazyImage } from './LazyImage';
export {
  LazyComponentWrapper,
  withLazyLoading,
  useLazyComponent,
} from './LazyComponentWrapper';
