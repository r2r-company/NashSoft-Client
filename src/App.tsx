import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// 📦 Сторінки
import Home from "./pages/Dashboard/Home";
import Companies from "./pages/OtherPage/Companies/Companies";
import CompanyDetailPage from "./pages/OtherPage/Companies/CompanyDetailPage";
import Firms from "./pages/OtherPage/Firms/Firms";
import Warehouses from "./pages/OtherPage/Warehouses/Warehouses";
import WarehouseDetailPage from "./pages/OtherPage/Warehouses/WarehouseDetailPage"; 
import Departments from "./pages/OtherPage/Departments/Departments";
import DepartmentDetailPage from "./pages/OtherPage/Departments/DepartmentDetailPage";
import Products from "./pages/OtherPage/Products/Products";
import ProductDetailPage from "./pages/OtherPage/Products/ProductDetailPage";
import ProductGroups from "./pages/OtherPage/ProductGroups/ProductGroups";
import ProductGroupDetailPage from "./pages/OtherPage/ProductGroups/ProductGroupDetailPage";
import Units from "./pages/OtherPage/Units/Units";
import UnitDetailPage from "./pages/OtherPage/Units/UnitDetailPage";
import Suppliers from "./pages/OtherPage/Suppliers/Suppliers";
import SupplierDetailPage from "./pages/OtherPage/Suppliers/SupplierDetailPage";
import Customers from "./pages/OtherPage/Customers/Customers";
import CustomerDetailPage from "./pages/OtherPage/Customers/CustomerDetailPage";
import CustomerTypes from "./pages/OtherPage/CustomerTypes/CustomerTypes";
import CustomerTypeDetailPage from "./pages/OtherPage/CustomerTypes/CustomerTypeDetailPage";
import Accounts from "./pages/OtherPage/Accounts/Accounts";
import AccountDetailPage from "./pages/OtherPage/Accounts/AccountDetailPage";
import PaymentTypes from "./pages/OtherPage/PaymentTypes/PaymentTypes";
import PaymentTypeDetailPage from "./pages/OtherPage/PaymentTypes/PaymentTypesDetailPage";
import PriceTypes from "./pages/OtherPage/PriceTypes/PriceTypes";
import PriceTypeDetailPage from "./pages/OtherPage/PriceTypes/PriceTypeDetailPage";
import SystemUsers from "./pages/OtherPage/SystemUsers/SystemUsers";
import SystemUserDetailPage from "./pages/OtherPage/SystemUsers/SystemUserDetailPage";
import AccessGroups from "./pages/OtherPage/AccessGroups/AccessGroups";
import AccessGroupDetailPage from "./pages/OtherPage/AccessGroups/AccessGroupDetailPage";
import { DictionariesProvider } from "./context/DictionariesContext";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import FirmDetailPage from "./pages/OtherPage/Firms/FirmDetailPage";
import Receipts from './pages/OtherPage/Receipts/Receipts';
import ReceiptDetailPage from './pages/OtherPage/Receipts/ReceiptsDetailPage';
import CreateReceiptPage from './pages/OtherPage/Receipts/CreateReceiptsPage';
import Sales from './pages/OtherPage/Sales/Sales';
import SaleDetailPage from './pages/OtherPage/Sales/SaleDetailPage';
import CreateSalePage from './pages/OtherPage/Sales/CreateSalesPage';
import Contracts from "./pages/OtherPage/Contracts/Contracts";
import ContractDetailPage from "./pages/OtherPage/Contracts/ContractDetailPage";
import TradePoints from './pages/OtherPage/TradePoints/TradePoitns';
import TradePointDetailPage from './pages/OtherPage/TradePoints/TradePointDetailPage';
import PriceSettings from './pages/OtherPage/PriceSettings/PriceSetings';
import CreatePriceSettingsPage from './pages/OtherPage/PriceSettings/CreateSettingsPage';
import PriceSettingsDetailPage from './pages/OtherPage/PriceSettings/PriceSettingsDetailPage';


export default function App() {
  return (
    <DictionariesProvider>
    <Router>
      <Toaster 
  position="top-right" 
  containerStyle={{
    zIndex: 999999,
  }}
  toastOptions={{
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
    },
    success: {
      duration: 3000,
      iconTheme: {
        primary: '#4ade80',
        secondary: '#fff',
      },
    },
    error: {
      duration: 4000,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    },
  }}
/>
      <ScrollToTop />
      <Routes>
        {/* 🌐 Оболонка з AppLayout */}
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/warehouses/:id" element={<WarehouseDetailPage />} /> 
          <Route path="/departments" element={<Departments />} />
          <Route path="/departments/:id" element={<DepartmentDetailPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/product-groups" element={<ProductGroups />} />
          <Route path="/product-groups/:id" element={<ProductGroupDetailPage />} />
          <Route path="/units" element={<Units />} />
          <Route path="/units/:id" element={<UnitDetailPage />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customer-types" element={<CustomerTypes />} />
          <Route path="/customer-types/:id" element={<CustomerTypeDetailPage />} />

          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetailPage />} />
          <Route path="/payment-types" element={<PaymentTypes />} />
          <Route path="/payment-types/:id" element={<PaymentTypeDetailPage />} />

          <Route path="/price-types" element={<PriceTypes />} />
          <Route path="/price-types/:id" element={<PriceTypeDetailPage />} />

          <Route path="/system-users" element={<SystemUsers />} />
          <Route path="/system-users/:id" element={<SystemUserDetailPage />} />

          <Route path="/access-groups" element={<AccessGroups />} />
          <Route path="/access-groups/:id" element={<AccessGroupDetailPage />} />

          <Route path="/firms/:id" element={<FirmDetailPage />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/receipts/create" element={<CreateReceiptPage />} />
          <Route path="/receipts/:id" element={<ReceiptDetailPage />} />

          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/create" element={<CreateSalePage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/trade-points" element={<TradePoints />} />
          <Route path="/trade-points/:id" element={<TradePointDetailPage />} />
          <Route path="/price-settings" element={<PriceSettings />} />
          <Route path="/price-settings/create" element={<CreatePriceSettingsPage />} />
          <Route path="/price-settings/:id" element={<PriceSettingsDetailPage />} />



          


        </Route>

        {/* 🔐 Авторизація */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* ❌ 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </DictionariesProvider>
  );
}
