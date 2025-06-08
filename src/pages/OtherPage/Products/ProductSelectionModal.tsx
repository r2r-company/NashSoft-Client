import { useState, useEffect } from "react";
import axios from "../../../config/api";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import ProductCategoryTree from "./ProductCategoryTree";

// Типы данных
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
};

type CategoryGroup = {
  id: number;
  name: string;
  parent?: number | null;
  children?: CategoryGroup[];
  products_count?: number;
};

type StockData = {
  [warehouseId: string]: {
    warehouse_name: string;
    products: {
      product_id: number;
      product_name: string;
      quantity: number;
    }[];
  };
};

type AllStockItem = {
  product__id: number;
  product__name: string;
  warehouse__id: number;
  warehouse__name: string;
  total: number;
};

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: Product) => void;
  onMultipleProductsSelect?: (products: Product[]) => void;
  multiSelect?: boolean;
  selectedWarehouse?: number;
}

// Компонент модалки залишків по всім складам
function AllStockModal({ 
  isOpen, 
  onClose, 
  productId, 
  productName 
}: {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  productName: string;
}) {
  const [stockData, setStockData] = useState<AllStockItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId !== null) {
      loadAllStockData();
    }
  }, [isOpen, productId]);

  const loadAllStockData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("stock/");
      console.log("All stock data loaded:", response.data);
      setStockData(response.data);
    } catch (error) {
      console.error("Error loading all stock data:", error);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  const productStocks = productId === 0 
    ? stockData 
    : stockData.filter(item => item.product__id === productId);
  
  const totalStock = productStocks.reduce((sum, item) => sum + item.total, 0);

  // Групуємо по товарах для відображення всіх залишків
  const groupedByProduct = productId === 0 
    ? stockData.reduce((acc, item) => {
        const key = `${item.product__id}-${item.product__name}`;
        if (!acc[key]) {
          acc[key] = {
            product_id: item.product__id,
            product_name: item.product__name,
            warehouses: [],
            total: 0
          };
        }
        acc[key].warehouses.push({
          warehouse_id: item.warehouse__id,
          warehouse_name: item.warehouse__name,
          quantity: item.total
        });
        acc[key].total += item.total;
        return acc;
      }, {} as any)
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{zIndex: 9999999}}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-600 max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-t-xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Залишки по складах
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Завантаження...</p>
              </div>
            </div>
          ) : productId === 0 ? (
            // Показ всіх залишків
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800 dark:text-blue-400">
                    Загальний залишок по всім товарам:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalStock}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {Object.values(groupedByProduct || {}).map((productGroup: any) => (
                  <div key={productGroup.product_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {productGroup.product_name}
                        </h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {productGroup.product_id}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          productGroup.total > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {productGroup.total}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Загалом
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {productGroup.warehouses.map((warehouse: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {warehouse.warehouse_name}
                          </span>
                          <span className={`text-sm font-medium ${
                            warehouse.quantity > 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {warehouse.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : productStocks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Товар відсутній на складах
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Цей товар не знайдено на жодному складі
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Загальний залишок */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800 dark:text-blue-400">
                    Загальний залишок:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalStock}
                  </span>
                </div>
              </div>

              {/* Залишки по складах */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 dark:text-white mb-3">
                  По складах:
                </h4>
                {productStocks.map((stock, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {stock.warehouse__name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID складу: {stock.warehouse__id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        stock.total > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stock.total}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.total > 0 ? 'В наявності' : 'Відсутній'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>
            Закрити
          </Button>
        </div>
      </div>
    </div>
  );
}

// Компонент для отображения одного товара
function ProductCard({ 
  product, 
  searchQuery, 
  isSelected, 
  multiSelect, 
  onSelect, 
  stockQuantity,
  onShowAllStock
}: {
  product: Product;
  searchQuery: string;
  isSelected: boolean;
  multiSelect: boolean;
  onSelect: () => void;
  stockQuantity: number;
  onShowAllStock: () => void;
}) {
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
      ) : part
    );
  };

  const formatPrice = (price?: number) => {
    return price ? `${price.toFixed(2)} ₴` : "0.00 ₴";
  };

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-sm transition-all cursor-pointer group ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
      }`}
      onClick={(e) => {
        // Перевіряємо, чи клік не був по кнопці
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        onSelect();
      }}
    >
      <div className="flex items-start justify-between">
        {/* Checkbox для множественного выбора */}
        {multiSelect && (
          <div className="flex-shrink-0 mr-3 mt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Информация о товаре */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            {/* Иконка товара */}
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v1.007a1 1 0 00.293.707L8.5 13.021a2 2 0 002.829 0l6.207-6.307a1 1 0 00.293-.707V5a2 2 0 00-2-2H4zm0 2h12v.007L10 11.021 4 5.007V5z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Детали товара */}
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
                  <span>
                    <span className="font-medium">На складі:</span> 
                    <span className={`ml-1 font-semibold ${
                      stockQuantity > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stockQuantity}
                    </span>
                  </span>
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

        {/* Кнопки справа */}
        <div className="ml-4 flex-shrink-0 flex flex-col gap-2">
          {!multiSelect && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSelect}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Вибрати
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onShowAllStock();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
          >
            📊 Залишки
          </Button>
        </div>
      </div>

      {/* Статусы */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
        <div className="flex items-center gap-2">
          {product.is_active === false && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full">
              Неактивний
            </span>
          )}
          {stockQuantity <= 0 && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full">
              Немає на складі
            </span>
          )}
          {stockQuantity > 0 && stockQuantity < 10 && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
              Мало на складі
            </span>
          )}
          {stockQuantity >= 10 && (
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
}

export default function ProductSelectionModal({ 
  isOpen, 
  onClose, 
  onProductSelect,
  onMultipleProductsSelect,
  multiSelect = false,
  selectedWarehouse
}: ProductSelectionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productGroups, setProductGroups] = useState<CategoryGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [stockData, setStockData] = useState<StockData>({});
  const [showAllStockModal, setShowAllStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadStockData();
      setSelectedProducts(new Set());
    }
  }, [isOpen, selectedWarehouse]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsResponse, groupsResponse] = await Promise.all([
        axios.get("products/"),
        axios.get("product-groups/")
      ]);

      console.log("Products loaded:", productsResponse.data);
      setProducts(productsResponse.data);
      setProductGroups(groupsResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockData = async () => {
    try {
      const response = await axios.get("stock/warehouses/");
      console.log("Stock data loaded:", response.data);
      setStockData(response.data);
    } catch (error) {
      console.error("Error loading stock data:", error);
      setStockData({});
    }
  };

  // Получение остатка товара на выбранном складе
  const getProductStock = (productId: number): number => {
    if (!selectedWarehouse || !stockData[selectedWarehouse.toString()]) {
      return 0;
    }
    
    const warehouseData = stockData[selectedWarehouse.toString()];
    const productStock = warehouseData.products?.find(p => p.product_id === productId);
    return productStock ? productStock.quantity : 0;
  };

  // Получение названия склада
  const getWarehouseName = (): string => {
    if (!selectedWarehouse || !stockData[selectedWarehouse.toString()]) {
      return "";
    }
    return stockData[selectedWarehouse.toString()].warehouse_name || "";
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.group_name && product.group_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGroup = !selectedGroupId || product.group_id === selectedGroupId;

    return matchesSearch && matchesGroup;
  });

  // Функция поиска групп по ID
  const findGroupById = (groups: CategoryGroup[], id: number): CategoryGroup | null => {
    for (const group of groups) {
      if (group.id === id) return group;
      if (group.children) {
        const found = findGroupById(group.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Конвертуємо CategoryGroup в формат для ProductCategoryTree
  const convertedProductGroups = productGroups.map(group => ({
    ...group,
    parent: group.parent ?? null
  }));

  // Подсчет товаров в группах
  const totalGroupsProducts = productGroups.reduce((sum, group) => sum + (group.products_count || 0), 0);

  const handleGroupSelect = (groupId: number | null) => {
    setSelectedGroupId(groupId);
  };

  const handleProductSelect = (product: Product) => {
    if (multiSelect) {
      const newSelected = new Set(selectedProducts);
      if (newSelected.has(product.id)) {
        newSelected.delete(product.id);
      } else {
        newSelected.add(product.id);
      }
      setSelectedProducts(newSelected);
    } else {
      onProductSelect(product);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (multiSelect && onMultipleProductsSelect) {
      const selectedProductsList = products.filter(product => 
        selectedProducts.has(product.id)
      );
      onMultipleProductsSelect(selectedProductsList);
    }
    onClose();
  };

  const resetFilters = () => {
    setSelectedGroupId(null);
    setSearchQuery("");
  };

  const selectAllVisible = () => {
    if (multiSelect) {
      const newSelected = new Set(selectedProducts);
      filteredProducts.forEach(product => {
        newSelected.add(product.id);
      });
      setSelectedProducts(newSelected);
    }
  };

  const handleShowAllStock = (product: Product) => {
    setSelectedProductForStock({ id: product.id, name: product.name });
    setShowAllStockModal(true);
  };

  const deselectAll = () => {
    if (multiSelect) {
      setSelectedProducts(new Set());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{zIndex: 999999}}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-300 dark:border-gray-600" style={{width: '95vw', height: '95vh', minWidth: '1200px', minHeight: '800px'}}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-t-xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {multiSelect ? "Вибір товарів" : "Вибір товару"}
            </h2>
            {multiSelect && selectedProducts.size > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Обрано товарів: {selectedProducts.size}
              </p>
            )}
            {selectedWarehouse && getWarehouseName() && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                📦 Склад: {getWarehouseName()}
              </p>
            )}
            {!selectedWarehouse && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                ⚠️ Склад не обрано - залишки не відображаються
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Пошук товару по назві, коду або групі..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={resetFilters} size="sm">
              Скинути фільтри
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedProductForStock({ id: 0, name: "Всі товари" });
                setShowAllStockModal(true);
              }} 
              size="sm"
            >
              📊 Всі залишки
            </Button>
            {multiSelect && (
              <>
                <Button variant="outline" onClick={selectAllVisible} size="sm">
                  Обрати видимі
                </Button>
                <Button variant="outline" onClick={deselectAll} size="sm">
                  Скинути вибір
                </Button>
              </>
            )}
          </div>
          
          {/* Selected group indicator */}
          {selectedGroupId && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Обрана група:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-sm">
                {findGroupById(convertedProductGroups, selectedGroupId)?.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Product Groups Tree */}
          <div className="border-r border-gray-200 dark:border-gray-700 overflow-auto" style={{width: '300px', flexShrink: 0}}>
            <ProductCategoryTree
              categories={convertedProductGroups as any}
              selectedCategoryId={selectedGroupId}
              onCategorySelect={handleGroupSelect}
              loading={loading}
            />
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-auto min-w-0">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Завантаження товарів...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      Товари не знайдені
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery || selectedGroupId 
                        ? "Спробуйте змінити фільтри пошуку" 
                        : "У цій категорії немає товарів"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      searchQuery={searchQuery}
                      isSelected={multiSelect && selectedProducts.has(product.id)}
                      multiSelect={multiSelect}
                      onSelect={() => handleProductSelect(product)}
                      stockQuantity={getProductStock(product.id)}
                      onShowAllStock={() => handleShowAllStock(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-xl flex-shrink-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Знайдено: {filteredProducts.length} з {products.length} товарів
            {productGroups.length > 0 && ` | Груп: ${productGroups.length}`}
            {totalGroupsProducts > 0 && ` | В групах: ${totalGroupsProducts}`}
            {multiSelect && selectedProducts.size > 0 && ` | Обрано: ${selectedProducts.size}`}
            {selectedWarehouse && getWarehouseName() && ` | ${getWarehouseName()}`}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            {multiSelect && (
              <Button 
                variant="primary" 
                onClick={handleConfirmSelection}
                disabled={selectedProducts.size === 0}
              >
                Додати обрані ({selectedProducts.size})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Модалка залишків по всім складам */}
      <AllStockModal
        isOpen={showAllStockModal}
        onClose={() => {
          setShowAllStockModal(false);
          setSelectedProductForStock(null);
        }}
        productId={selectedProductForStock?.id || null}
        productName={selectedProductForStock?.name || ""}
      />
    </div>
  );
}