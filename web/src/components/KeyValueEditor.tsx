import { Icon } from "./Icon";

export interface KvRow {
  key: string;
  value: string;
}

export function KeyValueEditor({
  rows,
  onChange,
  placeholderKey = "key",
  placeholderValue = "value",
  secret = false,
}: {
  rows: KvRow[];
  onChange: (rows: KvRow[]) => void;
  placeholderKey?: string;
  placeholderValue?: string;
  secret?: boolean;
}) {
  const update = (i: number, patch: Partial<KvRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, { key: "", value: "" }]);

  const placeholder = secret ? "••••••••" : placeholderValue;

  return (
    <div className="list">
      {rows.map((r, i) => (
        <div className="kv" key={i}>
          <input
            className="kv-key"
            value={r.key}
            placeholder={placeholderKey}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => update(i, { key: e.target.value })}
          />
          <input
            className="kv-value"
            value={secret ? "" : r.value}
            placeholder={r.value && secret ? "•".repeat(Math.min(12, r.value.length)) : placeholder}
            type={secret && r.value ? "password" : "text"}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => update(i, { value: e.target.value })}
          />
          {secret && (
            <span
              className={`kv-lock${r.value ? " is-on" : ""}`}
              title={r.value ? "Secret set" : "Empty"}
            >
              <Icon.LockClosed />
            </span>
          )}
          <button
            type="button"
            className="kv-remove"
            onClick={() => remove(i)}
            aria-label="Remove"
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <button type="button" className="kv-add" onClick={add}>
        <Icon.Plus />
        Add
      </button>
    </div>
  );
}
