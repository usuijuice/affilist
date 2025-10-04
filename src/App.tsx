import { useState, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Layout,
  ErrorBoundary,
  ToastProvider,
  LoadingSpinner,
} from './components';
import { AppProvider } from './contexts';
import { AuthProvider } from './contexts';
import { performanceMonitor } from './utils/performance';
import { serviceWorkerManager } from './utils/serviceWorker';

// Lazy load page components for code splitting
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage }))
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  }))
);
const FeaturedPage = lazy(() =>
  import('./pages/FeaturedPage').then((module) => ({
    default: module.FeaturedPage,
  }))
);

// Lazy load admin components for better performance
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((module) => ({
    default: module.AdminDashboard,
  }))
);
const AnalyticsDashboard = lazy(() =>
  import('./components/AnalyticsDashboard').then((module) => ({
    default: module.AnalyticsDashboard,
  }))
);
const Login = lazy(() =>
  import('./components/Login').then((module) => ({ default: module.Login }))
);

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  useEffect(() => {
    // Start monitoring app initialization
    performanceMonitor.startTiming('App Initialization');

    // Register service worker in production
    if (import.meta.env.PROD) {
      serviceWorkerManager.register('/sw.js').then((registration) => {
        if (registration) {
          console.log('Service Worker registered successfully');
        }
      });
    }

    return () => {
      performanceMonitor.endTiming('App Initialization');
    };
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <Router>
              <AppContent />
            </Router>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Search functionality will be handled by the search components
    console.log('Search query:', query);
  };

  return (
    <Layout onSearch={handleSearch} searchQuery={searchQuery}>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:slug" element={<CategoriesPage />} />
          <Route path="/featured" element={<FeaturedPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
