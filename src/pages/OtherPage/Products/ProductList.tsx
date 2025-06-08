import Button from "../../../components/ui/button/Button";

type Product = {
  id: number;
  name: string;
  unit?: number;
  unit_name?: string;
  group_id?: number;
  group_name?: string;
  price?: number;
  code?: string;
  description?: string;
  stock_quantity?: number;
  is_active?: boolean;
  // Старые поля для совместимости
  category?: string;
  product_group_name?: string;
};

interface ProductListProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onShowAllStock?: (product: Product) => void;
  productsStock?: {[key: number]: number};
  loading?: boolean;
  searchQuery?: string;
  multiSelect?: boolean;
  selectedProducts?: Set<number>;
  showStockInfo?: boolean;
}

export default function ProductList({ 
  products, 
  onProductSelect, 
  onShowAllStock,
  productsStock = {},
  loading, 
  searchQuery,
  multiSelect = false,
  selectedProducts = new Set(),
  showStockInfo = false
}: ProductListProps) {
  
  const formatPrice = (price?: number) => {
    if (!price) return "—";
    return `${price.toFixed(2)} ₴`;
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Завантаження товарів...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? "Товари не знайдені" : "Товари відсутні"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery 
              ? `За пошуковим запитом "${searchQuery}" нічого не знайдено`
              : "У цій категорії немає товарів"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            Товари ({products.length})
          </h3>
          
          {/* Sort options */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Сортування:</span>
            <select className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <option>За назвою</option>
              <option>За ціною</option>
              <option>За залишком</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3">
          {products.map((product) => {
            const isSelected = multiSelect && selectedProducts.has(product.id);
            
            return (
              <div
                key={product.id}
                className={`border rounded-lg p-4 hover:shadow-sm transition-all cursor-pointer group ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
                onClick={() => onProductSelect(product)}
              >
                <div className="flex items-start justify-between">
                  {/* Checkbox for multiselect */}
                  {multiSelect && (
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onProductSelect(product)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      {/* Product Icon/Image placeholder */}
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v1.007a1 1 0 00.293.707L8.5 13.021a2 2 0 002.829 0l6.207-6.307a1 1 0 00.293-.707V5a2 2 0 00-2-2H4zm0 2h12v.007L10 11.021 4 5.007V5z" clipRule="evenodd" />
                        </svg>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold mb-1 transition-colors ${
                          isSelected 
                            ? 'text-blue-800 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}>
                          {searchQuery ? highlightText(product.name, searchQuery) : product.name}
                        </h4>
                        
                        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            <span>
                              <span className="font-medium">Код:</span> {product.code || "—"}
                            </span>
                            <span>
                              <span className="font-medium">Од.:</span> {product.unit_name || "шт"}
                            </span>
                          </div>
                          
                          {product.group_name && (
                            <div>
                              <span className="font-medium">Група:</span> {
                                searchQuery ? highlightText(product.group_name, searchQuery) : product.group_name
                              }
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <span>
                              <span className="font-medium">Ціна:</span> 
                              <span className="text-green-600 dark:text-green-400 font-semibold ml-1">
                                {formatPrice(product.price)}
                              </span>
                            </span>
                            {showStockInfo && (
                              <span>
                                <span className="font-medium">На складі:</span> 
                                <span className={`ml-1 font-semibold ${
                                  (productsStock[product.id] || 0) > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {productsStock[product.id] || 0}
                                </span>
                              </span>
                            )}
                          </div>

                          {product.description && (
                            <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex-shrink-0 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {!multiSelect && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log("Edit product:", product)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ✏️ Редагувати
                        </Button>
                        {onShowAllStock && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onShowAllStock(product)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            📊 Залишки
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Status indicators */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    {product.is_active === false && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full">
                        Неактивний
                      </span>
                    )}
                    {showStockInfo && (productsStock[product.id] || 0) <= 0 && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full">
                        Немає на складі
                      </span>
                    )}
                    {showStockInfo && (productsStock[product.id] || 0) > 0 && (productsStock[product.id] || 0) < 10 && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
                        Мало на складі
                      </span>
                    )}
                    {showStockInfo && (productsStock[product.id] || 0) >= 10 && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                        В наявності
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    ID: {product.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}