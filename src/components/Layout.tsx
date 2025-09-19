
import { Header } from './Header';
import { Footer } from './Footer';
import type { Category } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  categories?: Category[];
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Layout({ 
  children, 
  categories = [], 
  onSearch = () => {}, 
  searchQuery = '' 
}: LayoutProps) {
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