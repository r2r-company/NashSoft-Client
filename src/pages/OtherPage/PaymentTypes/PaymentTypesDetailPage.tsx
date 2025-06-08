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

type PaymentType = {
  id: number;
  name: string;
};

export default function PaymentTypeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
  const [form, setForm] = useState<Partial<PaymentType>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // API для отримання конкретного типу оплати поки не реалізовано
        // Спробуємо отримати зі списку
        const response = await axios.get("payment-types/");
        const paymentTypes = response.data;
        const foundPaymentType = paymentTypes.find((pt: PaymentType) => pt.id === parseInt(id || "0"));
        
        if (foundPaymentType) {
          setPaymentType(foundPaymentType);
          setForm(foundPaymentType);
        } else {
          toast.error("Тип оплати не знайдено");
          navigate("/payment-types");
        }
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
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    setChanged(true);
  };

  const handleSave = () => {
    // API для редагування поки не реалізовано
    toast.error("API для редагування типу оплати поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    const requestBody = {
      name: form.name,
    };

    axios
      .put(`payment-types/${id}/`, requestBody)
      .then((res) => {
        const updatedPaymentTypeData = res.data;
        
        setPaymentType(updatedPaymentTypeData);
        setForm(updatedPaymentTypeData);
        setChanged(false);
        setIsEditing(false);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      })
      .catch((err) => {
        console.error("PUT error:", err.response?.data);
        toast.error("Помилка при збереженні ❌");
      });
    */
  };

  const handleDelete = () => {
    // API для видалення поки не реалізовано
    toast.error("API для видалення типу оплати поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    axios
      .delete(`payment-types/${id}/`)
      .then(() => {
        toast.success("Тип оплати видалено 🗑️");
        navigate("/payment-types");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
    */
  };

  if (loading || !paymentType) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Тип оплати ${paymentType.name} | НашСофт`} description="Деталі типу оплати" />
      <PageBreadcrumb
        crumbs={[
          { label: "Типи оплат", href: "/payment-types" },
          { label: ` ${paymentType.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі типу оплати
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/payment-types")}>
            Назад
          </Button>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              Редагувати
            </Button>
          )}
          {changed && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSaveModal(true)}

            >
              Зберегти зміни
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDeleteModal(true)}
          >
            Видалити
          </Button>
        </div>
      </div>

      <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="grid gap-6 sm:max-w-md">
          <Input
            label="Назва типу оплати"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити тип оплати?"
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

      {false && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">
          <Alert
            variant="success"
            title="Успішно збережено"
            message="Тип оплати оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}