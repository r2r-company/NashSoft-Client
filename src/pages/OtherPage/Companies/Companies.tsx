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

type Company = {
  id: number;
  name: string;
  tax_id: string;
};

export default function Companies() {
  const [data, setData] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ name: "", tax_id: "" });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("companies/").then((res) => setData(res.data));
  }, []);

  const handleAddCompany = () => {
    axios
      .post("companies/", newCompany)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Компанію додано ✅");
        setShowAddModal(false);
        setNewCompany({ name: "", tax_id: "" });
      })
      .catch(() => {
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCompany({ ...newCompany, [e.target.name]: e.target.value });
  };

  return (
    <>
      <PageMeta title="Компанії | НашСофт" description="Довідник компаній" />
      <PageBreadcrumb pageTitle="Компанії" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список компаній
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати компанію</span>
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
      ЄДРПОУ
    </TableCell>
  </tr>
</TableHeader>

            <TableBody>
  {data.map((company, index) => (
    <tr
      key={company.id}
      onClick={() => navigate(`/companies/${company.id}`)}
      className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
    >
      <TableCell className="px-4 py-3 text-gray-800 dark:text-white">{index + 1}</TableCell>
      <TableCell className="px-4 py-3 text-gray-800 dark:text-white">{company.name}</TableCell>
      <TableCell className="px-4 py-3 text-gray-800 dark:text-white">{company.tax_id}</TableCell>
    </tr>
  ))}
</TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Нова компанія"
        description=""
        onConfirm={handleAddCompany}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input label="Назва компанії" name="name" value={newCompany.name || ""} onChange={handleInputChange} />
          <Input label="ЄДРПОУ / ІПН" name="tax_id" value={newCompany.tax_id || ""} onChange={handleInputChange} />
        </div>
      </ConfirmModal>
    </>
  );
}
