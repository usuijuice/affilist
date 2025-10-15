import React, { useState, useEffect } from 'react';
import type { AffiliateLink, Category, CreateLinkRequest } from '../types';
import { categoriesApi } from '../services';

interface LinkFormProps {
  link?: AffiliateLink;
  onSubmit: (linkData: CreateLinkRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  url: string;
  affiliateUrl: string;
  categoryId: string;
  tags: string[];
  imageUrl: string;
  commissionRate: string;
  featured: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  url?: string;
  affiliateUrl?: string;
  categoryId?: string;
  tags?: string;
  imageUrl?: string;
  commissionRate?: string;
}

export function LinkForm({
  link,
  onSubmit,
  onCancel,
  isLoading = false,
}: LinkFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    url: '',
    affiliateUrl: '',
    categoryId: '',
    tags: [],
    imageUrl: '',
    commissionRate: '',
    featured: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagInput, setTagInput] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesApi.getAllCategories();
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Initialize form data when link prop changes
  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title,
        description: link.description,
        url: link.url,
        affiliateUrl: link.affiliateUrl,
        categoryId: link.category.id,
        tags: link.tags,
        imageUrl: link.imageUrl || '',
        commissionRate: link.commissionRate?.toString() || '',
        featured: link.featured,
      });
    }
  }, [link]);

  // Auto-save draft functionality
  useEffect(() => {
    const draftKey = `linkForm_draft_${link?.id || 'new'}`;

    if (isDraft) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }

    // Load draft on mount if creating new link
    if (!link && !isDraft) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData(draftData);
          setIsDraft(true);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [formData, isDraft, link]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'タイトルを入力してください';
    } else if (formData.title.length < 3) {
      newErrors.title = 'タイトルは3文字以上で入力してください';
    } else if (formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    if (!formData.description.trim()) {
      newErrors.description = '説明を入力してください';
    } else if (formData.description.length < 10) {
      newErrors.description = '説明は10文字以上で入力してください';
    } else if (formData.description.length > 500) {
      newErrors.description = '説明は500文字以内で入力してください';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URLを入力してください';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = '有効なURLを入力してください';
    }

    if (!formData.affiliateUrl.trim()) {
      newErrors.affiliateUrl = 'アフィリエイトURLを入力してください';
    } else if (!isValidUrl(formData.affiliateUrl)) {
      newErrors.affiliateUrl = '有効なアフィリエイトURLを入力してください';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'カテゴリを選択してください';
    }

    // Optional fields validation
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = '有効な画像URLを入力してください';
    }

    if (formData.commissionRate) {
      const rate = parseFloat(formData.commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.commissionRate = '報酬率は0〜100の範囲で入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDraft(true);

    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTagAdd = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
      setIsDraft(true);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
    setIsDraft(true);
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateLinkRequest = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      url: formData.url.trim(),
      affiliateUrl: formData.affiliateUrl.trim(),
      categoryId: formData.categoryId,
      tags: formData.tags,
      imageUrl: formData.imageUrl.trim() || undefined,
      commissionRate: formData.commissionRate
        ? parseFloat(formData.commissionRate)
        : undefined,
      featured: formData.featured,
    };

    try {
      await onSubmit(submitData);

      // Clear draft on successful submission
      const draftKey = `linkForm_draft_${link?.id || 'new'}`;
      localStorage.removeItem(draftKey);
      setIsDraft(false);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const clearDraft = () => {
    const draftKey = `linkForm_draft_${link?.id || 'new'}`;
    localStorage.removeItem(draftKey);
    setIsDraft(false);

    if (!link) {
      setFormData({
        title: '',
        description: '',
        url: '',
        affiliateUrl: '',
        categoryId: '',
        tags: [],
        imageUrl: '',
        commissionRate: '',
        featured: false,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Draft indicator */}
        {isDraft && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-yellow-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-yellow-800">
                  下書きは自動的に保存されています
                </span>
              </div>
              <button
                type="button"
                onClick={clearDraft}
                className="text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                下書きを削除
              </button>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>

          <div className="grid grid-cols-1 gap-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                タイトル *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : ''
                }`}
                placeholder="アフィリエイトリンクのタイトルを入力"
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.title.length}/100 文字
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                説明 *
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : ''
                }`}
                placeholder="リンクの内容や訴求ポイントを入力"
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/500 文字
              </p>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700"
                >
                  紹介元URL *
                </label>
                <input
                  type="url"
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.url ? 'border-red-300' : ''
                  }`}
                  placeholder="https://example.com"
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="affiliateUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  アフィリエイトURL *
                </label>
                <input
                  type="url"
                  id="affiliateUrl"
                  value={formData.affiliateUrl}
                  onChange={(e) =>
                    handleInputChange('affiliateUrl', e.target.value)
                  }
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.affiliateUrl ? 'border-red-300' : ''
                  }`}
                  placeholder="https://affiliate.example.com/ref=123"
                />
                {errors.affiliateUrl && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.affiliateUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categorization */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">分類設定</h3>

          <div className="grid grid-cols-1 gap-6">
            {/* Category */}
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700"
              >
                カテゴリ *
              </label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) =>
                  handleInputChange('categoryId', e.target.value)
                }
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.categoryId ? 'border-red-300' : ''
                }`}
              >
                <option value="">カテゴリを選択してください</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700"
              >
                タグ
              </label>
              <div className="mt-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                      >
                        <svg
                          className="w-2 h-2"
                          fill="currentColor"
                          viewBox="0 0 8 8"
                        >
                          <path d="M1.41 0l-1.41 1.41.72.72 1.78 1.81-1.78 1.78-.72.69 1.41 1.44.72-.72 1.81-1.81 1.78 1.81.69.72 1.44-1.44-.72-.69-1.81-1.78 1.81-1.81.72-.72-1.44-1.41-.69.72-1.78 1.78-1.81-1.78-.72-.72z" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="タグを追加"
                  />
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                  >
                    追加
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enterキーまたは「追加」を押すとタグを登録できます。タグを設定するとユーザーがリンクを見つけやすくなります。
              </p>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">追加設定</h3>

          <div className="grid grid-cols-1 gap-6">
            {/* Image URL */}
            <div>
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700"
              >
                画像URL
              </label>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.imageUrl ? 'border-red-300' : ''
                }`}
                placeholder="https://example.com/logo.png"
              />
              {errors.imageUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                （任意）リンク用のロゴやプレビュー画像
              </p>
            </div>

            {/* Commission Rate */}
            <div>
              <label
                htmlFor="commissionRate"
                className="block text-sm font-medium text-gray-700"
              >
                報酬率（%）
              </label>
              <input
                type="number"
                id="commissionRate"
                min="0"
                max="100"
                step="0.01"
                value={formData.commissionRate}
                onChange={(e) =>
                  handleInputChange('commissionRate', e.target.value)
                }
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.commissionRate ? 'border-red-300' : ''
                }`}
                placeholder="5.00"
              />
              {errors.commissionRate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.commissionRate}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                （任意）報酬率をパーセンテージで入力
              </p>
            </div>

            {/* Featured */}
            <div className="flex items-center">
              <input
                id="featured"
                type="checkbox"
                checked={formData.featured}
                onChange={(e) =>
                  handleInputChange('featured', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="featured"
                className="ml-2 block text-sm text-gray-900"
              >
                注目リンクにする
              </label>
              <p className="ml-2 text-sm text-gray-500">
                注目リンクはホームページで目立つ位置に表示されます
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {link ? '更新しています...' : '作成しています...'}
              </div>
            ) : link ? (
              'リンクを更新'
            ) : (
              'リンクを作成'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
