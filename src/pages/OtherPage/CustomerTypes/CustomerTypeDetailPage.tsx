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

type CustomerType = {
  id: number;
  name: string;
};

export default function CustomerTypeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<CustomerType | null>(null);
  const [form, setForm] = useState<Partial<CustomerType>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [changed, setChanged] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    axios.get(`customer-types/${id}/`).then((res) => {
      setData(res.data);
      setForm(res.data);
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ name: e.target.value });
    setChanged(true);
  };

  const handleSave = () => {
    axios
      .put(`customer-types/${id}/`, form)
      .then((res) => {
        setData(res.data);
        setForm(res.data);
        setChanged(false);
        setIsEditing(false);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      })
      .catch(() => toast.error("Помилка при збереженні ❌"));
  };

  const handleDelete = () => {
    axios
      .delete(`customer-types/${id}/`)
      .then(() => {
        toast.success("Тип клієнта видалено 🗑️");
        navigate("/customer-types");
      })
      .catch(() => toast.error("Помилка при видаленні ❌"));
  };

  if (!data) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Тип ${data.name} | НашСофт`} description="Деталі типу клієнта" />
      <PageBreadcrumb
        crumbs={[
          { label: "Типи клієнтів", href: "/customer-types" },
          { label: ` ${data.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі типу
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/customer-types")}>Назад</Button>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Редагувати</Button>
          )}
          {changed && (
            <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)}>Зберегти зміни</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)}>Видалити</Button>
        </div>
      </div>

      <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="grid gap-6 sm:max-w-md">
          <Input
            label="Назва типу"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити тип?"
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
            message="Тип клієнта оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}
