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

type PriceSettingForm = {
  firm_id: number | undefined;
  date: string;
  description: string;
  base_type: 'product' | 'product_group';
  base_group: number | undefined;
  trade_points: number[];
  items: PriceSettingItem[];
};

type PriceSettingItem = {
  product: number | undefined;
  product_name?: string;
  price: number; // базова ціна з системи
  old_price: number; // стара ціна для порівняння  
  new_price: number; // нова ціна, яку встановлюємо
  price_type: number;
  vat_percent: number;
  vat_included: boolean;
  markup_percent: number;
  unit: number;
  unit_conversion: number;
  reason: string; // причина зміни ціни
  price_change_type: 'set' | 'increase' | 'decrease'; // тип зміни ціни
};

type Firm = {
  id: number;
  name: string;
  company: string;
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

export default function CreatePriceSettingPage() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<PriceSettingForm>({
    firm_id: undefined,
    date: new Date().toISOString().split('T')[0],
    description: '',
    base_type: 'product',
    base_group: undefined,
    trade_points: [1],
    items: [
  {
    product: undefined,
    price: 0,
    old_price: 0,
    new_price: 0,
    price_type: 1,
    vat_percent: 20,
    vat_included: true,
    markup_percent: 0,
    unit: 1,
    unit_conversion: 1,
    reason: '',
    price_change_type: 'set' as const
  }
]
  });

  const [firms, setFirms] = useState<Firm[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const priceChangeTypeOptions = [
    { value: "set", label: "Встановити ціну" },
    { value: "increase", label: "Підвищити ціну" },
    { value: "decrease", label: "Знизити ціну" },
  ];

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      console.log("Loading firms from API...");
      const response = await axios.get("firms/");
      console.log("✅ Firms loaded:", response.data);
      setFirms(response.data);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error loading firms:", error);
      setFirms([]);
      toast.error("Не вдалося завантажити фірми");
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFirmSelectChange = (value: string) => {
    setForm(prev => ({ ...prev, firm_id: parseInt(value) }));
  };

  const handleItemChange = (index: number, field: keyof PriceSettingItem, value: string | number | boolean) => {
  const items = [...form.items];
  
  if (field === 'product') {
    const productId = parseInt(value as string) || undefined;
    items[index] = { 
      ...items[index], 
      [field]: productId
    };
    
    if (productId) {
      items[index].product_name = `Товар ID: ${productId}`;
    }
  } else if (typeof value === 'string' && (
    field === 'price' || field === 'old_price' || field === 'new_price' || 
    field === 'vat_percent' || field === 'markup_percent' || 
    field === 'unit' || field === 'unit_conversion' || field === 'price_type'
  )) {
    const numericValue = parseFloat(value) || 0;
    items[index] = { 
      ...items[index], 
      [field]: numericValue 
    };
  } else {
    items[index] = { 
      ...items[index], 
      [field]: value 
    };
  }
  
  setForm(prev => ({ ...prev, items }));
};

  const handleMultipleProductsSelect = (products: Product[]) => {
  const newItems = products.map(product => ({
    product: product.id,
    product_name: product.name,
    price: product.price || 0,
    old_price: product.price || 0,
    new_price: product.price || 0,
    price_type: 1,
    vat_percent: 20,
    vat_included: true,
    markup_percent: 0,
    unit: product.unit || 1,
    unit_conversion: 1,
    reason: '',
    price_change_type: 'set' as const
  }));

  setForm(prev => ({ 
    ...prev, 
    items: [...prev.items.filter(item => item.product), ...newItems]
  }));
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
      old_price: product.price || items[currentItemIndex].old_price,
      new_price: product.price || items[currentItemIndex].new_price,
      unit: product.unit || 1
    };
    setForm(prev => ({ ...prev, items }));
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
  const newItem: PriceSettingItem = {
    product: undefined,
    price: 0,
    old_price: 0,
    new_price: 0,
    price_type: 1,
    vat_percent: 20,
    vat_included: true,
    markup_percent: 0,
    unit: 1,
    unit_conversion: 1,
    reason: '',
    price_change_type: 'set' as const
  };
  setForm(prev => ({ 
    ...prev, 
    items: [...prev.items, newItem] 
  }));
};

  const removeItem = (index: number) => {
    if (form.items.length <= 1) {
      toast.error("Має бути хоча б один товар");
      return;
    }
    const items = [...form.items];
    items.splice(index, 1);
    setForm(prev => ({ ...prev, items }));
  };

  const validateForm = (): boolean => {
    console.log("=== VALIDATION ===");
    console.log("Validating form:", form);
    
    if (!form.firm_id) {
      toast.error("Оберіть фірму ❗");
      return false;
    }

    const selectedFirm = firms.find(f => f.id === form.firm_id);
    if (!selectedFirm) {
      toast.error("Обрана фірма не існує в системі ❗");
      console.log("Available firms:", firms);
      console.log("Selected firm ID:", form.firm_id);
      return false;
    }

    if (!form.date) {
      toast.error("Вкажіть дату документа ❗");
      return false;
    }

    if (form.items.length === 0) {
      toast.error("Додайте хоча б один товар ❗");
      return false;
    }

    const hasEmptyItems = form.items.some(item => !item.product);
    if (hasEmptyItems) {
      toast.error("Оберіть товари для всіх позицій ❗");
      console.log("Items with missing products:", form.items.filter(item => !item.product));
      return false;
    }

    const hasInvalidPrices = form.items.some(item => item.new_price < 0 || item.new_price === null || item.new_price === undefined);
    if (hasInvalidPrices) {
      toast.error("Нова ціна товарів має бути додатною ❗");
      console.log("Items with invalid prices:", form.items.filter(item => item.new_price < 0 || item.new_price === null || item.new_price === undefined));
      return false;
    }

    const hasEmptyReasons = form.items.some(item => !item.reason || !item.reason.trim());
    if (hasEmptyReasons) {
      toast.error("Вкажіть причину зміни ціни для всіх товарів ❗");
      console.log("Items with missing reasons:", form.items.filter(item => !item.reason || !item.reason.trim()));
      return false;
    }

    console.log("✅ Form validation passed");
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    const requestBody = {
      company: 1,
      firm: Number(form.firm_id),
      valid_from: String(form.date),
      status: "draft",
      base_type: "product_group", // або "product" залежно від логіки
      base_group: 2, // ID групи товарів
      trade_points: [1], // ID торгових точок
      items: form.items.map(item => ({
  product: Number(item.product),
  price_type: 1,
  price: Number(item.new_price), // використовуємо new_price
  vat_percent: 20,
  vat_included: true,
  markup_percent: item.old_price > 0 ? 
    Math.round(((item.new_price - item.old_price) / item.old_price) * 100) : 0,
  unit: 1,
  unit_conversion: 1
}))
    };

    console.log("=== DEBUG INFO ===");
    console.log("Form state:", form);
    console.log("Selected firm ID:", form.firm_id);
    console.log("Selected firm object:", firms.find(f => f.id === form.firm_id));
    console.log("Date:", form.date);
    console.log("Items count:", form.items.length);
    console.log("Request body being sent:", JSON.stringify(requestBody, null, 2));

    try {
      const response = await axios.post("create-price-setting-document/", requestBody);
      console.log("✅ Price setting document created successfully:", response.data);
      toast.success("Документ ціноутворення створено ✅");
      setTimeout(() => {
        navigate("/price-setting");
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
          console.log("❌ Validation errors from server:", errorData);
          
          let errorMessage = "Помилки валідації:\n";
          
          Object.keys(errorData).forEach(field => {
            const fieldErrors = errorData[field];
            if (Array.isArray(fieldErrors)) {
              errorMessage += `• ${field}: ${fieldErrors.join(', ')}\n`;
            } else if (typeof fieldErrors === 'string') {
              errorMessage += `• ${field}: ${fieldErrors}\n`;
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

  // Розрахунок відсотка зміни ціни
  const calculatePriceChange = (oldPrice: number, newPrice: number): string => {
    if (oldPrice === 0) return "N/A";
    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
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
      <PageMeta title="Новий документ ціноутворення | НашСофт" description="Створення документа ціноутворення" />
      <PageBreadcrumb
        crumbs={[
          { label: "Ціноутворення", href: "/price-setting" },
          { label: "Новий документ" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Новий документ ціноутворення
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Заповніть форму для зміни цін на товари
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/price-setting")}>
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
                Фірма *
              </label>
              {firms.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Фірми не завантажені. Перевірте API.
                </div>
              ) : (
                <Select
                  options={firms.map(firm => ({
                    value: firm.id.toString(),
                    label: `${firm.name} (${firm.company})`
                  }))}
                  placeholder="Оберіть фірму"
                  onChange={handleFirmSelectChange}
                  defaultValue=""
                />
              )}
            </div>

            <div>
              <Input
                label="Дата документа *"
                name="date"
                type="date"
                value={form.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Опис документа
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Опис причин зміни цін..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Товари та ціни */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Зміна цін на товари
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
                    Стара ціна (₴)
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Нова ціна (₴) *
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Зміна
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Тип зміни
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Причина зміни *
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
                        value={item.old_price.toString()}
                        onChange={(e) => handleItemChange(index, 'old_price', e.target.value)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.new_price.toString()}
                        onChange={(e) => handleItemChange(index, 'new_price', e.target.value)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          item.new_price > item.old_price 
                            ? 'text-red-600 bg-red-50' 
                            : item.new_price < item.old_price 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-gray-600 bg-gray-50'
                        }`}>
                          {item.old_price > 0 ? calculatePriceChange(item.old_price, item.new_price) : 'N/A'}
                        </span>
                        <span className={`text-xs mt-1 ${
                          item.new_price > item.old_price 
                            ? 'text-red-500' 
                            : item.new_price < item.old_price 
                              ? 'text-green-500' 
                              : 'text-gray-500'
                        }`}>
                          {item.new_price !== item.old_price ? formatPrice(Math.abs(item.new_price - item.old_price)) : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <select
                        value={item.price_change_type}
                        onChange={(e) => handleItemChange(index, 'price_change_type', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {priceChangeTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="text"
                        value={item.reason}
                        onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                        placeholder="Причина зміни ціни"
                        className="w-48"
                      />
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
                <span className="text-gray-600 dark:text-gray-400">Підвищення цін:</span>
                <span className="font-medium text-red-600">
                  {form.items.filter(item => item.new_price > item.old_price).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Зниження цін:</span>
                <span className="font-medium text-green-600">
                  {form.items.filter(item => item.new_price < item.old_price).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Без змін:</span>
                <span className="font-medium text-gray-600">
                  {form.items.filter(item => item.new_price === item.old_price).length}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 dark:border-white/20">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800 dark:text-white">Середня зміна:</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {form.items.length > 0 && form.items.every(item => item.old_price > 0) 
                      ? `${(form.items.reduce((sum, item) => sum + ((item.new_price - item.old_price) / item.old_price * 100), 0) / form.items.length).toFixed(1)}%`
                      : 'N/A'
                    }
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
        selectedWarehouse={undefined} // Для ціноутворення склад не потрібен
      />

      {/* Модальне вікно підтвердження */}
      <ConfirmModal
        isOpen={showSaveModal}
        title="Зберегти документ ціноутворення?"
        description="Ви впевнені, що хочете створити цей документ зміни цін? Документ буде збережено як чернетка."
        onConfirm={() => {
          setShowSaveModal(false);
          handleSave();
        }}
        onClose={() => setShowSaveModal(false)}
      />
    </>
  );
}