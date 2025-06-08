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

type Department = {
  id: number;
  name: string;
  firm_name: string;
  firm_id: number;
};

type Option = {
  value: number;
  label: string;
};

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<Department | null>(null);
  const [form, setForm] = useState<Partial<Department>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [firms, setFirms] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  // Функція для правильного форматування даних форми
  const formatDepartmentData = (departmentData: any, firmsData: Option[]) => {
    let firmId = departmentData.firm_id;
    
    // Якщо firm_id не існує, спробуємо знайти по назві
    if (!firmId && departmentData.firm_name) {
      const matchedFirm = firmsData.find((f: Option) => f.label === departmentData.firm_name);
      firmId = matchedFirm?.value;
    }
    
    return {
      ...departmentData,
      firm_id: firmId
    };
  };

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // Завантажуємо фірми та відділ паралельно
        const [departmentRes, firmsRes] = await Promise.all([
          axios.get(`departments/${id}/`),
          axios.get("firms/")
        ]);

        const departmentData = departmentRes.data;
        const firmsData = firmsRes.data.map((f: any) => ({
          value: f.id,
          label: f.name,
        }));

        const formData = formatDepartmentData(departmentData, firmsData);

        setDepartment(departmentData);
        setForm(formData);
        setFirms(firmsData);
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

  const handleFirmChange = (value: string) => {
    // Конвертуємо string в number, оскільки Select передає string
    setForm({ ...form, firm_id: parseInt(value) });
    setChanged(true);
  };

  const handleSave = () => {
    if (!form.firm_id) {
      toast.error("Оберіть фірму перед збереженням ❗");
      return;
    }

    const requestBody = {
      name: form.name,
      firm_id: form.firm_id,
    };

    axios
      .patch(`departments/${id}/`, requestBody)
      .then((res) => {
        const updatedDepartmentData = res.data;
        
        // Правильно форматуємо оновлені дані
        const formData = formatDepartmentData(updatedDepartmentData, firms);
        
        setDepartment(updatedDepartmentData);
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
      .delete(`departments/${id}/`)
      .then(() => {
        toast.success("Відділ видалено 🗑️");
        navigate("/departments");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  if (loading || !department) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Відділ ${department.name} | НашСофт`} description="Деталі відділу" />
      <PageBreadcrumb
        crumbs={[
          { label: "Відділи", href: "/departments" },
          { label: ` ${department.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі відділу
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/departments")}>
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
            label="Назва відділу"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Фірма
            </label>
            <Select
              options={firms.map(firm => ({
                value: firm.value.toString(),
                label: firm.label
              }))}
              defaultValue={form.firm_id?.toString() || ""}
              key={`firm-${form.firm_id}-${isEditing}`}
              onChange={handleFirmChange}
              placeholder="Оберіть фірму"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити відділ?"
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
            message="Відділ оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}