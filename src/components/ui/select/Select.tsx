// components/ui/select/Select.tsx
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Оберіть...",
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-white/10 dark:text-white dark:border-white/20">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 ml-auto text-gray-500 dark:text-white" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 rounded-md border border-gray-200 bg-white dark:bg-gray-900 shadow-lg"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="w-full">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt}
                value={opt}
                className="px-3 py-2 text-sm text-gray-800 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <SelectPrimitive.ItemText>{opt}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
