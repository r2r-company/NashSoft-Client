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

type AccessGroup = {
  id: number;
  code: string;
  name: string;
  access_group: number;
  access_group_name: string;
  permissions_count: number;
};

type AccessGroupOption = {
  id: number;
  name: string;
};

export default function AccessGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [accessGroup, setAccessGroup] = useState<AccessGroup | null>(null);
  const [form, setForm] = useState<Partial<AccessGroup>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert] = useState(false);
  const [accessGroupOptions, setAccessGroupOptions] = useState<AccessGroupOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // API для отримання конкретної групи доступу поки не реалізовано
        // Спробуємо отримати зі списку
        const response = await axios.get("access-groups/");
        const accessGroups = response.data;
        const foundAccessGroup = accessGroups.find((ag: AccessGroup) => ag.id === parseInt(id || "0"));
        
        if (foundAccessGroup) {
          setAccessGroup(foundAccessGroup);
          setForm(foundAccessGroup);
        } else {
          toast.error("Групу доступу не знайдено");
          navigate("/access-groups");
        }

        // Завантажуємо опції груп доступу
        loadAccessGroupOptions();
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

  const loadAccessGroupOptions = () => {
    // Поки що створюємо заглушку
    setAccessGroupOptions([
      { id: 1, name: "Адміністратори" },
      { id: 2, name: "Касири" },
      { id: 3, name: "Менеджери" },
      { id: 4, name: "Старші касири" }
    ]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    setChanged(true);
  };

  const handleAccessGroupSelectChange = (value: string) => {
    setForm({ ...form, access_group: parseInt(value) });
    setChanged(true);
  };

  const handleSave = () => {
    // API для редагування поки не реалізовано
    toast.error("API для редагування групи доступу поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    if (!form.code || !form.name || !form.access_group) {
      toast.error("Заповніть усі поля ❗");
      return;
    }

    const requestBody = {
      code: form.code,
      name: form.name,
      access_group: form.access_group,
    };

    axios
      .put(`access-groups/${id}/`, requestBody)
      .then((res) => {
        const updatedAccessGroupData = res.data;
        
        setAccessGroup(updatedAccessGroupData);
        setForm(updatedAccessGroupData);
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
    toast.error("API для видалення групи доступу поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    axios
      .delete(`access-groups/${id}/`)
      .then(() => {
        toast.success("Групу доступу видалено 🗑️");
        navigate("/access-groups");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
    */
  };

  if (loading || !accessGroup) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Група доступу ${accessGroup.name} | НашСофт`} description="Деталі групи доступу" />
      <PageBreadcrumb
        crumbs={[
          { label: "Групи доступу", href: "/access-groups" },
          { label: ` ${accessGroup.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі групи доступу
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/access-groups")}>
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
            label="Код групи"
            name="code"
            value={form.code || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="наприклад: manager"
          />

          <Input
            label="Назва групи"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="наприклад: Менеджер"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Група доступу
            </label>
            <Select
              options={accessGroupOptions.map(option => ({
                value: option.id.toString(),
                label: option.name
              }))}
              defaultValue={form.access_group?.toString() || ""}
              key={`access-group-${form.access_group}-${isEditing}`}
              onChange={handleAccessGroupSelectChange}
              placeholder="Оберіть групу доступу"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>

          {/* Інформація про дозволи */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Інформація про дозволи
            </label>
            <div className="flex items-center gap-2">
              <span className="inline-flex px-3 py-2 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                {accessGroup.permissions_count} дозволів
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Кількість дозволів визначається автоматично на основі налаштувань групи
            </div>
          </div>
        </div>
      </div>

      {/* Інформаційний блок про обмеження API */}
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Обмежена функціональність
            </h3>
            <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              <p>
                Доступний тільки перегляд даних. API для створення, редагування та видалення груп доступу поки не реалізовано.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити групу доступу?"
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
            message="Групу доступу оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}