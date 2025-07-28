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
import ReceiptSelectionModal from "../../../components/modals/ReceiptSelectionModal";


import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";


type ReturnToSupplierForm = {
  doc_type: string;
  company: number;
  firm: number;
  warehouse: number | undefined;
  supplier: number | undefined;  
  trade_point: number | undefined;
  contract: number | undefined;
  source_document: number | undefined; 
  auto_payment: boolean;
  items: ReturnToSupplierItem[];
};

type Company = {
  id: number;
  name: string;
  tax_id?: string;
};

type Firm = {
  id: number;
  name: string;
  company_name: string;
  company_id: number;
  is_vat: boolean; 
  vat_type: string;
};

type Supplier = {
  id: number;
  name: string;
  company?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
};

// ✅ ПОВЕРНЕННЯ ТОВАРУ (схожий на SaleItem)
type ReturnToSupplierItem = {
  product: number | undefined;
  product_name?: string;
  product_base_unit?: number;
  product_base_unit_name?: string;
  
  // ✅ ФАСУВАННЯ:
  unit_conversion: number | null;
  unit_conversion_name?: string;
  final_unit?: number;
  final_unit_name?: string;
  
  quantity: number;
  price: number;
  vat_percent: number;
  total: number;
};

type SelectedProductWithUnit = {
  product: Product;
  unit_conversion_id: number | null;
  unit_name: string;
  unit_symbol: string;
  factor: number;
};


type Warehouse = {
  id: number;
  name: string;
};

type TradePoint = {
  id: number;
  name: string;
  firm_id: number;
  firm_name: string;
};

type Contract = {
  id: number;
  name: string;
  customer: number;
  customer_name: string;
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
  category?: string;
  category_id?: number;
  product_group?: number;
  product_group_name?: string;
};

type PurchaseDocument = {
  id: number;
  doc: string;
  doc_number?: string;
  supplier_name?: string;
  date?: string;
};


export default function CreateReturnToSupplierPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  
  // ✅ ПОЧАТКОВИЙ СТАН ДЛЯ ПОВЕРНЕННЯ

