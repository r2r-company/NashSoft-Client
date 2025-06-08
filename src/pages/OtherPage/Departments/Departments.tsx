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

type Department = {
  id: number;
  name: string;
  firm_name: string;
  firm_id: number;
};

type DepartmentForm = {
  name: string;
  firm_id: number;
};

type Firm = {
  id: number;
  name: string;
  company: string;
  is_vat: boolean;
  vat_type: string;
};

export default function Departments() {
  const [data, setData] = useState<Department[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState<Partial<DepartmentForm>>({ 
    name: "", 
    firm_id: undefined
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("departments/").then((res) => setData(res.data));
    axios.get("firms/").then((res) => setFirms(res.data));
  }, []);

  const handleAddDepartment = () => {
    if (!newDepartment.firm_id) {
      toast.error("Оберіть фірму перед збереженням ❗");
      return;
    }

    const requestBody = {
      name: newDepartment.name,
      firm_id: newDepartment.firm_id,
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("departments/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Відділ додано ✅");
        setShowAddModal(false);
        setNewDepartment({ name: "", firm_id: undefined });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDepartment({ 
      ...newDepartment, 
      [name]: value 
    });
  };

  const handleFirmSelectChange = (value: string) => {
    setNewDepartment({ ...newDepartment, firm_id: parseInt(value) });
  };

  return (
    <>
      <PageMeta title="Відділи | НашСофт" description="Довідник відділів" />
      <PageBreadcrumb pageTitle="Відділи" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список відділів
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати відділ</span>
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
                  Назва відділу
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Фірма
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((department, index) => (
                <tr
                  key={department.id}
                  onClick={() => navigate(`/departments/${department.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {department.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {department.firm_name}
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Новий відділ"
        description=""
        onConfirm={handleAddDepartment}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва відділу" 
            name="name" 
            value={newDepartment.name || ""} 
            onChange={handleInputChange} 
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Фірма
            </label>
            <Select
              options={firms.map(firm => ({
                value: firm.id.toString(),
                label: firm.name
              }))}
              placeholder="Оберіть фірму"
              onChange={handleFirmSelectChange}
              defaultValue=""
            />
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}