import { useState } from "react";

type ProductGroup = {
  id: number;
  name: string;
  parent: number | null;
  children: ProductGroup[];
  products?: any[]; // Товары в группе
};

interface ProductCategoryTreeProps {
  categories: ProductGroup[];
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  loading?: boolean;
}

export default function ProductCategoryTree({
  categories,
  selectedCategoryId,
  onCategorySelect,
  loading
}: ProductCategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getProductsCount = (category: ProductGroup): number => {
    let count = category.products?.length || 0;
    
    // Добавляем товары из дочерних категорий
    if (category.children) {
      count += category.children.reduce((total, child) => total + getProductsCount(child), 0);
    }
    
    return count;
  };

  const renderCategory = (category: ProductGroup, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const productsCount = getProductsCount(category);
    const directProductsCount = category.products?.length || 0;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
          }`}
          style={{ paddingLeft: `${(level * 20) + 12}px` }}
          onClick={() => onCategorySelect(category.id)}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* Category icon */}
          <div className="flex-shrink-0">
            {hasChildren ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Category name and products count */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{category.name}</span>
              {productsCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  {directProductsCount > 0 && (
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                      {directProductsCount}
                    </span>
                  )}
                  {productsCount !== directProductsCount && (
                    <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full">
                      +{productsCount - directProductsCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children categories */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">📁</div>
        <p className="text-sm">Группы товаров отсутствуют</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-white">Группы товаров</h3>
          {selectedCategoryId && (
            <button
              onClick={() => onCategorySelect(null)}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Показать все
            </button>
          )}
        </div>
      </div>

      {/* Categories tree */}
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {/* "Все товары" option */}
          <div
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors ${
              selectedCategoryId === null
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => onCategorySelect(null)}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Все товары</span>
          </div>

          {/* Categories */}
          {categories.map(category => renderCategory(category))}
        </div>
      </div>
    </div>
  );
}