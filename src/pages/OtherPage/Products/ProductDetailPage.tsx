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

type Product = {
  id: number;
  name: string;
  unit: number;
  group_id: number;
  group_name: string;
  price: number | null;
};

type ProductGroup = {
  id: number;
  name: string;
};

type Unit = {
  id: number;
  name: string;
  short_name: string;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productRes, groupsRes, unitsRes] = await Promise.all([
          axios.get(`products/${id}/`),
          axios.get("product-groups/"),
          axios.get("units/")
        ]);

        const productData = productRes.data;
        
        setProduct(productData);
        setForm(productData);
        setGroups(groupsRes.data);
        setUnits(unitsRes.data);
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

  const handleGroupChange = (value: string) => {
    setForm({ ...form, group_id: parseInt(value) });
    setChanged(true);
  };

  const handleUnitChange = (value: string) => {
    setForm({ ...form, unit: parseInt(value) });
    setChanged(true);
  };

  const handleSave = () => {
    if (!form.group_id || !form.unit) {
      toast.error("Оберіть групу та одиницю виміру ❗");
      return;
    }

    const requestBody = {
      name: form.name,
      unit: form.unit,
      group: form.group_id,
    };

    axios
      .put(`products/${id}/`, requestBody)
      .then((res) => {
        const updatedProductData = res.data;
        
        setProduct(updatedProductData);
        setForm(updatedProductData);
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
      .delete(`products/${id}/`)
      .then(() => {
        toast.success("Продукт видалено 🗑️");
        navigate("/products");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
  };


  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    return `${price.toFixed(2)} ₴`;
  };

  if (loading || !product) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Продукт ${product.name} | НашСофт`} description="Деталі продукту" />
      <PageBreadcrumb
        crumbs={[
          { label: "Продукти", href: "/products" },
          { label: ` ${product.name}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі продукту
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/products")}>
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
            label="Назва продукту"
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Група продуктів
            </label>
            <Select
              options={groups.map(group => ({
                value: group.id.toString(),
                label: group.name
              }))}
              defaultValue={form.group_id?.toString() || ""}
              key={`group-${form.group_id}-${isEditing}`}
              onChange={handleGroupChange}
              placeholder="Оберіть групу"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Одиниця виміру
            </label>
            <Select
              options={units.map(unit => ({
                value: unit.id.toString(),
                label: `${unit.name} (${unit.short_name})`
              }))}
              defaultValue={form.unit?.toString() || ""}
              key={`unit-${form.unit}-${isEditing}`}
              onChange={handleUnitChange}
              placeholder="Оберіть одиницю"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Поточна ціна
            </label>
            <div className={`text-lg font-semibold ${
              product.price !== null 
                ? "text-green-600 dark:text-green-400" 
                : "text-gray-400"
            }`}>
              {formatPrice(product.price)}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ціна оновлюється автоматично
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити продукт?"
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
            message="Продукт оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}