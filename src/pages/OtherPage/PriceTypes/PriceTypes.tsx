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

type PriceType = {
  id: number;
  name: string;
  description: string;
};

type PriceTypeForm = {
  name: string;
  description: string;
};

export default function PriceTypes() {
  const [data, setData] = useState<PriceType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPriceType, setNewPriceType] = useState<Partial<PriceTypeForm>>({ 
    name: "", 
    description: "" 
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("price-types/").then((res) => setData(res.data));
  }, []);

  const handleAddPriceType = () => {
    // API для створення поки не реалізовано
    toast.error("API для створення типу ціни поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    const requestBody = {
      name: newPriceType.name,
      description: newPriceType.description
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("price-types/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Тип ціни додано ✅");
        setShowAddModal(false);
        setNewPriceType({ name: "", description: "" });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
    */
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPriceType({ 
      ...newPriceType, 
      [name]: value 
    });
  };

  return (
    <>
      <PageMeta title="Типи цін | НашСофт" description="Довідник типів цін" />
      <PageBreadcrumb pageTitle="Типи цін" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список типів цін
        </h1>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setShowAddModal(true)}
        >
          <span className="flex items-center gap-2">Додати тип ціни</span>
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
                  Назва типу ціни
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Опис
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((priceType, index) => (
                <tr
                  key={priceType.id}
                  onClick={() => navigate(`/price-types/${priceType.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="font-medium">{priceType.name}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {priceType.description}
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Типи цін не знайдено
        </div>
      )}

      <ConfirmModal
        isOpen={showAddModal}
        title="Новий тип ціни"
        description=""
        onConfirm={handleAddPriceType}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва типу ціни" 
            name="name" 
            value={newPriceType.name || ""} 
            onChange={handleInputChange}
          />
          <Input 
            label="Опис" 
            name="description" 
            value={newPriceType.description || ""} 
            onChange={handleInputChange}
          />
        </div>
      </ConfirmModal>
    </>
  );
}