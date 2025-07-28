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
import ProductSelectionModal from "../../../pages/OtherPage/Products/ProductSelectionModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

// ✅ ТИПИ ВІДПОВІДНО ДО ТВОЇХ MODELS
type PriceSettingForm = {
  company: number;
  firm: number;
  valid_from: string;
  base_type: string;
  base_receipt: number | undefined;
  base_group: number | undefined;
  base_price_type: number | undefined;
  trade_points: number[];
  items: PriceSettingItem[];
  comment?: string;
};

// ✅ ВІДПОВІДАЄ ТВОЇЙ PriceSettingItem МОДЕЛІ  
type PriceSettingItem = {
  product: number | undefined;
  product_name?: string;
  product_base_unit?: number;      // ✅ БАЗОВА ОДИНИЦЯ ТОВАРУ
  product_base_unit_name?: string; // ✅ НАЗВА БАЗОВОЇ ОДИНИЦІ
  
  price_type: number;
  base_price: number;              // ✅ ЦІНА ЗА БАЗОВУ ОДИНИЦЮ
  price: number;                   // ✅ ФІНАЛЬНА ЦІНА (РОЗРАХОВУЄТЬСЯ АВТОМАТИЧНО)
  
  // ✅ ФАСУВАННЯ (ОПЦІЙНО):
  unit_conversion: number | null;  // ✅ ID фасування або null
  unit_conversion_name?: string;   // ✅ НАЗВА ФАСУВАННЯ
  final_unit?: number;             // ✅ ФІНАЛЬНА ОДИНИЦЯ ЦІНИ
  final_unit_name?: string;        // ✅ НАЗВА ФІНАЛЬНОЇ ОДИНИЦІ
  
  vat_percent: number;
  vat_included: boolean;
  markup_percent: number;
  trade_point: number;
  
  // ✅ ІНФОРМАЦІЯ ПРО ФІРМУ:
  firm?: number;
  firm_name?: string;
  firm_is_vat_payer?: boolean;
  price_without_vat?: number;
  vat_amount?: number;
  price_with_vat?: number;
};

// ✅ ВІДПОВІДАЄ ТВОЇМ SERIALIZERS
type Company = {
  id: number;
  name: string;
  tax_id?: string;
};

type Firm = {
  id: number;
  name: string;
  company_name: string; // ✅ Назва компанії
  company_id: number;   // ✅ ID компанії для фільтрації
  is_vat: boolean; 
  vat_type: string;
};

type TradePoint = {
  id: number;
  name: string;
  firm: number;
  firm_name?: string;
};

type PriceType = {
  id: number;
  name: string;
  is_default: boolean;
};

type ProductGroup = {
  id: number;
  name: string;
  parent?: number;
};

type Product = {
  id: number;
  name: string;
  unit?: number;                   // ✅ БАЗОВА ОДИНИЦЯ
  unit_name?: string;              // ✅ НАЗВА БАЗОВОЇ ОДИНИЦІ
  group_id?: number;
  group_name?: string;
  price?: number;
  base_price?: number;             // ✅ БАЗОВА ЦІНА ЗА БАЗОВУ ОДИНИЦЮ
  conversions?: ProductUnitConversion[];  // ✅ СПИСОК ФАСУВАНЬ
};

type Receipt = {
  id: number;
  doc_number: string;
  date: string;
  status: string;
};

type Unit = {
  id: number;
  name: string;
  symbol?: string;
};

type Supplier = {
  id: number;
  name: string;
  code?: string;
};

type ProductUnitConversion = {
  id: number;
  name: string;                   
  product: number;
  from_unit: number;               
  to_unit: number;                 
  factor: number;                  
  from_unit_name: string;         
  to_unit_name: string;          
};

type SelectedProductWithUnit = {
  product: Product;
  unit_conversion_id: number | null;
  unit_name: string;
  unit_symbol: string;
  factor: number;
};

