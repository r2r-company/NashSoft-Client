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

// Типи для документа та його позицій
type ReceiptDocument = {
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
  supplier: number;
  supplier_name: string;
  contract: number;
  contract_name: string;
  auto_payment: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  items: ReceiptItem[];
};

type ReceiptItem = {
  id: number;
  product: number;
  product_name: string;
  product_code: string;
  product_unit: string;
  quantity: number;
  price: number;
  vat_percent: number;
  total: number;
  vat_amount: number;
  total_with_vat: number;
};

// Статуси документів
const STATUS_LABELS = {
  draft: "Чернетка",
  posted: "Проведено",
  cancelled: "Скасовано",
  pending: "В очікуванні"
};

const STATUS_COLORS = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  posted: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
};

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<ReceiptDocument | null>(null);
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
    console.log(`Loading document ${documentId}...`);
    
    // ✅ ЗАВАНТАЖУЄМО ДОКУМЕНТ:
    const response = await axios.get(`document/${documentId}/`);
    console.log("✅ Document loaded:", response.data);
    
    // ✅ ЗАВАНТАЖУЄМО СПИСОК З ПРАВИЛЬНОЮ СТРУКТУРОЮ:
    const listResponse = await axios.get("documents/?type=receipt");
    console.log("✅ List response:", listResponse.data);
    
    // ✅ ВИПРАВИТИ - ДАНІ В listResponse.data.data:
    const documentsData = listResponse.data.data || [];
    const documentFromList = documentsData.find((doc: any) => doc.id === documentId);
    
    console.log("✅ Document from list:", documentFromList);
    
    // ✅ КОМБІНУЄМО ДАНІ:
    const combinedDocument = {
      id: documentId,
      doc_type: response.data.doc_type,
      doc_number: documentFromList?.doc_number || `DOC-${documentId}`,
      date: documentFromList?.date || new Date().toISOString(),
      company: response.data.company,
      company_name: documentFromList?.company_name || "Компанія не завантажена",
      firm: response.data.firm,
      firm_name: documentFromList?.firm_name || "Фірма не завантажена",
      warehouse: response.data.warehouse,
      warehouse_name: documentFromList?.warehouse_name || "Склад не завантажений",
      supplier: response.data.supplier,
      supplier_name: documentFromList?.supplier_name || "Постачальник не завантажений", // ✅ ДОДАТИ
      contract: response.data.contract,
      contract_name: "Договір не завантажений",
      auto_payment: response.data.auto_payment,
      status: documentFromList?.status || "draft",
      created_at: documentFromList?.date || new Date().toISOString(),
      updated_at: documentFromList?.date || new Date().toISOString(),
      items: response.data.items?.map((item: any) => ({
        id: item.id,
        product: item.product,
        product_name: "Товар не завантажений",
        product_code: "",
        product_unit: "шт",
        quantity: parseFloat(item.quantity || 0),
        price: parseFloat(item.price || 0),
        vat_percent: parseFloat(item.vat_percent || 0),
        total: parseFloat(item.quantity || 0) * parseFloat(item.price || 0), // ✅ ВИПРАВИТИ РОЗРАХУНОК
        vat_amount: 0, // ✅ РОЗРАХУВАТИ ПІЗНІШЕ
        total_with_vat: parseFloat(item.quantity || 0) * parseFloat(item.price || 0) // ✅ ВИПРАВИТИ
      })) || []
    };
    
    console.log("✅ Combined document:", combinedDocument);
    setDocument(combinedDocument);
    
    // Завантажуємо додаткову інформацію
    loadAdditionalInfo(combinedDocument);
    
  } catch (error) {
    console.error("❌ Error loading document:", error);
    toast.error("Помилка завантаження документа");
    navigate("/receipts");
  } finally {
    setLoading(false);
  }
};

  const loadAdditionalInfo = async (doc: any) => {
    try {
      // Завантажуємо інформацію про постачальника
      if (doc.supplier) {
        try {
          const supplierResponse = await axios.get(`suppliers/${doc.supplier}/`);
          console.log("✅ Supplier loaded:", supplierResponse.data);
          
          // Оновлюємо документ з інформацією про постачальника
          setDocument(prev => prev ? {
            ...prev,
            supplier_name: supplierResponse.data.name
          } : null);
        } catch (error) {
          console.log("❌ Could not load supplier info");
        }
      }

      // Завантажуємо інформацію про договір
      if (doc.contract) {
        try {
          const contractResponse = await axios.get(`contracts/by-supplier/?id=${doc.supplier}`);
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

      // Завантажуємо інформацію про товари
      try {
        const productsResponse = await axios.get("products/");
        console.log("✅ Products loaded for mapping");
        
        setDocument(prev => prev ? {
          ...prev,
          items: prev.items.map((item: any) => {
            const product = productsResponse.data.find((p: any) => p.id === item.product);
            return {
              ...item,
              product_name: product?.name || `Товар ID: ${item.product}`,
              product_code: product?.code || "",
              product_unit: product?.unit_name || "шт"
            };
          })
        } : null);
      } catch (error) {
        console.log("❌ Could not load products info");
      }
      
    } catch (error) {
      console.log("❌ Error loading additional info:", error);
    }
  };

  const handleProcessDocument = async () => {
    if (!document) return;
    
    try {
      setProcessing(true);
      console.log("Trying to process document...");
      
      // Пробуємо різні ендпоінти для проведення
      try {
        await axios.post(`documents/${document.id}/process/`);
        console.log("✅ Document processed via documents/ endpoint");
      } catch (error1) {
        console.log("❌ documents/process/ failed, trying document/");
        try {
          await axios.post(`document/${document.id}/process/`);
          console.log("✅ Document processed via document/ endpoint");
        } catch (error2) {
          console.log("❌ document/process/ failed, trying receipts/");
          // Останній варіант - можливо receipts з параметром
          await axios.get(`receipts/?action=progress&id=${document.id}`);
          console.log("✅ Document processed via receipts/ endpoint");
        }
      }
      
      toast.success("Документ успішно проведено ✅");
      
      // Перезавантажуємо документ щоб оновити статус
      loadDocument(document.id);
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("Помилка при проведенні документа ❌");
    } finally {
      setProcessing(false);
      setShowProcessModal(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!document) return;
    
    try {
      console.log("Trying to delete document...");
      
      // Пробуємо різні ендпоінти для видалення
      try {
        await axios.delete(`documents/${document.id}/`);
        console.log("✅ Document deleted via documents/ endpoint");
      } catch (error1) {
        console.log("❌ documents/ delete failed, trying document/");
        await axios.delete(`document/${document.id}/`);
        console.log("✅ Document deleted via document/ endpoint");
      }
      
      toast.success("Документ видалено");
      navigate("/receipts");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Помилка при видаленні документа");
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

  const getTotalAmount = () => {
    if (!document?.items) return 0;
    return document.items.reduce((sum, item) => sum + item.total, 0);
  };

  const getTotalVAT = () => {
    if (!document?.items) return 0;
    return document.items.reduce((sum, item) => sum + item.vat_amount, 0);
  };

  const getTotalWithVAT = () => {
    if (!document?.items) return 0;
    return document.items.reduce((sum, item) => sum + item.total_with_vat, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Завантаження документа...</p>
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
        <Button variant="primary" onClick={() => navigate("/receipts")}>
          Повернутися до списку
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageMeta 
        title={`Документ ${document.doc_number} | НашСофт`} 
        description={`Деталі документа поступлення ${document.doc_number}`} 
      />
      <PageBreadcrumb
        crumbs={[
          { label: "Документи поступлення", href: "/receipts" },
          { label: document.doc_number }
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Документ поступлення {document.doc_number}
            </h1>
            {getStatusBadge(document.status)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Створено: {formatDate(document.created_at)} | Оновлено: {formatDate(document.updated_at)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/receipts")}>
            ← Назад до списку
          </Button>
          {document.status === 'draft' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/receipts/${document.id}/edit`)}
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Основна інформація
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
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
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Постачальник</label>
                <div className="text-gray-900 dark:text-white">{document.supplier_name}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Контракт</label>
                <div className="text-gray-900 dark:text-white">{document.contract_name}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Автоматична оплата</label>
                <div className="text-gray-900 dark:text-white">
                  {document.auto_payment ? "✅ Так" : "❌ Ні"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Позиції документа */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Позиції документа ({document.items.length})
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
                    <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Од. виміру
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Кількість
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Ціна
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      ПДВ %
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Сума без ПДВ
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Сума ПДВ
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                      Сума з ПДВ
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
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.product_code || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.product_unit}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatPrice(item.price)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {item.vat_percent}%
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatPrice(item.total)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatPrice(item.vat_amount)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                        {formatPrice(item.total_with_vat)}
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Підсумки */}
          <div className="mt-6 flex justify-end">
            <div className="w-80 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Кількість позицій:</span>
                <span className="font-medium">{document.items.length}</span>
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
                    {formatPrice(getTotalWithVAT())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно підтвердження проведення */}
      <ConfirmModal
        isOpen={showProcessModal}
        title="Провести документ?"
        description={`Ви впевнені, що хочете провести документ ${document.doc_number}? Після проведення документ не можна буде редагувати.`}
        onConfirm={handleProcessDocument}
        onClose={() => setShowProcessModal(false)}
      />

      {/* Модальне вікно підтвердження видалення */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити документ?"
        description={`Ви впевнені, що хочете видалити документ ${document.doc_number}? Цю дію неможливо скасувати.`}
        onConfirm={handleDeleteDocument}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
}