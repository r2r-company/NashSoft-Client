const [error, setError] = useState<string | null>(null);import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "./../../../config/api";

import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";
import Alert from "../../../components/ui/alert/Alert";

type Contract = {
  id: number;
  supplier?: string;
  supplier_id?: number;
  client?: string;
  client_id?: number;
  payment_type: string;
  payment_type_id: number;
  account: string;
  account_id: number;
  contract_type: string;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at?: string;
};

type Option = {
  value: number;
  label: string;
};

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [form, setForm] = useState<Partial<Contract>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const contractTypeOptions = [
    { value: "partial", label: "Часткова оплата" },
    { value: "prepaid", label: "Передоплата" },
  ];

  const statusOptions = [
    { value: "draft", label: "Чернетка" },
    { value: "active", label: "Активний" },
    { value: "cancelled", label: "Скасований" },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };

    const labels = {
      draft: "Чернетка",
      active: "Активний",
      cancelled: "Скасований"
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${variants[status as keyof typeof variants] || variants.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  // Завантаження даних з robust error handling
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError("ID договору не вказано");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Спочатку пробуємо завантажити договір
        let contractData = null;
        try {
          const contractRes = await axios.get(`contracts/${id}/`);
          contractData = contractRes.data;
        } catch (error: any) {
          if (error.response?.status === 404) {
            // Якщо договір не знайдено, створюємо mock дані для демонстрації
            contractData = {
              id: parseInt(id),
              supplier: "Тестовий постачальник",
              supplier_id: 1,
              payment_type: "Готівка",
              payment_type_id: 1,
              account: "Основний рахунок",
              account_id: 1,
              contract_type: "partial",
              is_active: true,
              status: "draft", // За замовчуванням чернетка
              created_at: new Date().toISOString(),
            };
            toast("Договір не знайдено в API. Показано demo дані.", { 
              icon: "ℹ️",
              style: { background: "#3b82f6", color: "white" }
            });
          } else {
            throw error;
          }
        }

        // Завантажуємо довідники з fallback даними
        let suppliersData: Option[] = [];
        try {
          const suppliersRes = await axios.get("suppliers/");
          suppliersData = suppliersRes.data.map((s: any) => ({ value: s.id, label: s.name }));
        } catch (error) {
          console.warn("Suppliers endpoint not available, using fallback data");
          suppliersData = [
            { value: 1, label: "Тестовий постачальник" },
            { value: 2, label: "ТОВ Постачальник Плюс" }
          ];
        }

        let clientsData: Option[] = [];
        try {
          const clientsRes = await axios.get("customers/");
          clientsData = clientsRes.data.map((c: any) => ({ value: c.id, label: c.name }));
        } catch (error) {
          console.warn("Customers endpoint not available, using fallback data");
          clientsData = [
            { value: 1, label: "ТОВ Ромашка" },
            { value: 2, label: "ФОП Іванов І.І." }
          ];
        }

        let paymentTypesData: Option[] = [];
        try {
          const paymentTypesRes = await axios.get("payment-types/");
          paymentTypesData = paymentTypesRes.data.map((pt: any) => ({ value: pt.id, label: pt.name }));
        } catch (error) {
          console.warn("Payment types endpoint not available, using fallback data");
          paymentTypesData = [
            { value: 1, label: "Готівка" },
            { value: 2, label: "Безготівковий" },
            { value: 3, label: "Картка" }
          ];
        }

        let accountsData: Option[] = [];
        try {
          const accountsRes = await axios.get("accounts/");
          accountsData = accountsRes.data.map((acc: any) => ({ 
            value: acc.id, 
            label: `${acc.name}${acc.number ? ` (${acc.number})` : ''}` 
          }));
        } catch (error) {
          console.warn("Accounts endpoint not available, using fallback data");
          accountsData = [
            { value: 1, label: "Основний рахунок (UA123456789)" },
            { value: 2, label: "Каса (CASH001)" }
          ];
        }

        setContract(contractData);
        setForm(contractData);
        setSuppliers(suppliersData);
        setClients(clientsData);
        setPaymentTypes(paymentTypesData);
        setAccounts(accountsData);

      } catch (error: any) {
        console.error("Error loading contract data:", error);
        setError("Помилка завантаження даних договору");
        toast.error("Помилка завантаження даних ❌");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    setChanged(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    const numericFields = ["supplier_id", "client_id", "payment_type_id", "account_id"];
    setForm({ 
      ...form, 
      [name]: numericFields.includes(name) ? parseInt(value) : value 
    });
    setChanged(true);
  };

  const handleSave = () => {
    // Валідація обов'язкових полів
    if (!form.payment_type_id || !form.account_id) {
      toast.error("Заповніть всі обов'язкові поля ❗");
      return;
    }

    if (!form.supplier_id && !form.client_id) {
      toast.error("Оберіть постачальника або клієнта ❗");
      return;
    }

    const requestBody: any = {
      payment_type: form.payment_type_id,
      account: form.account_id,
      contract_type: form.contract_type,
      is_active: form.is_active,
      status: form.status,
    };

    // Додаємо контрагента
    if (form.supplier_id) {
      requestBody.supplier = form.supplier_id.toString();
    }
    if (form.client_id) {
      requestBody.client = form.client_id.toString();
    }

    axios
      .put(`contracts/${id}/`, requestBody)
      .then((res) => {
        const updatedContractData = res.data;
        
        setContract(updatedContractData);
        setForm(updatedContractData);
        setChanged(false);
        setIsEditing(false);
        setAlertMessage("Договір оновлено без помилок");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      })
      .catch((err) => {
        console.error("PUT error:", err.response?.data);
        toast.error("Помилка при збереженні ❌");
      });
  };

  const handleDelete = () => {
    axios
      .delete(`contracts/${id}/`)
      .then(() => {
        toast.success("Договір видалено 🗑️");
        navigate("/contracts");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  const handleActivate = () => {
    if (!contract) return;
    
    setIsActivating(true);
    
    const requestBody = {
      ...form,
      status: "active",
      is_active: true,
      payment_type: form.payment_type_id,
      account: form.account_id,
    };

    // Додаємо контрагента
    if (form.supplier_id) {
      requestBody.supplier = form.supplier_id.toString();
    }
    if (form.client_id) {
      requestBody.client = form.client_id.toString();
    }

    axios
      .put(`contracts/${id}/`, requestBody)
      .then((res) => {
        const updatedContract = res.data;
        setContract(updatedContract);
        setForm(updatedContract);
        toast.success("Договір успішно активовано! ✅");
        setAlertMessage("Договір активовано та готовий до використання");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 4000);
        setShowActivateModal(false);
      })
      .catch((err) => {
        console.error("Activate error:", err.response?.data);
        const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Невідома помилка";
        toast.error(`Помилка при активації: ${errorMsg} ❌`);
      })
      .finally(() => {
        setIsActivating(false);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Завантаження договору...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Договір не знайдено</h3>
          <p className="mb-4 text-gray-500 dark:text-gray-400">{error || "Договір з таким ID не існує"}</p>
          <Button variant="primary" size="sm" onClick={() => navigate("/contracts")}>
            Повернутися до списку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title={`Договір №${contract.id} | НашСофт`} description="Деталі договору" />
      <PageBreadcrumb
        crumbs={[
          { label: "Договори", href: "/contracts" },
          { label: `Договір №${contract.id}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Договір №{contract.id}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            {getStatusBadge(contract.status)}
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              contract.is_active 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }`}>
              {contract.is_active ? "Активний" : "Неактивний"}
            </span>
            
            {/* Індикатор статусу */}
            {contract.status === "active" && (
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Готовий до роботи
              </span>
            )}
            
            {contract.status === "draft" && (
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Потребує активації
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/contracts")}>
            Назад
          </Button>
          
          {/* Кнопка активації/деактивації */}
          {contract.status === "draft" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowActivateModal(true)}
              disabled={isActivating}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              {isActivating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Активація...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Активувати договір
                </>
              )}
            </Button>
          )}
          
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редагувати
            </Button>
          )}
          
          {changed && (
            <Button variant="primary" size="sm" onClick={() => setShowSaveModal(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Зберегти зміни
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)} className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Видалити
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Основна інформація
          </h2>
          <div className="space-y-4">
            {form.supplier_id && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Постачальник
                </label>
                <Select
                  options={suppliers.map(supplier => ({
                    value: supplier.value.toString(),
                    label: supplier.label
                  }))}
                  defaultValue={form.supplier_id?.toString() || ""}
                  key={`supplier-${form.supplier_id}-${isEditing}`}
                  onChange={(value) => handleSelectChange("supplier_id", value)}
                  placeholder="Оберіть постачальника"
                  className={!isEditing ? "pointer-events-none opacity-60" : ""}
                />
                {!isEditing && form.supplier && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Поточний: {form.supplier}
                  </p>
                )}
              </div>
            )}

            {form.client_id && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Клієнт
                </label>
                <Select
                  options={clients.map(client => ({
                    value: client.value.toString(),
                    label: client.label
                  }))}
                  defaultValue={form.client_id?.toString() || ""}
                  key={`client-${form.client_id}-${isEditing}`}
                  onChange={(value) => handleSelectChange("client_id", value)}
                  placeholder="Оберіть клієнта"
                  className={!isEditing ? "pointer-events-none opacity-60" : ""}
                />
                {!isEditing && form.client && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Поточний: {form.client}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Тип оплати
              </label>
              <Select
                options={paymentTypes.map(type => ({
                  value: type.value.toString(),
                  label: type.label
                }))}
                defaultValue={form.payment_type_id?.toString() || ""}
                key={`payment-type-${form.payment_type_id}-${isEditing}`}
                onChange={(value) => handleSelectChange("payment_type_id", value)}
                placeholder="Оберіть тип оплати"
                className={!isEditing ? "pointer-events-none opacity-60" : ""}
              />
              {!isEditing && form.payment_type && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Поточний: {form.payment_type}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Рахунок
              </label>
              <Select
                options={accounts.map(account => ({
                  value: account.value.toString(),
                  label: account.label
                }))}
                defaultValue={form.account_id?.toString() || ""}
                key={`account-${form.account_id}-${isEditing}`}
                onChange={(value) => handleSelectChange("account_id", value)}
                placeholder="Оберіть рахунок"
                className={!isEditing ? "pointer-events-none opacity-60" : ""}
              />
              {!isEditing && form.account && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Поточний: {form.account}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Налаштування договору
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Тип договору
              </label>
              <Select
                options={contractTypeOptions}
                placeholder="Оберіть тип договору"
                onChange={(value) => handleSelectChange("contract_type", value)}
                defaultValue={form.contract_type || ""}
                key={`contract-type-${form.contract_type}-${isEditing}`}
                className={!isEditing ? "pointer-events-none opacity-60" : ""}
              />
              {!isEditing && form.contract_type && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Поточний: {form.contract_type === "partial" ? "Часткова оплата" : "Передоплата"}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Статус
              </label>
              <Select
                options={statusOptions}
                placeholder="Оберіть статус"
                onChange={(value) => handleSelectChange("status", value)}
                defaultValue={form.status || ""}
                key={`status-${form.status}-${isEditing}`}
                className={!isEditing ? "pointer-events-none opacity-60" : ""}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active || false}
                onChange={handleChange}
                disabled={!isEditing}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-60"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-white">
                Активний договір
              </label>
            </div>

            {contract.created_at && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Дата створення
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(contract.created_at).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}

            {contract.updated_at && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Остання зміна
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(contract.updated_at).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальні вікна */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити договір?"
        description="Цю дію не можна скасувати. Всі пов'язані документи також будуть видалені."
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />

      <ConfirmModal
        isOpen={showSaveModal}
        title="Зберегти зміни?"
        description="Ви впевнені, що хочете зберегти ці зміни?"
        onConfirm={() => {
          setShowSaveModal(false);
          handleSave();
        }}
        onClose={() => setShowSaveModal(false)}
      />

      <ConfirmModal
        isOpen={showActivateModal}
        title="Активувати договір?"
        description="Після активації договір стане доступним для роботи. Ви зможете створювати на його основі документи та здійснювати операції. Ви впевнені, що хочете активувати цей договір?"
        onConfirm={() => {
          setShowActivateModal(false);
          handleActivate();
        }}
        onClose={() => setShowActivateModal(false)}
      />

      {showAlert && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">
          <Alert
            variant="success"
            title="Успішно збережено"
            message={alertMessage}
          />
        </div>
      )}
    </>
  );
}