export default function CreatePriceSettingsPage() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<PriceSettingForm>({
    company: 0,
    firm: 0,
    valid_from: new Date().toISOString().split('T')[0],
    base_type: '',
    base_receipt: undefined,
    base_group: undefined,
    base_price_type: undefined,
    trade_points: [],
    items: [],
    comment: ''
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [tradePoints, setTradePoints] = useState<TradePoint[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [loadingData, setLoadingData] = useState({
    firms: false,
    tradePoints: false,
    receipts: false
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);

  useEffect(() => {
    loadDictionaries();
  }, []);


const calculateFinalPrice = (item: PriceSettingItem, conversions: ProductUnitConversion[]): PriceSettingItem => {
  // ✅ ПРОСТО: яку ціну ввів користувач - така і буде!
  let finalPrice = item.base_price; // Ціна яку ввів користувач
  let finalUnit = item.product_base_unit;
  let finalUnitName = item.product_base_unit_name;
  let conversionName = "";

  console.log("🔥 calculateFinalPrice - БЕЗ конверсії:");
  console.log("  - user input price:", item.base_price);
  console.log("  - unit_conversion:", item.unit_conversion);

  // ✅ ЯКЩО ОБРАНО ФАСУВАННЯ - просто змінюємо назву одиниці
  if (item.unit_conversion) {
    const conversion = conversions.find(c => c.id === item.unit_conversion);
    
    if (conversion) {
      // ✅ НЕ ДІЛИМО! Просто беремо ціну як є і показуємо за правильну одиницю
      finalPrice = item.base_price; // Ціна залишається така ж!
      finalUnit = conversion.to_unit;
      finalUnitName = conversion.to_unit_name;
      conversionName = conversion.name;
      
      console.log("  - keeping price as is:", finalPrice, "for", finalUnitName);
    }
  }

  return {
    ...item,
    price: finalPrice, // Та сама ціна що ввів користувач!
    final_unit: finalUnit,
    final_unit_name: finalUnitName,
    unit_conversion_name: conversionName
  };
};

// ✅ ФУНКЦІЯ ЗАВАНТАЖЕННЯ ФАСУВАНЬ ДЛЯ ТОВАРУ:
const loadProductConversions = async (productId: number): Promise<ProductUnitConversion[]> => {
  try {
    console.log(`Loading conversions for product ${productId}...`);
    const response = await axios.get(`product-unit-conversions/?product=${productId}`);
    console.log("✅ Product conversions loaded:", response.data);
    return response.data || [];
  } catch (error) {
    console.error("❌ Error loading product conversions:", error);
    return [];
  }
};

// ✅ ФУНКЦІЯ ОНОВЛЕННЯ ТОВАРУ З ФАСУВАННЯМИ:
const updateItemWithProduct = async (index: number, product: Product) => {
  try {
    // 1. Завантажуємо фасування для товару
    const conversions = await loadProductConversions(product.id);
    
    // 2. СПОЧАТКУ зберігаємо фасування
    setProductConversions(prev => ({
      ...prev,
      [product.id]: conversions
    }));
    
    // 3. ПОТІМ оновлюємо позицію
    const updatedItems = [...form.items];
    updatedItems[index] = {
      ...updatedItems[index],
      product: product.id,
      product_name: product.name,
      product_base_unit: product.unit,
      product_base_unit_name: product.unit_name,
      base_price: product.base_price || product.price || 0,
      unit_conversion: null,
      unit_conversion_name: "",
      final_unit: product.unit,
      final_unit_name: product.unit_name,
      price: product.base_price || product.price || 0
    };
    
    setForm({ ...form, items: updatedItems });
    
    console.log(`✅ Product ${product.name} updated with ${conversions.length} conversions`);
    
  } catch (error) {
    console.error("❌ Error updating product:", error);
    toast.error("Помилка оновлення товару");
  }
};


  const loadSuppliers = async () => {
  try {
    const response = await axios.get("suppliers/");
    console.log("✅ Suppliers loaded:", response.data);
    setSuppliers(response.data);
  } catch (error) {
    console.error("❌ Error loading suppliers:", error);
    setSuppliers([]);
  }
};

  const getSelectedFirm = () => {
  return firms.find(f => f.id === form.firm);
};

const isSelectedFirmVatPayer = () => {
  const selectedFirm = getSelectedFirm();
  return selectedFirm?.is_vat || false;
};

const calculateVatForItem = (item: PriceSettingItem) => {
  if (!item.firm_is_vat_payer || item.vat_percent === 0) {
    return {
      price_without_vat: item.price,
      vat_amount: 0,
      price_with_vat: item.price
    };
  }

  let priceWithoutVat: number;
  let vatAmount: number;
  let priceWithVat: number;

  if (item.vat_included) {
    // Ціна ВКЛЮЧАЄ ПДВ - витягуємо ПДВ
    priceWithoutVat = Math.round((item.price / (1 + item.vat_percent / 100)) * 100) / 100;
    vatAmount = Math.round((item.price - priceWithoutVat) * 100) / 100;
    priceWithVat = item.price;
  } else {
    // Ціна БЕЗ ПДВ - додаємо ПДВ
    priceWithoutVat = item.price;
    vatAmount = Math.round((item.price * item.vat_percent / 100) * 100) / 100;
    priceWithVat = Math.round((priceWithoutVat + vatAmount) * 100) / 100;
  }

  return { price_without_vat: priceWithoutVat, vat_amount: vatAmount, price_with_vat: priceWithVat };
};

const getProductConversions = (productId: number): ProductUnitConversion[] => {
  const conversions = productConversions[productId] || [];
  console.log(`🔥 Getting conversions for product ${productId}:`, conversions);
  return conversions;
};


const handleCompanyChange = (value: string) => {
  const companyId = parseInt(value);
  setForm({ 
    ...form, 
    company: companyId,
    firm: 0, // ✅ Скидаємо фірму
    trade_points: [],
    items: []
  });
  
  // Скидаємо залежні дані
  setTradePoints([]);
  setReceipts([]);
  setSelectedSupplier(null);
};

// Фільтровані фірми по компанії
const getFilteredFirms = () => {
  return firms.filter(firm => firm.company_id === form.company);
};

// ✅ ОНОВИТИ ЛОГІКУ ПОКАЗУ КОЛОНОК:
const shouldShowVatColumns = form.items.some(item => item.firm_is_vat_payer) || isSelectedFirmVatPayer();
  
  
  // ✅ ЗАВАНТАЖЕННЯ ДОВІДНИКІВ ВІДПОВІДНО ДО ТВОЇХ URLs
  const loadDictionaries = async () => {
  try {
    setLoading(true);
    console.log("Loading dictionaries for price settings...");

    const requests = [
      axios.get("companies/"),
      axios.get("firms/"),
      axios.get("price-types/"),
      axios.get("product-groups/"),
      axios.get("products/"),
      axios.get("units/"),
      axios.get("suppliers/") // ✅ ДОДАТИ
    ];

      const results = await Promise.allSettled(requests);
      
      if (results[0].status === 'fulfilled') {
        console.log("✅ Companies loaded:", results[0].value.data);
        setCompanies(results[0].value.data);
      } else {
        console.error("❌ Error loading companies:", results[0].reason);
        setCompanies([]);
        toast.error("Помилка завантаження компаній");
      }

      if (results[1].status === 'fulfilled') {
        console.log("✅ Firms loaded:", results[1].value.data);
        setFirms(results[1].value.data);
      } else {
        console.error("❌ Error loading firms:", results[1].reason);
        setFirms([]);
        toast.error("Помилка завантаження фірм");
      }

      if (results[2].status === 'fulfilled') {
        console.log("✅ Price types loaded:", results[2].value.data);
        setPriceTypes(results[2].value.data);
      } else {
        console.error("❌ Error loading price types:", results[2].reason);
        setPriceTypes([]);
        toast.error("Помилка завантаження типів цін");
      }

      if (results[3].status === 'fulfilled') {
        console.log("✅ Product groups loaded:", results[3].value.data);
        setProductGroups(results[3].value.data);
      } else {
        console.error("❌ Error loading product groups:", results[3].reason);
        setProductGroups([]);
        toast.error("Помилка завантаження груп товарів");
      }

      if (results[4].status === 'fulfilled') {
        console.log("✅ Products loaded:", results[4].value.data);
        setAllProducts(results[4].value.data);
      } else {
        console.error("❌ Error loading products:", results[4].reason);
        setAllProducts([]);
        toast.error("Помилка завантаження товарів");
      }

      if (results[5].status === 'fulfilled') {
        console.log("✅ Units loaded:", results[5].value.data);
        setUnits(results[5].value.data);
      } else {
        console.error("❌ Error loading units:", results[5].reason);
        setUnits([]);
        toast.error("Помилка завантаження одиниць виміру");
      }

      if (results[6].status === 'fulfilled') {
      console.log("✅ Suppliers loaded:", results[6].value.data);
      setSuppliers(results[6].value.data);
    } else {
      console.error("❌ Error loading suppliers:", results[6].reason);
      setSuppliers([]);
      toast.error("Помилка завантаження постачальників");
    }

   setLoading(false);
  } catch (error) {
    console.error("Error loading dictionaries:", error);
    toast.error("Помилка завантаження довідників");
    setLoading(false);
  }
};

  // ✅ ЗАВАНТАЖЕННЯ ТОРГОВИХ ТОЧОК ПО ФІРМІ  
  const loadTradePointsByFirm = async (firmId: number) => {
    setLoadingData(prev => ({ ...prev, tradePoints: true }));
    
    try {
      console.log(`Loading trade points for firm ${firmId}...`);
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

  // ✅ ЗАВАНТАЖЕННЯ ДОКУМЕНТІВ ПОСТУПЛЕННЯ
const loadReceiptsByFirm = async (firmId: number) => {
  setLoadingData(prev => ({ ...prev, receipts: true }));
  
  try {
    console.log(`Loading receipts for firm ${firmId}...`);
    const response = await axios.get(`documents/?type=receipt&status=posted`);
    console.log("✅ Receipts loaded:", response.data);
    
    // ✅ ПРАВИЛЬНО ВИТЯГУЄМО ДАНІ:
    const receiptsData = response.data.data || [];
    console.log("✅ All receipts:", receiptsData);
    
    // ✅ ФІЛЬТРУЄМО ПО ФІРМІ:
    const filteredReceipts = receiptsData.filter((receipt: any) => receipt.firm === firmId);
    console.log(`✅ Filtered receipts for firm ${firmId}:`, filteredReceipts);
    
    setReceipts(filteredReceipts);
    
    if (filteredReceipts.length === 0) {
      toast.error(`Проведених документів поступлення для цієї фірми не знайдено`);
    } else {
      console.log(`✅ Found ${filteredReceipts.length} receipts for firm ${firmId}`);
    }
    
  } catch (error) {
    console.error("❌ Error loading receipts:", error);
    setReceipts([]);
    toast.error("Не вдалося завантажити документи поступлення");
  } finally {
    setLoadingData(prev => ({ ...prev, receipts: false }));
  }
};
  const loadReceiptsBySupplierAndFirm = async (supplierId: number, firmId: number) => {
  setLoadingData(prev => ({ ...prev, receipts: true }));
  
  try {
    console.log(`Loading receipts for supplier ${supplierId} and firm ${firmId}...`);
    const response = await axios.get(`documents/?type=receipt&status=posted`);
    console.log("✅ All receipts loaded:", response.data);
    
    const receiptsData = response.data.data || [];
    
    // ✅ ОТРИМУЄМО НАЗВУ ФІРМИ ДЛЯ ФІЛЬТРАЦІЇ:
    const selectedFirm = firms.find(f => f.id === firmId);
    const firmName = selectedFirm?.name;
    
    console.log(`Looking for supplier_id: ${supplierId}, firm_name: "${firmName}"`);
    
    // ✅ ФІЛЬТРУЄМО ПО ПОСТАЧАЛЬНИКУ І ФІРМІ:
    const filteredReceipts = receiptsData.filter((receipt: any) => {
      console.log(`Receipt ${receipt.id}: supplier_id=${receipt.supplier_id}, firm_name="${receipt.firm_name}"`);
      return receipt.supplier_id === supplierId && receipt.firm_name === firmName;
    });
    
    console.log(`✅ Filtered receipts:`, filteredReceipts);
    
    setReceipts(filteredReceipts);
    
    if (filteredReceipts.length === 0) {
      toast.error(`Документів поступлення для цього постачальника та фірми не знайдено`);
    } else {
      toast.success(`Знайдено ${filteredReceipts.length} документів поступлення`);
    }
    
  } catch (error) {
    console.error("❌ Error loading receipts:", error);
    setReceipts([]);
    toast.error("Не вдалося завантажити документи поступлення");
  } finally {
    setLoadingData(prev => ({ ...prev, receipts: false }));
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
  
  console.log("Receipt selected:", receiptId);
  console.log("Trade points selected:", form.trade_points);
  console.log("Price types available:", priceTypes.length);
  
  if (receiptId && form.trade_points.length > 0 && priceTypes.length > 0) {
    await loadReceiptProducts(receiptId);
  } else {
    console.log("Skipping product load - missing requirements:");
    console.log("- Receipt ID:", receiptId);
    console.log("- Trade points:", form.trade_points.length);
    console.log("- Price types:", priceTypes.length);
  }
};

  // ✅ ЗАВАНТАЖЕННЯ ТОВАРІВ З ПОСТУПЛЕННЯ
const loadReceiptProducts = async (receiptId: number) => {
  try {
    console.log(`Loading products from receipt ${receiptId}...`);
    const response = await axios.get(`receipt-products/?document_id=${receiptId}`);
    console.log("✅ Receipt products response:", response.data);
    
    // ✅ ПЕРЕВІР ЩО ПОВЕРТАЄ API:
    let productsData = [];
    if (Array.isArray(response.data)) {
      productsData = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      productsData = response.data.data;
    } else {
      console.warn("Unexpected products response:", response.data);
      toast.error("Неправильний формат відповіді API");
      return;
    }
    
    console.log("✅ Products from receipt:", productsData);
    
    if (productsData.length === 0) {
      toast.error("В цьому документі немає товарів");
      return;
    }

    if (form.trade_points.length === 0) {
      toast.error("Спочатку оберіть торгові точки");
      return;
    }

    if (priceTypes.length === 0) {
      toast.error("Не знайдено типів цін");
      return;
    }

    const newItems: PriceSettingItem[] = [];
    const defaultPriceType = priceTypes.find(pt => pt.is_default) || priceTypes[0];
    const defaultUnit = units.find(u => u.name === 'штука') || units[0] || { id: 1 };

    // Створюємо позиції для кожного товару з накладної
    productsData.forEach((receiptItem: any) => {
  const product = allProducts.find(p => p.id === receiptItem.product);
  const basePrice = receiptItem.price * 1.2;
  
  // ✅ ВИКОРИСТОВУВАТИ ФІРМУ З ФОРМИ (НЕ З API):
  const selectedFirm = getSelectedFirm();
  
  newItems.push({
    product: receiptItem.product,
    product_name: product?.name || `Товар ID: ${receiptItem.product}`,
    price_type: defaultPriceType.id,
    price: basePrice,
    vat_percent: selectedFirm?.is_vat ? (receiptItem.vat_percent || 20) : 0,
    vat_included: selectedFirm?.is_vat || false,
    markup_percent: 20,
    product_base_unit: product?.unit,
    product_base_unit_name: product?.unit_name || units.find(u => u.id === product?.unit)?.name || "—", 
    base_price: basePrice,
    unit_conversion: null,  
    trade_point: form.trade_points[0],
    // ✅ ФІРМА З ФОРМИ:
    firm: form.firm,
    firm_name: selectedFirm?.name,
    firm_is_vat_payer: selectedFirm?.is_vat || false
  });
});

    console.log("✅ Created items:", newItems);

    for (const item of newItems) {
  if (item.product) {
    const conversions = await loadProductConversions(item.product);
    setProductConversions(prev => ({
      ...prev,
      [item.product!]: conversions
    }));
  }
}
    
    setForm(prev => ({ 
      ...prev, 
      items: newItems
    }));

    toast.success(`Додано ${newItems.length} товарів з документа поступлення`);
    
  } catch (error) {
    console.error("❌ Error loading receipt products:", error);
    toast.error("Помилка завантаження товарів з документа поступлення");
  }
};

// ✅ ВИНЕСТИ ЦЮ ФУНКЦІЮ СЮДИ (ПІСЛЯ loadReceiptProducts):
const loadProductsByGroup = async (groupId: number) => {
  try {
    console.log(`Loading products from group ${groupId}...`);
    
    // Фільтруємо товари по групі з уже завантажених
    const groupProducts = allProducts.filter(product => product.group_id === groupId);
    console.log("✅ Products from group:", groupProducts);
    
    if (groupProducts.length === 0) {
      toast.error("В цій групі немає товарів");
      return;
    }

    if (form.trade_points.length === 0) {
      toast.error("Спочатку оберіть торгові точки");
      return;
    }

    if (priceTypes.length === 0) {
      toast.error("Не знайдено типів цін");
      return;
    }

    const newItems: PriceSettingItem[] = [];
    const defaultPriceType = priceTypes.find(pt => pt.is_default) || priceTypes[0];
    const defaultUnit = units.find(u => u.name === 'штука') || units[0] || { id: 1 };

    // Створюємо позиції для кожного товару з групи
    groupProducts.forEach((product) => {
      newItems.push({
  product: product.id,
  product_name: product.name,
  price_type: defaultPriceType.id,
  price: product.price || 0,
  vat_percent: getSelectedFirm()?.is_vat ? 20 : 0, // ✅
  vat_included: getSelectedFirm()?.is_vat || false, // ✅
  markup_percent: 0,
  product_base_unit: product.unit,
  product_base_unit_name: product.unit_name,
  base_price: product.price || 0,
  unit_conversion: null,
  trade_point: form.trade_points[0],
  // ✅ ДОДАТИ ІНФО ПРО ФІРМУ:
  firm: form.firm,
  firm_name: getSelectedFirm()?.name,
  firm_is_vat_payer: getSelectedFirm()?.is_vat || false
});
    });

    console.log("✅ Created items from group:", newItems);
    
    setForm(prev => ({ 
      ...prev, 
      items: newItems
    }));

    toast.success(`Додано ${newItems.length} товарів з групи`);
    
  } catch (error) {
    console.error("❌ Error loading products from group:", error);
    toast.error("Помилка завантаження товарів з групи");
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
      console.log('Trade points updated:', newTradePoints);
  console.log('Form state:', form);
  };

const addNewProduct = () => {
    console.log("🔥 addNewProduct called"); // ✅ ДОДАЙТЕ ЦЕЙ ЛОГ
  console.log('🔥 Current form.trade_points:', form.trade_points);
    console.log('🔥 Current form.trade_points:', form.trade_points); // ✅ ДОДАТИ

  if (form.trade_points.length === 0) {
        console.log('❌ No trade points selected!');

        console.log('❌ No trade points selected!'); // ✅ ДОДАТИ

    toast.error("Спочатку оберіть торгові точки");
    return;
  }

  if (priceTypes.length === 0) {
    toast.error("Не знайдено типів цін");
    return;
  }

  const defaultUnit = units.find(u => u.name === 'штука') || units[0] || { id: 1, name: 'шт' };
  const defaultPriceType = priceTypes.find(pt => pt.is_default) || priceTypes[0];

  const newItem: PriceSettingItem = {
    product: undefined,
    product_name: "",
    product_base_unit: undefined,       // ✅ ДОДАТИ
    product_base_unit_name: "",         // ✅ ДОДАТИ
    price_type: defaultPriceType.id,
    base_price: 0,                      // ✅ ДОДАТИ
    price: 0,
    unit_conversion: null,              // ✅ ДОДАТИ
    unit_conversion_name: "",           // ✅ ДОДАТИ
    final_unit: undefined,              // ✅ ДОДАТИ
    final_unit_name: "",                // ✅ ДОДАТИ
    vat_percent: isSelectedFirmVatPayer() ? 20 : 0,  // ✅ ВИПРАВИТИ
    vat_included: isSelectedFirmVatPayer(),          // ✅ ВИПРАВИТИ
    markup_percent: 0,
    trade_point: form.trade_points[0],
    // ✅ ДОДАТИ ІНФО ПРО ФІРМУ:
    firm: form.firm,
    firm_name: getSelectedFirm()?.name,
    firm_is_vat_payer: isSelectedFirmVatPayer()
  };

  setForm({
    ...form,
    items: [...form.items, newItem]
  });
};

  // ✅ ВИДАЛЕННЯ ТОВАРУ
  const removeItem = (index: number) => {
    const items = [...form.items];
    items.splice(index, 1);
    setForm({ ...form, items });
  };



const [productConversions, setProductConversions] = useState<{[key: number]: ProductUnitConversion[]}>({});

// ✅ ФУНКЦІЯ ОТРИМАННЯ ФАСУВАНЬ ДЛЯ ТОВАРУ:
const updateItem = (itemIndex: number, field: keyof PriceSettingItem, value: any) => {
  const updatedItems = [...form.items];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    [field]: value
  };
  
  console.log(`🔥 Updating item ${itemIndex}, field: ${field}, value:`, value);
   
  setForm({ ...form, items: updatedItems });
};

  // ✅ ВИБІР ТОВАРУ
const handleProductSelect = async (selectedItem: SelectedProductWithUnit) => {
  if (currentItemIndex >= 0) {
    const conversions = await loadProductConversions(selectedItem.product.id);
    setProductConversions(prev => ({
      ...prev,
      [selectedItem.product.id]: conversions
    }));
    
    // ✅ ПРОСТО ЗБЕРІГАЄМО ДАНІ БЕЗ РОЗРАХУНКІВ:
    const updatedItems = [...form.items];
    updatedItems[currentItemIndex] = {
      ...updatedItems[currentItemIndex],
      product: selectedItem.product.id,
      product_name: selectedItem.product.name,
      product_base_unit: selectedItem.product.unit,
      product_base_unit_name: selectedItem.product.unit_name,
      
      // ✅ БЕЗ РОЗРАХУНКІВ - просто зберігаємо:
      base_price: 0,  // Користувач введе
      price: 0,       // = base_price (показуємо те саме)
      unit_conversion: selectedItem.unit_conversion_id,
      unit_conversion_name: selectedItem.unit_conversion_id ? selectedItem.unit_name : "",
      final_unit_name: selectedItem.unit_name,
    };
    
    setForm({ ...form, items: updatedItems });
  }
  
  setShowProductModal(false);
  setCurrentItemIndex(-1);
};

  // ✅ ВИБІР КІЛЬКОХ ТОВАРІВ
// ✅ ОНОВЛЕНА ФУНКЦІЯ ДЛЯ МНОЖЕСТВЕННОГО ВИБОРУ
const handleMultipleProductsSelect = async (selectedItems: SelectedProductWithUnit[]) => {
  if (form.trade_points.length === 0 || priceTypes.length === 0) {
    toast.error("Спочатку оберіть торгові точки");
    return;
  }

  const defaultPriceType = priceTypes.find(pt => pt.is_default) || priceTypes[0];
  const defaultTradePoint = form.trade_points[0];
  const selectedFirm = getSelectedFirm();

  const newItems: PriceSettingItem[] = [];

  // Обробляємо кожен товар з фасуванням
  for (const selectedItem of selectedItems) {
    const conversions = await loadProductConversions(selectedItem.product.id);
    
    // Зберігаємо фасування для товару
    setProductConversions(prev => ({
      ...prev,
      [selectedItem.product.id]: conversions
    }));

    const basePrice = selectedItem.product.base_price || selectedItem.product.price || 0;
    let finalPrice = basePrice;
    
    // Якщо є фасування, перераховуємо ціну
    if (selectedItem.unit_conversion_id && selectedItem.factor !== 1) {
      finalPrice = basePrice / selectedItem.factor;
    }

    newItems.push({
      product: selectedItem.product.id,
      product_name: selectedItem.product.name,
      product_base_unit: selectedItem.product.unit,
      product_base_unit_name: selectedItem.product.unit_name,
      price_type: defaultPriceType.id,
      
      // ✅ БАЗОВА ТА ФІНАЛЬНА ЦІНА:
      base_price: basePrice,
      price: finalPrice,
      
      // ✅ ІНФОРМАЦІЯ ПРО ФАСУВАННЯ:
      unit_conversion: selectedItem.unit_conversion_id,
      unit_conversion_name: selectedItem.unit_conversion_id ? selectedItem.unit_name : "",
      final_unit: selectedItem.product.unit,
      final_unit_name: selectedItem.unit_name,
      
      vat_percent: selectedFirm?.is_vat ? 20 : 0,
      vat_included: selectedFirm?.is_vat || false,
      markup_percent: 0,
      trade_point: defaultTradePoint,
      firm: form.firm,
      firm_name: selectedFirm?.name,
      firm_is_vat_payer: selectedFirm?.is_vat || false
    });
  }

  setForm({ 
    ...form, 
    items: [...form.items, ...newItems]
  });
  
  setShowProductModal(false);
  setCurrentItemIndex(-1);
  
  toast.success(`Додано ${selectedItems.length} товарів`);
};

const openProductModal = (itemIndex: number) => {
  console.log("🔥 Opening product modal for index:", itemIndex); // ✅ ДОДАЙТЕ ЦЕЙ ЛОГ
  setCurrentItemIndex(itemIndex);
  setShowProductModal(true);
};

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

    const hasInvalidItems = form.items.some(item => !item.product);
    if (hasInvalidItems) {
      toast.error("Оберіть товари для всіх позицій ❗");
      return false;
    }

    return true;
  };

  // ✅ ЗБЕРЕЖЕННЯ ДОКУМЕНТА
const handleSave = async () => {
  if (!validateForm()) {
    return;
  }

  setSaving(true);


  
  // ✅ ПРАВИЛЬНИЙ ФОРМАТ ВІДПОВІДНО ДО ТВОГО BACKEND
const requestBody = {
    company: form.company,
    firm: form.firm,
    valid_from: form.valid_from,
    base_type: form.base_type || undefined,
    base_receipt: form.base_receipt,
    base_group: form.base_group,
    base_price_type: form.base_price_type,
    trade_points: form.trade_points,
    items: form.items.map(item => ({
      product: item.product,
      price_type: item.price_type,
      base_price: Number(item.base_price || 0),
      price: Number(item.base_price || 0),
      vat_percent: Number(item.vat_percent || 0),
      vat_included: Boolean(item.vat_included),
      markup_percent: Number(item.markup_percent || 0),
      unit_conversion: item.unit_conversion,
      trade_point: item.trade_point,
      firm: item.firm || form.firm,
      unit: item.product_base_unit  // ✅ ДОДАТИ ЦЕ ПОЛЕ!
    })),
    comment: form.comment || ""
  };

  console.log("=== ВИПРАВЛЕНИЙ REQUEST З UNIT ===");
  console.log("Request body:", JSON.stringify(requestBody, null, 2));
  console.log("Sample item:", requestBody.items[0]);
  console.log("==================================");

  try {
    const response = await axios.post("create-price-setting-document/", requestBody);
    console.log("✅ Success:", response.data);
    toast.success("Документ ціноутворення створено ✅");
    
    setTimeout(() => {
      navigate("/price-settings");
    }, 500);
    
  } catch (error: any) {
    console.error("Error:", error.response?.data);
    toast.error("Помилка збереження");
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
  onChange={handleCompanyChange} // ✅ ЗМІНИТИ НА handleCompanyChange
  defaultValue="" // ✅ ЗМІНИТИ НА ""
/>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
          Фірма *
        </label>
        <Select
  options={getFilteredFirms().map(firm => ({ // ✅ ВИКОРИСТАТИ getFilteredFirms()
    value: firm.id.toString(),
    label: `${firm.name} (${firm.is_vat ? 'з ПДВ' : 'без ПДВ'})` // ✅ ПОКАЗАТИ ПДВ
  }))}
  placeholder="Оберіть фірму"
  onChange={handleFirmChange}
  defaultValue="" // ✅ ЗМІНИТИ НА ""
/>
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
    </div>
  </div>

  {/* ✅ 1. СПОЧАТКУ ТОРГОВІ ТОЧКИ */}
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Крок 1: Торгові точки * 
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Спочатку оберіть торгові точки, для яких будуть діяти ці ціни
        </p>
      </div>
      {form.trade_points.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Обрано: {form.trade_points.length} з {tradePoints.length}
        </div>
      )}
    </div>
    
    {/* Весь код торгових точок тут... */}
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
          Додайте торгові точки або оберіть іншу фірму.
        </p>
      </div>
    ) : (
      <>
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

        {form.trade_points.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
              <span className="text-lg">✅</span>
              <span className="text-sm font-medium">
                Торгові точки обрано! Тепер можете вибрати базування.
              </span>
            </div>
          </div>
        )}
      </>
    )}
  </div>

  {/* ✅ 2. ТЕПЕР БАЗУВАННЯ (тільки якщо є торгові точки) */}
  {form.trade_points.length > 0 && (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
        Крок 2: Тип базування (необов'язково)
      </h2>
      
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
  <div className="col-span-2 space-y-4"> {/* ✅ ДОДАТИ space-y-4 */}
    {/* ✅ ДОДАТИ ВИБІР ПОСТАЧАЛЬНИКА: */}
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
        Постачальник *
      </label>
      <div className="max-w-md">
        <Select
          options={suppliers.map(supplier => ({
            value: supplier.id.toString(),
            label: supplier.name
          }))}
          placeholder="Оберіть постачальника"
          onChange={(value) => {
            const supplierId = parseInt(value);
            setSelectedSupplier(supplierId);
            setReceipts([]); // Скидаємо документи
            setForm({ ...form, base_receipt: undefined, items: [] });
            
            // ✅ ЗАВАНТАЖУЄМО ДОКУМЕНТИ ДЛЯ ПОСТАЧАЛЬНИКА
            if (supplierId && form.firm) {
              loadReceiptsBySupplierAndFirm(supplierId, form.firm);
            }
          }}
          defaultValue=""
        />
      </div>
    </div>

    {/* ✅ ДОКУМЕНТИ ТІЛЬКИ ЯКЩО ВИБРАНО ПОСТАЧАЛЬНИКА: */}
    {selectedSupplier && (
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
          Документ поступлення *
        </label>
        {loadingData.receipts ? (
          <div className="p-3 border border-blue-300 bg-blue-50 rounded-lg text-blue-700 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Завантаження документів...
          </div>
        ) : (!receipts || receipts.length === 0) ? (
          <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-700">
            ⚠️ Документів поступлення для цього постачальника не знайдено
          </div>
        ) : (
          <div className="max-w-md">
            <Select
              options={receipts.map(receipt => ({
                value: receipt.id.toString(),
                label: `${receipt.doc_number} від ${new Date(receipt.date).toLocaleDateString('uk-UA')}`
              }))}
              placeholder="Оберіть документ поступлення"
              onChange={handleBaseReceiptChange}
              defaultValue=""
            />
          </div>
        )}
      </div>
    )}
  </div>
)}

{form.base_type === 'product_group' && (
  <div className="col-span-2">
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
      Група товарів *
    </label>
    <div className="max-w-md">
      <Select
        options={productGroups.map(group => ({
          value: group.id.toString(),
          label: group.name
        }))}
        placeholder="Оберіть групу товарів"
        onChange={async (value) => {
          const groupId = parseInt(value);
          setForm({ ...form, base_group: groupId, items: [] });
          
          // ✅ АВТОМАТИЧНО ЗАВАНТАЖУЄМО ТОВАРИ
          if (groupId && form.trade_points.length > 0 && priceTypes.length > 0) {
            await loadProductsByGroup(groupId);
          } else {
            console.log("Skipping product load - missing requirements:");
            console.log("- Group ID:", groupId);
            console.log("- Trade points:", form.trade_points.length);
            console.log("- Price types:", priceTypes.length);
          }
        }}
        defaultValue=""
      />
    </div>
    {form.base_group && (
      <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
        ℹ️ Товари з цієї групи будуть автоматично додані до ціноутворення
      </div>
    )}
  </div>
)}

{form.base_type === 'price_type' && (
  <div className="col-span-2"> {/* ✅ Додай це */}
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
      Тип ціни *
    </label>
    <div className="max-w-md"> {/* ✅ Залиш це для обмеження */}
      <Select
        options={priceTypes.map(type => ({
          value: type.id.toString(),
          label: type.name
        }))}
        placeholder="Оберіть тип ціни"
        onChange={(value) => setForm({ ...form, base_price_type: parseInt(value) })}
        defaultValue=""
      />
    </div>
  </div>
)}

        {/* Інші типи базування... */}
      </div>
    </div>
  )}

        {/* Товари і ціни */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Товари та ціни ({form.items.length})
            </h2>
            <div className="flex gap-2 flex-wrap">
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
    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
      Базова од.
    </TableCell>
    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
      Фасування
    </TableCell>
    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
      Базова ціна
    </TableCell>
    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
      Фінальна ціна
    </TableCell>
    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
      Тип ціни
    </TableCell>
    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
      Торгова точка
    </TableCell>
    {shouldShowVatColumns && (
      <>
        <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
          ПДВ %
        </TableCell>
        <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
          З ПДВ
        </TableCell>
      </>
    )}
    <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
      Дії
    </TableCell>
  </tr>
</TableHeader>

<TableBody>
  {form.items.map((item, index) => {
    const conversions = getProductConversions(item.product || 0);
    
    return (
      <tr key={index} className="border-b border-gray-100 dark:border-white/10">
        {/* ✅ ТОВАР */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {item.product_name ? (
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                  <div className="font-medium text-sm">{item.product_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
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
        </td>
        
        {/* ✅ БАЗОВА ОДИНИЦЯ */}
        <td className="px-4 py-3">
          <div className="text-center">
            <span className="text-sm font-medium">
              {item.product_base_unit_name || "—"}
            </span>
          </div>
        </td>
        
        {/* ✅ ФАСУВАННЯ */}
        <td className="px-4 py-3">
          <div className="flex justify-center">
            <div className="w-40">
              {item.product ? (
                <Select
                  options={[
                    { value: '', label: 'Без фасування' },
                    ...conversions.map(conv => ({
                      value: conv.id.toString(),
                      label: conv.name
                    }))
                  ]}
                  placeholder="Оберіть фасування"
                  onChange={(value) => updateItem(index, 'unit_conversion', value ? parseInt(value) : null)}
                  defaultValue={item.unit_conversion?.toString() || ''}
                  key={`conversion-${item.product}-${conversions.length}-${item.unit_conversion}`}
                />
              ) : (
                <div className="text-center text-gray-400 text-sm">
                  Оберіть товар
                </div>
              )}
            </div>
          </div>
        </td>
        
        {/* ✅ БАЗОВА ЦІНА - ПОЛЕ ДЛЯ ВВЕДЕННЯ */}
        <td className="px-4 py-3">
          <div className="flex justify-center">
            <Input
              type="number"
              value={item.base_price?.toString() || ''}
              onChange={(e) => updateItem(index, 'base_price', parseFloat(e.target.value) || 0)}
              className="w-28 text-center"
              placeholder="Введіть ціну"
            />
          </div>
        </td>
        
        {/* ✅ ФІНАЛЬНА ЦІНА - АВТОМАТИЧНО РОЗРАХОВУЄТЬСЯ */}
        <td className="px-4 py-3">
  <div className="text-center">
    <div className="text-lg font-bold text-green-600">
      {(item.base_price || 0).toFixed(2)} ₴
    </div>
    <div className="text-xs text-gray-500">
      за {item.final_unit_name || item.product_base_unit_name || "од."}
    </div>
  </div>
</td>
        
        {/* ✅ ТИП ЦІНИ */}
        <td className="px-4 py-3">
          <div className="flex justify-center">
            <div className="w-32">
              <Select
                options={priceTypes.map(pt => ({
                  value: pt.id.toString(),
                  label: pt.name
                }))}
                placeholder="Тип ціни"
                onChange={(value) => updateItem(index, 'price_type', parseInt(value))}
                defaultValue={item.price_type?.toString() || ''}
              />
            </div>
          </div>
        </td>
        
        {/* ✅ ТОРГОВА ТОЧКА */}
        <td className="px-4 py-3">
          <div className="flex justify-center">
            <div className="w-36">
              <Select
                options={tradePoints.map(tp => ({
                  value: tp.id.toString(),
                  label: tp.name
                }))}
                placeholder="Торгова точка"
                onChange={(value) => updateItem(index, 'trade_point', parseInt(value))}
                defaultValue={item.trade_point?.toString() || ''}
              />
            </div>
          </div>
        </td>
        
        {/* ✅ КОЛОНКИ ПДВ (якщо потрібно) */}
        {shouldShowVatColumns && (
          <>
            <td className="px-4 py-3">
              <div className="flex justify-center">
                {item.firm_is_vat_payer ? (
                  <Input
                    type="number"
                    value={item.vat_percent?.toString() || '0'}
                    onChange={(e) => updateItem(index, 'vat_percent', parseFloat(e.target.value) || 0)}
                    className="w-20 text-center"
                    placeholder="20"
                  />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </td>
            
            <td className="px-4 py-3">
              <div className="flex justify-center">
                {item.firm_is_vat_payer ? (
                  <input
                    type="checkbox"
                    checked={item.vat_included || false}
                    onChange={(e) => updateItem(index, 'vat_included', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </td>
          </>
        )}
        
        {/* ✅ ДІЇ */}
        <td className="px-4 py-3">
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeItem(index)}
              className="text-red-600 hover:text-red-700"
            >
              🗑️
            </Button>
          </div>
        </td>
      </tr>
    );
  })}
</TableBody>
              </Table>
            </div>  
          )}

          {/* Підсумки */}
          {form.items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Торгових точок:</span>
                  <span className="font-medium">{form.trade_points.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Позицій цін:</span>
                  <span className="font-medium">{form.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Типів цін:</span>
                  <span className="font-medium">{priceTypes.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Коментар */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Коментар (необов'язково)
          </h2>
          <textarea
            value={form.comment || ''}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Додайте коментар до документа ціноутворення..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
          />
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
       selectedWarehouse={undefined}
     />

     {/* Модальне вікно підтвердження */}
     <ConfirmModal
       isOpen={showSaveModal}
       title="Зберегти документ ціноутворення?"
       description={`Ви впевнені, що хочете створити документ ціноутворення з наступними параметрами:

- Товарів: ${form.items.length}
- Торгових точок: ${form.trade_points.length}
- Компанія: ${companies.find(c => c.id === form.company)?.name || 'Не обрано'}
- Фірма: ${firms.find(f => f.id === form.firm)?.name || 'Не обрано'}
- Дата початку дії: ${form.valid_from}`}
       onConfirm={() => {
         setShowSaveModal(false);
         handleSave();
       }}
       onClose={() => setShowSaveModal(false)}
     />
   </>
 );
}