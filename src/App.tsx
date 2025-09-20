import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ErrorBoundary, ToastProvider } from './components';
import { HomePage, CategoriesPage, FeaturedPage } from './pages';
import { AppProvider } from './contexts';
import { AuthProvider } from './contexts';

function App() {
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
    <Layout 
      onSearch={handleSearch}
      searchQuery={searchQuery}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:slug" element={<CategoriesPage />} />
        <Route path="/featured" element={<FeaturedPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
