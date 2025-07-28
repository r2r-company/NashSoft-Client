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

// Типи для документа ціноутворення
type PriceSettingDocument = {
  id: number;
  doc_number: string;
  date: string;
  company: number;
  company_name: string;
  firm: number;
  firm_name: string;
  valid_from: string;
  status: string;
  base_type?: string;
  base_receipt?: number;
  base_receipt_number?: string;
  base_group?: number;
  base_group_name?: string;
  base_price_type?: number;
  base_price_type_name?: string;
  trade_points: TradePointInfo[];
  items: PriceSettingItem[];
  created_at: string;
  updated_at: string;
};

type PriceSettingItem = {
  id: number;
  product: number;
  product_name: string;
  product_code: string;
  product_unit: string;
  price_type: number;
  price_type_name: string;
  price: number;
  vat_percent: number;
  vat_included: boolean;
  markup_percent: number;
  unit: number;
  unit_name: string;
  unit_conversion: number | null;
  trade_point: number;
  trade_point_name: string;
  firm: number;
  price_without_vat: number;
  vat_amount: number;
  price_with_vat: number;
};

type TradePointInfo = {
  id: number;
  name: string;
  address?: string;
  items_count: number;
};

// Статуси документів
const STATUS_LABELS = {
  draft: "Чернетка",
  approved: "Затверджено",
  cancelled: "Скасовано"
};

const STATUS_COLORS = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
};

// Типи базування
const BASE_TYPE_LABELS = {
  receipt: "📦 На основі поступлення",
  product_group: "📁 По групі товарів",
  price_type: "💰 По типу ціни"
};

