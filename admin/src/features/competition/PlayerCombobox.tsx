import { useEffect, useId, useRef, useState } from "react";
import { useAdminUsers } from "../users/hooks";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

interface Props {
  label: string;
  value: string;
  onChange: (id: string, username: string) => void;
  enabled: boolean;
  placeholder?: string;
  excludeId?: string;
}

export function PlayerCombobox({
  label,
  value,
  onChange,
  enabled,
  placeholder = "Search username",
  excludeId,
}: Props) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(search.trim(), 300);
  const users = useAdminUsers(
    { page: 1, limit: 25, search: debounced || undefined, status: "active" },
    enabled && open,
  );

  useEffect(() => {
    if (!value) setSelectedName("");
  }, [value]);

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
      setSearch("");
    }
  };

  const options = (users.data?.data ?? []).filter((user) => user.id !== excludeId);
  const total = users.data?.total ?? 0;
  const display = selectedName || search;

  const select = (id: string, username: string) => {
    onChange(id, username);
    setSelectedName(username);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="admin-player-combobox" ref={wrapperRef} onBlur={handleBlur}>
      <span className="admin-player-combobox__label">{label}</span>
      <div className="admin-player-combobox__control">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          value={open ? search : display}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
            if (value) onChange("", "");
            setSelectedName("");
          }}
        />
        {open ? (
          <ul className="admin-player-combobox__list" id={listId} role="listbox">
            {users.isFetching ? (
              <li className="admin-player-combobox__hint">Searching…</li>
            ) : options.length === 0 ? (
              <li className="admin-player-combobox__hint">
                No players match — try a different search.
              </li>
            ) : (
              options.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={user.id === value}
                    className={user.id === value ? "is-selected" : undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(user.id, user.username)}
                  >
                    <span>{user.username}</span>
                    {user.gamerieId ? <small>{user.gamerieId}</small> : null}
                  </button>
                </li>
              ))
            )}
            {!users.isFetching && total > options.length ? (
              <li className="admin-player-combobox__hint">
                Showing {options.length} of {total} — refine your search to narrow.
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
