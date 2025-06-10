import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Product } from "../../OtherPage/Products/type/Product";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

type PriceSettingForm = {
  company: number;
  firm: number;
  valid_from: string;
  payment_type: string; // 'cash' | 'cashless' | 'both'
  base_type: string;
  base_receipt: number | undefined;
  base_group: number | undefined;
  base_price_type: number | undefined;
  trade_points: number[];
  items: PriceSettingItem[];
  // Нові поля для покращення функціональності
  currency: string;
  rounding_rule: 'kopeck' | 'hryvnia' | 'none';
  auto_apply_markup: boolean;
  default_markup_percent: number;
};

// Нова структура для inline редагування
type PriceSettingItem = {
  product: number | undefined;
  product_name?: string;
  product_unit?: string;
  unit: number;
  unit_name?: string;
  unit_conversion: number | null;
  group_id?: number;
  group_name?: string;
  base_price: number;
  cost_price?: number; // Собівартість для контролю рентабельності
  vat_percent: number;
  vat_included: boolean;
  min_price?: number; // Мінімальна ціна продажу
  max_discount_percent?: number; // Максимальний відсоток знижки
  // Об'єкт цін для кожної торгової точки та типу ціни
  prices: PriceData[];
};

type PriceData = {
  trade_point: number;
  trade_point_name?: string;
  price_type: number;
  price_type_name?: string;
  price: number;
  markup_percent: number;
  margin_percent?: number; // Відсоток маржі
  is_active: boolean;
  effective_from?: string; // Дата початку дії ціни
  effective_to?: string; // Дата закінчення дії ціни
};

type Company = {
  id: number;
  name: string;
};

type Firm = {
  id: number;
  name: string;
  company: number;
};

type TradePoint = {
  id: number;
  name: string;
  firm: number;
  address?: string;
};

type PriceType = {
  id: number;
  name: string;
  is_retail: boolean;
  is_wholesale: boolean;
  default_markup?: number; // Стандартна націнка для типу ціни
};

type ProductGroup = {
  id: number;
  name: string;
  parent?: number;
  default_markup?: number; // Стандартна націнка для групи
};

type Receipt = {
  id: number;
  doc_number: string;
  date: string;
  supplier_name: string;
  status: string;
};


