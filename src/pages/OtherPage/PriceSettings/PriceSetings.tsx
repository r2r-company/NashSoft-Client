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

type PriceSettingDocument = {
  id: number;
  doc_number: string;
  date: string;
  company_name: string;
  firm_name: string;
  valid_from: string;
  status: string;
  base_type?: string;
  base_receipt_number?: string;
  base_group_name?: string;
  base_price_type_name?: string;
  trade_points_count: number;
  items_count: number;
};

type FilterState = {
  status: string;
  company: string;
  firm: string;
  base_type: string;
  dateFrom: string;
  dateTo: string;
  valid_from: string;
  valid_to: string;
};

// Статуси документів ціноутворення
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
  price_type: "💰 По типу ціни",
  manual: "✋ Ручне створення"
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function PriceSettings() {
  const [data, setData] = useState<PriceSettingDocument[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    company: '',
    firm: '',
    base_type: '',
    dateFrom: '',
    dateTo: '',
    valid_from: '',
    valid_to: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    loadPriceSettings();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Скидання сторінки при зміні пошуку або фільтрів
  }, [search, filters]);

  const loadPriceSettings = async () => {
    try {
      setLoading(true);
      console.log("Loading price setting documents...");
      
      const response = await axios.get("price-setting-documents/");
      console.log("✅ Price settings loaded:", response.data);
      setData(response.data);
    } catch (error) {
      console.error("❌ Error loading price settings:", error);
      toast.error("Помилка завантаження документів ціноутворення");
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
      base_type: '',
      dateFrom: '',
      dateTo: '',
      valid_from: '',
      valid_to: ''
    });
  };

  const handleApproveDocument = async (docNumber: string) => {
    try {
      console.log(`Approving document ${docNumber}...`);
      await axios.get(`price-setting-document-action/?action=approve&id=${docNumber}`);
      toast.success(`Документ ${docNumber} затверджено ✅`);
      loadPriceSettings(); // Перезавантажуємо список
    } catch (error) {
      console.error("Error approving document:", error);
      toast.error("Помилка при затвердженні документа");
    }
  };

  const handleUnapproveDocument = async (docNumber: string) => {
    try {
      console.log(`Unapproving document ${docNumber}...`);
      await axios.get(`price-setting-document-action/?action=unapprove&id=${docNumber}`);
      toast.success(`Документ ${docNumber} розпроведено`);
      loadPriceSettings(); // Перезавантажуємо список
    } catch (error) {
      console.error("Error unapproving document:", error);
      toast.error("Помилка при розпроведенні документа");
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

  const getStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.draft;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {label}
      </span>
    );
  };

  const getBaseTypeBadge = (baseType?: string) => {
    if (!baseType) return <span className="text-gray-500">—</span>;
    
    const label = BASE_TYPE_LABELS[baseType as keyof typeof BASE_TYPE_LABELS] || baseType;
    
    return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
        {label}
      </span>
    );
  };

  // Фільтрація документів
  const filteredData = data.filter(doc => {
    // Пошук
    if (search) {
      const query = search.toLowerCase();
      const matchesSearch = (
        doc.doc_number.toLowerCase().includes(query) ||
        doc.company_name.toLowerCase().includes(query) ||
        doc.firm_name.toLowerCase().includes(query) ||
        (doc.base_receipt_number && doc.base_receipt_number.toLowerCase().includes(query)) ||
        (doc.base_group_name && doc.base_group_name.toLowerCase().includes(query))
      );
      if (!matchesSearch) return false;
    }

    // Фільтри
    if (filters.status && doc.status !== filters.status) return false;
    if (filters.company && !doc.company_name.toLowerCase().includes(filters.company.toLowerCase())) return false;
    if (filters.firm && !doc.firm_name.toLowerCase().includes(filters.firm.toLowerCase())) return false;
    if (filters.base_type && doc.base_type !== filters.base_type) return false;

    // Фільтр по даті створення
    if (filters.dateFrom) {
      const docDate = new Date(doc.date);
      const fromDate = new Date(filters.dateFrom);
      if (docDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const docDate = new Date(doc.date);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (docDate > toDate) return false;
    }

    // Фільтр по даті початку дії
    if (filters.valid_from) {
      const validFromDate = new Date(doc.valid_from);
      const fromDate = new Date(filters.valid_from);
      if (validFromDate < fromDate) return false;
    }

    if (filters.valid_to) {
      const validFromDate = new Date(doc.valid_from);
      const toDate = new Date(filters.valid_to);
      if (validFromDate > toDate) return false;
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
          <p className="text-gray-600 dark:text-gray-400">Завантаження документів ціноутворення...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Ціноутворення | НашСофт" description="Документи ціноутворення товарів" />
      <PageBreadcrumb pageTitle="Ціноутворення" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Документи ціноутворення
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Показано: {paginatedData.length} з {filteredData.length} документів (всього: {data.length})
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate("/price-settings/create")} className="px-4 py-2">
            💰 Створити ціноутворення
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPriceSettings}
            disabled={loading}
            className="px-3 py-2 flex items-center gap-2"
          >
            🔄 Оновити
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
                placeholder="Введіть номер документа, компанію або фірму..."
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Фільтр по типу базування */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тип базування
                </label>
                <select
                  value={filters.base_type}
                  onChange={(e) => handleFilterChange('base_type', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Всі типи</option>
                  {Object.entries(BASE_TYPE_LABELS).map(([key, label]) => (
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

              {/* Дата створення від */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Створено від
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Дата створення до */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Створено до
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Дія від */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Діє від
                </label>
                <input
                  type="date"
                  value={filters.valid_from}
                  onChange={(e) => handleFilterChange('valid_from', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Дія до */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Діє до
                </label>
                <input
                  type="date"
                  value={filters.valid_to}
                  onChange={(e) => handleFilterChange('valid_to', e.target.value)}
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
              💰
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              {data.length === 0 ? "Документи ціноутворення відсутні" : "Документи не знайдені"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {data.length === 0 
                ? "Створіть ваш перший документ ціноутворення" 
                : "Спробуйте змінити параметри пошуку або фільтри"
              }
            </p>
            {data.length === 0 && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => navigate("/price-settings/create")}
                className="mt-4"
              >
                Створити документ
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-transparent">
                    <TableCell isHeader className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      № Документа
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Дата створення
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Діє з
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Компанія / Фірма
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Базування
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Торг. точки
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Позиції
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Статус
                    </TableCell>
                    <TableCell isHeader className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Дії
                    </TableCell>
                  </tr>
                </TableHeader>

                <TableBody>
                  {paginatedData.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white cursor-pointer">
                        <div 
                          className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => navigate(`/price-settings/${doc.id}`)}
                        >
                          {doc.doc_number}
                        </div>
                        <div className="text-sm text-gray-500">ID: {doc.id}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        {formatDate(doc.date)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        <div className="font-medium">{formatDateOnly(doc.valid_from)}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-800 dark:text-white">
                        <div className="font-medium">{doc.company_name}</div>
                        <div className="text-sm text-gray-500">{doc.firm_name}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {getBaseTypeBadge(doc.base_type)}
                        {doc.base_receipt_number && (
                          <div className="text-xs text-gray-500 mt-1">
                            📦 {doc.base_receipt_number}
                          </div>
                        )}
                        {doc.base_group_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            📁 {doc.base_group_name}
                          </div>
                        )}
                        {doc.base_price_type_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            💰 {doc.base_price_type_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          {doc.trade_points_count}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                          {doc.items_count}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {doc.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveDocument(doc.doc_number)}
                              className="px-2 py-1 text-xs"
                            >
                              ✅ Затвердити
                            </Button>
                          )}
                          {doc.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnapproveDocument(doc.doc_number)}
                              className="px-2 py-1 text-xs"
                            >
                              🔄 Розпровести
                            </Button>
                          )}
                        </div>
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