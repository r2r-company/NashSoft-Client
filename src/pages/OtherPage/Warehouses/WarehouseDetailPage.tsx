import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../../config/api";

import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";
import Alert from "../../../components/ui/alert/Alert";

type Warehouse = {
  id: number;
  name: string;
  company_name: string;
  company_id: number;
};

type Option = {
  value: number;
  label: string;
};

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<Partial<Warehouse>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  // Функція для правильного форматування даних форми
  const formatWarehouseData = (warehouseData: any, companiesData: Option[]) => {
    let companyId = warehouseData.company_id;
    
    // Якщо company_id не існує, спробуємо знайти по назві
    if (!companyId && warehouseData.company_name) {
      const matchedCompany = companiesData.find((c: Option) => c.label === warehouseData.company_name);
      companyId = matchedCompany?.value;
    }
    
    return {
      ...warehouseData,
      company_id: companyId
    };
  };

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // Завантажуємо компанії та склад паралельно
        const [warehouseRes, companiesRes] = await Promise.all([
          axios.get(`warehouses/${id}/`),
          axios.get("companies/")
        ]);

        const warehouseData = warehouseRes.data;
        const companiesData = companiesRes.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        }));

        const formData = formatWarehouseData(warehouseData, companiesData);

        setWarehouse(warehouseData);
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
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
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
    };

    axios
      .patch(`warehouses/${id}/`, requestBody)
      .then((res) => {
        const updatedWarehouseData = res.data;
        
        // Правильно форматуємо оновлені дані
        const formData = formatWarehouseData(updatedWarehouseData, companies);
        
        setWarehouse(updatedWarehouseData);
        setForm(formData);
        setChanged(false);
        setIsEditing(false);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      })
      .catch((err) => {
        console.error("PATCH error:", err.response?.data);
        toast.error("Помилка при збереженні ❌");
      });
  };

  const handleDelete = () => {
    axios
      .delete(`warehouses/${id}/`)
      .then(() => {
        toast.success("Склад видалено 🗑️");
        navigate("/warehouses");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  if (loading || !warehouse) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Склад ${warehouse.name} | НашСофт`} description="Деталі складу" />
      <PageBreadcrumb
        crumbs={[
          { label: "Склади", href: "/warehouses" },
          { label: ` ${warehouse.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі складу
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/warehouses")}>
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
            label="Назва складу"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
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
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити склад?"
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
            message="Склад оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}