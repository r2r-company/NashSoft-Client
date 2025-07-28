import { useState, useEffect } from "react";
import axios from "../../config/api";
import toast from "react-hot-toast";
import Button from "../ui/button/Button";
import Input from "../ui/input/Input";
import { Table, TableBody, TableCell, TableHeader } from "../ui/table";

type Receipt = {
  id: number;
  doc_type: string;
  doc_number: string;
  date: string;
  company_name: string;
  firm_name: string;
  warehouse_name: string;
  supplier_id: number;
  supplier_name: string;
  status: string;
};

type ReceiptSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (receipt: Receipt) => void;
  company: number;
  firm: number;
  warehouse: number;
};

export default function ReceiptSelectionModal({
  isOpen,
  onClose,
  onSelect,
  company,
  firm,
  warehouse
}: ReceiptSelectionModalProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Завантаження поступлень при відкритті модалки
  useEffect(() => {
    if (isOpen && company && firm && warehouse) {
      fetchReceipts();
    }
  }, [isOpen, company, firm, warehouse]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      console.log("🔄 Завантаження поступлень:", { company, firm, warehouse });
      
      const params: any = { company, firm, warehouse };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await axios.get("/receipts-by-filter/", { params });

      if (response.data.success && response.data.data) {
        setReceipts(response.data.data);
        console.log("✅ Завантажено поступлень:", response.data.data.length);
      } else {
        setReceipts([]);
        toast.error("Поступлення не знайдені");
      }
    } catch (error) {
      console.error("❌ Помилка завантаження:", error);
      setReceipts([]);
      toast.error("Помилка завантаження поступлень");
    } finally {
      setLoading(false);
    }
  };

  // Фільтрація за пошуком
  const filteredReceipts = receipts.filter(receipt => 
    receipt.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  const handleConfirm = () => {
    if (selectedReceipt) {
      onSelect(selectedReceipt);
      onClose();
      setSelectedReceipt(null);
    } else {
      toast.error("Оберіть документ поступлення");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            📋 Вибір документа поступлення
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
                placeholder="Номер або постачальник..."
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
              <Button variant="primary" size="sm" onClick={fetchReceipts}>
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
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              📭 Документи поступлення не знайдені
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReceipts.map((receipt) => (
                <div
  key={receipt.id}
  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
    selectedReceipt?.id === receipt.id
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
  }`}
  onClick={() => setSelectedReceipt(receipt)}
>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-blue-600">
                          📄 {receipt.doc_number}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          receipt.status === 'posted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {receipt.status === 'posted' ? 'Проведено' : receipt.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">📅 Дата:</span>
                          <div>{formatDate(receipt.date)}</div>
                        </div>
                        <div>
                          <span className="font-medium">🏢 Постачальник:</span>
                          <div>{receipt.supplier_name}</div>
                        </div>
                        <div>
                          <span className="font-medium">🏭 Фірма:</span>
                          <div>{receipt.firm_name}</div>
                        </div>
                        <div>
                          <span className="font-medium">📦 Склад:</span>
                          <div>{receipt.warehouse_name}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
  {selectedReceipt?.id === receipt.id && (
    <div className="text-blue-600 text-xl">✅</div>
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
            {selectedReceipt ? (
              <span className="text-blue-600 font-medium">
                ✅ Обрано: {selectedReceipt.doc_number}
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
              disabled={!selectedReceipt}
            >
              Обрати документ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}