import { useState, useEffect } from "react";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import ProductList from "./ProductList";
import ProductCategoryTree from "./ProductCategoryTree";

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

type ProductStockData = {
  product_id: number;
  total_quantity: number;
  warehouses: {
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
  }[];
};

// Компонент модалки залишків по всім складам для конкретного товару
function ProductStockModal({ 
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
  const [stockData, setStockData] = useState<ProductStockData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId !== null) {
      loadProductStockData();
    }
  }, [isOpen, productId]);

  const loadProductStockData = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`stock/product/${productId}/`);
      console.log("Product stock data loaded:", response.data);
      setStockData(response.data);
    } catch (error) {
      console.error("Error loading product stock data:", error);
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{zIndex: 9999999}}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-600 max-w-2xl w-full max-h-[80vh] flex flex-col">
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
          ) : !stockData ? (
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
            <div className="space-y-4">
              {/* Загальний залишок */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800 dark:text-blue-400">
                    Загальний залишок:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stockData.total_quantity}
                  </span>
                </div>
              </div>

              {/* Залишки по складах */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 dark:text-white mb-3">
                  По складах:
                </h4>
                {stockData.warehouses.map((warehouse, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {warehouse.warehouse_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID складу: {warehouse.warehouse_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        warehouse.quantity > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {warehouse.quantity}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {warehouse.quantity > 0 ? 'В наявності' : 'Відсутній'}
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productGroups, setProductGroups] = useState<CategoryGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<{id: number, name: string} | null>(null);
  const [productsStock, setProductsStock] = useState<{[key: number]: number}>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setGroupsLoading(true);
      
      const [productsResponse, groupsResponse] = await Promise.all([
        axios.get("products/"),
        axios.get("product-groups/")
      ]);

      setProducts(productsResponse.data);
      setProductGroups(groupsResponse.data);
      
      // Завантажуємо залишки для всіх товарів
      loadProductsStock(productsResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Не вдалося завантажити дані");
      setProducts([]);
      setProductGroups([]);
    } finally {
      setLoading(false);
      setGroupsLoading(false);
    }
  };

  const loadProductsStock = async (productsList: Product[]) => {
    try {
      const stockPromises = productsList.map(product => 
        axios.get(`stock/product/${product.id}/`)
          .then(response => ({ 
            productId: product.id, 
            totalQuantity: response.data.total_quantity || 0 
          }))
          .catch(() => ({ 
            productId: product.id, 
            totalQuantity: 0 
          }))
      );

      const stockResults = await Promise.all(stockPromises);
      const stockMap: {[key: number]: number} = {};
      
      stockResults.forEach(result => {
        stockMap[result.productId] = result.totalQuantity;
      });

      setProductsStock(stockMap);
    } catch (error) {
      console.error("Error loading products stock:", error);
    }
  };

  const handleProductSelect = (product: Product) => {
    console.log("Selected product:", product);
    toast.success(`Обрано товар: ${product.name}`);
  };

  const handleShowAllStock = (product: Product) => {
    setSelectedProductForStock({ id: product.id, name: product.name });
    setShowStockModal(true);
  };

  const handleGroupSelect = (groupId: number | null) => {
    setSelectedGroupId(groupId);
  };

  const getFilteredProducts = (): Product[] => {
    let filtered = products;

    // Фільтрація по групі
    if (selectedGroupId) {
      filtered = filtered.filter(product => product.group_id === selectedGroupId);
    }

    // Фільтрація по пошуковому запиту
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.code?.toLowerCase().includes(query) ||
        product.group_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Функція для знаходження групи по ID
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

  const resetFilters = () => {
    setSelectedGroupId(null);
    setSearchQuery("");
  };

  const totalGroupsProducts = productGroups.reduce((sum, group) => sum + (group.products_count || 0), 0);

  return (
    <>
      <PageMeta title="Товари | НашСофт" description="Управління товарами" />
      <PageBreadcrumb
        crumbs={[
          { label: "Товари" }
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Товари
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управління товарами та послугами
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            Оновити
          </Button>
          <Button variant="primary" size="sm">
            Додати товар
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Пошук товару за назвою, кодом, категорією або групою..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={resetFilters}
            size="sm"
          >
            Скинути фільтри
          </Button>
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
        
        <div className="mt-3 text-sm text-gray-500">
          Знайдено: {filteredProducts.length} з {products.length} товарів
          {productGroups.length > 0 && ` | Груп: ${productGroups.length}`}
          {totalGroupsProducts > 0 && ` | В групах: ${totalGroupsProducts}`}
        </div>
      </div>

      {/* Main Content with Tree and Products */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden flex" style={{height: 'calc(100vh - 280px)'}}>
        {/* Product Groups Tree */}
        <div className="border-r border-gray-200 dark:border-gray-700 overflow-auto" style={{width: '320px', flexShrink: 0}}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
              Групи товарів
            </h3>
          </div>
          <ProductCategoryTree
            categories={convertedProductGroups as any}
            selectedCategoryId={selectedGroupId}
            onCategorySelect={handleGroupSelect}
            loading={groupsLoading}
          />
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ProductList
            products={filteredProducts}
            onProductSelect={handleProductSelect}
            onShowAllStock={handleShowAllStock}
            productsStock={productsStock}
            loading={loading}
            searchQuery={searchQuery}
            showStockInfo={true}
          />
        </div>
      </div>

      {/* Модалка залишків для конкретного товару */}
      <ProductStockModal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setSelectedProductForStock(null);
        }}
        productId={selectedProductForStock?.id || null}
        productName={selectedProductForStock?.name || ""}
      />
    </>
  );
}