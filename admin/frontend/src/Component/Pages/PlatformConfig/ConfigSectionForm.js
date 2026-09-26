import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setToast } from "../../../util/toast";
import { fetchConfigHistory, savePlatformConfigSection } from "./configApi";
import { buildSectionSchema, checkDeps, fromFormValues, serverErrorToField, toFormValues, toKey } from "./configSchema";
import { fmtDateTime, formatValue, inr } from "./format";

const errorMessage = (e) => e?.message || e?.root?.message || null;

function FieldError({ error }) {
  const msg = errorMessage(error);
  return msg ? <div className="pc-error">{msg}</div> : null;
}

function CoinsHint({ control, name, coinsPerInr }) {
  const v = Number(useWatch({ control, name }));
  if (!Number.isFinite(v) || v <= 0 || !coinsPerInr) return null;
  return <span className="pc-hint-inline">≈ {inr(v / coinsPerInr)}</span>;
}

function NumberInput({ f, name, register, className = "" }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={f.step || (f.integer ? 1 : "any")}
      min={f.min ?? undefined}
      max={f.max ?? undefined}
      className={`form-control ${className}`}
      {...register(name)}
    />
  );
}

function ScalarField({ f, name, register, control, errors, coinsPerInr }) {
  const id = `pc-${name}`;
  if (f.type === "boolean") {
    return (
      <div className="pc-field pc-field-switch">
        <div className="form-check form-switch">
          <input id={id} type="checkbox" role="switch" className="form-check-input" {...register(name)} />
          <label htmlFor={id} className="form-check-label">{f.label}</label>
        </div>
        {f.help ? <div className="pc-help">{f.help}</div> : null}
        <FieldError error={errors[name]} />
      </div>
    );
  }
  return (
    <div className="pc-field">
      <label htmlFor={id} className="pc-label">
        {f.label}
        {f.unit === "coins" ? <CoinsHint control={control} name={name} coinsPerInr={coinsPerInr} /> : null}
      </label>
      {f.type === "select" ? (
        <select id={id} className="form-select" {...register(name)}>
          {f.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : f.type === "text" || f.type === "url" ? (
        <input id={id} type={f.type === "url" ? "url" : "text"} className="form-control" {...register(name)} />
      ) : (
        <div className="pc-input-unit">
          {f.unit === "₹" ? <span className="pc-unit pc-unit-pre">₹</span> : null}
          <NumberInput f={f} name={name} register={register} />
          {f.unit && f.unit !== "₹" ? <span className="pc-unit">{f.unit}</span> : null}
        </div>
      )}
      {f.help ? <div className="pc-help">{f.help}</div> : null}
      <FieldError error={errors[name]} />
    </div>
  );
}

function newListItem(item) {
  return Object.fromEntries(item.map((sub) => [sub.path, sub.type === "boolean" ? true : sub.type === "number" ? "" : ""]));
}

function ListField({ f, name, register, control, errors, coinsPerInr }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const listErrors = errors[name];
  return (
    <div className="pc-field pc-field-wide">
      <div className="pc-label-row">
        <span className="pc-label">{f.label}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={fields.length >= (f.maxItems || 20)}
          onClick={() => append(newListItem(f.item))}
        >
          + Add
        </button>
      </div>
      <div className="table-responsive pc-list">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              {f.item.map((sub) => (
                <th key={sub.path} scope="col">
                  {sub.label}
                  {sub.unit && sub.unit !== "₹" ? <span className="pc-th-unit"> ({sub.unit})</span> : null}
                  {sub.unit === "₹" ? <span className="pc-th-unit"> (₹)</span> : null}
                </th>
              ))}
              <th scope="col" aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {fields.map((row, i) => (
              <tr key={row.id}>
                {f.item.map((sub) => {
                  const subName = `${name}.${i}.${sub.path}`;
                  const err = listErrors?.[i]?.[sub.path];
                  return (
                    <td key={sub.path}>
                      {sub.type === "boolean" ? (
                        <div className="form-check form-switch m-0">
                          <input type="checkbox" role="switch" className="form-check-input" aria-label={sub.label} {...register(subName)} />
                        </div>
                      ) : sub.type === "text" ? (
                        <input type="text" className="form-control form-control-sm" aria-label={sub.label} {...register(subName)} />
                      ) : (
                        <>
                          <NumberInput f={sub} name={subName} register={register} className="form-control-sm" />
                          {sub.unit === "coins" ? <CoinsHint control={control} name={subName} coinsPerInr={coinsPerInr} /> : null}
                        </>
                      )}
                      <FieldError error={err} />
                    </td>
                  );
                })}
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger"
                    disabled={fields.length <= (f.minItems || 1)}
                    onClick={() => remove(i)}
                    aria-label="Remove row"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FieldError error={listErrors} />
    </div>
  );
}

function History({ sectionKey }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    fetchConfigHistory(sectionKey, 10)
      .then((d) => setRows(d.status ? d.history : []))
      .catch(() => setRows([]));
  }, [sectionKey]);
  if (!rows) return <div className="pc-history pc-muted">Loading history…</div>;
  if (rows.length === 0) return <div className="pc-history pc-muted">No changes recorded yet.</div>;
  return (
    <ul className="pc-history">
      {rows.map((r) => (
        <li key={r._id}>
          <div className="pc-history-meta">
            {fmtDateTime(r.createdAt)} · {r.adminName || "Admin"}
          </div>
          <ul>
            {(r.changes || []).map((c) => (
              <li key={c.path}>
                <span className="pc-history-label">{c.label}</span>: {formatValue(c.from)} → {formatValue(c.to)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/**
 * One Platform Config section: form built from the backend's field metadata,
 * validated with the matching Zod schema, saved with PATCH. While the admin
 * isn't editing, it follows the server (the page polls); if someone else
 * saves while they are editing, it says so instead of overwriting their input.
 */
export default function ConfigSectionForm({ section, coinsPerInr, onSaved }) {
  const schema = useMemo(() => buildSectionSchema(section), [section]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: toFormValues(section), mode: "onChange" });

  // Re-run cross-field checks when any field they read changes; a list item
  // edit re-checks its whole list (unique names, from ≤ to, within limits).
  const deps = useMemo(() => checkDeps(section), [section]);
  const listKeys = section.fields.filter((f) => f.type === "list").map((f) => toKey(f.path));
  const reg = (name) => {
    const listKey = listKeys.find((k) => name.startsWith(`${k}.`));
    const d = listKey ? [listKey] : deps[name];
    return d ? register(name, { deps: d }) : register(name);
  };

  const [showHistory, setShowHistory] = useState(false);
  const [changedElsewhere, setChangedElsewhere] = useState(null);
  const lastSeenChange = useRef(section.lastChange?.createdAt || null);

  useEffect(() => {
    const change = section.lastChange?.createdAt || null;
    if (!isDirty) {
      reset(toFormValues(section));
      setChangedElsewhere(null);
    } else if (change && change !== lastSeenChange.current) {
      setChangedElsewhere(section.lastChange);
    }
    lastSeenChange.current = change;
    // isDirty is read, not a dependency: only a new server snapshot resyncs.
  }, [section, reset]);

  const onSubmit = async (formValues) => {
    try {
      const res = await savePlatformConfigSection(section.key, fromFormValues(section, formValues));
      if (!res.status) {
        for (const [key, message] of Object.entries(res.errors || {})) {
          const name = serverErrorToField(section, key);
          if (name) setError(name, { type: "server", message });
        }
        setToast("error", res.message);
        return;
      }
      setToast("success", res.message);
      lastSeenChange.current = null;
      reset(toFormValues(res.section));
      setChangedElsewhere(null);
      onSaved && onSaved(res.section);
    } catch (e) {
      setToast("error", e?.response?.data?.message || "Couldn't save — check your connection and try again.");
    }
  };

  const discard = () => {
    reset(toFormValues(section));
    setChangedElsewhere(null);
  };

  const scalars = section.fields.filter((f) => f.type !== "list");
  const lists = section.fields.filter((f) => f.type === "list");

  return (
    <form className="pc-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="pc-card-head">
        <div>
          <h6 className="pc-card-title">{section.title}</h6>
          <div className="pc-card-desc">{section.description}</div>
        </div>
        <button type="button" className="btn btn-sm btn-link" onClick={() => setShowHistory((s) => !s)}>
          {showHistory ? "Hide history" : "History"}
        </button>
      </div>

      {changedElsewhere ? (
        <div className="pc-banner" role="status">
          {changedElsewhere.adminName || "Another admin"} saved this section at {fmtDateTime(changedElsewhere.createdAt)} while you were editing.{" "}
          <button type="button" className="btn btn-sm btn-link p-0 align-baseline" onClick={discard}>
            Load their values
          </button>
        </div>
      ) : null}

      {showHistory ? <History sectionKey={section.key} /> : null}

      <div className="pc-card-body">
        {scalars.length ? (
          <div className="pc-grid">
            {scalars.map((f) => (
              <ScalarField key={f.path} f={f} name={toKey(f.path)} register={reg} control={control} errors={errors} coinsPerInr={coinsPerInr} />
            ))}
          </div>
        ) : null}
        {lists.map((f) => (
          <ListField key={f.path} f={f} name={toKey(f.path)} register={reg} control={control} errors={errors} coinsPerInr={coinsPerInr} />
        ))}
      </div>

      <div className="pc-card-foot">
        <span className="pc-muted pc-small">
          {section.lastChange
            ? `Last changed ${fmtDateTime(section.lastChange.createdAt)} by ${section.lastChange.adminName || "admin"}`
            : "Using launch defaults"}
        </span>
        <div className="pc-actions">
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!isDirty || isSubmitting} onClick={discard}>
            Discard
          </button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
