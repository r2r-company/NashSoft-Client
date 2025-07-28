import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

// Типи для документа повернення та його позицій
type ReturnToSupplierDocument = {
  id: number;
  doc_type: string;
  doc_number: string;
  date: string;
  company: number;
  company_name: string;
  firm: number;
  firm_name: string;
  warehouse: number;
  warehouse_name: string;
  trade_point: number;
  trade_point_name: string;
  supplier: number;  // ✅ supplier замість customer
  supplier_name: string;  // ✅ supplier_name замість customer_name
  contract: number;
  contract_name: string;
  original_purchase_id?: number;  // ✅ original_purchase_id замість original_sale_id
  original_purchase_number?: string;  // ✅ original_purchase_number замість original_sale_number
  return_reason?: string;
  return_note?: string;
  auto_refund: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  items: ReturnToSupplierItem[];
};

type ReturnToSupplierItem = {
  id: number;
  product: number;
  product_name: string;
  product_code: string;
  product_unit: string;
  quantity: number;
  unit: number;
  unit_name: string;
  price: number;
  vat_percent: number;
  vat_amount: number;
  price_without_vat: number;
  price_with_vat: number;
  total: number;
  return_reason?: string;
  original_purchase_item_id?: number;  // ✅ original_purchase_item_id замість original_sale_item_id
};

// Статуси документів повернення
const STATUS_LABELS = {
  draft: "Чернетка",
  posted: "Проведено",
  cancelled: "Скасовано",
  pending: "В очікуванні",
  approved: "Затверджено"
};

const STATUS_COLORS = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  posted: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  approved: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
};

// Причини повернення
const RETURN_REASONS = {
  defective: "Брак товару",
  wrong_item: "Помилковий товар",
  supplier_request: "Бажання постачальника", 
  warranty: "Гарантійний випадок",
  expired: "Прострочений товар",
  damaged: "Пошкоджений при доставці",
  quality_issue: "Проблеми з якістю",  
  other: "Інше"
};

