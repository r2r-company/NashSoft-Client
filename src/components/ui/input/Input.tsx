// components/ui/input/Input.tsx

import React from "react";
import clsx from "clsx";

type Props = {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  type?: string;
  name?: string;
  className?: string;
};

export default function Input({
  label,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  error,
  type = "text",
  name,
  className = "",
}: Props) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-white/[0.02] border-gray-300 dark:border-white/10",
          "text-gray-800 dark:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
