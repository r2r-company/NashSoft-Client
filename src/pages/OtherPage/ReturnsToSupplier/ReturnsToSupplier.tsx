import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

// Тип для документа повернення постачальнику
type ReturnToSupplier = {
  id: number;
  doc_type: string;
  doc_number: string;
  date: string;
  company_name: string;
  firm_name: string;
  warehouse_name: string;
  supplier_id?: number;
  supplier_name?: string;
  trade_point_id?: number;
  trade_point_name?: string;
  original_purchase_id?: number;        // Посилання на оригінальний документ закупівлі
  original_purchase_number?: string;    // Номер оригінального документа
  return_reason?: string;               // Причина повернення
  status: string;
};

type FilterState = {
  status: string;
  company: string;
  firm: string;
  warehouse: string;
  supplier: string;
  returnReason: string;
  dateFrom: string;
  dateTo: string;
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

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function ReturnsToSupplier() {
  const [data, setData] = useState<ReturnToSupplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    company: '',
    firm: '',
    warehouse: '',
    supplier: '',
    returnReason: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    loadReturnsToSupplier();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Скидання сторінки при зміні пошуку або фільтрів
  }, [search, filters]);

  const loadReturnsToSupplier = async () => {
    try {
      setLoading(true);
      console.log("Loading return to supplier documents...");
      
      const response = await axios.get("documents/?type=return_to_supplier");
      console.log("✅ Full API response:", response.data);
      
      // ✅ ВИПРАВИТИ СТРУКТУРУ ВІДПОВІДІ:
      let documents = [];
      
      if (response.data && response.data.data) {
        documents = response.data.data;  // StandardResponse format
      } else if (Array.isArray(response.data)) {
        documents = response.data;       // Simple array format
      } else {
        console.error("❌ Unexpected response structure:", response.data);
        documents = [];
      }
      
      console.log("✅ Extracted documents:", documents);
      setData(documents);
    } catch (error) {
      console.error("❌ Error loading return to supplier documents:", error);
      toast.error("Помилка завантаження документів повернення постачальнику");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      company: '',
      firm: '',
      warehouse: '',
      supplier: '',
      returnReason: '',
      dateFrom: '',
      dateTo: ''
    });
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

  const getStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.draft;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {label}
      </span>
    );
  };

  const getReturnReasonLabel = (reason?: string) => {
    if (!reason) return "—";
    return RETURN_REASONS[reason as keyof typeof RETURN_REASONS] || reason;
  };

  // Фільтрація документів по пошуку та фільтрам
  const filteredData = data.filter(returnDoc => {
    // Пошук
    if (search) {
      const query = search.toLowerCase();
      const matchesSearch = (
        returnDoc.doc_number.toLowerCase().includes(query) ||
        returnDoc.company_name.toLowerCase().includes(query) ||
        returnDoc.firm_name.toLowerCase().includes(query) ||
        returnDoc.warehouse_name.toLowerCase().includes(query) ||
        (returnDoc.supplier_name && returnDoc.supplier_name.toLowerCase().includes(query)) ||
        (returnDoc.trade_point_name && returnDoc.trade_point_name.toLowerCase().includes(query)) ||
        (returnDoc.original_purchase_number && returnDoc.original_purchase_number.toLowerCase().includes(query))
      );
      if (!matchesSearch) return false;
    }

    // Фільтр по статусу
    if (filters.status && returnDoc.status !== filters.status) return false;

    // Фільтр по компанії
    if (filters.company && !returnDoc.company_name.toLowerCase().includes(filters.company.toLowerCase())) return false;

    // Фільтр по фірмі
    if (filters.firm && !returnDoc.firm_name.toLowerCase().includes(filters.firm.toLowerCase())) return false;

    // Фільтр по складу
    if (filters.warehouse && !returnDoc.warehouse_name.toLowerCase().includes(filters.warehouse.toLowerCase())) return false;

    // Фільтр по постачальнику
    if (filters.supplier && returnDoc.supplier_name && !returnDoc.supplier_name.toLowerCase().includes(filters.supplier.toLowerCase())) return false;

    // Фільтр по причині повернення
    if (filters.returnReason && returnDoc.return_reason !== filters.returnReason) return false;

    // Фільтр по даті від
    if (filters.dateFrom) {
      const returnDate = new Date(returnDoc.date);
      const fromDate = new Date(filters.dateFrom);
      if (returnDate < fromDate) return false;
    }

    // Фільтр по даті до
    if (filters.dateTo) {
      const returnDate = new Date(returnDoc.date);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Включити весь день
      if (returnDate > toDate) return false;
    }

    return true;
  });

  // Пагінація
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Унікальні значення для фільтрів
  const uniqueCompanies = [...new Set(data.map(item => item.company_name))].sort();
  const uniqueFirms = [...new Set(data.map(item => item.firm_name))].sort();
  const uniqueWarehouses = [...new Set(data.map(item => item.warehouse_name))].sort();
  const uniqueSuppliers = [...new Set(data.map(item => item.supplier_name).filter(Boolean))].sort();
  const uniqueReturnReasons = [...new Set(data.map(item => item.return_reason).filter(Boolean))].sort();

  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Завантаження документів...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Повернення постачальнику | НашСофт" description="Документи повернення товарів постачальнику" />
      <PageBreadcrumb pageTitle="Повернення постачальнику" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Повернення постачальнику
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Показано: {paginatedData.length} з {filteredData.length} документів (всього: {data.length})
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate("/returns-to-supplier/create")} className="px-4 py-2">
            Створити повернення
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadReturnsToSupplier}
            disabled={loading}
            className="px-3 py-2 flex items-center gap-2"
          >
            Оновити
          </Button>
        </div>
      </div>

      {/* Пошук та фільтри */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Введіть номер повернення, оригінальний документ, постачальника..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
          </div>
          <Button 
            variant={showFilters ? "primary" : "outline"}
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Фільтри
          </Button>
        </div>

        {/* Панель фільтрів */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Фільтри</h3>
              <Button variant="outline" size="sm" onClick={clearFilters} className="px-3 py-1.5">
                Очистити все
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Фільтр по статусу */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Статус
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Всі статуси</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Фільтр по компанії */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Компанія
                </label>
                <select
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Всі компанії</option>
                  {uniqueCompanies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              {/* Фільтр по фірмі */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Фірма
                </label>
                <select
                  value={filters.firm}
                  onChange={(e) => handleFilterChange('firm', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Всі фірми</option>
                  {uniqueFirms.map((firm) => (
                    <option key={firm} value={firm}>{firm}</option>
                  ))}
                </select>
              </div>

              {/* Фільтр по складу */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Склад
                </label>
                <select
                  value={filters.warehouse}
                  onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Всі склади</option>
                  {uniqueWarehouses.map((warehouse) => (
                    <option key={warehouse} value={warehouse}>{warehouse}</option>
                  ))}
                </select>
              </div>

              {/* Фільтр по постачальнику */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Постачальник
                </label>
                <select
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Всі постачальники</option>
                  {uniqueSuppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>

              {/* Фільтр по причині повернення */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Причина повернення
                </label>
                <select
                  value={filters.returnReason}
                  onChange={(e) => handleFilterChange('returnReason', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Всі причини</option>
                  {Object.entries(RETURN_REASONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Фільтр по даті від */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата від
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Фільтр по даті до */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата до
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
              ↩️
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              {data.length === 0 ? "Повернення відсутні" : "Повернення не знайдені"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {data.length === 0 
                ? "Створіть ваш перший документ повернення постачальнику" 
                : "Спробуйте змінити параметри пошуку або фільтри"
              }
            </p>
            {data.length === 0 && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => navigate("/returns-to-supplier/create")}
                className="mt-4"
              >
                Створити повернення
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-transparent">
                    <TableCell
                      isHeader
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white"
                    >
                      № Повернення
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white"
                    >
                      Дата створення
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white"
                    >
                      Постачальник
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white"
                    >
                      Оригінальний документ
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white"
                    >
                      Причина повернення
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white"
                    >
                      Склад
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white"
                    >
                      Статус
                    </TableCell>
                  </tr>
                </TableHeader>

                <TableBody>
                  {paginatedData.map((returnDoc) => (
                    <tr
                      key={returnDoc.id}
                      className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/returns-to-supplier/${returnDoc.id}`)}
                    >
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        <div className="font-medium">{returnDoc.doc_number}</div>
                        <div className="text-sm text-gray-500">ID: {returnDoc.id}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        {formatDate(returnDoc.date)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        <div className="font-medium">{returnDoc.supplier_name || "—"}</div>
                        {returnDoc.trade_point_name && (
                          <div className="text-sm text-gray-500">{returnDoc.trade_point_name}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        {returnDoc.original_purchase_number ? (
                          <div 
                            className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/purchases/${returnDoc.original_purchase_id}`);
                            }}
                          >
                            {returnDoc.original_purchase_number}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        <span className="text-sm">
                          {getReturnReasonLabel(returnDoc.return_reason)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        <div className="font-medium">{returnDoc.warehouse_name}</div>
                        <div className="text-sm text-gray-500">{returnDoc.company_name} • {returnDoc.firm_name}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {getStatusBadge(returnDoc.status)}
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Пагінація */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Показано {startIndex + 1}-{Math.min(endIndex, filteredData.length)} з {filteredData.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Показувати:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {ITEMS_PER_PAGE_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Попередня сторінка */}
                    {/* Попередня сторінка */}
<Button
  variant="outline"
  size="sm"
  onClick={() => setCurrentPage(currentPage - 1)}
  disabled={currentPage === 1}
  className="px-3 py-1.5"
>
  ←
</Button>

                   {/* Номери сторінок */}
                   {getPaginationNumbers().map((pageNum, index) => (
                     <div key={index}>
                       {pageNum === '...' ? (
                         <span className="px-2 py-1 text-gray-500">...</span>
                       ) : (
                         <Button
                           variant={currentPage === pageNum ? "primary" : "outline"}
                           size="sm"
                           onClick={() => setCurrentPage(pageNum as number)}
                           className="px-3 py-1.5 min-w-[36px]"
                         >
                           {pageNum}
                         </Button>
                       )}
                     </div>
                   ))}

                   {/* Наступна сторінка */}
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setCurrentPage(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className="px-3 py-1.5"
                   >
                     →
                   </Button>
                 </div>
               </div>
             </div>
           )}
         </>
       )}
     </div>
   </>
 );
}