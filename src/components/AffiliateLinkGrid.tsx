
import { AffiliateLinkCard } from './AffiliateLinkCard';
import type { AffiliateLink } from '../types';

interface AffiliateLinkGridProps {
  links: AffiliateLink[];
  loading: boolean;
  onLinkClick: (linkId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Skeleton component for loading states
function AffiliateLinkSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 bg-gray-200"></div>
      
      {/* Content skeleton */}
      <div className="p-4">
        {/* Category badge skeleton */}
        <div className="mb-2">
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Title skeleton */}
        <div className="mb-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        {/* Description skeleton */}
        <div className="mb-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        
        {/* Tags skeleton */}
        <div className="mb-3 flex gap-1">
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="h-6 w-12 bg-gray-200 rounded"></div>
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 w-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4 opacity-50">🔍</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No affiliate links found</h3>
      <p className="text-gray-600 text-center max-w-md">{message}</p>
    </div>
  );
}

// Load more button component
function LoadMoreButton({ onLoadMore, loading }: { onLoadMore: () => void; loading: boolean }) {
  return (
    <div className="col-span-full flex justify-center py-8">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="
          px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        "
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading...
          </div>
        ) : (
          'Load More'
        )}
      </button>
    </div>
  );
}

export function AffiliateLinkGrid({
  links,
  loading,
  onLinkClick,
  onLoadMore,
  hasMore = false,
  emptyMessage = "Try adjusting your search criteria or browse different categories.",
  className = ""
}: AffiliateLinkGridProps) {
  // Show skeleton loading state
  if (loading && links.length === 0) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: 8 }, (_, index) => (
          <AffiliateLinkSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // Show empty state when no links and not loading
  if (!loading && links.length === 0) {
    return (
      <div className={`grid grid-cols-1 ${className}`}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Grid of affiliate link cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {links.map((link) => (
          <AffiliateLinkCard
            key={link.id}
            link={link}
            onLinkClick={onLinkClick}
            featured={link.featured}
          />
        ))}
        
        {/* Show skeleton cards while loading more */}
        {loading && links.length > 0 && (
          <>
            {Array.from({ length: 4 }, (_, index) => (
              <AffiliateLinkSkeleton key={`loading-skeleton-${index}`} />
            ))}
          </>
        )}
      </div>

      {/* Load more button */}
      {!loading && hasMore && onLoadMore && (
        <LoadMoreButton onLoadMore={onLoadMore} loading={loading} />
      )}
      
      {/* Loading more indicator */}
      {loading && links.length > 0 && !hasMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            Loading more links...
          </div>
        </div>
      )}
    </div>
  );
}