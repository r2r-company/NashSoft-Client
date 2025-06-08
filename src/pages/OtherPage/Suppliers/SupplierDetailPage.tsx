import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "./../../../config/api";

import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";
import Alert from "../../../components/ui/alert/Alert";

type Supplier = {
  id: number;
  name: string;
  tax_id: string;
};

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        const supplierRes = await axios.get(`suppliers/${id}/`);
        const supplierData = supplierRes.data;

        setSupplier(supplierData);
        setForm(supplierData);
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

  const handleSave = () => {
    const requestBody = {
      name: form.name,
      tax_id: form.tax_id,
    };

    axios
      .put(`suppliers/${id}/`, requestBody)
      .then((res) => {
        const updatedSupplierData = res.data;
        
        setSupplier(updatedSupplierData);
        setForm(updatedSupplierData);
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
      .delete(`suppliers/${id}/`)
      .then(() => {
        toast.success("Постачальника видалено 🗑️");
        navigate("/suppliers");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  if (loading || !supplier) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Постачальник ${supplier.name} | НашСофт`} description="Деталі постачальника" />
      <PageBreadcrumb
        crumbs={[
          { label: "Постачальники", href: "/suppliers" },
          { label: ` ${supplier.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі постачальника
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/suppliers")}>
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
            label="Назва постачальника"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Наприклад: ТОВ Постачальник Плюс"
          />

          <Input
            label="Податковий номер"
            name="tax_id"
            value={form.tax_id || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Наприклад: 1234567890"
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити постачальника?"
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
            message="Постачальника оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}