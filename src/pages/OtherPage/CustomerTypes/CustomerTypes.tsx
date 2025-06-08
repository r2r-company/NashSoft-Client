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

type CustomerType = {
  id: number;
  name: string;
};

type CustomerTypeForm = {
  name: string;
};

export default function CustomerTypes() {
  const [data, setData] = useState<CustomerType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<CustomerTypeForm>({ name: "" });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("customer-types/").then((res) => setData(res.data));
  }, []);

  const handleAdd = () => {
    axios
      .post("customer-types/", newType)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Тип додано ✅");
        setShowAddModal(false);
        setNewType({ name: "" });
      })
      .catch(() => toast.error("Помилка при додаванні ❌"));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewType({ name: e.target.value });
  };

  return (
    <>
      <PageMeta title="Типи клієнтів | НашСофт" description="Довідник типів клієнтів" />
      <PageBreadcrumb pageTitle="Типи клієнтів" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список типів клієнтів
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати тип</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-transparent">
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">#</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white">Назва</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/customer-types/${item.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">{item.name}</TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Новий тип клієнта"
        onConfirm={handleAdd}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input
            label="Назва типу"
            name="name"
            value={newType.name}
            onChange={handleInputChange}
          />
        </div>
      </ConfirmModal>
    </>
  );
}
