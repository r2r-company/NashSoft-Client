import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "./../../../config/api";

import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";
import Alert from "../../../components/ui/alert/Alert";

type SystemUser = {
  id: number;
  user: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  company: number;
  company_name: string;
  interfaces: number[];
  roles: string[];
  is_active: boolean;
};

type Company = {
  id: number;
  name: string;
};

export default function SystemUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [systemUser, setSystemUser] = useState<SystemUser | null>(null);
  const [form, setForm] = useState<Partial<SystemUser>>({});
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAlert] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        // API для отримання конкретного системного користувача поки не реалізовано
        // Спробуємо отримати зі списку
        const [systemUsersRes, companiesRes] = await Promise.all([
          axios.get("system-users/"),
          axios.get("companies/")
        ]);

        const systemUsers = systemUsersRes.data;
        const foundSystemUser = systemUsers.find((su: SystemUser) => su.id === parseInt(id || "0"));
        
        if (foundSystemUser) {
          // Форматуємо дані для роботи з формою
          const formattedUser = {
            ...foundSystemUser,
            company: foundSystemUser.company || foundSystemUser.company_name
          };
          
          setSystemUser(foundSystemUser);
          setForm(formattedUser);
        } else {
          toast.error("Системного користувача не знайдено");
          navigate("/system-users");
        }

        setCompanies(companiesRes.data);
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
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    setChanged(true);
  };


  const handleCompanySelectChange = (value: string) => {
    setForm({ ...form, company: parseInt(value) });
    setChanged(true);
  };

  const handleSave = () => {
    // API для редагування поки не реалізовано
    toast.error("API для редагування системного користувача поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    if (!form.user || !form.company) {
      toast.error("Оберіть користувача та компанію ❗");
      return;
    }

    const requestBody = {
      user: form.user,
      company: form.company,
      interfaces: form.interfaces || [],
      is_active: form.is_active,
    };

    axios
      .put(`system-users/${id}/`, requestBody)
      .then((res) => {
        const updatedSystemUserData = res.data;
        
        setSystemUser(updatedSystemUserData);
        setForm(updatedSystemUserData);
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
    toast.error("API для видалення системного користувача поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    axios
      .delete(`system-users/${id}/`)
      .then(() => {
        toast.success("Системного користувача видалено 🗑️");
        navigate("/system-users");
      })
      .catch(() => {
        toast.error("Помилка при видаленні ❌");
      });
    */
  };

  const getFullName = () => {
    if (!systemUser) return "";
    return `${systemUser.first_name} ${systemUser.last_name}`.trim() || systemUser.username;
  };

  const getRolesBadges = (roles: string[]) => {
    return roles.map((role, index) => (
      <span 
        key={index}
        className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mr-1"
      >
        {role}
      </span>
    ));
  };

  if (loading || !systemUser) return <div>Завантаження...</div>;

  return (
    <>
      <PageMeta title={`Користувач ${getFullName()} | НашСофт`} description="Деталі системного користувача" />
      <PageBreadcrumb
        crumbs={[
          { label: "Системні користувачі", href: "/system-users" },
          { label: ` ${getFullName()}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Деталі системного користувача
        </h1>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/system-users")}>
            Назад
          </Button>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              disabled={true}
            >
              Редагувати
            </Button>
          )}
          {changed && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setShowSaveModal(true)}
              disabled={true}
            >
              Зберегти зміни
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDeleteModal(true)}
            disabled={true}
          >
            Видалити
          </Button>
        </div>
      </div>

      <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="grid gap-6 sm:max-w-md">
          {/* Інформація про користувача */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Інформація про користувача
            </label>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-800 dark:text-white">
                {getFullName()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{systemUser.username}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {systemUser.email}
              </div>
            </div>
          </div>

          {/* Компанія */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Компанія
            </label>
            <Select
              options={companies.map(company => ({
                value: company.id.toString(),
                label: company.name
              }))}
              defaultValue={typeof form.company === 'number' ? form.company.toString() : ""}
              key={`company-${form.company}-${isEditing}`}
              onChange={handleCompanySelectChange}
              placeholder="Оберіть компанію"
              className={!isEditing ? "pointer-events-none opacity-60" : ""}
            />
          </div>

          {/* Ролі */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Ролі користувача
            </label>
            <div className="flex flex-wrap gap-1">
              {getRolesBadges(systemUser.roles)}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ролі визначаються інтерфейсами користувача
            </div>
          </div>

          {/* Статус */}
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
              Активний користувач
            </label>
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
                Доступний тільки перегляд даних. API для створення, редагування та видалення системних користувачів поки не реалізовано.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Видалити системного користувача?"
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
            message="Системного користувача оновлено без помилок"
          />
        </div>
      )}
    </>
  );
}