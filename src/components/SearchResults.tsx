import type { AffiliateLink } from '../types';
import { AffiliateLinkCard } from './AffiliateLinkCard';

interface SearchResultsProps {
  links: AffiliateLink[];
  searchQuery: string;
  onLinkClick: (linkId: string) => void;
  loading?: boolean;
}

export function SearchResults({
  links,
  searchQuery,
  onLinkClick,
  loading = false,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">検索中です...</span>
      </div>
    );
  }

  if (searchQuery.trim() && links.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          該当する結果が見つかりませんでした
        </h3>
        <p className="text-gray-600 mb-4">
          「{searchQuery}
          」に一致するアフィリエイトリンクは見つかりませんでした。
        </p>
        <div className="text-sm text-gray-500">
          <p>次の方法をお試しください。</p>
          <ul className="mt-2 space-y-1">
            <li>• キーワードのスペルを確認する</li>
            <li>• 別のキーワードを入力する</li>
            <li>• より一般的な語句で検索する</li>
            <li>• カテゴリから探してみる</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {links.map((link) => (
        <AffiliateLinkCard
          key={link.id}
          link={link}
          onLinkClick={onLinkClick}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
