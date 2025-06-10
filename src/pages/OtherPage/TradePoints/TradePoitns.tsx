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

type TradePoint = {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  firm: string;
  firm_id: number;
  is_active: boolean;
  point_type: string;
};

type TradePointForm = {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  firm_id: number;
  is_active?: boolean;
  point_type: string;
};

type Firm = {
  id: number;
  name: string;
  company: string;
};

export default function TradePoints() {
  const [data, setData] = useState<TradePoint[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTradePoint, setNewTradePoint] = useState<Partial<TradePointForm>>({ 
    name: "", 
    address: "",
    phone: "",
    email: "",
    firm_id: undefined, 
    point_type: "",
    is_active: true
  });
  const navigate = useNavigate();

  const pointTypeOptions = [
    { value: "магазин", label: "Магазин" },
    { value: "склад", label: "Склад" },
    { value: "офіс", label: "Офіс" },
    { value: "кіоск", label: "Кіоск" },
    { value: "інше", label: "Інше" },
  ];

  useEffect(() => {
    axios.get("trade-points/").then((res) => setData(res.data));
    axios.get("firms/").then((res) => setFirms(res.data));
  }, []);

  const handleAddTradePoint = () => {
    // Валідація обов'язкових полів
    if (!newTradePoint.name || !newTradePoint.address || !newTradePoint.firm_id || !newTradePoint.point_type) {
      toast.error("Заповніть усі обов'язкові поля ❗");
      return;
    }

    // Формуємо тіло запиту
    const requestBody = {
      name: newTradePoint.name,
      address: newTradePoint.address,
      phone: newTradePoint.phone || "",
      email: newTradePoint.email || "",
      firm_id: newTradePoint.firm_id,
      point_type: newTradePoint.point_type,
      is_active: newTradePoint.is_active ?? true
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("trade-points/", requestBody)
      .then((res) => {
        setData((prev) => [...prev, res.data]);
        toast.success("Торгову точку додано ✅");
        setShowAddModal(false);
        setNewTradePoint({ 
          name: "", 
          address: "",
          phone: "",
          email: "",
          firm_id: undefined, 
          point_type: "",
          is_active: true
        });
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewTradePoint({ 
      ...newTradePoint, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSelectChange = (value: string) => {
    setNewTradePoint({ ...newTradePoint, point_type: value });
  };

  const handleFirmSelectChange = (value: string) => {
    setNewTradePoint({ ...newTradePoint, firm_id: parseInt(value) });
  };

  return (
    <>
      <PageMeta title="Торгові точки | НашСофт" description="Довідник торгових точок" />
      <PageBreadcrumb pageTitle="Торгові точки" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Список торгових точок
        </h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2">Додати торгову точку</span>
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
                  Адреса
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Фірма
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
                  Телефон
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Статус
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {data.map((point, index) => (
                <tr
                  key={point.id}
                  onClick={() => navigate(`/trade-points/${point.id}`)}
                  className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <div>
                      <div className="font-medium">{point.name}</div>
                      {point.email && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{point.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {point.address}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {point.firm}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {point.point_type}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    {point.phone || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      point.is_active 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {point.is_active ? "Активна" : "Неактивна"}
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
        title="Нова торгова точка"
        description=""
        onConfirm={handleAddTradePoint}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва торгової точки *" 
            name="name" 
            value={newTradePoint.name || ""} 
            onChange={handleInputChange} 
            placeholder="Введіть назву"
          />
          
          <Input 
            label="Адреса *" 
            name="address" 
            value={newTradePoint.address || ""} 
            onChange={handleInputChange} 
            placeholder="Введіть адресу"
          />

          <Input 
            label="Телефон" 
            name="phone" 
            value={newTradePoint.phone || ""} 
            onChange={handleInputChange} 
            placeholder="+380..."
          />

          <Input 
            label="Email" 
            name="email" 
            type="email"
            value={newTradePoint.email || ""} 
            onChange={handleInputChange} 
            placeholder="example@company.com"
          />
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Фірма *
            </label>
            <Select
              options={firms.map(firm => ({
                value: firm.id.toString(),
                label: `${firm.name} (${firm.company})`
              }))}
              placeholder="Оберіть фірму"
              onChange={handleFirmSelectChange}
              defaultValue=""
            />
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Тип торгової точки *
            </label>
            <Select
              options={pointTypeOptions}
              placeholder="Оберіть тип"
              onChange={handleSelectChange}
              defaultValue={newTradePoint.point_type || ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={newTradePoint.is_active ?? true}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-white">
              Активна торгова точка
            </label>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}