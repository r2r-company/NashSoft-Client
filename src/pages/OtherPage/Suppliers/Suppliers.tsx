import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/api";
import toast from "react-hot-toast";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import ConfirmModal from "../../../components/ui/modal/ConfirmModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "../../../components/ui/table";

type Supplier = {
  id: number;
  name: string;
  tax_id: string;
};

type SupplierForm = {
  name: string;
  tax_id: string;
};

export default function Suppliers() {
  const [data, setData] = useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<SupplierForm>>({ 
    name: "", 
    tax_id: "" 
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("suppliers/").then((res) => setData(res.data));
  }, []);

  const handleAddSupplier = () => {
    const requestBody = {
      name: newSupplier.name,
      tax_id: newSupplier.tax_id
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("suppliers/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Постачальника додано ✅");
        setShowAddModal(false);
        setNewSupplier({ name: "", tax_id: "" });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSupplier({ 
      ...newSupplier, 
      [name]: value 
    });
  };

  return (
    <>
      <PageMeta title="Постачальники | НашСофт" description="Довідник постачальників" />
      <PageBreadcrumb pageTitle="Постачальники" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список постачальників
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати постачальника</span>
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
                  Назва постачальника
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Податковий номер
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((supplier, index) => (
                <tr
                  key={supplier.id}
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {supplier.tax_id}
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
        title="Новий постачальник"
        description=""
        onConfirm={handleAddSupplier}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва постачальника" 
            name="name" 
            value={newSupplier.name || ""} 
            onChange={handleInputChange}
            placeholder="Наприклад: ТОВ Постачальник Плюс"
          />
          <Input 
            label="Податковий номер" 
            name="tax_id" 
            value={newSupplier.tax_id || ""} 
            onChange={handleInputChange}
            placeholder="Наприклад: 1234567890"
          />
        </div>
      </ConfirmModal>
    </>
  );
}