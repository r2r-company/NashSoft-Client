import { useState, useEffect } from "react";
import axios from "../../config/api";
import toast from "react-hot-toast";
import Button from "../ui/button/Button";
import Input from "../ui/input/Input";

type SalesDocument = {
  id: number;
  doc_type: string;
  doc_number: string;
  date: string;
  company_name: string;
  firm_name: string;
  warehouse_name: string;
  customer_id: number;
  customer_name: string;
  status: string;
  total_amount?: number;
};

type SalesSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (salesDoc: SalesDocument) => void;
  company: number;
  firm: number;
  warehouse: number;
  customer?: number;
};

export default function SalesSelectionModal({
  isOpen,
  onClose,
  onSelect,
  company,
  firm,
  warehouse,
  customer
}: SalesSelectionModalProps) {
  const [salesDocuments, setSalesDocuments] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSalesDoc, setSelectedSalesDoc] = useState<SalesDocument | null>(null);

  // Завантаження документів продажу при відкритті модалки
  useEffect(() => {
    if (isOpen && company && firm && warehouse) {
      fetchSalesDocuments();
    }
  }, [isOpen, company, firm, warehouse, customer]);

  const fetchSalesDocuments = async () => {
    setLoading(true);
    try {
      console.log("🔄 Завантаження документів продажу:", { company, firm, warehouse, customer });
      
      const params: any = { company, firm, warehouse };
      if (customer) params.customer = customer;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await axios.get("documents/sales/", { params });

      if (response.data.success && response.data.data) {
        setSalesDocuments(response.data.data);
        console.log("✅ Завантажено документів продажу:", response.data.data.length);
      } else {
        setSalesDocuments([]);
        toast.error("Документи продажу не знайдені");
      }
    } catch (error) {
      console.error("❌ Помилка завантаження:", error);
      setSalesDocuments([]);
      toast.error("Помилка завантаження документів продажу");
    } finally {
      setLoading(false);
    }
  };

  // Фільтрація за пошуком
  const filteredSalesDocuments = salesDocuments.filter(salesDoc => 
    salesDoc.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salesDoc.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ₴`;
  };

  const handleConfirm = () => {
    if (selectedSalesDoc) {
      onSelect(selectedSalesDoc);
      onClose();
      setSelectedSalesDoc(null);
    } else {
      toast.error("Оберіть документ продажу");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            🛒 Вибір документа продажу для повернення
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕ Закрити
          </Button>
        </div>

        {/* Фільтри */}
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Пошук</label>
              <Input
                type="text"
                placeholder="Номер або клієнт..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дата від</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дата до</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary" size="sm" onClick={fetchSalesDocuments}>
                🔍 Знайти
              </Button>
            </div>
          </div>
        </div>

        {/* Список документів */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Завантаження...</span>
            </div>
          ) : filteredSalesDocuments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              🛒 Документи продажу не знайдені
              <div className="text-sm mt-2">
                {customer ? "Для цього клієнта немає проведених документів продажу" : "Створіть спочатку документ продажу"}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSalesDocuments.map((salesDoc) => (
                <div
                  key={salesDoc.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSalesDoc?.id === salesDoc.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedSalesDoc(salesDoc)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-orange-600">
                          🛒 {salesDoc.doc_number}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          salesDoc.status === 'posted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {salesDoc.status === 'posted' ? 'Проведено' : salesDoc.status}
                        </span>
                        {salesDoc.total_amount && (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {formatPrice(salesDoc.total_amount)}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">📅 Дата:</span>
                          <div>{formatDate(salesDoc.date)}</div>
                        </div>
                        <div>
                          <span className="font-medium">👤 Клієнт:</span>
                          <div>{salesDoc.customer_name}</div>
                        </div>
                        <div>
                          <span className="font-medium">🏭 Фірма:</span>
                          <div>{salesDoc.firm_name}</div>
                        </div>
                        <div>
                          <span className="font-medium">📦 Склад:</span>
                          <div>{salesDoc.warehouse_name}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {selectedSalesDoc?.id === salesDoc.id && (
                        <div className="text-orange-600 text-xl">✅</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Підвал з кнопками */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500">
            {selectedSalesDoc ? (
              <span className="text-orange-600 font-medium">
                ✅ Обрано: {selectedSalesDoc.doc_number} 
                {selectedSalesDoc.total_amount && ` (${formatPrice(selectedSalesDoc.total_amount)})`}
              </span>
            ) : (
              <span>Оберіть документ зі списку</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirm}
              disabled={!selectedSalesDoc}
            >
              Обрати документ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}