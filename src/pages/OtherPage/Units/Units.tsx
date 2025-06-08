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

type Unit = {
  id: number;
  name: string;
  symbol: string;
};

type UnitForm = {
  name: string;
  symbol: string;
};

export default function Units() {
  const [data, setData] = useState<Unit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnit, setNewUnit] = useState<Partial<UnitForm>>({ 
    name: "", 
    symbol: "" 
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("units/").then((res) => setData(res.data));
  }, []);

  const handleAddUnit = () => {
    const requestBody = {
      name: newUnit.name,
      symbol: newUnit.symbol
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("units/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Одиницю додано ✅");
        setShowAddModal(false);
        setNewUnit({ name: "", symbol: "" });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUnit({ 
      ...newUnit, 
      [name]: value 
    });
  };

  return (
    <>
      <PageMeta title="Одиниці вимірювання | НашСофт" description="Довідник одиниць вимірювання" />
      <PageBreadcrumb pageTitle="Одиниці вимірювання" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список одиниць вимірювання
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати одиницю</span>
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
                  Назва
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Символ
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((unit, index) => (
                <tr
                  key={unit.id}
                  onClick={() => navigate(`/units/${unit.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {unit.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {unit.symbol}
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
        title="Нова одиниця вимірювання"
        description=""
        onConfirm={handleAddUnit}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва одиниці" 
            name="name" 
            value={newUnit.name || ""} 
            onChange={handleInputChange}
            placeholder="Наприклад: кілограм"
          />
          <Input 
            label="Символ" 
            name="symbol" 
            value={newUnit.symbol || ""} 
            onChange={handleInputChange}
            placeholder="Наприклад: кг"
          />
        </div>
      </ConfirmModal>
    </>
  );
}