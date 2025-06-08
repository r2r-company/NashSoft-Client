import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

type SystemUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  roles: string[];
  is_active: boolean;
};

type SystemUserForm = {
  user: number;
  company: number;
  interfaces: number[];
  is_active: boolean;
};

type Company = {
  id: number;
  name: string;
};

export default function SystemUsers() {
  const [data, setData] = useState<SystemUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSystemUser, setNewSystemUser] = useState<Partial<SystemUserForm>>({ 
    user: undefined,
    company: undefined,
    interfaces: [],
    is_active: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("system-users/").then((res) => setData(res.data));
    // Завантажуємо довідники для форми
    loadDictionaries();
  }, []);

  const loadDictionaries = () => {
    axios.get("companies/").then((res) => {
      setCompanies(res.data);
    }).catch(() => {
      // Якщо немає API користувачів, працюємо без них
    });
  };

  const handleAddSystemUser = () => {
    // API для створення поки не реалізовано
    toast.error("API для створення системного користувача поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    if (!newSystemUser.user || !newSystemUser.company) {
      toast.error("Оберіть користувача та компанію ❗");
      return;
    }

    const requestBody = {
      user: newSystemUser.user,
      company: newSystemUser.company,
      interfaces: newSystemUser.interfaces || [],
      is_active: newSystemUser.is_active
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("system-users/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Системного користувача додано ✅");
        setShowAddModal(false);
        setNewSystemUser({ user: undefined, company: undefined, interfaces: [], is_active: true });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
    */
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewSystemUser({ 
      ...newSystemUser, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleUserSelectChange = (value: string) => {
    setNewSystemUser({ ...newSystemUser, user: parseInt(value) });
  };

  const handleCompanySelectChange = (value: string) => {
    setNewSystemUser({ ...newSystemUser, company: parseInt(value) });
  };

  const getFullName = (user: SystemUser) => {
    return `${user.first_name} ${user.last_name}`.trim() || user.username;
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

  return (
    <>
      <PageMeta title="Системні користувачі | НашСофт" description="Довідник системних користувачів" />
      <PageBreadcrumb pageTitle="Системні користувачі" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список системних користувачів
        </h1>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setShowAddModal(true)}
          disabled={true}
        >
          <span className="flex items-center gap-2">Додати користувача</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-transparent">
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Ім'я користувача
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Компанія
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Ролі
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Статус
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((systemUser, index) => (
                <tr
                  key={systemUser.id}
                  onClick={() => navigate(`/system-users/${systemUser.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <div>
                      <div className="font-medium">{getFullName(systemUser)}</div>
                      <div className="text-sm text-gray-500">@{systemUser.username}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {systemUser.email}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {systemUser.company}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <div className="flex flex-wrap gap-1">
                      {getRolesBadges(systemUser.roles)}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      systemUser.is_active 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {systemUser.is_active ? "Активний" : "Неактивний"}
                    </span>
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Новий системний користувач"
        description=""
        onConfirm={handleAddSystemUser}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Користувач
            </label>
            <Select
              options={[]} // Поки що пустий масив, оскільки немає API користувачів
              placeholder="Оберіть користувача"
              onChange={handleUserSelectChange}
              defaultValue=""
              className="pointer-events-none opacity-60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Компанія
            </label>
            <Select
              options={companies.map(company => ({
                value: company.id.toString(),
                label: company.name
              }))}
              placeholder="Оберіть компанію"
              onChange={handleCompanySelectChange}
              defaultValue=""
              className="pointer-events-none opacity-60"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={newSystemUser.is_active || false}
              onChange={handleInputChange}
              disabled={true}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-60"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-white">
              Активний користувач
            </label>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}