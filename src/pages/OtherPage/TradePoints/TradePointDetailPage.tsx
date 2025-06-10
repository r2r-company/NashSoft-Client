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

type TradePoint = {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  firm: string;
  firm_id: number;
  is_active: boolean;
  point_type: string;
};

type Option = {
  value: number;
  label: string;
};

export default function TradePointDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tradePoint, setTradePoint] = useState<TradePoint | null>(null);
  const [form, setForm] = useState<Partial<TradePoint>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [firms, setFirms] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  const pointTypeOptions = [
    { value: "магазин", label: "Магазин" },
    { value: "склад", label: "Склад" },
    { value: "офіс", label: "Офіс" },
    { value: "кіоск", label: "Кіоск" },
    { value: "інше", label: "Інше" },
  ];

  // Функція для правильного форматування даних форми
  const formatTradePointData = (pointData: any, firmsData: Option[]) => {
    let firmId = pointData.firm_id;
    
    // Якщо firm_id не існує, спробуємо знайти по назві
    if (!firmId && pointData.firm) {
      const matchedFirm = firmsData.find((f: Option) => f.label.includes(pointData.firm));
      firmId = matchedFirm?.value;
    }
    
    return {
      ...pointData,
      firm_id: firmId,
      point_type: pointData.point_type || "",
      is_active: pointData.is_active || false,
      phone: pointData.phone || "",
      email: pointData.email || ""
    };
  };

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // Завантажуємо фірми та торгову точку паралельно
        const [pointRes, firmsRes] = await Promise.all([
          axios.get(`trade-points/${id}/`),
          axios.get("firms/")
        ]);

        const pointData = pointRes.data;
        const firmsData = firmsRes.data.map((f: any) => ({
          value: f.id,
          label: `${f.name} (${f.company})`,
        }));

        const formData = formatTradePointData(pointData, firmsData);

        setTradePoint(pointData);
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
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    setChanged(true);
  };

  const handleSelectChange = (value: string) => {
    setForm({ ...form, point_type: value });
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

    if (!form.name || !form.address || !form.point_type) {
      toast.error("Заповніть усі обов'язкові поля ❗");
      return;
    }

    const requestBody = {
      name: form.name,
      address: form.address,
      phone: form.phone || "",
      email: form.email || "",
      firm_id: form.firm_id,
      point_type: form.point_type,
      is_active: form.is_active,
    };

    axios
      .put(`trade-points/${id}/`, requestBody)
      .then((res) => {
        const updatedPointData = res.data;
        
        // Правильно форматуємо оновлені дані
        const formData = formatTradePointData(updatedPointData, firms);
        
        setTradePoint(updatedPointData);
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
      .delete(`trade-points/${id}/`)
      .then(() => {
        toast.success("Торгову точку видалено 🗑️");
        navigate("/trade-points");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  if (loading || !tradePoint) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Торгова точка ${tradePoint.name} | НашСофт`} description="Деталі торгової точки" />
      <PageBreadcrumb
        crumbs={[
          { label: "Торгові точки", href: "/trade-points" },
          { label: ` ${tradePoint.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі торгової точки
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/trade-points")}>
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
            label="Назва торгової точки"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <Input
            label="Адреса"
            name="address"
            value={form.address || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <Input
            label="Телефон"
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="+380..."
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="example@company.com"
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип торгової точки
            </label>
            <Select
              options={pointTypeOptions}
              placeholder="Оберіть тип"
              onChange={handleSelectChange}
              defaultValue={form.point_type || ""}
              key={`type-${form.point_type}-${isEditing}`}
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
              Активна торгова точка
            </label>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити торгову точку?"
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
            message="Торгову точку оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}