export default function ReturnToSupplierDetailPage() {  // ✅ ЗМІНЕНО назву
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<ReturnToSupplierDocument | null>(null);  // ✅ ЗМІНЕНО тип
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
 
  useEffect(() => {
    if (id) {
      loadDocument(parseInt(id));
    }
  }, [id]);

  const loadDocument = async (documentId: number) => {
  try {
    setLoading(true);
    console.log(`Loading return to supplier document ${documentId}...`);
    
    // ✅ ЗАВАНТАЖУЄМО ДОКУМЕНТ:
    const response = await axios.get(`document/${documentId}/`);
    console.log("✅ Return to supplier document loaded:", response.data);
    
    // ✅ ЗАВАНТАЖУЄМО СПИСОК БЕЗПЕЧНО:
    let documentFromList = null;
    try {
      const listResponse = await axios.get("documents/?type=return_to_supplier");  // ✅ ЗМІНЕНО
      console.log("✅ List response:", listResponse.data);
      
      let documents = [];
      if (listResponse.data && listResponse.data.data) {
        documents = listResponse.data.data;
      } else if (Array.isArray(listResponse.data)) {
        documents = listResponse.data;
      }
      
      documentFromList = documents.find((doc: any) => doc.id === documentId);
    } catch (listError) {
      console.log("❌ Could not load document list, using defaults");
    }
    
    // ✅ КОМБІНУЄМО ДАНІ:
    const combinedDocument = {
      id: documentId,
      doc_type: response.data.doc_type || "return_to_supplier",
      doc_number: documentFromList?.doc_number || `RETURN-SUP-${documentId}`,
      date: documentFromList?.date || new Date().toISOString(),
      company: response.data.company,
      company_name: documentFromList?.company_name || "Компанія не завантажена",
      firm: response.data.firm,
      firm_name: documentFromList?.firm_name || "Фірма не завантажена",
      warehouse: response.data.warehouse,
      warehouse_name: documentFromList?.warehouse_name || "Склад не завантажений",
      trade_point: response.data.trade_point,
      trade_point_name: "Торгова точка не завантажена",
      supplier: response.data.supplier,  // ✅ ЗМІНЕНО
      supplier_name: documentFromList?.supplier_name || "Постачальник не завантажений",  // ✅ ЗМІНЕНО
      contract: response.data.contract,
      contract_name: "Договір не завантажений",
      original_purchase_id: response.data.original_purchase_id,  // ✅ ЗМІНЕНО
      original_purchase_number: documentFromList?.original_purchase_number,  // ✅ ЗМІНЕНО
      return_reason: response.data.return_reason || documentFromList?.return_reason,
      return_note: response.data.return_note,
      auto_refund: response.data.auto_refund || false,
      status: documentFromList?.status || "draft",
      created_at: documentFromList?.date || new Date().toISOString(),
      updated_at: documentFromList?.date || new Date().toISOString(),
      items: (response.data.items || []).map((item: any) => ({
        id: item.id,
        product: item.product,
        product_name: "Товар не завантажений",
        product_code: "",
        product_unit: "",
        quantity: parseFloat(item.quantity || 0),
        unit: item.unit,
        unit_name: "Одиниця не завантажена",
        price: parseFloat(item.price || 0),
        vat_percent: parseFloat(item.vat_percent || 0),
        vat_amount: parseFloat(item.vat_amount || 0),
        price_without_vat: parseFloat(item.price_without_vat || item.price || 0),
        price_with_vat: parseFloat(item.price_with_vat || item.price || 0),
        total: parseFloat(item.quantity || 0) * parseFloat(item.price || 0),
        return_reason: item.return_reason,
        original_purchase_item_id: item.original_purchase_item_id  // ✅ ЗМІНЕНО
      }))
    };
    
    setDocument(combinedDocument);
    loadAdditionalInfo(combinedDocument);
    
  } catch (error) {
    console.error("❌ Error loading return to supplier document:", error);
    toast.error("Помилка завантаження документа повернення постачальнику");
    navigate("/returns-to-supplier");  // ✅ ЗМІНЕНО маршрут
  } finally {
    setLoading(false);
  }
};

 const loadAdditionalInfo = async (doc: any) => {
  try {
    // Завантажуємо інформацію про постачальника
    if (doc.supplier) {  // ✅ ЗМІНЕНО supplier замість customer
      try {
        const supplierResponse = await axios.get(`suppliers/${doc.supplier}/`);  // ✅ ЗМІНЕНО
        console.log("✅ Supplier loaded:", supplierResponse.data);
        
        setDocument(prev => prev ? {
          ...prev,
          supplier_name: supplierResponse.data.name  // ✅ ЗМІНЕНО
        } : null);
      } catch (error) {
        console.log("❌ Could not load supplier info");
      }
    }

    // Завантажуємо інформацію про договір
    if (doc.contract && doc.supplier) {  // ✅ ЗМІНЕНО supplier замість customer
      try {
        const contractResponse = await axios.get(`contracts/by-supplier/?id=${doc.supplier}`);  // ✅ ЗМІНЕНО
        const contract = contractResponse.data.find((c: any) => c.id === doc.contract);
        
        if (contract) {
          console.log("✅ Contract loaded:", contract);
          setDocument(prev => prev ? {
            ...prev,
            contract_name: contract.name
          } : null);
        }
      } catch (error) {
        console.log("❌ Could not load contract info");
      }
    }

      // Завантажуємо інформацію про торгову точку
      if (doc.trade_point) {
      try {
        const tradePointResponse = await axios.get(`trade-points/${doc.trade_point}/`);
        console.log("✅ Trade point loaded:", tradePointResponse.data);
        
        setDocument(prev => prev ? {
          ...prev,
          trade_point_name: tradePointResponse.data.name
        } : null);
      } catch (error) {
        console.log("❌ Could not load trade point info");
      }
    }

    // Завантажуємо інформацію про склад
    if (doc.warehouse) {
      try {
        const warehouseResponse = await axios.get(`warehouses/${doc.warehouse}/`);
        console.log("✅ Warehouse loaded:", warehouseResponse.data);
        
        setDocument(prev => prev ? {
          ...prev,
          warehouse_name: warehouseResponse.data.name
        } : null);
      } catch (error) {
        console.log("❌ Could not load warehouse info");
      }
    }

    // Завантажуємо інформацію про оригінальний документ закупівлі
    if (doc.original_purchase_id) {  // ✅ ЗМІНЕНО
      try {
        const originalPurchaseResponse = await axios.get(`document/${doc.original_purchase_id}/`);  // ✅ ЗМІНЕНО
        console.log("✅ Original purchase document loaded:", originalPurchaseResponse.data);
        
        // Також пробуємо знайти в списку для отримання номера
        try {
          const purchaseListResponse = await axios.get("documents/?type=purchase");  // ✅ ЗМІНЕНО
          let purchaseDocuments = [];
          if (purchaseListResponse.data && purchaseListResponse.data.data) {
            purchaseDocuments = purchaseListResponse.data.data;
          } else if (Array.isArray(purchaseListResponse.data)) {
            purchaseDocuments = purchaseListResponse.data;
          }
          
          const originalPurchaseFromList = purchaseDocuments.find((purchaseDoc: any) => purchaseDoc.id === doc.original_purchase_id);  // ✅ ЗМІНЕНО
          
          setDocument(prev => prev ? {
            ...prev,
            original_purchase_number: originalPurchaseFromList?.doc_number || `PURCHASE-${doc.original_purchase_id}`  // ✅ ЗМІНЕНО
          } : null);
        } catch (listError) {
          console.log("❌ Could not load purchase list for original document number");
        }
      } catch (error) {
        console.log("❌ Could not load original purchase document info");
      }
    }

    // Завантажуємо інформацію про товари та одиниці виміру
    try {
      const [productsResponse, unitsResponse] = await Promise.all([
        axios.get("products/"),
        axios.get("units/")
      ]);
      
      console.log("✅ Products and units loaded for mapping");
      
      setDocument(prev => prev ? {
        ...prev,
        items: prev.items.map((item: any) => {
          const product = productsResponse.data.find((p: any) => p.id === item.product);
          const unit = unitsResponse.data.find((u: any) => u.id === item.unit);
          
          return {
            ...item,
            product_name: product?.name || `Товар ID: ${item.product}`,
            product_code: product?.code || "",
            product_unit: product?.unit_name || "",
            unit_name: unit?.name || `Одиниця ID: ${item.unit}`,
          };
        })
      } : null);
    } catch (error) {
      console.log("❌ Could not load products or units info");
    }
    
  } catch (error) {
    console.log("❌ Error loading additional info:", error);
  }
};

  const handleProcessDocument = async () => {
  if (!document) return;
  
  try {
    setProcessing(true);
    console.log("Trying to process return to supplier document...");
    
    // ✅ ВИКОРИСТАЙ ПРАВИЛЬНИЙ ЕНДПОІНТ ДЛЯ ПОВЕРНЕНЬ ПОСТАЧАЛЬНИКУ:
    await axios.get(`return-to-supplier/?id=${document.id}&action=progress`);  // ✅ ЗМІНЕНО
    console.log("✅ Return to supplier document processed successfully");
    
    toast.success("Документ повернення постачальнику успішно проведено ✅");
    
    // Перезавантажуємо документ щоб оновити статус
    loadDocument(document.id);
  } catch (error) {
    console.error("Error processing return to supplier document:", error);
    toast.error("Помилка при проведенні документа повернення постачальнику ❌");
  } finally {
    setProcessing(false);
    setShowProcessModal(false);
  }
};

  const handleDeleteDocument = async () => {
  if (!document) return;
  
  try {
    console.log("Trying to delete return to supplier document...");
    
    // Пробуємо різні ендпоінти для видалення
    try {
      await axios.delete(`documents/${document.id}/`);
      console.log("✅ Return to supplier document deleted via documents/ endpoint");
    } catch (error1) {
      console.log("❌ documents/ delete failed, trying document/");
      await axios.delete(`document/${document.id}/`);
      console.log("✅ Return to supplier document deleted via document/ endpoint");
    }
    
    toast.success("Документ повернення постачальнику видалено");
    navigate("/returns-to-supplier");  // ✅ ЗМІНЕНО маршрут
  } catch (error) {
    console.error("Error deleting return to supplier document:", error);
    toast.error("Помилка при видаленні документа повернення постачальнику");
  } finally {
    setShowDeleteModal(false);
  }
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ₴`;
  };

  const getStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.draft;
    
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${colorClass}`}>
        {label}
      </span>
    );
  };

  const getReturnReasonLabel = (reason?: string) => {
    if (!reason) return "—";
    return RETURN_REASONS[reason as keyof typeof RETURN_REASONS] || reason;
  };

  const getTotalAmount = () => {
    if (!document?.items) return 0;
    return document.items.reduce((sum, item) => sum + item.total, 0);
  };

  if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Завантаження документа повернення...</p>
      </div>
    </div>
  );
}

