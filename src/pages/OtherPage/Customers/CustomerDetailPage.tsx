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

type Customer = {
  id: number;
  name: string;
  type: number;
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  const customerTypeOptions = [
    { value: "1", label: "ФОП" },
    { value: "2", label: "ТОВ" },
    { value: "3", label: "ПП" },
    { value: "4", label: "ТЗОВ" },
  ];

  const getTypeLabel = (type: number) => {
    const option = customerTypeOptions.find(opt => opt.value === type.toString());
    return option?.label || "Невідомо";
  };

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        const customerRes = await axios.get(`customers/${id}/`);
        const customerData = customerRes.data;

        setCustomer(customerData);
        setForm(customerData);
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

  const handleSelectChange = (value: string) => {
    setForm({ ...form, type: parseInt(value) });
    setChanged(true);
  };

  const handleSave = () => {
    if (!form.type) {
      toast.error("Оберіть тип клієнта перед збереженням ❗");
      return;
    }

    const requestBody = {
      name: form.name,
      type: form.type,
    };

    axios
      .put(`customers/${id}/`, requestBody)
      .then((res) => {
        const updatedCustomerData = res.data;
        
        setCustomer(updatedCustomerData);
        setForm(updatedCustomerData);
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
      .delete(`customers/${id}/`)
      .then(() => {
        toast.success("Клієнта видалено 🗑️");
        navigate("/customers");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  if (loading || !customer) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Клієнт ${customer.name} | НашСофт`} description="Деталі клієнта" />
      <PageBreadcrumb
        crumbs={[
          { label: "Клієнти", href: "/customers" },
          { label: ` ${customer.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі клієнта
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/customers")}>
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
            label="Назва клієнта"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="ФОП Іванов І.І."
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип клієнта
            </label>
            <Select
              options={customerTypeOptions}
              defaultValue={form.type?.toString() || ""}
              key={`type-${form.type}-${isEditing}`}
              onChange={handleSelectChange}
              placeholder="Оберіть тип клієнта"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
            {!isEditing && form.type && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Поточний тип: {getTypeLabel(form.type)}
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити клієнта?"
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
            message="Клієнта оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}