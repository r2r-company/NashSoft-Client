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

type Firm = {
  id: number;
  name: string;
  company: string;
  is_vat: boolean;
  vat_type: string;
};

type FirmForm = {
  name: string;
  company: number;
  vat_type: string;
  is_vat?: boolean;
};

type Company = {
  id: number;
  name: string;
  tax_id: string;
};

export default function Firms() {
  const [data, setData] = useState<Firm[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFirm, setNewFirm] = useState<Partial<FirmForm>>({ 
    name: "", 
    company: undefined, 
    vat_type: "" 
  });
  const navigate = useNavigate();

  const vatTypeOptions = [
    { value: "ФОП", label: "ФОП" },
    { value: "ТОВ", label: "ТОВ" },
    { value: "ТЗОВ", label: "ТЗОВ" },
  ];

  useEffect(() => {
    axios.get("firms/").then((res) => setData(res.data));
    axios.get("companies/").then((res) => setCompanies(res.data));
  }, []);

  const handleAddFirm = () => {
    // Формуємо тіло запиту тільки з потрібними полями
    const requestBody = {
      name: newFirm.name,
      company_id: newFirm.company,
      vat_type: newFirm.vat_type
    };

    console.log("Відправляємо:", requestBody); // Для дебагу

    axios
      .post("firms/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Фірму додано ✅");
        setShowAddModal(false);
        setNewFirm({ name: "", company: undefined, vat_type: "" });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data); // Для дебагу
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewFirm({ 
      ...newFirm, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSelectChange = (value: string) => {
    setNewFirm({ ...newFirm, vat_type: value });
  };

  const handleCompanySelectChange = (value: string) => {
    setNewFirm({ ...newFirm, company: parseInt(value) });
  };

  return (
    <>
      <PageMeta title="Фірми | НашСофт" description="Довідник фірм" />
      <PageBreadcrumb pageTitle="Фірми" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список фірм
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати фірму</span>
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
                  Назва фірми
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Компанія
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Тип ПДВ
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Платник ПДВ
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((firm, index) => (
                <tr
                  key={firm.id}
                  onClick={() => navigate(`/firms/${firm.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {firm.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {firm.company}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {firm.vat_type}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      firm.is_vat 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {firm.is_vat ? "Так" : "Ні"}
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
        title="Нова фірма"
        description=""
        onConfirm={handleAddFirm}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва фірми" 
            name="name" 
            value={newFirm.name || ""} 
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
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип ПДВ
            </label>
            <Select
              options={vatTypeOptions}
              placeholder="Оберіть тип ПДВ"
              onChange={handleSelectChange}
              defaultValue={newFirm.vat_type || ""}
            />
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}