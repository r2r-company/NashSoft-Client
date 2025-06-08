import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "../config/api";

interface Dictionaries {
  companies: { id: number; name: string }[];
  firms: any[];
  warehouses: any[];
  departments: any[];
  vatTypes: string[];
}

const DictionariesContext = createContext<Dictionaries | null>(null);

export const useDictionaries = () => {
  const ctx = useContext(DictionariesContext);
  if (!ctx) throw new Error("DictionariesProvider missing");
  return ctx;
};

export function DictionariesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Dictionaries>({
    companies: [],
    firms: [],
    warehouses: [],
    departments: [],
    vatTypes: [],
  });

  useEffect(() => {
    Promise.all([
      axios.get("/companies/"),
      axios.get("/firms/"),
      axios.get("/warehouses/"),
      axios.get("/departments/"),
      axios.get("/vat-types/"),
    ]).then(([c, f, w, d, v]) => {
      setData({
        companies: c.data,
        firms: f.data,
        warehouses: w.data,
        departments: d.data,
        vatTypes: v.data,
      });
    });
  }, []);

  return (
    <DictionariesContext.Provider value={data}>
      {children}
    </DictionariesContext.Provider>
  );
}
