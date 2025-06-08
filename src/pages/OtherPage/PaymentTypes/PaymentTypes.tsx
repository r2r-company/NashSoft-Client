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

type PaymentType = {
  id: number;
  name: string;
};

type PaymentTypeForm = {
  name: string;
};

export default function PaymentTypes() {
  const [data, setData] = useState<PaymentType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<Partial<PaymentTypeForm>>({ 
    name: "" 
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("payment-types/").then((res) => setData(res.data));
  }, []);

  const handleAddPaymentType = () => {
    // API для створення поки не реалізовано
    toast.error("API для створення типу оплати поки не реалізовано ❌");
    
    // Коли API буде готове, розкоментувати:
    /*
    const requestBody = {
      name: newPaymentType.name
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("payment-types/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Тип оплати додано ✅");
        setShowAddModal(false);
        setNewPaymentType({ name: "" });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
    */
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPaymentType({ 
      ...newPaymentType, 
      [name]: value 
    });
  };

  return (
    <>
      <PageMeta title="Типи оплат | НашСофт" description="Довідник типів оплат" />
      <PageBreadcrumb pageTitle="Типи оплат" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список типів оплат
        </h1>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setShowAddModal(true)}
        >
          <span className="flex items-center gap-2">Додати тип оплати</span>
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
                  Назва типу оплати
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((paymentType, index) => (
                <tr
                  key={paymentType.id}
                  onClick={() => navigate(`/payment-types/${paymentType.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {paymentType.name}
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Новий тип оплати"
        description=""
        onConfirm={handleAddPaymentType}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва типу оплати" 
            name="name" 
            value={newPaymentType.name || ""} 
            onChange={handleInputChange} 
          />
        </div>
      </ConfirmModal>
    </>
  );
}