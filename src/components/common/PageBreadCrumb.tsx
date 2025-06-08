import { Link } from "react-router-dom";

type Crumb = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  pageTitle?: string;
  crumbs?: Crumb[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, crumbs }) => {
  const finalCrumbs: Crumb[] = crumbs ?? [{ label: pageTitle || "" }];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {finalCrumbs[finalCrumbs.length - 1]?.label}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              to="/"
            >
              Home
              <svg
                className="stroke-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          {finalCrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-1.5 text-sm">
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-gray-500 dark:text-gray-400 hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-800 dark:text-white/90 font-medium">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
