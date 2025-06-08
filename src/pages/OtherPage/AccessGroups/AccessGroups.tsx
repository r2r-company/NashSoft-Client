import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/form/Select";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

type AccessGroup = {
  id: number;
  code: string;
  name: string;
  access_group: number;
  access_group_name: string;
  permissions_count: number;
};

type AccessGroupForm = {
  code: string;
  name: string;
  access_group: number;
};

type AccessGroupOption = {
  id: number;
  name: string;
};

export default function AccessGroups() {
  const [data, setData] = useState<AccessGroup[]>([]);
  const [accessGroupOptions, setAccessGroupOptions] = useState<AccessGroupOption[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccessGroup, setNewAccessGroup] = useState<Partial<AccessGroupForm>>({ 
    code: "",
    name: "", 
    access_group: undefined
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("access-groups/").then((res) => setData(res.data));
    // Завантажуємо довідники для форми (припускаємо що є API для груп доступу)
    loadAccessGroupOptions();
  }, []);

  const loadAccessGroupOptions = () => {
    // Припускаємо що є окремий API для вибору груп доступу
    // axios.get("access-group-options/").then((res) => setAccessGroupOptions(res.data));
    
    // Поки що створюємо заглушку
    setAccessGroupOptions([
      { id: 1, name: "Адміністратори" },
      { id: 2, name: "Касири" },
      { id: 3, name: "Менеджери" },
      { id: 4, name: "Старші касири" }
    ]);
  };

  const handleAddAccessGroup = () => {
    // API для створення поки не реалізовано
    toast.error("API для створення групи доступу поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    if (!newAccessGroup.code || !newAccessGroup.name || !newAccessGroup.access_group) {
      toast.error("Заповніть усі поля ❗");
      return;
    }

    const requestBody = {
      code: newAccessGroup.code,
      name: newAccessGroup.name,
      access_group: newAccessGroup.access_group
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("access-groups/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Групу доступу додано ✅");
        setShowAddModal(false);
        setNewAccessGroup({ code: "", name: "", access_group: undefined });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
    */
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAccessGroup({ 
      ...newAccessGroup, 
      [name]: value 
    });
  };

  const handleAccessGroupSelectChange = (value: string) => {
    setNewAccessGroup({ ...newAccessGroup, access_group: parseInt(value) });
  };

  return (
    <>
      <PageMeta title="Групи доступу | НашСофт" description="Довідник груп доступу" />
      <PageBreadcrumb pageTitle="Групи доступу" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список груп доступу
        </h1>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setShowAddModal(true)}
        >
          <span className="flex items-center gap-2">Додати групу доступу</span>
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
                  Код
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Назва
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Група доступу
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Кількість дозволів
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((accessGroup, index) => (
                <tr
                  key={accessGroup.id}
                  onClick={() => navigate(`/access-groups/${accessGroup.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {accessGroup.code}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="font-medium">{accessGroup.name}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {accessGroup.access_group_name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      {accessGroup.permissions_count} дозволів
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
        title="Нова група доступу"
        description=""
        onConfirm={handleAddAccessGroup}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Код групи" 
            name="code" 
            value={newAccessGroup.code || ""} 
            onChange={handleInputChange}
            placeholder="наприклад: manager"
          />
          <Input 
            label="Назва групи" 
            name="name" 
            value={newAccessGroup.name || ""} 
            onChange={handleInputChange}
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
              placeholder="Оберіть групу доступу"
              onChange={handleAccessGroupSelectChange}
              defaultValue=""
            />
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}