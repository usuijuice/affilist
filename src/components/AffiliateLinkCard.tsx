import React from 'react';
import type { AffiliateLink } from '../types';
import { HighlightedText } from './HighlightedText';
import { LazyImage } from './LazyImage';
import { useClickTracking } from '../hooks/useClickTracking';

interface AffiliateLinkCardProps {
  link: AffiliateLink;
  onLinkClick: (linkId: string) => void;
  featured?: boolean;
  searchQuery?: string;
}

export function AffiliateLinkCard({
  link,
  onLinkClick,
  featured = false,
  searchQuery = '',
}: AffiliateLinkCardProps) {
  const { trackClick } = useClickTracking();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Track the click with metadata
    await trackClick(link.id, {
      title: link.title,
      category: link.category.name,
      categoryId: link.category.id,
      featured: link.featured || featured,
      commissionRate: link.commissionRate,
      searchQuery: searchQuery || undefined,
      clickSource: 'card',
      timestamp: new Date().toISOString(),
    });

    // Call the parent's click handler
    onLinkClick(link.id);

    // Open the affiliate URL in a new tab
    window.open(link.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const formatCommissionRate = (rate?: number) => {
    if (!rate) return null;
    return `${rate}% commission`;
  };

  const formatClickCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k clicks`;
    }
    return `${count} clicks`;
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 
        border border-gray-200 overflow-hidden cursor-pointer group
        ${featured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      aria-label={`Visit ${link.title}`}
    >
      {/* Featured Badge */}
      {(featured || link.featured) && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Featured
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {link.imageUrl ? (
          <LazyImage
            src={link.imageUrl}
            alt={link.title}
            className="w-full h-full group-hover:scale-105 transition-transform duration-200"
            placeholder={`data:image/svg+xml;base64,${btoa(`
              <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="16">
                  ${link.category.name}
                </text>
              </svg>
            `)}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-2">{link.category.icon || '🔗'}</div>
              <div className="text-gray-500 text-sm font-medium">
                {link.category.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category Badge */}
        <div className="mb-2">
          <span
            className="inline-block px-2 py-1 text-xs font-semibold rounded-full text-white"
            style={{ backgroundColor: link.category.color }}
          >
            {link.category.name}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {searchQuery ? (
            <HighlightedText text={link.title} searchQuery={searchQuery} />
          ) : (
            link.title
          )}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {searchQuery ? (
            <HighlightedText
              text={link.description}
              searchQuery={searchQuery}
            />
          ) : (
            link.description
          )}
        </p>

        {/* Tags */}
        {link.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {link.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {searchQuery ? (
                    <HighlightedText text={tag} searchQuery={searchQuery} />
                  ) : (
                    tag
                  )}
                </span>
              ))}
              {link.tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  +{link.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer with commission and stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            {link.commissionRate && (
              <span className="font-medium text-green-600">
                {formatCommissionRate(link.commissionRate)}
              </span>
            )}
            <span>{formatClickCount(link.clickCount)}</span>
          </div>

          {/* External link indicator */}
          <div className="flex items-center text-blue-500">
            <span className="text-xs mr-1">Visit</span>
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
