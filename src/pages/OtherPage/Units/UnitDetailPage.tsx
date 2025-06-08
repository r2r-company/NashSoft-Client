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

type Unit = {
  id: number;
  name: string;
  symbol: string;
};

export default function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState<Partial<Unit>>({});
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
        const unitRes = await axios.get(`units/${id}/`);
        const unitData = unitRes.data;

        setUnit(unitData);
        setForm(unitData);
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
      symbol: form.symbol,
    };

    axios
      .put(`units/${id}/`, requestBody)
      .then((res) => {
        const updatedUnitData = res.data;
        
        setUnit(updatedUnitData);
        setForm(updatedUnitData);
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
      .delete(`units/${id}/`)
      .then(() => {
        toast.success("Одиницю видалено 🗑️");
        navigate("/units");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  if (loading || !unit) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Одиниця ${unit.name} | НашСофт`} description="Деталі одиниці вимірювання" />
      <PageBreadcrumb
        crumbs={[
          { label: "Одиниці вимірювання", href: "/units" },
          { label: ` ${unit.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі одиниці вимірювання
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/units")}>
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
            label="Назва одиниці"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Наприклад: кілограм"
          />

          <Input
            label="Символ"
            name="symbol"
            value={form.symbol || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Наприклад: кг"
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити одиницю?"
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
            message="Одиницю оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}