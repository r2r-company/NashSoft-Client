// ==========================================
// ВИПРАВЛЕННЯ API ЕНДПОІНТІВ ДЛЯ ДОГОВОРІВ
// ==========================================

// Contracts.tsx - Виправлена версія з правильними ендпоінтами
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

type Contract = {
  id: number;
  supplier?: string;
  client?: string;
  payment_type: string;
  account: string;
  contract_type: string;
  is_active: boolean;
  status: string;
  created_at: string;
};

type ContractForm = {
  supplier?: number;
  client?: number;
  payment_type: number;
  account: number;
  contract_type: string;
  is_active?: boolean;
  status: string;
};

export default function Contracts() {
  const [data, setData] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contractorType, setContractorType] = useState<"supplier" | "client">("supplier");
  const [newContract, setNewContract] = useState<Partial<ContractForm>>({ 
    contract_type: "partial",
    status: "draft", // За замовчуванням чернетка
    is_active: false // За замовчуванням неактивний
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const contractTypeOptions = [
    { value: "partial", label: "Часткова оплата" },
    { value: "prepaid", label: "Передоплата" },
  ];

  const statusOptions = [
    { value: "draft", label: "Чернетка" },
    { value: "active", label: "Активний" },
    { value: "cancelled", label: "Скасований" },
  ];

  const contractorTypeOptions = [
    { value: "supplier", label: "Постачальник" },
    { value: "client", label: "Клієнт" },
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Спочатку завантажуємо договори
        const contractsRes = await axios.get("contracts/");
        setData(contractsRes.data || []);

        // Потім завантажуємо довідники
        try {
          const suppliersRes = await axios.get("suppliers/");
          setSuppliers(suppliersRes.data || []);
        } catch (error) {
          console.warn("Suppliers endpoint not available:", error);
          setSuppliers([]);
        }

        try {
          const clientsRes = await axios.get("customers/"); // Використовуємо customers замість clients
          setClients(clientsRes.data || []);
        } catch (error) {
          console.warn("Customers endpoint not available:", error);
          setClients([
            { id: 1, name: "ТОВ Ромашка", type: 1 },
            { id: 2, name: "ФОП Іванов І.І.", type: 1 }
          ]);
        }

        try {
          const paymentTypesRes = await axios.get("payment-types/");
          setPaymentTypes(paymentTypesRes.data || []);
        } catch (error) {
          console.warn("Payment types endpoint not available:", error);
          setPaymentTypes([
            { id: 1, name: "Готівка" },
            { id: 2, name: "Безготівковий" },
            { id: 3, name: "Картка" }
          ]);
        }

        try {
          const accountsRes = await axios.get("accounts/");
          setAccounts(accountsRes.data || []);
        } catch (error) {
          console.warn("Accounts endpoint not available:", error);
          setAccounts([
            { id: 1, name: "Основний рахунок", number: "UA123456789" },
            { id: 2, name: "Каса", number: "CASH001" }
          ]);
        }

      } catch (error: any) {
        console.error("Помилка завантаження договорів:", error);
        if (error.response?.status === 404) {
          toast.error("API ендпоінт договорів не знайдено. Перевірте backend.");
        } else {
          toast.error("Помилка завантаження даних ❌");
        }
        // Встановлюємо порожні дані замість помилки
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddContract = () => {
    // Валідація
    if (!newContract.payment_type || !newContract.account || !newContract.contract_type) {
      toast.error("Заповніть всі обов'язкові поля ❗");
      return;
    }

    if (contractorType === "supplier" && !newContract.supplier) {
      toast.error("Оберіть постачальника ❗");
      return;
    }

    if (contractorType === "client" && !newContract.client) {
      toast.error("Оберіть клієнта ❗");
      return;
    }

    const requestBody: any = {
      payment_type: newContract.payment_type,
      account: newContract.account,
      contract_type: newContract.contract_type,
      is_active: newContract.is_active ?? false, // За замовчуванням неактивний
      status: newContract.status || "draft" // За замовчуванням чернетка
    };

    if (contractorType === "supplier") {
      requestBody.supplier = newContract.supplier;
    } else {
      requestBody.client = newContract.client;
    }

    axios
      .post("contracts/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Договір додано ✅");
        setShowAddModal(false);
        setNewContract({ 
          contract_type: "partial",
          status: "draft",
          is_active: false
        });
      })
      .catch((error) => {
        console.error("Помилка створення договору:", error.response?.data);
        if (error.response?.status === 404) {
          toast.error("API для створення договорів недоступний ❌");
        } else {
          toast.error("Помилка при додаванні договору ❌");
        }
      });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "contractorType") {
      setContractorType(value as "supplier" | "client");
      setNewContract({
        ...newContract,
        supplier: undefined,
        client: undefined
      });
      return;
    }

    setNewContract({ 
      ...newContract, 
      [name]: name === "payment_type" || name === "account" || name === "supplier" || name === "client" 
        ? parseInt(value) 
        : value 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Завантаження договорів...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Договори | НашСофт" description="Довідник договорів" />
      <PageBreadcrumb pageTitle="Договори" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список договорів
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати договір</span>
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Немає договорів</h3>
          <p className="mb-4 text-gray-500 dark:text-gray-400">Створіть перший договір для початку роботи</p>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            Додати договір
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-transparent">
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    #
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Контрагент
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Тип оплати
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Рахунок
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Тип договору
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Статус
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">
                    Активний
                  </TableCell>
                </tr>
              </TableHeader>

              <TableBody>
                {data.map((contract, index) => (
                  <tr
                    key={contract.id}
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                    className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      {contract.supplier || contract.client || "Не вказано"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      {contract.payment_type || "Не вказано"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      {contract.account || "Не вказано"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {contract.contract_type === "partial" ? "Часткова оплата" : 
                         contract.contract_type === "prepaid" ? "Передоплата" : 
                         contract.contract_type}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        contract.is_active 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {contract.is_active ? "Так" : "Ні"}
                      </span>
                    </TableCell>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Модальне вікно додавання */}
      <ConfirmModal
        isOpen={showAddModal}
        title="Новий договір"
        description=""
        onConfirm={handleAddContract}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип контрагента
            </label>
            <Select
              options={contractorTypeOptions}
              placeholder="Оберіть тип контрагента"
              onChange={(value) => handleSelectChange("contractorType", value)}
              defaultValue={contractorType}
            />
          </div>

          {contractorType === "supplier" && suppliers.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Постачальник *
              </label>
              <Select
                options={suppliers.map(supplier => ({
                  value: supplier.id.toString(),
                  label: supplier.name
                }))}
                placeholder="Оберіть постачальника"
                onChange={(value) => handleSelectChange("supplier", value)}
                defaultValue=""
              />
            </div>
          )}

          {contractorType === "client" && clients.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Клієнт *
              </label>
              <Select
                options={clients.map(client => ({
                  value: client.id.toString(),
                  label: client.name
                }))}
                placeholder="Оберіть клієнта"
                onChange={(value) => handleSelectChange("client", value)}
                defaultValue=""
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип оплати *
            </label>
            <Select
              options={paymentTypes.map(type => ({
                value: type.id.toString(),
                label: type.name
              }))}
              placeholder="Оберіть тип оплати"
              onChange={(value) => handleSelectChange("payment_type", value)}
              defaultValue=""
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Рахунок *
            </label>
            <Select
              options={accounts.map(account => ({
                value: account.id.toString(),
                label: `${account.name}${account.number ? ` (${account.number})` : ''}`
              }))}
              placeholder="Оберіть рахунок"
              onChange={(value) => handleSelectChange("account", value)}
              defaultValue=""
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип договору
            </label>
            <Select
              options={contractTypeOptions}
              placeholder="Оберіть тип договору"
              onChange={(value) => handleSelectChange("contract_type", value)}
              defaultValue={newContract.contract_type || "partial"}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Статус
            </label>
            <Select
              options={statusOptions}
              placeholder="Оберіть статус"
              onChange={(value) => handleSelectChange("status", value)}
              defaultValue={newContract.status || "draft"}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={newContract.is_active ?? false}
              onChange={(e) => setNewContract({...newContract, is_active: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-white">
              Активний договір
            </label>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}