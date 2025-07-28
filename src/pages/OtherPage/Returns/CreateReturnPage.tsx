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
import SalesSelectionModal from "../../../components/modals/SalesSelectionModal";


import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

type SalesDocument = {
  id: number;
  doc_number: string;
  date: string;
  customer_name: string;
  total_amount?: number;
  status: string;
};

// ✅ ТИПИ ДЛЯ ПОВЕРНЕННЯ (схожі на Sales, але doc_type = "return_from_client")
type ReturnForm = {
  doc_type: string;
  company: number;
  firm: number;
  warehouse: number | undefined;
  customer: number | undefined;
  trade_point: number | undefined;
  contract: number | undefined;
  source_document: number | undefined; // ✅ ДОДАТИ
  auto_payment: boolean;
  items: ReturnItem[];
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

// ✅ ПОВЕРНЕННЯ ТОВАРУ (схожий на SaleItem)
type ReturnItem = {
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

export default function CreateReturnPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  
  // ✅ ПОЧАТКОВИЙ СТАН ДЛЯ ПОВЕРНЕННЯ

const [form, setForm] = useState<ReturnForm>({
 doc_type: "return_from_client",
 company: 0,
 firm: 0,
 warehouse: undefined,
 customer: undefined,
 trade_point: undefined,
 contract: undefined,
 source_document: undefined, // ✅ ДОДАНО
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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tradePoints, setTradePoints] = useState<TradePoint[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [salesDocuments, setSalesDocuments] = useState<SalesDocument[]>([]);
  const [selectedSalesDoc, setSelectedSalesDoc] = useState<number | null>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);

  useEffect(() => {
    loadDictionaries();
  }, []);


  useEffect(() => {
  if (form.company && form.firm && form.warehouse && form.customer) {
    fetchSalesDocuments();
  }
}, [form.company, form.firm, form.warehouse, form.customer]);

const fetchSalesDocuments = async () => {
  if (!form.company || !form.firm || !form.warehouse || !form.customer) {
    console.log("Не всі параметри вибрані для завантаження документів продажу");
    return;
  }

  try {
    console.log("🔄 Завантаження документів продажу з параметрами:", {
      company: form.company,
      firm: form.firm,
      warehouse: form.warehouse,
      customer: form.customer
    });

    const response = await axios.get("documents/sales/", {
      params: {
        company: form.company,
        firm: form.firm,
        warehouse: form.warehouse,
        customer: form.customer
      },
    });

    console.log("✅ Документи продажу завантажено:", response.data);
    
    if (response.data.success && response.data.data) {
      setSalesDocuments(response.data.data);
      
      if (response.data.data.length === 0) {
        toast.error("Документи продажу для цього клієнта не знайдені");
      }
    } else {
      setSalesDocuments([]);
      toast.error("Не вдалося завантажити документи продажу");
    }
  } catch (error) {
    console.error("❌ Помилка при завантаженні документів продажу:", error);
    setSalesDocuments([]);
    toast.error("Помилка завантаження документів продажу");
  }
};

const handleSalesDocSelect = (salesDoc: SalesDocument) => {
  console.log("📋 Обрано документ продажу:", salesDoc);
  
  setSelectedSalesDoc(salesDoc.id);
  setForm(prev => ({ 
    ...prev, 
    source_document: salesDoc.id,
    items: [] // Очистити товари перед завантаженням нових
  }));
  
  toast.success(`Обрано документ: ${salesDoc.doc_number}`);
};



useEffect(() => {
  const fetchSalesDocItems = async () => {
    if (!selectedSalesDoc) {
      console.log("Документ продажу не обрано");
      return;
    }

    try {
      console.log(`🔄 Завантаження товарів з документа продажу ID: ${selectedSalesDoc}`);
      
      const response = await axios.get(`/document/${selectedSalesDoc}`);
      
      console.log("✅ Відповідь API:", response.data);
      
      const salesData = response.data;
      const fetchedItems = salesData.items || [];

      console.log("🛒 Товари з документа продажу:", fetchedItems);

      if (!fetchedItems || fetchedItems.length === 0) {
        toast.error("В цьому документі продажу немає товарів");
        return;
      }

      // ✅ МАПУВАННЯ товарів для повернення
      const mappedItems: ReturnItem[] = fetchedItems.map((item: any, index: number) => {
        console.log(`📝 Мапування товару ${index + 1}:`, item);
        
        return {
          product: item.product,
          product_name: `Товар ID: ${item.product}`,
          product_base_unit: item.unit,
          product_base_unit_name: "",
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

      console.log("✅ Змаповані товари для повернення:", mappedItems);

      setForm(prev => ({ 
        ...prev, 
        items: mappedItems,
        source_document: selectedSalesDoc
      }));

      toast.success(`Завантажено ${mappedItems.length} товарів для повернення`);

    } catch (error: any) {
      console.error("❌ Помилка при завантаженні товарів:", error);
      toast.error("Не вдалося завантажити товари з документа продажу");
    }
  };

  fetchSalesDocItems();
}, [selectedSalesDoc]);





  const loadDictionaries = async () => {
    try {
      console.log("Loading dictionaries for returns...");

      const requests = [
        axios.get("companies/"),
        axios.get("firms/"),
        axios.get("customers/"),
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

      // ✅ КЛІЄНТИ
      if (results[2].status === 'fulfilled') {
        setCustomers(results[2].value.data);
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

  const loadContractsByCustomer = async (customerId: number) => {
    setLoadingContracts(true);
    setContracts([]);
    
    try {
      console.log(`Loading contracts for customer ${customerId} and firm ${form.firm}...`);
      
      const response = await axios.get(`contracts/by-customer/?id=${customerId}`);
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
        toast.error("Договори для цього клієнта і фірми не знайдені");
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
      customer: undefined,
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
      customer: undefined,
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

  const handleCustomerChange = (value: string) => {
    const customerId = parseInt(value);
    setForm({ 
      ...form, 
      customer: customerId,
      contract: undefined
    });
    
    if (customerId && form.firm) {
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

  const handleItemChange = (index: number, field: keyof ReturnItem, value: string) => {
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
    const newItem: ReturnItem = {
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

  // ✅ ПЕРЕВІРКА НАЯВНОСТІ ДОКУМЕНТІВ РЕАЛІЗАЦІЇ
  if (salesDocuments.length === 0) {
    toast.error("Немає доступних документів реалізації для повернення. Спочатку створіть документ реалізації.");
    return false;
  }

  if (!form.customer || !form.warehouse || !form.trade_point) {
    toast.error("Заповніть усі обов'язкові поля ❗");
    return false;
  }

  // ✅ ВИДАЛИТИ ЦІ ДУБЛЮЮЧІ РЯДКИ:
  // if (!form.customer || !form.warehouse || !form.trade_point) {
  //   toast.error("Заповніть усі обов'язкові поля ❗");
  //   return false;
  // }

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
      customer: form.customer,
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

    try {
      const response = await axios.post("document/", requestBody);
      toast.success("Документ повернення від клієнта створено ✅");
      
      setTimeout(() => {
        navigate("/returns");
      }, 500);
      
    } catch (error: any) {
      console.error("❌ API Error:", error);
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'string') {
          toast.error(`API помилка: ${errorData}`);
        } else if (errorData.message) {
          toast.error(`API помилка: ${errorData.message}`);
        } else {
          toast.error("Помилка створення документа");
        }
      } else {
        toast.error("Помилка запиту до сервера");
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
      <PageMeta title="Новий документ повернення від клієнта | НашСофт" description="Створення документа повернення товарів від клієнта" />
      <PageBreadcrumb
        crumbs={[
          { label: "Повернення від клієнтів", href: "/returns" },
          { label: "Новий документ" },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            🔄 Новий документ повернення від клієнта
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Заповніть форму для створення документа повернення товарів від клієнта
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/returns")}>
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

            {/* ✅ КЛІЄНТ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Клієнт *
              </label>
              {!form.firm ? (
                <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
                  Спочатку оберіть фірму
                </div>
              ) : customers.length === 0 ? (
                <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-red-700">
                  ⚠️ Клієнти не завантажені
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

            {/* ✅ СКЛАД */}
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
          </div>
          {/* ✅ ДОКУМЕНТ ПРОДАЖУ - НОВИЙ БЛОК З КНОПКОЮ */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              🛒 Документ продажу для повернення
            </label>
            
            {!form.customer || !form.warehouse ? (
              <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
                Спочатку оберіть клієнта та склад
              </div>
            ) : (
              <div className="space-y-3">
                {/* КНОПКА ВИБОРУ ДОКУМЕНТА */}
                <Button 
                  variant="outline" 
                  onClick={() => setShowSalesModal(true)}
                  className="w-full justify-start"
                >
                  🛒 Обрати документ продажу
                </Button>
                
                {/* ІНФОРМАЦІЯ ПРО ВИБРАНИЙ ДОКУМЕНТ */}
                {selectedSalesDoc && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    {(() => {
                      const selectedSalesData = salesDocuments.find(s => s.id === selectedSalesDoc);
                      return selectedSalesData ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-orange-800">
                              ✅ Обрано: {selectedSalesData.doc_number}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSalesDoc(null);
                                setForm(prev => ({ ...prev, source_document: undefined, items: [] }));
                              }}
                            >
                              ✕ Скасувати
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-orange-600">
                            <div>📅 {new Date(selectedSalesData.date).toLocaleDateString('uk-UA')}</div>
                            <div>👤 {selectedSalesData.customer_name}</div>
                            <div>📊 {selectedSalesData.status === 'posted' ? 'Проведено' : selectedSalesData.status}</div>
                            {selectedSalesData.total_amount && (
                              <div>💰 {selectedSalesData.total_amount.toFixed(2)} ₴</div>
                            )}
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
              Автоматичне повернення коштів
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
             {/* ✅ ПОКАЗУВАТИ КНОПКИ ТІЛЬКИ ЯКЩО ОБРАНО ДОКУМЕНТ ПРОДАЖУ */}
             {selectedSalesDoc ? (
               <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                 ✅ Товари завантажені з документа продажу
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
         </div>

         {form.items.length === 0 ? (
  <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
    <div className="text-gray-500 mb-2">
      🛒 Немає товарів для повернення
    </div>
    <div className="text-sm text-gray-400">
      {!selectedSalesDoc 
        ? "Оберіть документ продажу, щоб завантажити товари" 
        : "Товари завантажуються..."
      }
    </div>
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
                           <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                             <div className="font-medium text-sm text-orange-800 dark:text-orange-300">{item.product_name}</div>
                             <div className="text-xs text-orange-600 dark:text-orange-400">
                               ID: {item.product} • Повернення
                             </div>
                           </div>
                         ) : (
                           <div className="p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-center text-gray-500">
                             Товар не обрано
                           </div>
                         )}
                       </div>
                       {!selectedSalesDoc && (
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
                     <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
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
)}


         {/* Підсумки */}
         <div className="mt-6 flex justify-end">
           <div className="w-80 space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
             <div className="flex justify-between text-sm">
               <span className="text-orange-600 dark:text-orange-400">Кількість позицій:</span>
               <span className="font-medium">{form.items.length}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-orange-600 dark:text-orange-400">Сума без ПДВ:</span>
               <span className="font-medium">-{formatPrice(getTotalAmount())}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-orange-600 dark:text-orange-400">Сума ПДВ:</span>
               <span className="font-medium">-{formatPrice(getTotalVAT())}</span>
             </div>
             <div className="border-t border-orange-300 pt-2 dark:border-orange-700">
               <div className="flex justify-between">
                 <span className="font-semibold text-orange-800 dark:text-orange-300">До повернення:</span>
                 <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                   -{formatPrice(getTotalAmount() + getTotalVAT())}
                 </span>
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
       title="Зберегти документ повернення?"
       description="Ви впевнені, що хочете створити цей документ повернення від клієнта?"
       onConfirm={() => {
         setShowSaveModal(false);
         handleSave();
       }}
       onClose={() => setShowSaveModal(false)}
     />

          {/* Модалка вибору документа продажу */}
     <SalesSelectionModal
       isOpen={showSalesModal}
       onClose={() => setShowSalesModal(false)}
       onSelect={handleSalesDocSelect}
       company={form.company}
       firm={form.firm}
       warehouse={form.warehouse || 0}
       customer={form.customer}
     />
     
   </>
 );
}


        