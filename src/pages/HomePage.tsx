import { useState } from 'react';
import { AffiliateLinkGrid } from '../components';
import { createMockAffiliateLinks } from '../test/factories';

export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState(() => createMockAffiliateLinks(8));
  const [hasMore, setHasMore] = useState(true);

  const handleLinkClick = (linkId: string) => {
    console.log('Link clicked:', linkId);
    // This will be implemented in future tasks with actual tracking
  };

  const handleLoadMore = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newLinks = createMockAffiliateLinks(4);
      setLinks((prev) => [...prev, ...newLinks]);
      setLoading(false);
      // Simulate reaching end after a few loads
      if (links.length > 16) {
        setHasMore(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            おすすめのアフィリエイト案件を見つけましょう
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            信頼できるサービスや案件をカテゴリ別に紹介しています。厳選したアフィリエイトリンクで成果報酬を獲得しましょう。
          </p>
        </div>

        {/* Demo of the new AffiliateLinkGrid component */}
        <AffiliateLinkGrid
          links={links}
          loading={loading}
          onLinkClick={handleLinkClick}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          emptyMessage="現在表示できるアフィリエイトリンクがありません。後ほど再度ご確認ください。"
        />
      </div>
    </div>
  );
}
