import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";

// Типи для документа ціноутворення згідно з Django моделлю
type PriceSettingDocument = {
  id: number;
  doc_number: string;
  date: string;
  company_name: string;
  firm_name: string;
  valid_from: string;
  status: 'draft' | 'approved' | 'cancelled';
  base_type?: 'receipt' | 'product_group' | 'price_type';
  base_receipt_number?: string;
  base_group_name?: string;
  base_price_type_name?: string;
  trade_points_count: number;
  items_count: number;
  created_at: string;
  updated_at: string;
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
  price_type: "💰 По типу ціни"
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
    setCurrentPage(1);
  }, [search, filters]);

  const loadPriceSettings = async () => {
    try {
      setLoading(true);
      console.log("Loading price setting documents...");
      
      // Використовуємо правильний endpoint згідно з Django API
      const response = await axios.get("price-setting-documents/");
      console.log("✅ Price settings loaded:", response.data);
      
      // Обробляємо дані з бекенду
      const formattedData = response.data.map((doc: any) => ({
        ...doc,
        company_name: doc.company?.name || doc.company_name || 'Невідома компанія',
        firm_name: doc.firm?.name || doc.firm_name || 'Невідома фірма',
        trade_points_count: doc.trade_points?.length || doc.trade_points_count || 0,
        items_count: doc.items?.length || doc.items_count || 0
      }));
      
      setData(formattedData);
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

  // Дії над документами
  const handleApproveDocument = async (docNumber: string) => {
    if (!confirm(`Затвердити документ ${docNumber}? Після затвердження документ не можна буде редагувати.`)) {
      return;
    }

    try {
      console.log(`Approving document ${docNumber}...`);
      
      // Використовуємо правильний endpoint для дій з документами
      await axios.post(`price-setting-documents/actions/`, {
        action: 'approve',
        doc_number: docNumber
      });
      
      toast.success(`Документ ${docNumber} затверджено ✅`);
      loadPriceSettings();
    } catch (error: any) {
      console.error("Error approving document:", error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || "Помилка при затвердженні документа";
      toast.error(errorMessage);
    }
  };

  const handleUnapproveDocument = async (docNumber: string) => {
    if (!confirm(`Розпровести документ ${docNumber}? Ціни перестануть діяти.`)) {
      return;
    }

    try {
      console.log(`Unapproving document ${docNumber}...`);
      
      await axios.post(`price-setting-documents/actions/`, {
        action: 'unapprove',
        doc_number: docNumber
      });
      
      toast.success(`Документ ${docNumber} розпроведено`);
      loadPriceSettings();
    } catch (error: any) {
      console.error("Error unapproving document:", error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || "Помилка при розпроведенні документа";
      toast.error(errorMessage);
    }
  };

  const handleDeleteDocument = async (docId: number, docNumber: string) => {
    if (!confirm(`Видалити документ ${docNumber}? Цю дію неможливо скасувати.`)) {
      return;
    }

    try {
      console.log(`Deleting document ${docId}...`);
      
      await axios.delete(`price-setting-documents/${docId}/`);
      
      toast.success(`Документ ${docNumber} видалено`);
      loadPriceSettings();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || "Помилка при видаленні документа";
      toast.error(errorMessage);
    }
  };

  // Функції форматування
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
    <div className="p-6">
      {/* Заголовок */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            💰 Документи ціноутворення
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Показано: {paginatedData.length} з {filteredData.length} документів (всього: {data.length})
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate("/price-settings/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            💰 Створити ціноутворення
          </button>
          
          <button 
            onClick={loadPriceSettings}
            disabled={loading}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            🔄 Оновити
          </button>
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
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Фільтри
          </button>
        </div>

        {/* Панель фільтрів */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Фільтри</h3>
              <button 
                onClick={clearFilters}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
              >
                Очистити все
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Статус */}
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

              {/* Тип базування */}
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

              {/* Компанія */}
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

              {/* Фірма */}
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

              {/* Діє від */}
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

              {/* Діє до */}
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

      {/* Таблиця */}
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
              <button 
                onClick={() => navigate("/price-settings/create")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Створити документ
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      № Документа
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Дата створення
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Діє з
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Компанія / Фірма
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Базування
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Торг. точки
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Позиції
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-white">
                      Статус
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-white">
                      Дії
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200 dark:bg-white/[0.02] dark:divide-white/10">
                  {paginatedData.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-800 dark:text-white">
                        <div 
                          className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          onClick={() => navigate(`/price-settings/${doc.id}`)}
                        >
                          {doc.doc_number}
                        </div>
                        <div className="text-sm text-gray-500">ID: {doc.id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-800 dark:text-white">
                        {formatDate(doc.date)}
                      </td>
                      <td className="px-6 py-4 text-gray-800 dark:text-white">
                        <div className="font-medium">{formatDateOnly(doc.valid_from)}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-800 dark:text-white">
                        <div className="font-medium">{doc.company_name}</div>
                        <div className="text-sm text-gray-500">{doc.firm_name}</div>
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          {doc.trade_points_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                          {doc.items_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {doc.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleApproveDocument(doc.doc_number)}
                                className="border border-green-300 hover:bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                              >
                                ✅ Затвердити
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.doc_number)}
                                className="border border-red-300 hover:bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                              >
                                🗑️ Видалити
                              </button>
                            </>
                          )}
                          {doc.status === 'approved' && (
                            <button
                              onClick={() => handleUnapproveDocument(doc.doc_number)}
                              className="border border-orange-300 hover:bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              🔄 Розпровести
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ←
                    </button>

                    {/* Номери сторінок */}
                    {getPaginationNumbers().map((pageNum, index) => (
                      <div key={index}>
                        {pageNum === '...' ? (
                          <span className="px-2 py-1 text-gray-500">...</span>
                        ) : (
                          <button
                            onClick={() => setCurrentPage(pageNum as number)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors min-w-[36px] ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Наступна сторінка */}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}