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

type Firm = {
  id: number;
  name: string;
  company: string;
  company_id: number;
  is_vat: boolean;
  vat_type: string;
};

type Option = {
  value: number;
  label: string;
};

export default function FirmDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [firm, setFirm] = useState<Firm | null>(null);
  const [form, setForm] = useState<Partial<Firm>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  const vatTypeOptions = [
    { value: "ФОП", label: "ФОП" },
    { value: "ТОВ", label: "ТОВ" },
    { value: "ТЗОВ", label: "ТЗОВ" },
  ];

  // Функція для правильного форматування даних форми
  const formatFirmData = (firmData: any, companiesData: Option[]) => {
    let companyId = firmData.company_id;
    
    // Якщо company_id не існує, спробуємо знайти по назві
    if (!companyId && firmData.company) {
      const matchedCompany = companiesData.find((c: Option) => c.label === firmData.company);
      companyId = matchedCompany?.value;
    }
    
    return {
      ...firmData,
      company_id: companyId,
      vat_type: firmData.vat_type || "",
      is_vat: firmData.is_vat || false
    };
  };

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // Завантажуємо компанії та фірму паралельно
        const [firmRes, companiesRes] = await Promise.all([
          axios.get(`firms/${id}/`),
          axios.get("companies/")
        ]);

        const firmData = firmRes.data;
        const companiesData = companiesRes.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        }));

        const formData = formatFirmData(firmData, companiesData);

        setFirm(firmData);
        setForm(formData);
        setCompanies(companiesData);
        setLoading(false);
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
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    setChanged(true);
  };

  const handleSelectChange = (value: string) => {
    setForm({ ...form, vat_type: value });
    setChanged(true);
  };

  const handleCompanyChange = (value: string) => {
    // Конвертуємо string в number, оскільки Select передає string
    setForm({ ...form, company_id: parseInt(value) });
    setChanged(true);
  };

  const handleSave = () => {
    if (!form.company_id) {
      toast.error("Оберіть компанію перед збереженням ❗");
      return;
    }

    const requestBody = {
      name: form.name,
      company_id: form.company_id,
      vat_type: form.vat_type,
      is_vat: form.is_vat,
    };

    axios
      .put(`firms/${id}/`, requestBody)
      .then((res) => {
        const updatedFirmData = res.data;
        
        // Правильно форматуємо оновлені дані
        const formData = formatFirmData(updatedFirmData, companies);
        
        setFirm(updatedFirmData);
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
      .delete(`firms/${id}/`)
      .then(() => {
        toast.success("Фірму видалено 🗑️");
        navigate("/firms");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  if (loading || !firm) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Фірма ${firm.name} | НашСофт`} description="Деталі фірми" />
      <PageBreadcrumb
        crumbs={[
          { label: "Фірми", href: "/firms" },
          { label: ` ${firm.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі фірми
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/firms")}>
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
            label="Назва фірми"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Компанія
            </label>
            <Select
              options={companies.map(company => ({
                value: company.value.toString(),
                label: company.label
              }))}
              defaultValue={form.company_id?.toString() || ""}
              key={`company-${form.company_id}-${isEditing}`}
              onChange={handleCompanyChange}
              placeholder="Оберіть компанію"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип ПДВ
            </label>
            <Select
              options={vatTypeOptions}
              placeholder="Оберіть тип ПДВ"
              onChange={handleSelectChange}
              defaultValue={form.vat_type || ""}
              key={`vat-${form.vat_type}-${isEditing}`}
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_vat"
              name="is_vat"
              checked={form.is_vat || false}
              onChange={handleChange}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-60"
            />
            <label htmlFor="is_vat" className="text-sm font-medium text-gray-700 dark:text-white">
              Платник ПДВ
            </label>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити фірму?"
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
            message="Фірму оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}