const [form, setForm] = useState<ReturnToSupplierForm>({
  doc_type: "return_to_supplier", // ✅ ЗМІНИТИ ТИП
  company: 0,
  firm: 0,
  warehouse: undefined,
  supplier: undefined, // ✅ supplier замість customer
  trade_point: undefined,
  contract: undefined,
  source_document: undefined,
  auto_payment: false,
  items: [
    {
      product: undefined,
      product_base_unit: undefined,
      product_base_unit_name: "",
      unit_conversion: null,
      unit_conversion_name: "",
      final_unit: undefined,
      final_unit_name: "",
      quantity: 1,
      price: 0,
      vat_percent: 0,
      total: 0
    }
  ]
});


  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tradePoints, setTradePoints] = useState<TradePoint[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); // замість customers
  const [purchaseDocuments, setPurchaseDocuments] = useState<PurchaseDocument[]>([]); // замість salesDocuments
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    loadDictionaries();
  }, []);

  useEffect(() => {
  if (form.company && form.firm && form.warehouse) {
    fetchReceipts();
  }
}, [form.company, form.firm, form.warehouse]);

  const handleReceiptSelect = (receipt: any) => {
  console.log("📋 Обрано документ поступлення:", receipt);
  console.log("📋 ID документа:", receipt.id);
  
  setSelectedReceipt(receipt.id);
  setForm(prev => ({ 
    ...prev, 
    source_document: receipt.id,
    supplier: receipt.supplier_id,
    items: [] // Очистити товари перед завантаженням нових
  }));
  
  // Завантажити договори для цього постачальника
  if (receipt.supplier_id && form.firm) {
    loadContractsBySupplier(receipt.supplier_id);
  }
  
  toast.success(`Обрано документ: ${receipt.doc_number}`);
};



  // ✅ Отримуємо поступлення по фільтру
  const fetchReceipts = async () => {
  if (!form.company || !form.firm || !form.warehouse) {
    console.log("Не всі параметри вибрані для завантаження поступлень");
    return;
  }

  try {
    console.log("🔄 Завантаження поступлень з параметрами:", {
      company: form.company,
      firm: form.firm,
      warehouse: form.warehouse
    });

    const response = await axios.get("/receipts-by-filter/", {
      params: {
        company: form.company,
        firm: form.firm,
        warehouse: form.warehouse,
      },
    });

    console.log("✅ Поступлення завантажено:", response.data);
    
    if (response.data.success && response.data.data) {
      setReceipts(response.data.data);
      
      if (response.data.data.length === 0) {
        toast.error("Поступлення для цього складу не знайдені");
      }
    } else {
      setReceipts([]);
      toast.error("Не вдалося завантажити поступлення");
    }
  } catch (error) {
    console.error("❌ Помилка при завантаженні поступлень:", error);
    setReceipts([]);
    toast.error("Помилка завантаження поступлень");
  }
};


  // ✅ Підтягуємо товари з вибраного поступлення
  useEffect(() => {
  const fetchReceiptItems = async () => {
    if (!selectedReceipt) {
      console.log("Документ поступлення не обрано");
      return;
    }

    try {
      console.log(`🔄 Завантаження товарів з поступлення ID: ${selectedReceipt}`);
      
      // ✅ ПРАВИЛЬНИЙ endpoint для отримання документа
      const response = await axios.get(`/document/${selectedReceipt}`);
      
      console.log("✅ Відповідь API:", response.data);
      
      const receiptData = response.data;
      const fetchedItems = receiptData.items || [];

      console.log("📦 Товари з поступлення:", fetchedItems);

      if (!fetchedItems || fetchedItems.length === 0) {
        toast.error("В цьому документі поступлення немає товарів");
        return;
      }

      // ✅ МАПУВАННЯ товарів з правильної структури
      const mappedItems: ReturnToSupplierItem[] = fetchedItems.map((item: any, index: number) => {
        console.log(`📝 Мапування товару ${index + 1}:`, item);
        
        return {
          product: item.product,
          product_name: `Товар ID: ${item.product}`, // Поки що так, пізніше додамо назви
          product_base_unit: item.unit,
          product_base_unit_name: "", // Треба буде додати запит на одиниці
          unit_conversion: item.unit_conversion,
          unit_conversion_name: "",
          final_unit: item.unit,
          final_unit_name: "",
          quantity: parseFloat(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          vat_percent: parseFloat(item.vat_percent) || 0,
          total: (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1),
        };
      });

      console.log("✅ Змаповані товари:", mappedItems);

      setForm(prev => ({ 
        ...prev, 
        items: mappedItems,
        source_document: selectedReceipt
      }));

      toast.success(`Завантажено ${mappedItems.length} товарів з поступлення`);

    } catch (error: any) {
      console.error("❌ Помилка при завантаженні товарів:", error);
      toast.error("Не вдалося завантажити товари з поступлення");
    }
  };

  fetchReceiptItems();
}, [selectedReceipt]);

const checkPurchaseDocuments = async () => {
  try {
    const response = await axios.get("documents/?type=purchase"); // ✅ purchase замість sale
    console.log("📋 Available purchase documents:", response.data);
    
    let purchaseDocs = [];
    if (response.data && response.data.data) {
      purchaseDocs = response.data.data;
    } else if (Array.isArray(response.data)) {
      purchaseDocs = response.data;
    }
    
    setPurchaseDocuments(purchaseDocs); // ✅ ЗМІНЕНО
    
    if (purchaseDocs.length > 0) {
      console.log("✅ Found purchase documents:", purchaseDocs);
      console.log("✅ Use one of these IDs for source_document:", purchaseDocs.map((doc: { id: any; }) => doc.id));
    } else {
      console.log("❌ No purchase documents found. Create a purchase document first!");
    }
  } catch (error) {
    console.error("Error loading purchase documents:", error);
  }
};


  const loadDictionaries = async () => {
  try {
    console.log("Loading dictionaries for returns to supplier...");

    const requests = [
      axios.get("companies/"),
      axios.get("firms/"),
      axios.get("suppliers/"), // ✅ suppliers замість customers
      axios.get("warehouses/"),
      axios.get("trade-points/")
    ];

    const results = await Promise.allSettled(requests);
    
    // ✅ КОМПАНІЇ
    if (results[0].status === 'fulfilled') {
      console.log("✅ Companies loaded:", results[0].value.data);
      setCompanies(results[0].value.data);
    } else {
      console.error("❌ Error loading companies:", results[0].reason);
      setCompanies([]);
      toast.error("Не вдалося завантажити компанії");
    }

    // ✅ ФІРМИ
    if (results[1].status === 'fulfilled') {
      console.log("✅ Firms loaded:", results[1].value.data);
      setFirms(results[1].value.data);
    } else {
      console.error("❌ Error loading firms:", results[1].reason);
      setFirms([]);
      toast.error("Не вдалося завантажити фірми");
    }

    // ✅ ПОСТАЧАЛЬНИКИ
    if (results[2].status === 'fulfilled') {
      setSuppliers(results[2].value.data); // ✅ ЗМІНЕНО
    }

    // ✅ СКЛАДИ
    if (results[3].status === 'fulfilled') {
      setWarehouses(results[3].value.data);
    }

    // ✅ ТОРГОВІ ТОЧКИ
    if (results[4].status === 'fulfilled') {
      setTradePoints(results[4].value.data);
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
    console.log(`Loading contracts for supplier ${supplierId} and firm ${form.firm}...`);
    
    const response = await axios.get(`contracts/by-supplier/?id=${supplierId}`); // ✅ ЗМІНЕНО ендпоінт
    console.log("✅ All contracts loaded:", response.data);
    
    let filteredContracts = response.data;
    
    if (form.firm && response.data.length > 0 && 'firm_id' in response.data[0]) {
      filteredContracts = response.data.filter((contract: any) => 
        contract.firm_id === form.firm
      );
      console.log(`✅ Filtered contracts for firm ${form.firm}:`, filteredContracts);
    }
    
    setContracts(filteredContracts);
    
    if (filteredContracts.length === 0) {
      toast.error("Договори для цього постачальника і фірми не знайдені"); // ✅ ЗМІНЕНО текст
    }
    
  } catch (error) {
    console.error("❌ Error loading contracts:", error);
    setContracts([]);
    toast.error("Не вдалося завантажити договори");
  } finally {
    setLoadingContracts(false);
  }
};

  const handleCompanyChange = (value: string) => {
  const companyId = parseInt(value);
  setForm({ 
    ...form, 
    company: companyId,
    firm: 0,
    warehouse: undefined,
    supplier: undefined, // ✅ ЗМІНЕНО supplier замість customer
    trade_point: undefined,
    contract: undefined,
    items: []
  });
  
  if (companyId) {
    loadWarehousesByCompany(companyId);
  } else {
    setWarehouses([]);
  }
  setContracts([]);
};

  const loadWarehousesByCompany = async (companyId: number) => {
    try {
      const response = await axios.get("warehouses/");
      const filteredWarehouses = response.data.filter((w: any) => 
        w.company_id === companyId
      );
      setWarehouses(filteredWarehouses);
    } catch (error) {
      setWarehouses([]);
    }
  };

  const handleFirmChange = (value: string) => {
  const firmId = parseInt(value);
  setForm({ 
    ...form, 
    firm: firmId,
    warehouse: undefined,
    trade_point: undefined,
    supplier: undefined, // ✅ ЗМІНЕНО supplier замість customer
    contract: undefined,
    items: []
  });
  
  if (firmId) {
    loadTradePointsByFirm(firmId);
    loadWarehousesByFirm(firmId);
  } else {
    setTradePoints([]);
    setWarehouses([]);
  }
};


  const getFilteredFirms = () => {
    return firms.filter(firm => firm.company_id === form.company);
  };

  const loadTradePointsByFirm = async (firmId: number) => {
    try {
      const response = await axios.get("trade-points/");
      console.log("✅ All trade points:", response.data);
      
      const filteredTradePoints = response.data.filter((tp: any) => 
        tp.firm === firmId || tp.firm_id === firmId
      );
      
      console.log("✅ Filtered trade points:", filteredTradePoints);
      setTradePoints(filteredTradePoints);
    } catch (error) {
      console.error("❌ Error loading trade points:", error);
      setTradePoints([]);
    }
  };

  const loadWarehousesByFirm = async (firmId: number) => {
    try {
      const response = await axios.get("warehouses/");
      console.log("✅ All warehouses:", response.data);
      
      const filteredWarehouses = response.data.filter((w: any) => 
        w.company_id === form.company
      );
      
      console.log("✅ Filtered warehouses:", filteredWarehouses);
      setWarehouses(filteredWarehouses);
      
      if (filteredWarehouses.length === 0) {
        toast.error("Склади для цієї компанії не знайдені");
      }
    } catch (error) {
      console.error("❌ Error loading warehouses:", error);
      setWarehouses([]);
      toast.error("Не вдалося завантажити склади");
    }
  };

  const handleSupplierChange = (value: string) => {
  const supplierId = parseInt(value);
  setForm({ 
    ...form, 
    supplier: supplierId, // ✅ ЗМІНЕНО
    contract: undefined
  });
  
  if (supplierId && form.firm) {
    loadContractsBySupplier(supplierId); // ✅ ЗМІНЕНО назву функції
  } else {
    setContracts([]);
  }
};

  const handleWarehouseChange = (value: string) => {
  const warehouseId = parseInt(value);
  setForm({ ...form, warehouse: warehouseId });
  
  if (warehouseId && form.company && form.firm) {
    fetchReceipts();
  }
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

  const handleItemChange = (index: number, field: keyof ReturnToSupplierItem, value: string) => {
  // ✅ ЗМІНЕНО тип з ReturnItem на ReturnToSupplierItem
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

  const handleMultipleProductsSelect = (selectedItems: SelectedProductWithUnit[]) => {
    const newItems = selectedItems.map(selectedItem => ({
      product: selectedItem.product.id,
      product_name: selectedItem.product.name,
      product_base_unit: selectedItem.product.unit,
      product_base_unit_name: selectedItem.product.unit_name,
      
      // ✅ ФАСУВАННЯ:
      unit_conversion: selectedItem.unit_conversion_id,
      unit_conversion_name: selectedItem.unit_conversion_id ? selectedItem.unit_name : "",
      final_unit: selectedItem.product.unit,
      final_unit_name: selectedItem.unit_name,
      
      quantity: 1,
      price: selectedItem.product.price || 0,
      vat_percent: 0,
      total: 1 * (selectedItem.product.price || 0)
    }));

    setForm({ 
      ...form, 
      items: [...form.items.filter(item => item.product), ...newItems]
    });
    setShowProductModal(false);
    setCurrentItemIndex(-1);
  };

  const handleProductSelect = (selectedItem: SelectedProductWithUnit) => {
    if (currentItemIndex >= 0) {
      const items = [...form.items];
      items[currentItemIndex] = {
        ...items[currentItemIndex],
        product: selectedItem.product.id,
        product_name: selectedItem.product.name,
        product_base_unit: selectedItem.product.unit,
        product_base_unit_name: selectedItem.product.unit_name,
        
        // ✅ ФАСУВАННЯ:
        unit_conversion: selectedItem.unit_conversion_id,
        unit_conversion_name: selectedItem.unit_conversion_id ? selectedItem.unit_name : "",
        final_unit: selectedItem.product.unit,
        final_unit_name: selectedItem.unit_name,
        
        price: selectedItem.product.price || items[currentItemIndex].price,
        total: items[currentItemIndex].quantity * (selectedItem.product.price || items[currentItemIndex].price)
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
  const newItem: ReturnToSupplierItem = { // ✅ ЗМІНЕНО тип
    product: undefined,
    product_base_unit: undefined,
    product_base_unit_name: "",
    unit_conversion: null,
    unit_conversion_name: "",
    final_unit: undefined,
    final_unit_name: "",
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
  if (!form.company || !form.firm) {
    toast.error("Оберіть компанію та фірму ❗");
    return false;
  }

  if (!form.supplier || !form.warehouse || !form.trade_point) {
    toast.error("Заповніть усі обов'язкові поля ❗");
    return false;
  }

  // ✅ НОВА ПЕРЕВІРКА: Документ поступлення замість purchase documents
  if (!form.source_document) {
    toast.error("Оберіть документ поступлення для повернення ❗");
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

  const selectedTradePoint = tradePoints.find(tp => tp.id === form.trade_point);
  if (!selectedTradePoint) {
    toast.error("Обрана торгова точка не існує в системі ❗");
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
    trade_point: form.trade_point,
    contract: form.contract,
    source_document: form.source_document, // ✅ Використовуємо вибраний документ
    auto_payment: form.auto_payment,
    items: form.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      vat_percent: item.vat_percent,
      unit_conversion: item.unit_conversion
    }))
  };

  console.log("🔄 Sending return_to_supplier request:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await axios.post("document/", requestBody);
    console.log("✅ Return to supplier document created successfully:", response.data);
    
    toast.success("Документ повернення постачальнику створено ✅");
    
    setTimeout(() => {
      navigate("/returns-to-supplier");
    }, 500);
    
  } catch (error: any) {
    console.error("❌ API Error:", error);
    
    if (error.response) {
      console.error("❌ Response data:", JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'string') {
          toast.error(`API помилка: ${errorData}`);
        } else if (errorData.message) {
          toast.error(`API помилка: ${errorData.message}`);
        } else if (errorData.error) {
          toast.error(`API помилка: ${errorData.error}`);
        } else if (errorData.detail) {
          toast.error(`API помилка: ${errorData.detail}`);
        } else {
          const errorMessages = Object.entries(errorData)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          toast.error(`API помилка: ${errorMessages}`);
        }
      } else {
        toast.error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
    } else {
      toast.error("Помилка запиту");
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
      <PageMeta 
  title="Новий документ повернення постачальнику | НашСофт" 
  description="Створення документа повернення товарів постачальнику" 
/>
<PageBreadcrumb
  crumbs={[
    { label: "Повернення постачальнику", href: "/returns-to-supplier" },
    { label: "Новий документ" },
  ]}
/>

<div className="mb-6 flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
      ↩️ Новий документ повернення постачальнику
    </h1>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      Заповніть форму для створення документа повернення товарів постачальнику
    </p>
  </div>
  <div className="flex gap-3">
    <Button variant="outline" size="sm" onClick={() => navigate("/returns-to-supplier")}>
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
      {/* ✅ КОМПАНІЯ */}
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
          defaultValue=""
        />
      </div>

      {/* ✅ ФІРМА */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
          Фірма *
        </label>
        <Select
          options={getFilteredFirms().map(firm => ({
            value: firm.id.toString(),
            label: `${firm.name} (${firm.is_vat ? 'з ПДВ' : 'без ПДВ'})`
          }))}
          placeholder="Оберіть фірму"
          onChange={handleFirmChange}
          defaultValue=""
        />
      </div>

      {/* ✅ СКЛАД - ПЕРЕМІСТИТИ ПЕРЕД ПОСТАЧАЛЬНИКОМ */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
          Склад *
        </label>
        {!form.firm ? (
          <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
            Спочатку оберіть фірму
          </div>
        ) : warehouses.length === 0 ? (
          <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
            ⚠️ Склади для цієї фірми не знайдені
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

      {/* ✅ ПОСТАЧАЛЬНИК */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
          Постачальник *
        </label>
        {!form.firm ? (
          <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
            Спочатку оберіть фірму
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
            ⚠️ Постачальники не завантажені
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

      {/* ✅ ТОРГОВА ТОЧКА */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
          Торгова точка *
        </label>
        {!form.firm ? (
          <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
            Спочатку оберіть фірму
          </div>
        ) : tradePoints.length === 0 ? (
          <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
            ⚠️ Торгові точки для цієї фірми не знайдені
          </div>
        ) : (
          <Select
            options={tradePoints.map(tp => ({
              value: tp.id.toString(),
              label: tp.name
            }))}
            placeholder="Оберіть торгову точку"
            onChange={handleTradePointChange}
            defaultValue=""
          />
        )}
      </div>

      {/* ✅ ДОГОВІР */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
          Контракт
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
    </div>
    
    {/* ✅ ДОКУМЕНТ ПОСТУПЛЕННЯ - НОВИЙ БЛОК З КНОПКОЮ */}
<div className="mt-6">
  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
    📋 Документ поступлення для повернення
  </label>
  
  {!form.warehouse ? (
    <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
      Спочатку оберіть склад
    </div>
  ) : (
    <div className="space-y-3">
      {/* КНОПКА ВИБОРУ ДОКУМЕНТА */}
      <Button 
        variant="outline" 
        onClick={() => setShowReceiptModal(true)}
        className="w-full justify-start"
      >
        📋 Обрати документ поступлення
      </Button>
      
      {/* ІНФОРМАЦІЯ ПРО ВИБРАНИЙ ДОКУМЕНТ */}
      {selectedReceipt && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {(() => {
            const selectedReceiptData = receipts.find(r => r.id === selectedReceipt);
            return selectedReceiptData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-blue-800">
                    ✅ Обрано: {selectedReceiptData.doc_number}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedReceipt(null);
                      setForm(prev => ({ ...prev, source_document: undefined, items: [] }));
                    }}
                  >
                    ✕ Скасувати
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-600">
                  <div>📅 {new Date(selectedReceiptData.date).toLocaleDateString('uk-UA')}</div>
                  <div>🏢 {selectedReceiptData.supplier_name}</div>
                  <div>📊 {selectedReceiptData.status === 'posted' ? 'Проведено' : selectedReceiptData.status}</div>
                  <div>📦 {selectedReceiptData.warehouse_name}</div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  )}
</div>
    
    {/* Автоматична оплата */}
    <div className="mt-4 flex items-center gap-2">
      <input
        type="checkbox"
        id="auto_payment"
        checked={form.auto_payment}
        onChange={(e) => handleAutoPaymentChange(e.target.checked)}
        className="rounded border-gray-300"
      />
      <label htmlFor="auto_payment" className="text-sm text-gray-700 dark:text-white">
        Автоматичне повернення коштів від постачальника
      </label>
    </div>
  </div>

  {/* Товари */}
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        Позиції для повернення ({form.items.length})
      </h2>
      <div className="flex gap-2">
        {/* ✅ ПОКАЗУВАТИ КНОПКИ ТІЛЬКИ ЯКЩО ОБРАНО ДОКУМЕНТ ПОСТУПЛЕННЯ */}
        {selectedReceipt ? (
          <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
            ✅ Товари завантажені з поступлення
          </div>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={openMultiProductModal}>
              Додати декілька товарів
            </Button>
            <Button variant="outline" size="sm" onClick={addItem}>
              Додати товар
            </Button>
          </>
        )}
      </div>
    </div>

    {/* ✅ ПОКАЗУВАТИ ТОВАРИ ТІЛЬКИ ЯКЩО ВОНИ Є */}
    {form.items.length === 0 ? (
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-gray-500 mb-2">
          📦 Немає товарів для повернення
        </div>
        <div className="text-sm text-gray-400">
          {!selectedReceipt 
            ? "Оберіть документ поступлення, щоб завантажити товари" 
            : "Товари завантажуються..."
          }
        </div>
      </div>
    ) : (
      <>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
          <Table>
            <TableHeader>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                  Товар *
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                  Одиниця
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
                  {/* ✅ ТОВАР */}
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        {item.product_name ? (
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <div className="font-medium text-sm text-red-800 dark:text-red-300">{item.product_name}</div>
                            <div className="text-xs text-red-600 dark:text-red-400">
                              ID: {item.product} • ↩️ Повернення постачальнику
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-center text-gray-500">
                            Товар не обрано
                          </div>
                        )}
                      </div>
                      {/* ✅ КНОПКА ЗМІНИ ТІЛЬКИ ДЛЯ РУЧНО ДОДАНИХ */}
                      {!selectedReceipt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openProductModal(index)}
                        >
                          {item.product_name ? "Змінити" : "Обрати"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* ✅ ОДИНИЦЯ */}
                  <TableCell className="px-4 py-3">
                    <div className="text-center">
                      <span className="text-sm">
                        {item.final_unit_name || item.product_base_unit_name || "—"}
                      </span>
                      {item.unit_conversion_name && (
                        <div className="text-xs text-blue-600 mt-1">
                          {item.unit_conversion_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* ✅ КІЛЬКІСТЬ */}
                  <TableCell className="px-4 py-3">
                    <Input
                      type="number"
                      value={item.quantity.toString()}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  
                  {/* ✅ ЦІНА */}
                  <TableCell className="px-4 py-3">
                    <Input
                      type="number"
                      value={item.price.toString()}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="w-28"
                    />
                  </TableCell>
                  
                  {/* ✅ ПДВ */}
                  <TableCell className="px-4 py-3">
                    <Input
                      type="number"
                      value={item.vat_percent.toString()}
                      onChange={(e) => handleItemChange(index, 'vat_percent', e.target.value)}
                      className="w-20"
                    />
                  </TableCell>
                  
                  {/* ✅ СУМА */}
                  <TableCell className="px-4 py-3">
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatPrice(item.total)}
                    </span>
                  </TableCell>
                  
                  {/* ✅ ДІЇ */}
                  <TableCell className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={form.items.length <= 1}
                      className="text-red-600 hover:text-red-700"
                    >
                      🗑️
                    </Button>
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Підсумки */}
        <div className="mt-6 flex justify-end">
          <div className="w-80 space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400">Кількість позицій:</span>
              <span className="font-medium">{form.items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400">Сума без ПДВ:</span>
              <span className="font-medium">-{formatPrice(getTotalAmount())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400">Сума ПДВ:</span>
              <span className="font-medium">-{formatPrice(getTotalVAT())}</span>
            </div>
            <div className="border-t border-red-300 pt-2 dark:border-red-700">
              <div className="flex justify-between">
                <span className="font-semibold text-red-800 dark:text-red-300">До повернення:</span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  -{formatPrice(getTotalAmount() + getTotalVAT())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
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
  selectedWarehouse={form.warehouse}
/>

{/* Модальне вікно підтвердження */}
<ConfirmModal
  isOpen={showSaveModal}
  title="Зберегти документ повернення?"
  description="Ви впевнені, що хочете створити цей документ повернення постачальнику?"
  onConfirm={() => {
    setShowSaveModal(false);
    handleSave();
  }}
  onClose={() => setShowSaveModal(false)}
/>
{/* Модалка вибору документа поступлення */}
<ReceiptSelectionModal
  isOpen={showReceiptModal}
  onClose={() => setShowReceiptModal(false)}
  onSelect={handleReceiptSelect}
  company={form.company}
  firm={form.firm}
  warehouse={form.warehouse || 0}
/>
   </>
 );
}


        