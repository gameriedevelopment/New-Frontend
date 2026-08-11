import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import "./SearchSelect.css";

export interface SearchSelectOption {
  value: string;
  label: string;
  description?: string;
}

export function SearchSelect({
  emptyText = "No matching options",
  hasMore,
  label,
  loading,
  loadingMore,
  onChange,
  onLoadMore,
  onSearch,
  options,
  placeholder = "Search and select",
  searchPlaceholder = "Search",
  value,
}: {
  emptyText?: string;
  hasMore?: boolean;
  label: string;
  loading?: boolean;
  loadingMore?: boolean;
  onChange: (value: string) => void;
  onLoadMore?: () => void;
  onSearch: (search: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState<SearchSelectOption | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const buttonId = useId();
  const selected =
    options.find((item) => item.value === value) ??
    (selection?.value === value ? selection : undefined);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
  }, [open]);
  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(search), 220);
    return () => window.clearTimeout(timer);
  }, [onSearch, search]);
  const choose = (option: SearchSelectOption) => {
    setSelection(option);
    onChange(option.value);
    setSearch("");
    onSearch("");
    setOpen(false);
  };
  const keydown = (event: React.KeyboardEvent) => {
    if (!open && ["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(options.length - 1, current + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    }
    if (event.key === "Enter" && options[active]) {
      event.preventDefault();
      choose(options[active]);
    }
  };
  const loadWhenNearEnd = (event: React.UIEvent<HTMLUListElement>) => {
    const list = event.currentTarget;
    if (hasMore && !loadingMore && list.scrollHeight - list.scrollTop - list.clientHeight < 72)
      onLoadMore?.();
  };
  return (
    <div className="search-select" ref={root} onKeyDown={keydown}>
      <label htmlFor={buttonId}>{label}</label>
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span data-placeholder={!selected}>{selected?.label || placeholder}</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <div className="search-select__panel">
          <div>
            <Search size={14} />
            <input
              ref={input}
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActive(0);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
            />
          </div>
          {loading ? (
            <p className="search-select__state" role="status">
              Searching…
            </p>
          ) : null}
          {!loading && !options.length ? <p className="search-select__state">{emptyText}</p> : null}
          {!loading && options.length ? (
            <ul id={listId} role="listbox" onScroll={loadWhenNearEnd}>
              {options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={value === option.value}
                  data-active={active === index}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <span>
                    <strong>{option.label}</strong>
                    {option.description ? <small>{option.description}</small> : null}
                  </span>
                  {value === option.value ? <Check size={14} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {!loading && (hasMore || loadingMore) ? (
            <div className="search-select__more">
              <button type="button" disabled={loadingMore} onClick={onLoadMore}>
                {loadingMore ? "Loading more games…" : "Load more games"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
