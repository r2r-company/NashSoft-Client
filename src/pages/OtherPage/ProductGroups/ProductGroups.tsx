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

type ProductGroup = {
  id: number;
  name: string;
  parent: number | null;
  children: ProductGroup[];
};

type ProductGroupFlat = {
  id: number;
  name: string;
  parent_name: string | null;
};

type ProductGroupForm = {
  name: string;
  parent: number | null;
};

export default function ProductGroups() {
  const [data, setData] = useState<ProductGroupFlat[]>([]);
  const [treeData, setTreeData] = useState<ProductGroup[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<ProductGroupForm>>({ 
    name: "", 
    parent: null 
  });
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('flat');
  const navigate = useNavigate();

  useEffect(() => {
    loadProductGroups();
  }, [viewMode]);

  const loadProductGroups = () => {
    if (viewMode === 'flat') {
      axios.get("product-groups/flat/").then((res) => setData(res.data));
    } else {
      axios.get("product-groups/").then((res) => setTreeData(res.data));
    }
  };

  const handleAddGroup = () => {
    if (!newGroup.name) {
      toast.error("Введіть назву групи ❗");
      return;
    }

    const requestBody = {
      name: newGroup.name,
      parent: newGroup.parent
    };

    console.log("Відправляємо:", requestBody);

    axios
      .post("product-groups/create/", requestBody)
      .then(() => {
        toast.success("Групу додано ✅");
        setShowAddModal(false);
        setNewGroup({ name: "", parent: null });
        loadProductGroups(); // Перезавантажуємо дані
      })
      .catch((error) => {
        console.error("Помилка:", error.response?.data);
        toast.error("Помилка при додаванні ❌");
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewGroup({ 
      ...newGroup, 
      [name]: value 
    });
  };

  const handleParentSelectChange = (value: string) => {
    setNewGroup({ ...newGroup, parent: value ? parseInt(value) : null });
  };

  // Рекурсивний рендер дерева
  const renderTreeNode = (group: ProductGroup, level: number = 0) => {
    const indent = level * 20;
    
    return (
      <div key={group.id}>
        <tr
          onClick={() => navigate(`/product-groups/${group.id}`)}
          className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
            {group.id}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
            <div style={{ paddingLeft: `${indent}px` }} className="flex items-center">
              {level > 0 && (
                <span className="mr-2 text-gray-400">└─</span>
              )}
              {group.name}
            </div>
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
            {group.children.length}
          </TableCell>
        </tr>
        {group.children.map((child) => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  // Отримуємо всі групи для селекту (плоский список)
  const getFlatGroupsForSelect = () => {
    return data.map(group => ({
      value: group.id.toString(),
      label: group.parent_name ? `${group.parent_name} → ${group.name}` : group.name
    }));
  };

  return (
    <>
      <PageMeta title="Групи продуктів | НашСофт" description="Довідник груп продуктів" />
      <PageBreadcrumb pageTitle="Групи продуктів" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Групи продуктів
        </h1>
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-white/10">
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1 text-sm font-medium ${
                viewMode === 'flat'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-white'
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 text-sm font-medium ${
                viewMode === 'tree'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-white'
              }`}
            >
              Дерево
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <span className="flex items-center gap-2">Додати групу</span>
          </Button>
        </div>
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
                  ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  Назва групи
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-white"
                >
                  {viewMode === 'flat' ? 'Батьківська група' : 'Підгруп'}
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {viewMode === 'flat' ? (
                data.map((group) => (
                  <tr
                    key={group.id}
                    onClick={() => navigate(`/product-groups/${group.id}`)}
                    className="cursor-pointer border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      {group.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                      {group.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {group.parent_name || "—"}
                    </TableCell>
                  </tr>
                ))
              ) : (
                treeData.map((group) => renderTreeNode(group))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Нова група продуктів"
        description=""
        onConfirm={handleAddGroup}
        onClose={() => setShowAddModal(false)}
      >
        <div className="space-y-4 mt-4">
          <Input 
            label="Назва групи" 
            name="name" 
            value={newGroup.name || ""} 
            onChange={handleInputChange} 
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Батьківська група (необов'язково)
            </label>
            <Select
              options={getFlatGroupsForSelect()}
              placeholder="Оберіть батьківську групу або залиште порожнім"
              onChange={handleParentSelectChange}
              defaultValue=""
            />
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}