export default function PriceSettingsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<PriceSettingDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showUnapproveModal, setShowUnapproveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTradePoint, setSelectedTradePoint] = useState<number | null>(null);

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      loadDocument(parseInt(id));
    } else {
      console.error("Invalid document ID:", id);
      toast.error("Невірний ID документа");
      navigate("/price-settings");
    }
  }, [id, navigate]);

  const loadDocument = async (documentId: number) => {
    if (!documentId || isNaN(documentId)) {
      console.error("Invalid document ID provided:", documentId);
      toast.error("Невірний ID документа");
      navigate("/price-settings");
      return;
    }

    try {
      setLoading(true);
      console.log(`Loading price setting document ${documentId}...`);
      
      const response = await axios.get(`price-setting-documents/${documentId}/`)


      console.log("✅ Price setting document loaded:", response.data);
      
      setDocument(response.data);
      
    } catch (error) {
      console.error("❌ Error loading price setting document:", error);
      toast.error("Помилка завантаження документа ціноутворення");
      navigate("/price-settings");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDocument = async () => {
  if (!document) return;
  
  try {
    setProcessing(true);
    console.log("Approving price setting document...");
    
    // ✅ ВИПРАВЛЕНИЙ ENDPOINT:
    await axios.get(`price-setting-document-action/?id=${document.id}&action=approve`);
    console.log("✅ Document approved");
    
    toast.success("Документ ціноутворення затверджено ✅");
    
    // Перезавантажуємо документ щоб оновити статус
    loadDocument(document.id);
  } catch (error) {
    console.error("Error approving document:", error);
    toast.error("Помилка при затвердженні документа ❌");
  } finally {
    setProcessing(false);
    setShowApproveModal(false);
  }
};

const handleUnapproveDocument = async () => {
  if (!document) return;
  
  try {
    setProcessing(true);
    console.log("Unapproving price setting document...");
    
    // ✅ ВИПРАВЛЕНИЙ ENDPOINT:
    await axios.get(`price-setting-document-action/?id=${document.id}&action=unapprove`);
    console.log("✅ Document unapproved");
    
    toast.success("Документ ціноутворення розпроведено");
    
    // Перезавантажуємо документ щоб оновити статус
    loadDocument(document.id);
  } catch (error) {
    console.error("Error unapproving document:", error);
    toast.error("Помилка при розпроведенні документа");
  } finally {
    setProcessing(false);
    setShowUnapproveModal(false);
  }
};

  const handleDeleteDocument = async () => {
    if (!document) return;
    
    try {
      console.log("Deleting price setting document...");
      
      await axios.delete(`price-setting-documents/${document.id}/`);
      console.log("✅ Document deleted");
      
      toast.success("Документ ціноутворення видалено");
      navigate("/price-settings");
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

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatPrice = (price: number | string | null | undefined) => {
  const numeric = typeof price === "string" ? parseFloat(price) : price;
  return typeof numeric === "number" && !isNaN(numeric) 
    ? `${numeric.toFixed(2)} ₴`
    : "—";
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

  const getFilteredItems = () => {
    if (!document) return [];
    
    if (selectedTradePoint === null) {
      return document.items;
    }
    
    return document.items.filter(item => item.trade_point === selectedTradePoint);
  };

  const getGroupedItems = () => {
    const filteredItems = getFilteredItems();
    const grouped: Record<number, PriceSettingItem[]> = {};
    
    filteredItems.forEach(item => {
      if (!grouped[item.product]) {
        grouped[item.product] = [];
      }
      grouped[item.product].push(item);
    });
    
    return grouped;
  };

  const getStatistics = () => {
    if (!document) return { totalItems: 0, uniqueProducts: 0, avgPrice: 0, tradePoints: 0 };
    
    const filteredItems = getFilteredItems();
    const uniqueProducts = new Set(filteredItems.map(item => item.product)).size;
    const avgPrice = filteredItems.length > 0 
      ? filteredItems.reduce((sum, item) => sum + item.price, 0) / filteredItems.length 
      : 0;
    
    return {
      totalItems: filteredItems.length,
      uniqueProducts,
      avgPrice,
      tradePoints: document.trade_points.length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Завантаження документа ціноутворення...</p>
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
        <Button variant="primary" onClick={() => navigate("/price-settings")}>
          Повернутися до списку
        </Button>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <>
      <PageMeta 
        title={`Ціноутворення ${document.doc_number} | НашСофт`} 
        description={`Деталі документа ціноутворення ${document.doc_number}`} 
      />
      <PageBreadcrumb
        crumbs={[
          { label: "Ціноутворення", href: "/price-settings" },
          { label: document.doc_number }
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              💰 Ціноутворення {document.doc_number}
            </h1>
            {getStatusBadge(document.status)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Створено: {formatDate(document.created_at)} | Діє з: {formatDateOnly(document.valid_from)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/price-settings")}>
            ← Назад до списку
          </Button>
          {document.status === 'draft' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/price-settings/${document.id}/edit`)}
              >
                Редагувати
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setShowApproveModal(true)}
                disabled={processing}
              >
                {processing ? "Затвердження..." : "✅ Затвердити"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                🗑️ Видалити
              </Button>
            </>
          )}
          {document.status === 'approved' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowUnapproveModal(true)}
              disabled={processing}
            >
              {processing ? "Розпроведення..." : "🔄 Розпровести"}
            </Button>
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата початку дії</label>
                <div className="text-gray-900 dark:text-white">{formatDateOnly(document.valid_from)}</div>
              </div>
            </div>
            <div className="space-y-4">
              {document.base_type && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Базування</label>
                  <div className="text-gray-900 dark:text-white">
                    {BASE_TYPE_LABELS[document.base_type as keyof typeof BASE_TYPE_LABELS]}
                  </div>
                  {document.base_receipt_number && (
                    <div className="text-sm text-gray-500">
                      Документ поступлення: {document.base_receipt_number}
                    </div>
                  )}
                  {document.base_group_name && (
                    <div className="text-sm text-gray-500">
                      Група товарів: {document.base_group_name}
                    </div>
                  )}
                  {document.base_price_type_name && (
                    <div className="text-sm text-gray-500">
                      Тип ціни: {document.base_price_type_name}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Торгових точок</label>
                <div className="text-gray-900 dark:text-white">{document.trade_points.length}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Всього позицій</label>
                <div className="text-gray-900 dark:text-white">{document.items.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Статистика
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.tradePoints}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Торгових точок</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.uniqueProducts}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Унікальних товарів</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalItems}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Позицій цін</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatPrice(stats.avgPrice)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Середня ціна</div>
            </div>
          </div>
        </div>

        {/* Торгові точки */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Торгові точки ({document.trade_points.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div 
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedTradePoint === null 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTradePoint(null)}
            >
              <div className="font-medium text-gray-900 dark:text-white">
                🏪 Всі торгові точки
              </div>
              <div className="text-sm text-gray-500">
                {document.items.length} позицій
              </div>
            </div>
            {document.trade_points.map(tradePoint => (
              <div 
                key={tradePoint.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTradePoint === tradePoint.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTradePoint(tradePoint.id)}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  🏪 {tradePoint.name}
                </div>
                {tradePoint.address && (
                  <div className="text-xs text-gray-500 mb-1">
                    {tradePoint.address}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {tradePoint.items_count} позицій
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Позиції документа */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Позиції документа ({stats.totalItems})
              {selectedTradePoint && (
                <span className="ml-2 text-sm text-gray-500">
                  - {document.trade_points.find(tp => tp.id === selectedTradePoint)?.name}
                </span>
              )}
            </h2>
            {selectedTradePoint && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTradePoint(null)}
              >
                Показати всі
              </Button>
            )}
          </div>

          {stats.totalItems === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedTradePoint 
                ? "Позиції для обраної торгової точки не знайдені"
                : "Позиції документа не завантажені"
              }
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(getGroupedItems()).map(([productId, items]) => {
                const firstItem = items[0];
                
                return (
                  <div key={productId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            📦 {firstItem.product_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Код: {firstItem.product_code || "—"} • Одиниця: {firstItem.unit_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">ID товару</div>
                          <div className="font-medium">{firstItem.product}</div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <tr className="border-b border-gray-200 dark:border-white/10">
                            <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                              Торгова точка
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                              Тип ціни
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                              Ціна
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                              ПДВ %
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                              Націнка %
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-white">
                              З ПДВ
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                              Ціна без ПДВ
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                              Сума ПДВ
                            </TableCell>
                            <TableCell isHeader className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-white">
                              Ціна з ПДВ
                            </TableCell>
                          </tr>
                        </TableHeader>

                        <TableBody>
                          {items.map((item) => (
                            <tr key={`${item.product}-${item.trade_point}-${item.price_type}`} className="border-b border-gray-100 dark:border-white/10">
                              <TableCell className="px-4 py-3">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  🏪 {item.trade_point_name}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                  {item.price_type_name}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                {formatPrice(item.price)}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                {item.vat_percent}%
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                {item.markup_percent}%
                              </TableCell>
                              <TableCell className="px-4 py-3 text-center">
                                {item.vat_included ? (
                                  <span className="text-green-600 dark:text-green-400">✅</span>
                                ) : (
                                  <span className="text-red-600 dark:text-red-400">❌</span>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                {formatPrice(item.price_without_vat)}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                {formatPrice(item.vat_amount)}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                                {formatPrice(item.price_with_vat)}
                              </TableCell>
                            </tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Підсумки */}
          {stats.totalItems > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedTradePoint ? "Позицій на торговій точці:" : "Всього позицій:"}
                  </span>
                  <span className="font-medium">{stats.totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Унікальних товарів:</span>
                  <span className="font-medium">{stats.uniqueProducts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Середня ціна:</span>
                  <span className="font-medium">{formatPrice(stats.avgPrice)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 dark:border-white/20">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800 dark:text-white">Мін. ціна:</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatPrice(Math.min(...getFilteredItems().map(item => item.price)))}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-semibold text-gray-800 dark:text-white">Макс. ціна:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatPrice(Math.max(...getFilteredItems().map(item => item.price)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальні вікна */}
      <ConfirmModal
        isOpen={showApproveModal}
        title="Затвердити документ ціноутворення?"
        description={`Ви впевнені, що хочете затвердити документ ${document.doc_number}? Після затвердження ціни стануть активними та документ не можна буде редагувати.`}
        onConfirm={handleApproveDocument}
        onClose={() => setShowApproveModal(false)}
      />

      <ConfirmModal
        isOpen={showUnapproveModal}
        title="Розпровести документ ціноутворення?"
        description={`Ви впевнені, що хочете розпровести документ ${document.doc_number}? Ціни перестануть діяти.`}
        onConfirm={handleUnapproveDocument}
        onClose={() => setShowUnapproveModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити документ ціноутворення?"
        description={`Ви впевнені, що хочете видалити документ ${document.doc_number}? Цю дію неможливо скасувати.`}
        onConfirm={handleDeleteDocument}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
}