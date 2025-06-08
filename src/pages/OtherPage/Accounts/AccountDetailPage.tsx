import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "./../../../config/api";

import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";
import Alert from "../../../components/ui/alert/Alert";

type Account = {
  id: number;
  name: string;
  type: string;           // Повертаємо назад type
  company: number;
  company_name?: string;  // Додаємо опціонально
};

type Option = {
  value: number;
  label: string;
};

export default function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<Partial<Account>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  const accountTypeOptions = [
    { value: "cash", label: "Готівка" },
    { value: "bank", label: "Банк" },
  ];

  // Функція для правильного форматування даних форми
  const formatAccountData = (accountData: any) => {
    return {
      ...accountData,
      // API повертає company як число
      company_id: accountData.company,
    };
  };

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // Завантажуємо компанії та рахунок паралельно
        const [accountRes, companiesRes] = await Promise.all([
          axios.get(`accounts/${id}/`),
          axios.get("companies/")
        ]);

        const accountData = accountRes.data;
        const companiesData = companiesRes.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        }));

        console.log("Account data from API:", accountData); // Debug
        console.log("- account.id:", accountData.id);
        console.log("- account.name:", accountData.name);
        console.log("- account.type:", accountData.type);
        console.log("- account.company:", accountData.company);
        console.log("Companies data:", companiesData); // Debug

        const formData = formatAccountData(accountData);
        console.log("Formatted form data:", formData);
        console.log("- form.company_id:", formData.company_id);
        console.log("- form.type:", formData.type);
        console.log("- companies array:", companiesData);

        setAccount(accountData);
        setForm(formData);
        setCompanies(companiesData);
        setLoading(false);
        
        // Додаткова перевірка після setState
        setTimeout(() => {
          console.log("After setState - form:", formData);
          console.log("After setState - companies:", companiesData);
        }, 100);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Помилка завантаження даних");
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    setChanged(true);
  };

  const handleTypeSelectChange = (value: string) => {
    setForm({ ...form, type: value });
    setChanged(true);
  };

  const handleCompanyChange = (value: string) => {
    // Конвертуємо string в number, оскільки Select передає string
    setForm({ ...form, company: parseInt(value) });
    setChanged(true);
  };

  const handleSave = () => {
    if (!form.company) {
      toast.error("Оберіть компанію перед збереженням ❗");
      return;
    }

    const requestBody = {
      name: form.name,
      type: form.type,
      company: form.company,
    };

    axios
      .put(`accounts/${id}/`, requestBody)
      .then((res) => {
        const updatedAccountData = res.data;
        
        // Правильно форматуємо оновлені дані
        const formData = formatAccountData(updatedAccountData);
        
        setAccount(updatedAccountData);
        setForm(formData);
        setChanged(false);
        setIsEditing(false);
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
      .delete(`accounts/${id}/`)
      .then(() => {
        toast.success("Рахунок видалено 🗑️");
        navigate("/accounts");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };


  if (loading || !account) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Рахунок ${account.name} | НашСофт`} description="Деталі рахунку" />
      <PageBreadcrumb
        crumbs={[
          { label: "Рахунки", href: "/accounts" },
          { label: ` ${account.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі рахунку
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/accounts")}>
            Назад
          </Button>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Редагувати
            </Button>
          )}
          {changed && (
            <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)}>
              Зберегти зміни
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)}>
            Видалити
          </Button>
        </div>
      </div>

      <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="grid gap-6 sm:max-w-md">
          <Input
            label="Назва рахунку"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип рахунку
            </label>
            <Select
              options={accountTypeOptions}
              placeholder="Оберіть тип рахунку"
              onChange={handleTypeSelectChange}
              defaultValue={form.type || ""}
              key={`type-${form.type}-${loading}`}
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Компанія
            </label>
            <Select
              options={companies.map(company => ({
                value: company.value.toString(),
                label: company.label
              }))}
              defaultValue={form.company?.toString() || ""}
              key={`company-${form.company}-${loading}`}
              onChange={handleCompanyChange}
              placeholder="Оберіть компанію"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити рахунок?"
        description="Цю дію не можна скасувати."
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

      {showAlert && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">
          <Alert
            variant="success"
            title="Успішно збережено"
            message="Рахунок оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}