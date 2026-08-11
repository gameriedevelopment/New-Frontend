import type { ReactNode } from "react";
import "./directory.css";

interface DirectoryViewProps {
  eyebrow: string;
  title: string;
  description: string;
  search: string;
  searchPlaceholder: string;
  onSearch: (value: string) => void;
  filters?: ReactNode;
  loading: boolean;
  error?: string;
  empty: boolean;
  count?: number;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  onRetry: () => void;
  children: ReactNode;
  action?: ReactNode;
}

export function DirectoryView({
  eyebrow,
  title,
  description,
  search,
  searchPlaceholder,
  onSearch,
  filters,
  loading,
  error,
  empty,
  count,
  page,
  totalPages,
  onPage,
  onRetry,
  children,
  action,
}: DirectoryViewProps) {
  return (
    <main className="admin-directory-page">
      <header className="admin-directory-heading-row">
        <div className="admin-directory-heading">
          <span className="admin-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action ? <div className="admin-directory-heading-action">{action}</div> : null}
      </header>
      <section className="admin-directory-toolbar" aria-label={`${title} filters`}>
        <label className="admin-directory-search">
          <span className="sr-only">Search {title.toLowerCase()}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        {filters}
      </section>
      <div className="admin-directory-context">
        <span>{loading ? "Loading…" : `${count ?? 0} records`}</span>
        <span>Page {Math.min(page, Math.max(totalPages, 1))}</span>
      </div>
      {error ? (
        <section className="admin-directory-state" role="alert">
          <h2>Unable to load this directory</h2>
          <p>{error}</p>
          <button className="admin-secondary-button" onClick={onRetry}>
            Try again
          </button>
        </section>
      ) : loading ? (
        <section className="admin-directory-list" aria-label={`${title} loading`} aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="admin-directory-skeleton" key={index} />
          ))}
        </section>
      ) : empty ? (
        <section className="admin-directory-state">
          <h2>No matching records</h2>
          <p>Adjust the search or filter to broaden this view.</p>
        </section>
      ) : (
        <section className="admin-directory-list">{children}</section>
      )}
      {!error && !loading && totalPages > 1 ? (
        <nav className="admin-directory-pagination" aria-label={`${title} pages`}>
          <button
            className="admin-secondary-button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Previous
          </button>
          <span>
            {page} of {totalPages}
          </span>
          <button
            className="admin-secondary-button"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </main>
  );
}
