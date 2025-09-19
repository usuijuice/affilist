import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components';
import { HomePage, CategoriesPage, FeaturedPage } from './pages';
import { createMockCategories } from './test/factories';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock categories for the footer - this will be replaced with real data later
  const mockCategories = createMockCategories(8);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement actual search functionality in future tasks
    console.log('Search query:', query);
  };

  return (
    <Router>
      <Layout 
        categories={mockCategories}
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
    </Router>
  );
}

export default App;
