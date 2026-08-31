import { useEffect, useId, useRef } from 'react';
import { X, ArrowRight, Plus, AlertCircle, CheckCircle2, Inbox, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { number } from '../lib';
export function Button({ children, variant = '', busy, className = '', ...props }) {
  return (
    <button className={`btn ${variant} ${className}`} {...props} disabled={props.disabled || busy}>
      {busy && <LoaderCircle size={17} className="spin" />}
      {children}
    </button>
  );
}
export function Field({ label, hint, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ? (
        children
      ) : (
        <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      )}{' '}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function Select({ label, children, ...props }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} {...props}>
        {children}
      </select>
    </label>
  );
}
export function Textarea({ label, ...props }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea id={id} rows={3} {...props} />
    </label>
  );
}
export function Feedback({ error, success }) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={20} />
          <div>
            {error.message || String(error)}
            {Array.isArray(error.details) && (
              <ul>
                {error.details.map((d, i) => (
                  <li key={i}>
                    {d.field}: {d.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {success && (
        <div className="notice success" role="status">
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}
    </>
  );
}
export function Resource({ resource, children }) {
  if (resource.loading && !resource.data)
    return (
      <div className="loading" role="status">
        <LoaderCircle className="spin" /> Cargando tus datos…
      </div>
    );
  if (resource.error)
    return (
      <div className="card">
        <Feedback error={resource.error} />
        <Button onClick={resource.reload}>Reintentar</Button>
      </div>
    );
  return resource.data ? children(resource.data) : null;
}
export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <header className="page-title">
      <div>
        <p className="eyebrow">{eyebrow || 'TU ESPACIO PERSONAL'}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </header>
  );
}
export function Empty({ title, children, to, action, onClick }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={27} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {to ? (
        <Link className="btn" to={to}>
          {action}
          <ArrowRight size={16} />
        </Link>
      ) : onClick ? (
        <Button onClick={onClick}>
          <Plus size={16} />
          {action}
        </Button>
      ) : null}
    </div>
  );
}
export function Badge({ children, tone = '' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null),
    heading = useId();
  useEffect(() => {
    const d = ref.current;
    const previous = document.activeElement;
    d.showModal();
    const close = (e) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener('cancel', close);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      d.removeEventListener('cancel', close);
      d.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog className={`modal ${wide ? 'wide' : ''}`} ref={ref} aria-labelledby={heading}>
      <div className="modal-heading">
        <h2 id={heading}>{title}</h2>
        <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  children,
  onClose,
  onConfirm,
  action = 'Confirmar',
  busy,
  error,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{children}</p>
      <Feedback error={error} />
      <div className="form-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Volver
        </Button>
        <Button variant="danger" busy={busy} onClick={onConfirm}>
          {action}
        </Button>
      </div>
    </Modal>
  );
}
export function Stat({ label, value, unit, children, icon: Icon, accent }) {
  return (
    <article className={`stat ${accent ? 'accent' : ''}`}>
      <div className="stat-top">
        <span>{label}</span>
        {Icon && <Icon size={19} />}
      </div>
      <div className="stat-value">
        {value ?? '—'}
        <span>{unit}</span>
      </div>
      <div className="stat-foot">{children}</div>
    </article>
  );
}
export function Meter({ value = 0, max = 100, label, unit = '', color }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <strong>
          {number(value)}{' '}
          <small>
            / {number(max)} {unit}
          </small>
        </strong>
      </div>
      <div className="track">
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
export function Pager({ page, total, limit = 25, onChange }) {
  return (
    <div className="pager">
      <span>
        {total} registros · Página {page} de {Math.max(1, Math.ceil(total / limit))}
      </span>
      <div className="actions">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button
          variant="secondary"
          disabled={page * limit >= total}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
