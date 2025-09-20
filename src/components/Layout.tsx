
import { Header } from './Header';
import { Footer } from './Footer';
import { useAppState } from '../hooks';
import type { Category } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  categories?: Category[];
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Layout({ 
  children, 
  categories: propCategories, 
  onSearch = () => {}, 
  searchQuery = '' 
}: LayoutProps) {
  const { categories: contextCategories } = useAppState();
  
  // Use categories from context if available, otherwise use prop categories
  const categories = contextCategories.length > 0 ? contextCategories : (propCategories || []);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSearch={onSearch} searchQuery={searchQuery} />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer categories={categories} />
    </div>
  );
}