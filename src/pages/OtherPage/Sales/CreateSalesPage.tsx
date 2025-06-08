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

type SaleForm = {
  doc_type: string;
  company: number;
  firm: number;
  warehouse: number | undefined;
  trade_point: number | undefined;
  customer: number | undefined;
  contract: number | undefined;
  auto_payment: boolean;
  items: SaleItem[];
};

type SaleItem = {
  product: number | undefined;
  product_name?: string;
  quantity: number;
  unit: number | undefined;
  unit_name?: string;
  price?: number;
  total?: number;
};

type Customer = {
  id: number;
  name: string;
};

type Warehouse = {
  id: number;
  name: string;
};

type TradePoint = {
  id: number;
  name: string;
};

type Contract = {
  id: number;
  name: string;
  customer: number;
  customer_name: string;
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
};

type Unit = {
  id: number;
  name: string;
};

export default function CreateSalePage() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<SaleForm>({
    doc_type: "sale",
    company: 1,
    firm: 1,
    warehouse: undefined,
    trade_point: undefined,
    customer: undefined,
    contract: undefined,
    auto_payment: true,
    items: [
      {
        product: undefined,
        quantity: 1,
        unit: undefined,
        price: 0,
        total: 0
      }
    ]
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tradePoints, setTradePoints] = useState<TradePoint[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
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
      console.log("- Customers:", `${axios.defaults.baseURL || ''}customers/`);
      console.log("- Warehouses:", `${axios.defaults.baseURL || ''}warehouses/`);
      console.log("- Trade Points:", `${axios.defaults.baseURL || ''}trade-points/`);
      console.log("- Units:", `${axios.defaults.baseURL || ''}units/`);

      const requests = [
        axios.get("customers/"),
        axios.get("warehouses/"),
        axios.get("trade-points/"),
        axios.get("units/")
      ];

      const results = await Promise.allSettled(requests);
      
      if (results[0].status === 'fulfilled') {
        console.log("✅ Customers loaded from API:", results[0].value.data);
        setCustomers(results[0].value.data);
      } else {
        console.error("❌ Error loading customers:", results[0].reason);
        setCustomers([]);
        toast.error("Не вдалося завантажити клієнтів");
      }

      if (results[1].status === 'fulfilled') {
        console.log("✅ Warehouses loaded from API:", results[1].value.data);
        setWarehouses(results[1].value.data);
      } else {
        console.error("❌ Error loading warehouses:", results[1].reason);
        setWarehouses([]);
        toast.error("Не вдалося завантажити склади");
      }

      if (results[2].status === 'fulfilled') {
        console.log("✅ Trade Points loaded from API:", results[2].value.data);
        setTradePoints(results[2].value.data);
      } else {
        console.error("❌ Error loading trade points:", results[2].reason);
        setTradePoints([]);
        toast.error("Не вдалося завантажити торгові точки");
      }

      if (results[3].status === 'fulfilled') {
        console.log("✅ Units loaded from API:", results[3].value.data);
        setUnits(results[3].value.data);
      } else {
        console.error("❌ Error loading units:", results[3].reason);
        setUnits([]);
        toast.error("Не вдалося завантажити одиниці виміру");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading dictionaries:", error);
      toast.error("Помилка завантаження довідників");
      setLoading(false);
    }
  };

  const loadContractsByCustomer = async (customerId: number) => {
    setLoadingContracts(true);
    setContracts([]);
    
    try {
      console.log(`Loading contracts for customer ${customerId}...`);
      const response = await axios.get(`contracts/by-customer/?id=${customerId}`);
      console.log("✅ Contracts loaded:", response.data);
      setContracts(response.data);
    } catch (error) {
      console.error("❌ Error loading contracts:", error);
      setContracts([]);
      toast.error("Не вдалося завантажити договори для цього клієнта");
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    const customerId = parseInt(value);
    setForm({ 
      ...form, 
      customer: customerId,
      contract: undefined
    });
    
    if (customerId) {
      loadContractsByCustomer(customerId);
    } else {
      setContracts([]);
    }
  };

  const handleWarehouseChange = (value: string) => {
    setForm({ ...form, warehouse: parseInt(value) });
  };

  const handleTradePointChange = (value: string) => {
    setForm({ ...form, trade_point: parseInt(value) });
  };

  const handleContractChange = (value: string) => {
    setForm({ ...form, contract: parseInt(value) });
  };

  const handleAutoPaymentChange = (checked: boolean) => {
    setForm({ ...form, auto_payment: checked });
  };

  const handleItemChange = (index: number, field: keyof SaleItem, value: string) => {
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
    } else if (field === 'unit') {
      const unitId = parseInt(value) || undefined;
      items[index] = { 
        ...items[index], 
        [field]: unitId
      };
      
      if (unitId) {
        const unit = units.find(u => u.id === unitId);
        items[index].unit_name = unit?.name || `Одиниця ID: ${unitId}`;
      }
    } else {
      const numericValue = parseFloat(value) || 0;
      items[index] = { 
        ...items[index], 
        [field]: numericValue 
      };
      
      if (field === 'quantity' || field === 'price') {
        const quantity = field === 'quantity' ? numericValue : items[index].quantity;
        const price = field === 'price' ? numericValue : (items[index].price || 0);
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
      unit: product.unit,
      unit_name: product.unit_name,
      price: product.price || 0,
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
        unit: product.unit,
        unit_name: product.unit_name,
        price: product.price || items[currentItemIndex].price || 0,
        total: items[currentItemIndex].quantity * (product.price || items[currentItemIndex].price || 0)
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
    const newItem: SaleItem = {
      product: undefined,
      quantity: 1,
      unit: undefined,
      price: 0,
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
    if (!form.customer || !form.warehouse || !form.trade_point || !form.contract) {
      toast.error("Заповніть усі обов'язкові поля ❗");
      return false;
    }

    const selectedCustomer = customers.find(c => c.id === form.customer);
    if (!selectedCustomer) {
      toast.error("Обраний клієнт не існує в системі ❗");
      return false;
    }

    const selectedWarehouse = warehouses.find(w => w.id === form.warehouse);
    if (!selectedWarehouse) {
      toast.error("Обраний склад не існує в системі ❗");
      return false;
    }

    const selectedTradePoint = tradePoints.find(tp => tp.id === form.trade_point);
    if (!selectedTradePoint) {
      toast.error("Обрана торгова точка не існує в системі ❗");
      return false;
    }

    const selectedContract = contracts.find(c => c.id === form.contract);
    if (!selectedContract) {
      toast.error("Обраний контракт не існує в системі ❗");
      return false;
    }
    
    if (selectedContract.customer !== form.customer) {
      toast.error("Обраний контракт не належить даному клієнту ❗");
      return false;
    }

    const hasEmptyItems = form.items.some(item => !item.product);
    if (hasEmptyItems) {
      toast.error("Оберіть товари для всіх позицій ❗");
      return false;
    }

    const hasEmptyUnits = form.items.some(item => !item.unit);
    if (hasEmptyUnits) {
      toast.error("Оберіть одиниці виміру для всіх позицій ❗");
      return false;
    }

    const hasInvalidQuantities = form.items.some(item => item.quantity <= 0);
    if (hasInvalidQuantities) {
      toast.error("Кількість товарів має бути більше нуля ❗");
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
      trade_point: form.trade_point,
      customer: form.customer,
      contract: form.contract,
      auto_payment: form.auto_payment,
      items: form.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unit: item.unit
      }))
    };

    console.log("Sending request:", requestBody);
    console.log("Available customers:", customers.map(c => ({ id: c.id, name: c.name })));
    console.log("Available contracts:", contracts.map(c => ({ id: c.id, name: c.name, customer: c.customer })));

    try {
      const response = await axios.post("document/", requestBody);
      console.log("✅ Document created successfully:", response.data);
      
      toast.success("Документ реалізації створено ✅");
      
      // Затримка перед переходом, щоб дати час серверу обробити запит
      setTimeout(() => {
        navigate("/sales");
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
      <PageMeta title="Новий документ реалізації | НашСофт" description="Створення документа реалізації товарів" />
      <PageBreadcrumb
        crumbs={[
          { label: "Документи реалізації", href: "/sales" },
          { label: "Новий документ" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Новий документ реалізації
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Заповніть форму для створення документа реалізації товарів
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/sales")}>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Клієнт *
              </label>
              {customers.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Клієнти не завантажені. Перевірте API.
                </div>
              ) : (
                <Select
                  options={customers.map(customer => ({
                    value: customer.id.toString(),
                    label: customer.name
                  }))}
                  placeholder="Оберіть клієнта"
                  onChange={handleCustomerChange}
                  defaultValue=""
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Контракт *
              </label>
              {!form.customer ? (
                <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
                  Спочатку оберіть клієнта
                </div>
              ) : loadingContracts ? (
                <div className="p-3 border border-blue-300 bg-blue-50 rounded-lg text-blue-700 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Завантаження договорів...
                </div>
              ) : contracts.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Договори для цього клієнта не знайдені
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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Торгова точка *
              </label>
              {tradePoints.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Торгові точки не завантажені. Перевірте API.
                </div>
              ) : (
                <Select
                  options={tradePoints.map(tradePoint => ({
                    value: tradePoint.id.toString(),
                    label: tradePoint.name
                  }))}
                  placeholder="Оберіть торгову точку"
                  onChange={handleTradePointChange}
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
                    Одиниця виміру *
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Ціна
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
                      {units.length === 0 ? (
                        <div className="text-sm text-red-600">Одиниці не завантажені</div>
                      ) : (
                        <Select
                          options={units.map(unit => ({
                            value: unit.id.toString(),
                            label: unit.name
                          }))}
                          placeholder="Оберіть"
                          onChange={(value) => handleItemChange(index, 'unit', value)}
                          defaultValue={item.unit?.toString() || ""}
                        />
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={(item.price || 0).toString()}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm font-medium">{formatPrice(item.total || 0)}</span>
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
              <div className="border-t border-gray-300 pt-2 dark:border-white/20">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800 dark:text-white">Загальна сума:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatPrice(getTotalAmount())}
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
        description="Ви впевнені, що хочете створити цей документ реалізації?"
        onConfirm={() => {
          setShowSaveModal(false);
          handleSave();
        }}
        onClose={() => setShowSaveModal(false)}
      />
    </>
  );
}