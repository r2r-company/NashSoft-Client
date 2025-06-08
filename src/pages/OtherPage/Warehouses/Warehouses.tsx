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

type Warehouse = {
  id: number;
  name: string;
  company_name: string;
};

type WarehouseForm = {
  name: string;
  company_id: number;
};

type Company = {
  id: number;
  name: string;
  tax_id: string;
};

export default function Warehouses() {
  const [data, setData] = useState<Warehouse[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState<Partial<WarehouseForm>>({ 
    name: "", 
    company_id: undefined
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("warehouses/").then((res) => setData(res.data));
    axios.get("companies/").then((res) => setCompanies(res.data));
  }, []);

  const handleAddWarehouse = () => {
    if (!newWarehouse.company_id) {
      toast.error("Оберіть компанію перед збереженням ❗");
      return;
    }

    const requestBody = {
      name: newWarehouse.name,
      company_id: newWarehouse.company_id,
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("warehouses/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Склад додано ✅");
        setShowAddModal(false);
        setNewWarehouse({ name: "", company_id: undefined });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewWarehouse({ 
      ...newWarehouse, 
      [name]: value 
    });
  };

  const handleCompanySelectChange = (value: string) => {
    setNewWarehouse({ ...newWarehouse, company_id: parseInt(value) });
  };

  return (
    <>
      <PageMeta title="Склади | НашСофт" description="Довідник складів" />
      <PageBreadcrumb pageTitle="Склади" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список складів
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати склад</span>
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
                  Назва складу
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Компанія
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((warehouse, index) => (
                <tr
                  key={warehouse.id}
                  onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {warehouse.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {warehouse.company_name}
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Новий склад"
        description=""
        onConfirm={handleAddWarehouse}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва складу" 
            name="name" 
            value={newWarehouse.name || ""} 
            onChange={handleInputChange} 
          />
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
            />
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}