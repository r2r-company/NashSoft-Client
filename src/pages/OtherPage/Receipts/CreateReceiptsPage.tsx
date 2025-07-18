import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";
import ProductSelectionModal from "../Products/ProductSelectionModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

type ReceiptForm = {
  doc_type: string;
  company: number;
  firm: number;
  warehouse: number | undefined;
  supplier: number | undefined;
  contract: number | undefined;
  auto_payment: boolean;
  items: ReceiptItem[];
};

type ReceiptItem = {
  product: number | undefined;
  product_name?: string;
  quantity: number;
  price: number;
  vat_percent: number;
  total: number;
};

type Supplier = {
  id: number;
  name: string;
};

type Warehouse = {
  id: number;
  name: string;
};

type Contract = {
  id: number;
  name: string;
  supplier: number;
  supplier_name: string;
  client?: number;
  payment_type: number;
  payment_type_name: string;
  account: number;
  account_name: string;
  contract_type: string;
  doc_file: string | null;
  is_active: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
};

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
  category_id?: number;
  product_group?: number;
  product_group_name?: string;
};

export default function CreateReceiptPage() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<ReceiptForm>({
    doc_type: "receipt",
    company: 1,
    firm: 1,
    warehouse: undefined,
    supplier: undefined,
    contract: undefined,
    auto_payment: true,
    items: [
      {
        product: undefined,
        quantity: 1,
        price: 0,
        vat_percent: 0,
        total: 0
      }
    ]
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      console.log("Loading data from URLs:");
      console.log("- Suppliers:", `${axios.defaults.baseURL || ''}suppliers/`);
      console.log("- Warehouses:", `${axios.defaults.baseURL || ''}warehouses/`);

      const requests = [
        axios.get("suppliers/"),
        axios.get("warehouses/")
      ];

      const results = await Promise.allSettled(requests);
      
      if (results[0].status === 'fulfilled') {
        console.log("✅ Suppliers loaded from API:", results[0].value.data);
        setSuppliers(results[0].value.data);
      } else {
        console.error("❌ Error loading suppliers:", results[0].reason);
        setSuppliers([]);
        toast.error("Не вдалося завантажити постачальників");
      }

      if (results[1].status === 'fulfilled') {
        console.log("✅ Warehouses loaded from API:", results[1].value.data);
        setWarehouses(results[1].value.data);
      } else {
        console.error("❌ Error loading warehouses:", results[1].reason);
        setWarehouses([]);
        toast.error("Не вдалося завантажити склади");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading dictionaries:", error);
      toast.error("Помилка завантаження довідників");
      setLoading(false);
    }
  };

  const loadContractsBySupplier = async (supplierId: number) => {
    setLoadingContracts(true);
    setContracts([]);
    
    try {
      console.log(`Loading contracts for supplier ${supplierId}...`);
      const response = await axios.get(`contracts/by-supplier/?id=${supplierId}`);
      console.log("✅ Contracts loaded:", response.data);
      setContracts(response.data);
    } catch (error) {
      console.error("❌ Error loading contracts:", error);
      setContracts([]);
      toast.error("Не вдалося завантажити договори для цього постачальника");
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleSupplierChange = (value: string) => {
    const supplierId = parseInt(value);
    setForm({ 
      ...form, 
      supplier: supplierId,
      contract: undefined
    });
    
    if (supplierId) {
      loadContractsBySupplier(supplierId);
    } else {
      setContracts([]);
    }
  };

  const handleWarehouseChange = (value: string) => {
    setForm({ ...form, warehouse: parseInt(value) });
  };

  const handleContractChange = (value: string) => {
    setForm({ ...form, contract: parseInt(value) });
  };

  const handleAutoPaymentChange = (checked: boolean) => {
    setForm({ ...form, auto_payment: checked });
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: string) => {
    const items = [...form.items];
    
    if (field === 'product') {
      const productId = parseInt(value) || undefined;
      items[index] = { 
        ...items[index], 
        [field]: productId
      };
      
      if (productId) {
        items[index].product_name = `Товар ID: ${productId}`;
      }
    } else {
      const numericValue = parseFloat(value) || 0;
      items[index] = { 
        ...items[index], 
        [field]: numericValue 
      };
      
      if (field === 'quantity' || field === 'price') {
        const quantity = field === 'quantity' ? numericValue : items[index].quantity;
        const price = field === 'price' ? numericValue : items[index].price;
        items[index].total = quantity * price;
      }
    }
    
    setForm({ ...form, items });
  };

  const handleMultipleProductsSelect = (products: Product[]) => {
    const newItems = products.map(product => ({
      product: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price || 0,
      vat_percent: 0,
      total: 1 * (product.price || 0)
    }));

    setForm({ 
      ...form, 
      items: [...form.items.filter(item => item.product), ...newItems]
    });
    setShowProductModal(false);
    setCurrentItemIndex(-1);
  };

  const handleProductSelect = (product: Product) => {
    if (currentItemIndex >= 0) {
      const items = [...form.items];
      items[currentItemIndex] = {
        ...items[currentItemIndex],
        product: product.id,
        product_name: product.name,
        price: product.price || items[currentItemIndex].price,
        total: items[currentItemIndex].quantity * (product.price || items[currentItemIndex].price)
      };
      setForm({ ...form, items });
    }
    setShowProductModal(false);
    setCurrentItemIndex(-1);
  };

  const openProductModal = (itemIndex: number) => {
    setCurrentItemIndex(itemIndex);
    setShowProductModal(true);
  };

  const openMultiProductModal = () => {
    setCurrentItemIndex(-1);
    setShowProductModal(true);
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      product: undefined,
      quantity: 1,
      price: 0,
      vat_percent: 0,
      total: 0
    };
    setForm({ 
      ...form, 
      items: [...form.items, newItem] 
    });
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) {
      toast.error("Має бути хоча б один товар");
      return;
    }
    const items = [...form.items];
    items.splice(index, 1);
    setForm({ ...form, items });
  };

  const validateForm = (): boolean => {
    if (!form.supplier || !form.warehouse || !form.contract) {
      toast.error("Заповніть усі обов'язкові поля ❗");
      return false;
    }

    const selectedSupplier = suppliers.find(s => s.id === form.supplier);
    if (!selectedSupplier) {
      toast.error("Обраний постачальник не існує в системі ❗");
      return false;
    }

    const selectedWarehouse = warehouses.find(w => w.id === form.warehouse);
    if (!selectedWarehouse) {
      toast.error("Обраний склад не існує в системі ❗");
      return false;
    }

    const selectedContract = contracts.find(c => c.id === form.contract);
    if (!selectedContract) {
      toast.error("Обраний контракт не існує в системі ❗");
      return false;
    }
    
    if (selectedContract.supplier !== form.supplier) {
      toast.error("Обраний контракт не належить даному постачальнику ❗");
      return false;
    }

    const hasEmptyItems = form.items.some(item => !item.product);
    if (hasEmptyItems) {
      toast.error("Оберіть товари для всіх позицій ❗");
      return false;
    }

    const hasInvalidQuantities = form.items.some(item => item.quantity <= 0);
    if (hasInvalidQuantities) {
      toast.error("Кількість товарів має бути більше нуля ❗");
      return false;
    }

    const hasInvalidPrices = form.items.some(item => item.price < 0);
    if (hasInvalidPrices) {
      toast.error("Ціна товарів не може бути від'ємною ❗");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    const requestBody = {
      doc_type: form.doc_type,
      company: form.company,
      firm: form.firm,
      warehouse: form.warehouse,
      supplier: form.supplier,
      contract: form.contract,
      auto_payment: form.auto_payment,
      items: form.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        vat_percent: item.vat_percent
      }))
    };

    console.log("Sending request:", requestBody);
    console.log("Available suppliers:", suppliers.map(s => ({ id: s.id, name: s.name })));
    console.log("Available contracts:", contracts.map(c => ({ id: c.id, name: c.name, supplier: c.supplier })));

    try {
      const response = await axios.post("document/", requestBody);
      console.log("✅ Document created successfully:", response.data);
      
      toast.success("Документ поступлення створено ✅");
      
      // Затримка перед переходом, щоб дати час серверу обробити запит
      setTimeout(() => {
        // Варіант 1: Повернутися до списку документів (найбезпечніший)
        navigate("/receipts");
        
        // Варіант 2: Перейти до перегляду документа з затримкою (закоментований)
        // navigate(`/receipts/${response.data.id}`);
        
        // Варіант 3: Перезавантажити сторінку зі списком з hash для показу створеного документа (закоментований)
        // navigate(`/receipts#document-${response.data.id}`);
      }, 500);
      
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            data?: any; 
            status?: number;
            statusText?: string;
          } 
        };
        
        console.error("API Error:", axiosError.response?.data);
        console.error("Status:", axiosError.response?.status);
        
        if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
          const errorData = axiosError.response.data;
          
          let errorMessage = "Помилка валідації від сервера:\n";
          
          Object.keys(errorData).forEach(field => {
            const fieldErrors = errorData[field];
            if (Array.isArray(fieldErrors)) {
              errorMessage += `• ${field}: ${fieldErrors.join(', ')}\n`;
            }
          });
          
          toast.error(errorMessage);
        } else {
          toast.error(`Помилка при створенні документа: ${axiosError.response?.statusText || 'Невідома помилка'}`);
        }
      } else {
        console.error("Unknown error:", error);
        toast.error("Помилка при створенні документа ❌");
      }
    } finally {
      setSaving(false);
    }
  };

  const getTotalAmount = () => {
    return form.items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const getTotalVAT = () => {
    return form.items.reduce((sum, item) => sum + (item.total * item.vat_percent / 100), 0);
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ₴`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Завантаження довідників...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Новий документ поступлення | НашСофт" description="Створення документа поступлення товарів" />
      <PageBreadcrumb
        crumbs={[
          { label: "Документи поступлення", href: "/receipts" },
          { label: "Новий документ" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Новий документ поступлення
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Заповніть форму для створення документа поступлення товарів
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/receipts")}>
            Скасувати
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowSaveModal(true)} disabled={saving}>
            {saving ? "Збереження..." : "Зберегти документ"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Основна інформація */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Основна інформація
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Постачальник *
              </label>
              {suppliers.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Постачальники не завантажені. Перевірте API.
                </div>
              ) : (
                <Select
                  options={suppliers.map(supplier => ({
                    value: supplier.id.toString(),
                    label: supplier.name
                  }))}
                  placeholder="Оберіть постачальника"
                  onChange={handleSupplierChange}
                  defaultValue=""
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Контракт *
              </label>
              {!form.supplier ? (
                <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
                  Спочатку оберіть постачальника
                </div>
              ) : loadingContracts ? (
                <div className="p-3 border border-blue-300 bg-blue-50 rounded-lg text-blue-700 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Завантаження договорів...
                </div>
              ) : contracts.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Договори для цього постачальника не знайдені
                </div>
              ) : (
                <Select
                  options={contracts.map(contract => ({
                    value: contract.id.toString(),
                    label: `${contract.name} (${contract.contract_type}) - ${contract.status}`
                  }))}
                  placeholder="Оберіть контракт"
                  onChange={handleContractChange}
                  defaultValue=""
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Склад *
              </label>
              {warehouses.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Склади не завантажені. Перевірте API.
                </div>
              ) : (
                <Select
                  options={warehouses.map(warehouse => ({
                    value: warehouse.id.toString(),
                    label: warehouse.name
                  }))}
                  placeholder="Оберіть склад"
                  onChange={handleWarehouseChange}
                  defaultValue=""
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_payment"
              checked={form.auto_payment}
              onChange={(e) => handleAutoPaymentChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="auto_payment" className="text-sm text-gray-700 dark:text-white">
              Автоматична оплата
            </label>
          </div>
        </div>

        {/* Товари */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Позиції документа
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openMultiProductModal}>
                Додати декілька товарів
              </Button>
              <Button variant="outline" size="sm" onClick={addItem}>
                Додати товар
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
            <Table>
              <TableHeader>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Товар *
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Кількість
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Ціна
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    ПДВ (%)
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Сума
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Дії
                  </TableCell>
                </tr>
              </TableHeader>

              <TableBody>
                {form.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-white/10">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {item.product_name ? (
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                              <div className="font-medium text-sm">{item.product_name}</div>
                              <div className="text-xs text-gray-500">
                                ID: {item.product}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-center text-gray-500">
                              Товар не обрано
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openProductModal(index)}
                        >
                          {item.product_name ? "Змінити" : "Обрати"}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.price.toString()}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.vat_percent.toString()}
                        onChange={(e) => handleItemChange(index, 'vat_percent', e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm font-medium">{formatPrice(item.total)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={form.items.length <= 1}
                      >
                        Видалити
                      </Button>
                    </TableCell>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Підсумки */}
          <div className="mt-6 flex justify-end">
            <div className="w-80 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Кількість позицій:</span>
                <span className="font-medium">{form.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Сума без ПДВ:</span>
                <span className="font-medium">{formatPrice(getTotalAmount())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Сума ПДВ:</span>
                <span className="font-medium">{formatPrice(getTotalVAT())}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 dark:border-white/20">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800 dark:text-white">Загальна сума:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatPrice(getTotalAmount() + getTotalVAT())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка вибору товару */}
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setCurrentItemIndex(-1);
        }}
        onProductSelect={handleProductSelect}
        onMultipleProductsSelect={handleMultipleProductsSelect}
        multiSelect={currentItemIndex === -1}
        selectedWarehouse={form.warehouse}
      />

      {/* Модальне вікно підтвердження */}
      <ConfirmModal
        isOpen={showSaveModal}
        title="Зберегти документ?"
        description="Ви впевнені, що хочете створити цей документ поступлення?"
        onConfirm={() => {
          setShowSaveModal(false);
          handleSave();
        }}
        onClose={() => setShowSaveModal(false)}
      />
    </>
  );
}