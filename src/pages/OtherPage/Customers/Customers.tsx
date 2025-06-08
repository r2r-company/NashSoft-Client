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

type Customer = {
  id: number;
  name: string;
  type: number;
};

type CustomerForm = {
  name: string;
  type: number;
};

export default function Customers() {
  const [data, setData] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<CustomerForm>>({ 
    name: "", 
    type: undefined
  });
  const navigate = useNavigate();

  const customerTypeOptions = [
    { value: "1", label: "ФОП" },
    { value: "2", label: "ТОВ" },
    { value: "3", label: "ПП" },
    { value: "4", label: "ТЗОВ" },
  ];

  const getTypeLabel = (type: number) => {
    const option = customerTypeOptions.find(opt => opt.value === type.toString());
    return option?.label || "Невідомо";
  };

  useEffect(() => {
    axios.get("customers/").then((res) => setData(res.data));
  }, []);

  const handleAddCustomer = () => {
    const requestBody = {
      name: newCustomer.name,
      type: newCustomer.type
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("customers/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Клієнта додано ✅");
        setShowAddModal(false);
        setNewCustomer({ name: "", type: undefined });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomer({ 
      ...newCustomer, 
      [name]: value 
    });
  };

  const handleSelectChange = (value: string) => {
    setNewCustomer({ ...newCustomer, type: parseInt(value) });
  };

  return (
    <>
      <PageMeta title="Клієнти | НашСофт" description="Довідник клієнтів" />
      <PageBreadcrumb pageTitle="Клієнти" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список клієнтів
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати клієнта</span>
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
                  Назва клієнта
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Тип
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((customer, index) => (
                <tr
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {customer.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {getTypeLabel(customer.type)}
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
        title="Новий клієнт"
        description=""
        onConfirm={handleAddCustomer}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва клієнта" 
            name="name" 
            value={newCustomer.name || ""} 
            onChange={handleInputChange}
            placeholder="ФОП Іванов І.І."
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип клієнта
            </label>
            <Select
              options={customerTypeOptions}
              placeholder="Оберіть тип клієнта"
              onChange={handleSelectChange}
              defaultValue=""
            />
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}