export default function CreatePriceSettingsPage() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<PriceSettingForm>({
    company: 1,
    firm: 1,
    valid_from: new Date().toISOString().split('T')[0],
    payment_type: 'both',
    base_type: '',
    base_receipt: undefined,
    base_group: undefined,
    base_price_type: undefined,
    trade_points: [],
    items: [],
    // Нові поля
    currency: 'UAH',
    rounding_rule: 'kopeck',
    auto_apply_markup: false,
    default_markup_percent: 20
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [tradePoints, setTradePoints] = useState<TradePoint[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState<number | null>(null);
  
  const [loadingData, setLoadingData] = useState({
    firms: false,
    tradePoints: false,
    receipts: false
  });

  useEffect(() => {
    loadDictionaries();
  }, []);

  // Функція округлення ціни згідно з правилами
  const roundPrice = useCallback((price: number): number => {
    switch (form.rounding_rule) {
      case 'hryvnia':
        return Math.round(price);
      case 'kopeck':
        return Math.round(price * 100) / 100;
      case 'none':
      default:
        return price;
    }
  }, [form.rounding_rule]);

  // Обчислення маржі
  const calculateMargin = useCallback((sellingPrice: number, costPrice: number): number => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  }, []);

  // Обчислення націнки
  const calculateMarkup = useCallback((sellingPrice: number, costPrice: number): number => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  }, []);

  // Підрахунок загальної статистики
  const priceStatistics = useMemo(() => {
    const totalItems = form.items.length;
    const totalPrices = form.items.reduce((sum, item) => sum + item.prices.length, 0);
    const activePrices = form.items.reduce((sum, item) => 
      sum + item.prices.filter(p => p.is_active && p.price > 0).length, 0
    );
    
    let totalRevenue = 0;
    let totalCost = 0;
    let lowMarginItems = 0;

    form.items.forEach(item => {
      const activePricesForItem = item.prices.filter(p => p.is_active && p.price > 0);
      if (activePricesForItem.length > 0 && item.cost_price) {
        const avgPrice = activePricesForItem.reduce((sum, p) => sum + p.price, 0) / activePricesForItem.length;
        totalRevenue += avgPrice;
        totalCost += item.cost_price;
        
        const margin = calculateMargin(avgPrice, item.cost_price);
        if (margin < 10) { // Вважаємо низькою маржу менше 10%
          lowMarginItems++;
        }
      }
    });

    const averageMargin = totalCost > 0 ? calculateMargin(totalRevenue, totalCost) : 0;

    return {
      totalItems,
      totalPrices,
      activePrices,
      averageMargin,
      lowMarginItems
    };
  }, [form.items, calculateMargin]);

  const loadDictionaries = async () => {
    try {
      setLoading(true);
      console.log("Loading dictionaries for price settings...");

      const requests = [
        axios.get("companies/"),
        axios.get("firms/"),
        axios.get("price-types/"),
        axios.get("product-groups/"),
        axios.get("products/")
      ];

      const results = await Promise.allSettled(requests);
      
      if (results[0].status === 'fulfilled') {
        console.log("✅ Companies loaded:", results[0].value.data);
        setCompanies(results[0].value.data);
      } else {
        console.error("❌ Error loading companies:", results[0].reason);
        setCompanies([]);
      }

      if (results[1].status === 'fulfilled') {
        console.log("✅ Firms loaded:", results[1].value.data);
        setFirms(results[1].value.data);
      } else {
        console.error("❌ Error loading firms:", results[1].reason);
        setFirms([]);
      }

      if (results[2].status === 'fulfilled') {
        console.log("✅ Price types loaded:", results[2].value.data);
        setPriceTypes(results[2].value.data);
      } else {
        console.error("❌ Error loading price types:", results[2].reason);
        setPriceTypes([]);
      }

      if (results[3].status === 'fulfilled') {
        console.log("✅ Product groups loaded:", results[3].value.data);
        setProductGroups(results[3].value.data);
      } else {
        console.error("❌ Error loading product groups:", results[3].reason);
        setProductGroups([]);
      }

      if (results[4].status === 'fulfilled') {
        console.log("✅ Products loaded:", results[4].value.data);
        setAllProducts(results[4].value.data);
      } else {
        console.error("❌ Error loading products:", results[4].reason);
        setAllProducts([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading dictionaries:", error);
      toast.error("Помилка завантаження довідників");
      setLoading(false);
    }
  };

  const loadFirmsByCompany = async (companyId: number) => {
    setLoadingData(prev => ({ ...prev, firms: true }));
    
    try {
      console.log(`Loading firms for company ${companyId}...`);
      const response = await axios.get(`firms/?company=${companyId}`);
      console.log("✅ Firms loaded:", response.data);
      setFirms(response.data);
    } catch (error) {
      console.error("❌ Error loading firms:", error);
      setFirms([]);
      toast.error("Не вдалося завантажити фірми для цієї компанії");
    } finally {
      setLoadingData(prev => ({ ...prev, firms: false }));
    }
  };

  const loadTradePointsByFirm = async (firmId: number) => {
    setLoadingData(prev => ({ ...prev, tradePoints: true }));
    
    try {
      console.log(`Loading all trade points and filtering by firm ${firmId}...`);
      
      const response = await axios.get("trade-points/");
      console.log("✅ All trade points loaded:", response.data);
      
      const filteredTradePoints = response.data.filter((tp: TradePoint) => tp.firm === firmId);
      console.log(`✅ Filtered trade points for firm ${firmId}:`, filteredTradePoints);
      
      setTradePoints(filteredTradePoints);
      
      if (filteredTradePoints.length === 0) {
        console.log(`ℹ️ No trade points found for firm ${firmId}`);
      }
    } catch (error) {
      console.error("❌ Error loading trade points:", error);
      setTradePoints([]);
      toast.error("Не вдалося завантажити торгові точки");
    } finally {
      setLoadingData(prev => ({ ...prev, tradePoints: false }));
    }
  };

  const loadReceiptsByFirm = async (firmId: number) => {
    setLoadingData(prev => ({ ...prev, receipts: true }));
    
    try {
      console.log(`Loading receipts for firm ${firmId}...`);
      const response = await axios.get(`documents/?type=receipt&firm=${firmId}&status=posted`);
      console.log("✅ Receipts loaded:", response.data);
      setReceipts(response.data);
    } catch (error) {
      console.error("❌ Error loading receipts:", error);
      setReceipts([]);
      toast.error("Не вдалося завантажити документи поступлення");
    } finally {
      setLoadingData(prev => ({ ...prev, receipts: false }));
    }
  };

  const handleCompanyChange = (value: string) => {
    const companyId = parseInt(value);
    setForm({ 
      ...form, 
      company: companyId,
      firm: 1,
      trade_points: [],
      items: []
    });
    
    if (companyId) {
      loadFirmsByCompany(companyId);
    } else {
      setFirms([]);
      setTradePoints([]);
    }
  };

  const handleFirmChange = (value: string) => {
    const firmId = parseInt(value);
    setForm({ 
      ...form, 
      firm: firmId,
      trade_points: [],
      items: []
    });
    
    if (firmId) {
      loadTradePointsByFirm(firmId);
      if (form.base_type === 'receipt') {
        loadReceiptsByFirm(firmId);
      }
    } else {
      setTradePoints([]);
      setReceipts([]);
    }
    
    console.log(`🏢 Firm changed to: ${firmId}`);
  };

  const handleBaseTypeChange = (value: string) => {
    setForm({ 
      ...form, 
      base_type: value,
      base_receipt: undefined,
      base_group: undefined,
      base_price_type: undefined,
      items: []
    });

    if (value === 'receipt' && form.firm) {
      loadReceiptsByFirm(form.firm);
    }
  };

  const handleBaseReceiptChange = async (value: string) => {
    const receiptId = parseInt(value);
    setForm({ ...form, base_receipt: receiptId, items: [] });
    
    if (receiptId && form.trade_points.length > 0) {
      await loadReceiptProducts(receiptId);
    }
  };

  // Створюємо структуру цін для нового товару з покращеним алгоритмом
  const createPriceStructureForProduct = (basePrice: number = 0, costPrice: number = 0): PriceData[] => {
    const prices: PriceData[] = [];
    
    form.trade_points.forEach(tradePointId => {
      const tradePoint = tradePoints.find(tp => tp.id === tradePointId);
      
      priceTypes.forEach(priceType => {
        let calculatedPrice = basePrice;
        let markupPercent = form.default_markup_percent;

        // Застосовуємо стандартну націнку типу ціни
        if (priceType.default_markup && form.auto_apply_markup) {
          markupPercent = priceType.default_markup;
          calculatedPrice = costPrice * (1 + markupPercent / 100);
        }

        // Округлюємо ціну згідно з правилами
        calculatedPrice = roundPrice(calculatedPrice);

        const marginPercent = calculateMargin(calculatedPrice, costPrice);

        prices.push({
          trade_point: tradePointId,
          trade_point_name: tradePoint?.name,
          price_type: priceType.id,
          price_type_name: priceType.name,
          price: calculatedPrice,
          markup_percent: markupPercent,
          margin_percent: marginPercent,
          is_active: true,
          effective_from: form.valid_from
        });
      });
    });
    
    return prices;
  };

  const loadReceiptProducts = async (receiptId: number) => {
    try {
      console.log(`Loading products from receipt ${receiptId}...`);
      const response = await axios.get(`receipt-products/?document_id=${receiptId}`);
      console.log("✅ Receipt products loaded:", response.data);
      
      if (response.data && response.data.length > 0) {
        const newItems: PriceSettingItem[] = response.data.map((receiptItem: any) => {
          const product = allProducts.find(p => p.id === receiptItem.product);
          const costPrice = receiptItem.price || product?.cost_price || 0;
          const basePrice = product?.price || costPrice * 1.2; // 20% націнка за замовчуванням
          
          return {
            product: receiptItem.product,
            product_name: product?.name || `Товар ID: ${receiptItem.product}`,
            product_unit: product?.unit_name || "шт",
            unit: receiptItem.unit,
            unit_name: product?.unit_name || "шт",
            unit_conversion: null,
            group_id: product?.group_id,
            group_name: product?.group_name,
            base_price: basePrice,
            cost_price: costPrice,
            vat_percent: receiptItem.vat_percent || 20,
            vat_included: true,
            min_price: costPrice * 1.05, // Мінімальна ціна з 5% маржею
            max_discount_percent: 10,
            prices: createPriceStructureForProduct(basePrice, costPrice)
          };
        });

        // Перевіряємо на дублікати товарів
        const existingProductIds = form.items.map(item => item.product);
        const uniqueNewItems = newItems.filter(item => !existingProductIds.includes(item.product));

        if (uniqueNewItems.length !== newItems.length) {
          toast.error(`Пропущено ${newItems.length - uniqueNewItems.length} товарів, які вже є в списку`);
        }

        setForm(prev => ({ 
          ...prev, 
          items: [...prev.items, ...uniqueNewItems]
        }));

        toast.success(`Додано ${uniqueNewItems.length} товарів з документа поступлення`);
      }
    } catch (error) {
      console.error("❌ Error loading receipt products:", error);
      toast.error("Помилка завантаження товарів з документа поступлення");
    }
  };

  const handleTradePointsChange = (tradePointId: number, selected: boolean) => {
    const newTradePoints = selected 
      ? [...form.trade_points, tradePointId]
      : form.trade_points.filter(id => id !== tradePointId);
    
    setForm({ 
      ...form, 
      trade_points: newTradePoints
    });

    // Оновлюємо структуру цін для всіх товарів
    if (form.items.length > 0) {
      const updatedItems = form.items.map(item => ({
        ...item,
        prices: createPriceStructureForProduct(item.base_price, item.cost_price || 0)
      }));

      setForm(prev => ({ 
        ...prev, 
        trade_points: newTradePoints,
        items: updatedItems 
      }));
    }
  };

  // Масове застосування націнки
  const applyBulkMarkup = (markupPercent: number) => {
    const updatedItems = form.items.map(item => {
      const costPrice = item.cost_price || 0;
      const newBasePrice = roundPrice(costPrice * (1 + markupPercent / 100));
      
      return {
        ...item,
        base_price: newBasePrice,
        prices: item.prices.map(price => ({
          ...price,
          price: roundPrice(costPrice * (1 + markupPercent / 100)),
          markup_percent: markupPercent,
          margin_percent: calculateMargin(roundPrice(costPrice * (1 + markupPercent / 100)), costPrice)
        }))
      };
    });

    setForm({ ...form, items: updatedItems });
    toast.success(`Застосовано націнку ${markupPercent}% до всіх товарів`);
  };

  // Оновлення ціни для конкретної торгової точки та типу ціни
  const updateItemPrice = (itemIndex: number, tradePointId: number, priceTypeId: number, field: 'price' | 'markup_percent', value: number) => {
    const updatedItems = [...form.items];
    const item = updatedItems[itemIndex];
    const costPrice = item.cost_price || 0;
    
    const priceIndex = item.prices.findIndex(p => p.trade_point === tradePointId && p.price_type === priceTypeId);
    if (priceIndex !== -1) {
      let newPrice = item.prices[priceIndex].price;
      let newMarkup = item.prices[priceIndex].markup_percent;

      if (field === 'price') {
        newPrice = roundPrice(value);
        newMarkup = calculateMarkup(newPrice, costPrice);
        
        // Перевірка мінімальної ціни
        if (item.min_price && newPrice < item.min_price) {
          toast.error(`Ціна не може бути менше мінімальної (${item.min_price} ${form.currency})`);
          return;
        }
      } else if (field === 'markup_percent') {
        newMarkup = value;
        newPrice = roundPrice(costPrice * (1 + value / 100));
      }

      const newMargin = calculateMargin(newPrice, costPrice);

      item.prices[priceIndex] = {
        ...item.prices[priceIndex],
        price: newPrice,
        markup_percent: newMarkup,
        margin_percent: newMargin
      };
      
      setForm({ ...form, items: updatedItems });

      // Попередження про низьку маржу
      if (newMargin < 5) {
        toast.error(`⚠️ Увага! Низька маржа: ${newMargin.toFixed(1)}%`);
      }
    }
  };

  // Оновлення базових властивостей товару
  const updateItemProperty = (itemIndex: number, field: keyof PriceSettingItem, value: any) => {
    const updatedItems = [...form.items];
    const item = updatedItems[itemIndex];
    
    updatedItems[itemIndex] = {
      ...item,
      [field]: value
    };

    // Автоматичний перерахунок цін при зміні базової ціни або собівартості
    if (field === 'base_price' || field === 'cost_price') {
      const costPrice = field === 'cost_price' ? value : (item.cost_price || 0);
      
      updatedItems[itemIndex].prices = item.prices.map(price => {
        const newPrice = field === 'base_price' ? value : price.price;
        return {
          ...price,
          price: roundPrice(newPrice),
          markup_percent: calculateMarkup(newPrice, costPrice),
          margin_percent: calculateMargin(newPrice, costPrice)
        };
      });
    }

    setForm({ ...form, items: updatedItems });
  };

  // Додавання нового товару
  const addNewProduct = () => {
    if (form.trade_points.length === 0) {
      toast.error("Спочатку оберіть торгові точки");
      return;
    }

    const newItem: PriceSettingItem = {
      product: undefined,
      product_name: "",
      product_unit: "шт",
      unit: 1,
      unit_name: "шт",
      unit_conversion: null,
      group_id: undefined,
      group_name: "",
      base_price: 0,
      cost_price: 0,
      vat_percent: 20,
      vat_included: true,
      min_price: 0,
      max_discount_percent: 10,
      prices: createPriceStructureForProduct(0, 0)
    };

    setForm({
      ...form,
      items: [...form.items, newItem]
    });
  };

  // Видалення товару
  const removeItem = (index: number) => {
    const items = [...form.items];
    items.splice(index, 1);
    setForm({ ...form, items });
  };

  // Обробка вибору товару в інлайн таблиці
  const handleProductSelect = (product: Product) => {
    if (currentItemIndex >= 0) {
      const updatedItems = [...form.items];
      const item = updatedItems[currentItemIndex];
      const costPrice = product.cost_price || 0;
      const basePrice = product.price || (costPrice * 1.2);
      
      // Оновлюємо основну інформацію про товар
      updatedItems[currentItemIndex] = {
        ...item,
        product: product.id,
        product_name: product.name,
        product_unit: product.unit_name || "шт",
        unit: product.unit || 1,
        unit_name: product.unit_name || "шт",
        group_id: product.group_id,
        group_name: product.group_name,
        base_price: basePrice,
        cost_price: costPrice,
        min_price: product.min_price || (costPrice * 1.05),
        // Оновлюємо ціни з новою базовою ціною
        prices: createPriceStructureForProduct(basePrice, costPrice)
      };
      
      setForm({ ...form, items: updatedItems });
    }
    setShowProductModal(false);
    setCurrentItemIndex(-1);
  };

  // Обробка вибору кількох товарів
  const handleMultipleProductsSelect = (products: Product[]) => {
    const newItems: PriceSettingItem[] = products.map(product => {
      const costPrice = product.cost_price || 0;
      const basePrice = product.price || (costPrice * 1.2);
      
      return {
        product: product.id,
        product_name: product.name,
        product_unit: product.unit_name || "шт",
        unit: product.unit || 1,
        unit_name: product.unit_name || "шт",
        unit_conversion: null,
        group_id: product.group_id,
        group_name: product.group_name,
        base_price: basePrice,
        cost_price: costPrice,
        vat_percent: 20,
        vat_included: true,
        min_price: product.min_price || (costPrice * 1.05),
        max_discount_percent: 10,
        prices: createPriceStructureForProduct(basePrice, costPrice)
      };
    });

    // Перевіряємо на дублікати товарів
    const existingProductIds = form.items.map(item => item.product);
    const uniqueNewItems = newItems.filter(item => !existingProductIds.includes(item.product));

    if (uniqueNewItems.length !== newItems.length) {
      toast.error(`Пропущено ${newItems.length - uniqueNewItems.length} товарів, які вже є в списку`);
    }

    setForm({ 
      ...form, 
      items: [...form.items.filter(item => item.product), ...uniqueNewItems]
    });
    setShowProductModal(false);
    setCurrentItemIndex(-1);
  };

  // Відкриття модалки для вибору товару
  const openProductModal = (itemIndex: number) => {
    setCurrentItemIndex(itemIndex);
    setShowProductModal(true);
  };

  // Відкриття модалки для вибору кількох товарів
  const openMultiProductModal = () => {
    setCurrentItemIndex(-1);
    setShowProductModal(true);
  };

  const validateForm = (): boolean => {
    if (!form.company || !form.firm) {
      toast.error("Оберіть компанію та фірму ❗");
      return false;
    }

    if (!form.valid_from) {
      toast.error("Вкажіть дату початку дії цін ❗");
      return false;
    }

    if (form.trade_points.length === 0) {
      toast.error("Оберіть хоча б одну торгову точку ❗");
      return false;
    }

    if (form.items.length === 0) {
      toast.error("Додайте хоча б один товар ❗");
      return false;
    }

    const hasInvalidItems = form.items.some(item => 
      !item.product || item.prices.some(price => price.price < 0)
    );
    if (hasInvalidItems) {
      toast.error("Перевірте правильність заповнення товарів та цін ❗");
      return false;
    }

    // Додаткова валідація для бухгалтерських правил
    const hasLowMarginItems = form.items.some(item => {
      if (!item.cost_price) return false;
      return item.prices.some(price => {
        const margin = calculateMargin(price.price, item.cost_price!);
        return margin < 0; // Продаж з збитком
      });
    });

    if (hasLowMarginItems) {
      const confirmed = window.confirm(
        "⚠️ Деякі товари мають від'ємну маржу (продаж з збитком). Продовжити збереження?"
      );
      if (!confirmed) return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    // Перетворюємо дані в формат для сервера
    const priceItems: any[] = [];
    
    form.items.forEach(item => {
      item.prices.forEach(price => {
        if (price.is_active && price.price > 0) {
          priceItems.push({
            product: item.product,
            price_type: price.price_type,
            price: price.price,
            vat_percent: item.vat_percent,
            vat_included: item.vat_included,
            markup_percent: price.markup_percent,
            margin_percent: price.margin_percent,
            unit: item.unit,
            unit_conversion: item.unit_conversion,
            trade_point: price.trade_point,
            firm: form.firm,
            cost_price: item.cost_price,
            min_price: item.min_price,
            max_discount_percent: item.max_discount_percent,
            effective_from: price.effective_from,
            effective_to: price.effective_to
          });
        }
      });
    });

    const requestBody = {
      company: form.company,
      firm: form.firm,
      valid_from: form.valid_from,
      payment_type: form.payment_type,
      base_type: form.base_type || undefined,
      base_receipt: form.base_receipt,
      base_group: form.base_group,
      base_price_type: form.base_price_type,
      trade_points: form.trade_points,
      items: priceItems,
      // Нові поля
      currency: form.currency,
      rounding_rule: form.rounding_rule,
      auto_apply_markup: form.auto_apply_markup,
      default_markup_percent: form.default_markup_percent
    };

    console.log("Sending price setting request:", requestBody);

    try {
      const response = await axios.post("create-price-setting-document/", requestBody);
      console.log("✅ Price setting document created:", response.data);
      
      toast.success("Документ ціноутворення створено ✅");
      
      setTimeout(() => {
        navigate("/price-settings");
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
      <PageMeta title="Новий документ ціноутворення | НашСофт" description="Створення документа ціноутворення товарів" />
      <PageBreadcrumb
        crumbs={[
          { label: "Ціноутворення", href: "/price-settings" },
          { label: "Новий документ" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            💰 Новий документ ціноутворення
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Заповніть форму для встановлення цін на товари
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/price-settings")}>
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
                Компанія *
              </label>
              <Select
                options={companies.map(company => ({
                  value: company.id.toString(),
                  label: company.name
                }))}
                placeholder="Оберіть компанію"
                onChange={handleCompanyChange}
                defaultValue={form.company.toString()}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Фірма *
              </label>
              {loadingData.firms ? (
                <div className="p-3 border border-blue-300 bg-blue-50 rounded-lg text-blue-700 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Завантаження фірм...
                </div>
              ) : (
                <Select
                  options={firms.map(firm => ({
                    value: firm.id.toString(),
                    label: firm.name
                  }))}
                  placeholder="Оберіть фірму"
                  onChange={handleFirmChange}
                  defaultValue={form.firm.toString()}
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Дата початку дії *
              </label>
              <Input
                type="date"
                value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Тип оплати *
              </label>
              <Select
                options={[
                  { value: 'both', label: '💰 Готівка + Безготівка' },
                  { value: 'cash', label: '💵 Тільки готівка' },
                  { value: 'cashless', label: '💳 Тільки безготівка' }
                ]}
                placeholder="Оберіть тип оплати"
                onChange={(value) => setForm({ ...form, payment_type: value })}
                defaultValue={form.payment_type}
              />
            </div>
          </div>

          {/* Додаткові налаштування ціноутворення */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="mb-4 text-md font-semibold text-gray-800 dark:text-white">
              Налаштування ціноутворення
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Валюта
                </label>
                <Select
                  options={[
                    { value: 'UAH', label: '₴ Гривня' },
                    { value: 'USD', label: '$ Долар США' },
                    { value: 'EUR', label: '€ Євро' }
                  ]}
                  placeholder="Оберіть валюту"
                  onChange={(value) => setForm({ ...form, currency: value })}
                  defaultValue={form.currency}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Правило округлення
                </label>
                <Select
                  options={[
                    { value: 'kopeck', label: 'До копійок' },
                    { value: 'hryvnia', label: 'До гривень' },
                    { value: 'none', label: 'Без округлення' }
                  ]}
                  placeholder="Оберіть правило"
                  onChange={(value) => setForm({ ...form, rounding_rule: value as 'kopeck' | 'hryvnia' | 'none' })}
                  defaultValue={form.rounding_rule}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Стандартна націнка %
                </label>
                <Input
                  type="number"
                  value={form.default_markup_percent.toString()}
                  onChange={(e) => setForm({ ...form, default_markup_percent: parseFloat(e.target.value) || 0 })}
                  placeholder="20"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_apply_markup"
                  checked={form.auto_apply_markup}
                  onChange={(e) => setForm({ ...form, auto_apply_markup: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto_apply_markup" className="ml-2 text-sm text-gray-700 dark:text-white">
                  Автоматично застосовувати націнку
                </label>
              </div>
            </div>
          </div>
          
          {/* Торгові точки */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Торгові точки *
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Оберіть торгові точки, для яких будуть діяти ці ціни
              </p>
            </div>
            {form.trade_points.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Обрано: {form.trade_points.length} з {tradePoints.length}
              </div>
            )}
          </div>
          
          {loadingData.tradePoints ? (
            <div className="p-6 border border-blue-300 bg-blue-50 rounded-lg text-blue-700 flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              Завантаження торгових точок...
            </div>
          ) : tradePoints.length === 0 ? (
            <div className="p-6 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-800">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🏪</span>
                <span className="font-medium">Торгові точки для цієї фірми не знайдені</span>
              </div>
              <p className="text-sm">
                У обраної фірми немає прив'язаних торгових точок. 
                Додайте торгові точки у розділі "Довідники → Торгові точки" або оберіть іншу фірму.
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/trade-points', '_blank')}
                  className="text-sm"
                >
                  🔗 Перейти до торгових точок
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Кнопки швидкого вибору */}
              <div className="mb-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setForm({ ...form, trade_points: tradePoints.map(tp => tp.id) })}
                  disabled={form.trade_points.length === tradePoints.length}
                >
                  ✅ Обрати всі
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setForm({ ...form, trade_points: [], items: [] })}
                  disabled={form.trade_points.length === 0}
                >
                  ❌ Скасувати всі
                </Button>
              </div>

              {/* Список торгових точок */}
              <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                {tradePoints.map(tradePoint => (
                  <div 
                    key={tradePoint.id} 
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      form.trade_points.includes(tradePoint.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => handleTradePointsChange(tradePoint.id, !form.trade_points.includes(tradePoint.id))}
                  >
                    <input
                      type="checkbox"
                      id={`trade-point-${tradePoint.id}`}
                      checked={form.trade_points.includes(tradePoint.id)}
                      onChange={(e) => handleTradePointsChange(tradePoint.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label htmlFor={`trade-point-${tradePoint.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900 dark:text-white">
                        🏪 {tradePoint.name}
                      </div>
                      {tradePoint.address && (
                        <div className="text-sm text-gray-500 mt-1">
                          📍 {tradePoint.address}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {tradePoint.id}
                      </div>
                    </label>
                    {form.trade_points.includes(tradePoint.id) && (
                      <div className="text-blue-600 dark:text-blue-400">
                        ✅
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Інформаційне повідомлення */}
              {form.trade_points.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                    <span className="text-lg">ℹ️</span>
                    <span className="text-sm font-medium">
                      Ціни будуть застосовані для {form.trade_points.length} торгов{form.trade_points.length === 1 ? 'ої точки' : form.trade_points.length < 5 ? 'их точок' : 'их точок'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


          {/* Базування */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип базування (необов'язково)
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                options={[
                  { value: '', label: 'Ручне створення' },
                  { value: 'receipt', label: '📦 На основі поступлення' },
                  { value: 'product_group', label: '📁 По групі товарів' },
                  { value: 'price_type', label: '💰 По типу ціни' }
                ]}
                placeholder="Оберіть тип базування"
                onChange={handleBaseTypeChange}
                defaultValue={form.base_type}
              />

              {form.base_type === 'receipt' && (
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                    Документ поступлення *
                  </label>
                  {loadingData.receipts ? (
                    <div className="p-3 border border-blue-300 bg-blue-50 rounded-lg text-blue-700 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Завантаження документів...
                    </div>
                  ) : receipts.length === 0 ? (
                    <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-700">
                      ⚠️ Проведених документів поступлення для цієї фірми не знайдено
                    </div>
                  ) : (
                    <Select
                      options={receipts.map(receipt => ({
                        value: receipt.id.toString(),
                        label: `${receipt.doc_number} від ${new Date(receipt.date).toLocaleDateString('uk-UA')} (${receipt.supplier_name})`
                      }))}
                      placeholder="Оберіть документ поступлення"
                      onChange={handleBaseReceiptChange}
                      defaultValue=""
                    />
                  )}
                  {form.base_receipt && (
                    <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ Товари з цього документа будуть автоматично додані до ціноутворення
                    </div>
                  )}
                </div>
              )}

              {form.base_type === 'product_group' && (
                <Select
                  options={productGroups.map(group => ({
                    value: group.id.toString(),
                    label: group.name
                  }))}
                  placeholder="Оберіть групу товарів"
                  onChange={(value) => setForm({ ...form, base_group: parseInt(value) })}
                  defaultValue=""
                />
              )}

              {form.base_type === 'price_type' && (
                <Select
                  options={priceTypes.map(type => ({
                    value: type.id.toString(),
                    label: `${type.name} ${type.is_retail ? '(роздріб)' : ''} ${type.is_wholesale ? '(опт)' : ''}`
                  }))}
                  placeholder="Оберіть тип ціни"
                  onChange={(value) => setForm({ ...form, base_price_type: parseInt(value) })}
                  defaultValue=""
                />
              )}
            </div>
          </div>
        </div>

        {/* Товари і ціни - Покращена таблиця */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Товари та ціни ({form.items.length})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {form.items.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyBulkMarkup(10)}
                    className="text-green-600"
                  >
                    +10% націнки
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyBulkMarkup(20)}
                    className="text-green-600"
                  >
                    +20% націнки
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyBulkMarkup(50)}
                    className="text-green-600"
                  >
                    +50% націнки
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openMultiProductModal}
                disabled={form.trade_points.length === 0}
              >
                Додати декілька товарів
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addNewProduct}
                disabled={form.trade_points.length === 0}
              >
                ➕ Додати товар
              </Button>
              {form.items.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setForm({ ...form, items: [] })}
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️ Очистити всі
                </Button>
              )}
            </div>
          </div>

          {form.trade_points.length === 0 ? (
            <div className="p-6 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-700">
              ⚠️ Спочатку оберіть торгові точки для встановлення цін на товари
            </div>
          ) : form.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Товари не додані</h3>
              <p className="text-sm mb-4">
                {form.base_type === 'receipt' && form.base_receipt 
                  ? "Товари з документа поступлення будуть додані автоматично"
                  : "Натисніть 'Додати товар' для вибору номенклатури"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              <Table>
                <TableHeader>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Товар *
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Собівартість ₴
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Базова ціна ₴
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Середня маржа %
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      ПДВ %
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      З ПДВ
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Деталі цін
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Дії
                    </TableCell>
                  </tr>
                </TableHeader>

                <TableBody>
                  {form.items.map((item, itemIndex) => {
                    const activePrices = item.prices.filter(p => p.is_active && p.price > 0);
                    const avgMargin = activePrices.length > 0 
                      ? activePrices.reduce((sum, p) => sum + (p.margin_percent || 0), 0) / activePrices.length
                      : 0;
                    
                    return (
                      <tr key={itemIndex} className="border-b border-gray-100 dark:border-white/10">
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              {item.product_name ? (
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                                  <div className="font-medium text-sm">{item.product_name}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    ID: {item.product} • {item.unit_name}
                                    {item.group_name && ` • ${item.group_name}`}
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
                              onClick={() => openProductModal(itemIndex)}
                            >
                              {item.product_name ? "Змінити" : "Обрати"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Input
                            type="number"
                            value={item.cost_price?.toString() || '0'}
                            onChange={(e) => updateItemProperty(itemIndex, 'cost_price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Input
                            type="number"
                            value={item.base_price.toString()}
                            onChange={(e) => updateItemProperty(itemIndex, 'base_price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className={`text-sm font-medium ${
                            avgMargin < 0 ? 'text-red-600' : 
                            avgMargin < 10 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {avgMargin.toFixed(1)}%
                          </div>
                          {avgMargin < 0 && (
                            <div className="text-xs text-red-500">Збиток!</div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Input
                            type="number"
                            value={item.vat_percent.toString()}
                            onChange={(e) => updateItemProperty(itemIndex, 'vat_percent', parseFloat(e.target.value) || 0)}
                            placeholder="20"
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.vat_included}
                            onChange={(e) => updateItemProperty(itemIndex, 'vat_included', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {activePrices.length} / {item.prices.length} активних
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPriceDetails(showPriceDetails === itemIndex ? null : itemIndex)}
                            className="mt-1 text-xs"
                          >
                            {showPriceDetails === itemIndex ? 'Сховати' : 'Показати'}
                          </Button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(itemIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </TableCell>
                      </tr>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Детальний вигляд цін для обраного товару */}
              {showPriceDetails !== null && form.items[showPriceDetails] && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-t">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-3">
                    📊 Детальні ціни для товару: {form.items[showPriceDetails].product_name}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Торгова точка</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Тип ціни</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ціна {form.currency}</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Націнка %</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Маржа %</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Активна</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items[showPriceDetails].prices.map((price, priceIndex) => (
                          <tr key={priceIndex} className="border-b border-gray-100 dark:border-gray-600">
                            <td className="px-3 py-2 text-sm">{price.trade_point_name}</td>
                            <td className="px-3 py-2 text-sm">{price.price_type_name}</td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={price.price.toString()}
                                onChange={(e) => updateItemPrice(
                                  showPriceDetails, 
                                  price.trade_point, 
                                  price.price_type, 
                                  'price', 
                                  parseFloat(e.target.value) || 0
                                )}
                                className="w-24 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={price.markup_percent.toString()}
                                onChange={(e) => updateItemPrice(
                                  showPriceDetails, 
                                  price.trade_point, 
                                  price.price_type, 
                                  'markup_percent', 
                                  parseFloat(e.target.value) || 0
                                )}
                                className="w-20 text-sm"
                              />
                            </td>
                            <td className={`px-3 py-2 text-sm font-medium ${
                              (price.margin_percent || 0) < 0 ? 'text-red-600' : 
                              (price.margin_percent || 0) < 10 ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {(price.margin_percent || 0).toFixed(1)}%
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={price.is_active}
                                onChange={(e) => {
                                  const updatedItems = [...form.items];
                                  const priceIdx = updatedItems[showPriceDetails].prices.findIndex(
                                    p => p.trade_point === price.trade_point && p.price_type === price.price_type
                                  );
                                  if (priceIdx !== -1) {
                                    updatedItems[showPriceDetails].prices[priceIdx].is_active = e.target.checked;
                                    setForm({ ...form, items: updatedItems });
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Підказки */}
              {form.items.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-3">
                    💡 Бухгалтерські підказки:
                  </h4>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <div>• <strong>Маржа</strong> = (Ціна - Собівартість) / Ціна × 100%</div>
                    <div>• <strong>Націнка</strong> = (Ціна - Собівартість) / Собівартість × 100%</div>
                    <div>• <strong>Червоний колір</strong> - збиткова ціна (маржа від'ємна)</div>
                    <div>• <strong>Жовтий колір</strong> - низька маржа (менше 10%)</div>
                    <div>• <strong>Зелений колір</strong> - нормальна маржа (10% і більше)</div>
                    <div>• Ціни автоматично округлюються згідно з обраним правилом</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Покращені підсумки з аналітикою */}
          {form.items.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Основні показники */}
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <h4 className="font-semibold text-gray-800 dark:text-white">📊 Основні показники</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Торгових точок:</span>
                  <span className="font-medium">{form.trade_points.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Товарів:</span>
                  <span className="font-medium">{priceStatistics.totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Типів цін:</span>
                  <span className="font-medium">{priceTypes.length}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 dark:border-white/20">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800 dark:text-white">Активних позицій:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {priceStatistics.activePrices}
                    </span>
                  </div>
                </div>
              </div>

              {/* Аналітика рентабельності */}
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <h4 className="font-semibold text-gray-800 dark:text-white">💰 Аналітика рентабельності</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Середня маржа:</span>
                  <span className={`font-medium ${
                    priceStatistics.averageMargin < 0 ? 'text-red-600' : 
                    priceStatistics.averageMargin < 10 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {priceStatistics.averageMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Товарів з низькою маржею:</span>
                  <span className={`font-medium ${priceStatistics.lowMarginItems > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {priceStatistics.lowMarginItems}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Валюта:</span>
                  <span className="font-medium">{form.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Округлення:</span>
                  <span className="font-medium">
                    {form.rounding_rule === 'kopeck' ? 'До копійок' : 
                     form.rounding_rule === 'hryvnia' ? 'До гривень' : 'Без округлення'}
                  </span>
                </div>
              </div>
            </div>
          )}
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
        selectedWarehouse={undefined} // Для ціноутворення склад не обов'язковий
      />

      {/* Модальне вікно підтвердження */}
      <ConfirmModal
        isOpen={showSaveModal}
        title="Зберегти документ ціноутворення?"
        description={`Ви впевнені, що хочете створити документ ціноутворення з наступними параметрами:

• Товарів: ${form.items.length}
• Торгових точок: ${form.trade_points.length}
• Активних цінових позицій: ${priceStatistics.activePrices}
• Тип оплати: ${form.payment_type === 'both' ? 'Готівка + Безготівка' : form.payment_type === 'cash' ? 'Готівка' : 'Безготівка'}
• Середня маржа: ${priceStatistics.averageMargin.toFixed(1)}%${priceStatistics.lowMarginItems > 0 ? `
• ⚠️ Товарів з низькою маржею: ${priceStatistics.lowMarginItems}` : ''}`}
        onConfirm={() => {
          setShowSaveModal(false);
          handleSave();
        }}
        onClose={() => setShowSaveModal(false)}
      />
    </>
  );
}