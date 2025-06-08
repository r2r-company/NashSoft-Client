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

type Account = {
  id: number;
  name: string;
  type: string;
  company: string;
};

type AccountForm = {
  name: string;
  type: string;
  company: number;
};

type Company = {
  id: number;
  name: string;
  tax_id: string;
};

export default function Accounts() {
  const [data, setData] = useState<Account[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<AccountForm>>({ 
    name: "", 
    type: "",
    company: undefined
  });
  const navigate = useNavigate();

  const accountTypeOptions = [
    { value: "cash", label: "Готівка" },
    { value: "bank", label: "Банк" },
  ];

  useEffect(() => {
    axios.get("accounts/").then((res) => setData(res.data));
    axios.get("companies/").then((res) => setCompanies(res.data));
  }, []);

  const handleAddAccount = () => {
    const requestBody = {
      name: newAccount.name,
      type: newAccount.type,
      company: newAccount.company
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("accounts/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Рахунок додано ✅");
        setShowAddModal(false);
        setNewAccount({ name: "", type: "", company: undefined });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAccount({ 
      ...newAccount, 
      [name]: value 
    });
  };

  const handleTypeSelectChange = (value: string) => {
    setNewAccount({ ...newAccount, type: value });
  };

  const handleCompanySelectChange = (value: string) => {
    setNewAccount({ ...newAccount, company: parseInt(value) });
  };

  const getTypeLabel = (type: string) => {
    const option = accountTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  return (
    <>
      <PageMeta title="Рахунки | НашСофт" description="Довідник рахунків" />
      <PageBreadcrumb pageTitle="Рахунки" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список рахунків
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати рахунок</span>
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
                  Назва рахунку
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Тип
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
              {data.map((account, index) => (
                <tr
                  key={account.id}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {account.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      account.type === 'cash' 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    }`}>
                      {getTypeLabel(account.type)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {account.company}
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Новий рахунок"
        description=""
        onConfirm={handleAddAccount}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва рахунку" 
            name="name" 
            value={newAccount.name || ""} 
            onChange={handleInputChange} 
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип рахунку
            </label>
            <Select
              options={accountTypeOptions}
              placeholder="Оберіть тип рахунку"
              onChange={handleTypeSelectChange}
              defaultValue=""
            />
          </div>
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