if (!document) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Документ не знайдено
      </h3>
      <Button variant="primary" onClick={() => navigate("/returns-to-supplier")}>
        Повернутися до списку
      </Button>
    </div>
  );
}

  return (
    <>
      <PageMeta 
        title={`Документ повернення ${document.doc_number} | НашСофт`} 
        description={`Деталі документа повернення ${document.doc_number}`} 
      />
      <PageBreadcrumb
        crumbs={[
          { label: "Повернення від клієнтів", href: "/returns" },
          { label: document.doc_number }
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Документ повернення {document.doc_number}
            </h1>
            {getStatusBadge(document.status)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Створено: {formatDate(document.created_at)} | Оновлено: {formatDate(document.updated_at)}
          </p>
        </div>
        <div className="flex gap-3">
  <Button variant="outline" size="sm" onClick={() => navigate("/returns-to-supplier")}>
    ← Назад до списку
  </Button>
  {document.status === 'draft' && (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate(`/returns-to-supplier/${document.id}/edit`)}
      >
        Редагувати
      </Button>
      <Button 
        variant="primary" 
        size="sm" 
        onClick={() => setShowProcessModal(true)}
        disabled={processing}
      >
        {processing ? "Проведення..." : "Провести"}
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowDeleteModal(true)}
        className="text-red-600 hover:text-red-700 hover:border-red-300"
      >
        Видалити
      </Button>
    </>
  )}
</div>
      </div>

      <div className="grid gap-6">
        {/* Основна інформація */}
        {/* Основна інформація */}
<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
  <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
    Основна інформація
  </h2>
  <div className="grid gap-6 md:grid-cols-2">
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Постачальник</label>
        <div className="text-gray-900 dark:text-white">{document.supplier_name}</div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Оригінальний документ</label>
        <div className="text-gray-900 dark:text-white">
          {document.original_purchase_number ? (
            <button 
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              onClick={() => navigate(`/purchases/${document.original_purchase_id}`)}
            >
              {document.original_purchase_number}
            </button>
          ) : (
            "—"
          )}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Причина повернення</label>
        <div className="text-gray-900 dark:text-white">
          {getReturnReasonLabel(document.return_reason)}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Примітка</label>
        <div className="text-gray-900 dark:text-white">
          {document.return_note || "—"}
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Компанія</label>
        <div className="text-gray-900 dark:text-white">{document.company_name}</div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Фірма</label>
        <div className="text-gray-900 dark:text-white">{document.firm_name}</div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Склад</label>
        <div className="text-gray-900 dark:text-white">{document.warehouse_name}</div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Автоматичне отримання коштів</label>
        <div className="text-gray-900 dark:text-white">
          {document.auto_refund ? "✅ Так" : "❌ Ні"}
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Додаткова інформація */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Додаткова інформація
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Торгова точка</label>
                <div className="text-gray-900 dark:text-white">{document.trade_point_name}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Контракт</label>
                <div className="text-gray-900 dark:text-white">{document.contract_name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Позиції документа */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
  Позиції повернення постачальнику ({document.items.length})
          </h2>

          {document.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Позиції документа не завантажені
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              <Table>
                <TableHeader>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Товар
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Код
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Кількість
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Од. виміру
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Ціна
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Сума
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Причина
                    </TableCell>
                  </tr>
                </TableHeader>

                <TableBody>
                  {document.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-white/10">
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.product_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {item.product}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.product_code || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.unit_name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatPrice(item.price)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">
  +{formatPrice(item.total)}
</TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                        {getReturnReasonLabel(item.return_reason)}
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Підсумки */}
          <div className="mt-6 flex justify-end">
  <div className="w-80 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
    <div className="flex justify-between text-sm">
      <span className="text-blue-600 dark:text-blue-400">Кількість позицій:</span>
      <span className="font-medium">{document.items.length}</span>
    </div>
    <div className="border-t border-blue-300 pt-2 dark:border-blue-700">
      <div className="flex justify-between">
        <span className="font-semibold text-blue-800 dark:text-blue-300">Загальна сума повернення:</span>
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
          +{formatPrice(getTotalAmount())}
        </span>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>

      {/* Модальне вікно підтвердження проведення */}
{/* Модальне вікно підтвердження проведення */}
<ConfirmModal
  isOpen={showProcessModal}
  title="Провести документ повернення?"
  description={`Ви впевнені, що хочете провести документ повернення постачальнику ${document.doc_number}? Після проведення документ не можна буде редагувати. Товари будуть списані зі складу і може бути створено документ отримання коштів.`}
  onConfirm={handleProcessDocument}
  onClose={() => setShowProcessModal(false)}
/>

{/* Модальне вікно підтвердження видалення */}
<ConfirmModal
  isOpen={showDeleteModal}
  title="Видалити документ повернення?"
  description={`Ви впевнені, що хочете видалити документ повернення постачальнику ${document.doc_number}? Цю дію неможливо скасувати.`}
  onConfirm={handleDeleteDocument}
  onClose={() => setShowDeleteModal(false)}
/>
    </>
  );
}