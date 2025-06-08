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

type ProductGroup = {
  id: number;
  name: string;
  parent: number | null;
  children: ProductGroup[];
};

type ProductGroupFlat = {
  id: number;
  name: string;
  parent_name: string | null;
};

export default function ProductGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState<ProductGroup | null>(null);
  const [form, setForm] = useState<Partial<ProductGroup>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<ProductGroupFlat[]>([]);
  const [loading, setLoading] = useState(true);

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupRes, groupsRes] = await Promise.all([
          axios.get(`product-groups/${id}/`),
          axios.get("product-groups/flat/")
        ]);

        const groupData = groupRes.data;
        
        setGroup(groupData);
        setForm(groupData);
        setAvailableGroups(groupsRes.data);
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

  const handleParentChange = (value: string) => {
    setForm({ ...form, parent: value ? parseInt(value) : null });
    setChanged(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Введіть назву групи ❗");
      return;
    }

    // Перевіряємо, чи не намагаємось зробити групу батьком самої себе або своєї дочірньої групи
    if (form.parent === group?.id) {
      toast.error("Група не може бути батьком самої себе ❗");
      return;
    }

    const requestBody = {
      name: form.name,
      parent: form.parent,
    };

    axios
      .put(`product-groups/${id}/`, requestBody)
      .then((res) => {
        const updatedGroupData = res.data;
        
        setGroup(updatedGroupData);
        setForm(updatedGroupData);
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
    if (group?.children && group.children.length > 0) {
      toast.error("Неможливо видалити групу з підгрупами ❗");
      return;
    }

    axios
      .delete(`product-groups/${id}/`)
      .then(() => {
        toast.success("Групу видалено 🗑️");
        navigate("/product-groups");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };

  // Фільтруємо доступні групи (виключаємо поточну групу та її дочірні групи)
  const getAvailableParentGroups = () => {
    return availableGroups
      .filter(g => g.id !== group?.id) // Виключаємо саму групу
      .map(g => ({
        value: g.id.toString(),
        label: g.parent_name ? `${g.parent_name} → ${g.name}` : g.name
      }));
  };

  const getParentGroupName = () => {
    if (!group?.parent) return "—";
    const parentGroup = availableGroups.find(g => g.id === group.parent);
    return parentGroup?.name || "—";
  };

  // Рекурсивний рендер дочірніх груп
  const renderChildren = (children: ProductGroup[], level: number = 0) => {
    if (!children || children.length === 0) return null;

    return (
      <div className="ml-4">
        {children.map((child) => (
          <div key={child.id} className="py-1">
            <div 
              className="flex items-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => navigate(`/product-groups/${child.id}`)}
            >
              <span className="mr-2 text-gray-400">└─</span>
              <span>{child.name}</span>
              {child.children.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">({child.children.length})</span>
              )}
            </div>
            {renderChildren(child.children, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (loading || !group) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Група ${group.name} | НашСофт`} description="Деталі групи продуктів" />
      <PageBreadcrumb
        crumbs={[
          { label: "Групи продуктів", href: "/product-groups" },
          { label: ` ${group.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі групи продуктів
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/product-groups")}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Основна інформація */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Основна інформація
          </h2>
          <div className="space-y-4">
            <Input
              label="Назва групи"
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                Батьківська група
              </label>
              {isEditing ? (
                <Select
                  options={[
                    { value: "", label: "Без батьківської групи" },
                    ...getAvailableParentGroups()
                  ]}
                  defaultValue={form.parent?.toString() || ""}
                  key={`parent-${form.parent}-${isEditing}`}
                  onChange={handleParentChange}
                  placeholder="Оберіть батьківську групу"
                />
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
                  {getParentGroupName()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Дочірні групи */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Підгрупи ({group.children.length})
          </h2>
          {group.children.length > 0 ? (
            <div className="space-y-2">
              {renderChildren(group.children)}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              У цієї групи немає підгруп
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити групу продуктів?"
        description={
          group.children.length > 0 
            ? "Неможливо видалити групу, яка містить підгрупи. Спочатку видаліть або перенесіть всі підгрупи."
            : "Цю дію не можна скасувати."
        }
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
            message="Групу продуктів оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}