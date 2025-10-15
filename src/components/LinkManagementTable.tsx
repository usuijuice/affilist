import { useState, useMemo } from 'react';
import type { AffiliateLink } from '../types';

interface LinkManagementTableProps {
  links: AffiliateLink[];
  onEdit: (link: AffiliateLink) => void;
  onDelete: (linkId: string) => void;
  isLoading?: boolean;
}

type SortField =
  | 'title'
  | 'category'
  | 'status'
  | 'clickCount'
  | 'featured'
  | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function LinkManagementTable({
  links,
  onEdit,
  onDelete,
  isLoading = false,
}: LinkManagementTableProps) {
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'updatedAt',
    direction: 'desc',
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(links.map((link) => link.category.name))
    );
    return uniqueCategories.sort();
  }, [links]);

  // Filter and sort links
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = links;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.description.toLowerCase().includes(query) ||
          link.category.name.toLowerCase().includes(query) ||
          link.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((link) => link.status === filterStatus);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(
        (link) => link.category.name === filterCategory
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.name.toLowerCase();
          bValue = b.category.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'clickCount':
          aValue = a.clickCount;
          bValue = b.clickCount;
          break;
        case 'featured':
          aValue = a.featured ? 1 : 0;
          bValue = b.featured ? 1 : 0;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [links, searchQuery, filterStatus, filterCategory, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectLink = (linkId: string) => {
    setSelectedLinks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(linkId)) {
        newSet.delete(linkId);
      } else {
        newSet.add(linkId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedLinks.size === filteredAndSortedLinks.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(filteredAndSortedLinks.map((link) => link.id)));
    }
  };

  const handleDeleteLink = (linkId: string) => {
    onDelete(linkId);
    setShowDeleteConfirm(null);
    setSelectedLinks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(linkId);
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    selectedLinks.forEach((linkId) => onDelete(linkId));
    setSelectedLinks(new Set());
    setShowBulkDeleteConfirm(false);
  };

  const formatStatus = (status: AffiliateLink['status']) => {
    switch (status) {
      case 'active':
        return '有効';
      case 'inactive':
        return '停止';
      case 'pending':
        return '保留';
      default:
        return status;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortConfig.direction === 'asc' ? (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Filters and Search */}
      <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="リンクを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">すべてのステータス</option>
              <option value="active">有効</option>
              <option value="inactive">停止</option>
              <option value="pending">保留</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLinks.size > 0 && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 px-4 py-2 rounded-md">
            <span className="text-sm text-blue-700">
              {selectedLinks.size}件のリンクを選択中
            </span>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              選択したリンクを削除
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedLinks.size === filteredAndSortedLinks.length &&
                    filteredAndSortedLinks.length > 0
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1">
                  <span>タイトル</span>
                  {getSortIcon('title')}
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center space-x-1">
                  <span>カテゴリ</span>
                  {getSortIcon('category')}
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>ステータス</span>
                  {getSortIcon('status')}
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('clickCount')}
              >
                <div className="flex items-center space-x-1">
                  <span>クリック数</span>
                  {getSortIcon('clickCount')}
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('featured')}
              >
                <div className="flex items-center space-x-1">
                  <span>注目</span>
                  {getSortIcon('featured')}
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>更新日時</span>
                  {getSortIcon('updatedAt')}
                </div>
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedLinks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      該当するリンクが見つかりません
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery ||
                      filterStatus !== 'all' ||
                      filterCategory !== 'all'
                        ? '検索条件やフィルターを調整してください。'
                        : 'まずは新しいアフィリエイトリンクを作成してみましょう。'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLinks.has(link.id)}
                      onChange={() => handleSelectLink(link.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {link.imageUrl && (
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={link.imageUrl}
                            alt={link.title}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className={link.imageUrl ? 'ml-4' : ''}>
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {link.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {link.description}
                        </div>
                        {link.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {link.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {link.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{link.tags.length - 3} 件
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${link.category.color}20`,
                        color: link.category.color,
                      }}
                    >
                      {link.category.name}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        link.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : link.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {formatStatus(link.status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.clickCount.toLocaleString()} 件
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {link.featured ? (
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(link.updatedAt)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(link)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(link.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                リンクを削除
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  このアフィリエイトリンクを削除しますか？この操作は元に戻せません。
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDeleteLink(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  削除
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                複数のリンクを削除
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  選択した{selectedLinks.size}
                  件のリンクを削除しますか？この操作は取り消せません。
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  削除
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
