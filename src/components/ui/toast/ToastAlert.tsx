import { useEffect, useState } from "react";

export default function ToastAlert({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="p-4 border rounded-xl border-success-500 bg-success-50 dark:border-success-500/30 dark:bg-success-500/15 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="text-success-500">
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.7 12C3.7 7.42 7.42 3.7 12 3.7C16.58 3.7 20.3 7.42 20.3 12C20.3 16.58 16.58 20.3 12 20.3C7.42 20.3 3.7 16.58 3.7 12ZM12 1.9C6.42 1.9 1.9 6.42 1.9 12C1.9 17.58 6.42 22.1 12 22.1C17.58 22.1 22.1 17.58 22.1 12C22.1 6.42 17.58 1.9 12 1.9ZM15.62 10.74C15.97 10.39 15.97 9.82 15.62 9.47C15.27 9.12 14.7 9.12 14.35 9.47L11.19 12.62L9.65 11.09C9.3 10.74 8.73 10.74 8.38 11.09C8.03 11.44 8.03 12.01 8.38 12.36L10.55 14.53C10.72 14.7 10.95 14.8 11.19 14.8C11.43 14.8 11.66 14.7 11.83 14.53L15.62 10.74Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              Успішно збережено
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
