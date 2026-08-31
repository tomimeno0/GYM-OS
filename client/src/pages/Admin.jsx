import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Pencil, ShieldCheck, Search, Trash2 } from 'lucide-react';
import { PERMISSIONS } from '@gym-os/shared/constants';
import { api, useResource, useAction, useAuth, date, titleCase, pick } from '../lib';
import {
  PageTitle,
  Resource,
  Button,
  Field,
  Textarea,
  Select,
  Feedback,
  Modal,
  Confirm,
  Badge,
  Pager,
  Empty,
} from '../components/ui';
const permissionLabels = {
  'fitness:use': 'Usar funciones fitness',
  'users:read': 'Consultar usuarios',
  'users:manage': 'Administrar usuarios',
  'roles:manage': 'Administrar roles',
  'audit:read': 'Consultar bitácora',
  'integrity:read': 'Verificar integridad',
};
function AdminHeader() {
  const { user } = useAuth();
  return (
    <>
      <PageTitle
        eyebrow="ADMINISTRACIÓN"
        title="Un sistema en orden."
        description="Usuarios, permisos y trazabilidad de las operaciones."
      />
      <nav className="tab-links" aria-label="Administración">
        {[
          ['usuarios', 'Usuarios', 'users:read'],
          ['roles', 'Roles', 'roles:manage'],
          ['bitacora', 'Bitácora', 'audit:read'],
          ['integridad', 'Integridad', 'integrity:read'],
        ]
          .filter(([, , p]) => user.permisos.includes(p))
          .map(([url, label]) => (
            <NavLink key={url} to={`/admin/${url}`}>
              {label}
            </NavLink>
          ))}
      </nav>
    </>
  );
}
export function AdminUsers() {
  const { user } = useAuth(),
    [q, setQ] = useState(''),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(1),
    r = useResource(
      `/admin/users?${new URLSearchParams({ q: search, page, ...(status ? { estado: status } : {}) })}`,
    ),
    [confirm, setConfirm] = useState(null),
    [rolesFor, setRolesFor] = useState(null),
    a = useAction();
  return (
    <>
      <AdminHeader />
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
          setPage(1);
        }}
      >
        <Field
          label="Buscar usuarios"
          value={q}
          placeholder="Nombre o correo electrónico"
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          label="Estado"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="bloqueado">Bloqueados</option>
        </Select>
        <Button>
          <Search size={17} />
          Buscar
        </Button>
      </form>
      <Resource resource={r}>
        {(d) => (
          <div className="card">
            {!d.items.length ? (
              <Empty title="No hay coincidencias">Probá con otra búsqueda.</Empty>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Roles</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>
                            {u.nombre} {u.apellido}
                          </strong>
                          <small>{u.email}</small>
                        </td>
                        <td>
                          {u.roles.map((r) => (
                            <Badge key={r.id}>{r.nombre}</Badge>
                          ))}
                        </td>
                        <td>
                          <Badge tone={u.estado === 'activo' ? 'green' : ''}>
                            {titleCase(u.estado)}
                          </Badge>
                        </td>
                        <td>{date(u.fecha_registro)}</td>
                        <td>
                          <div className="actions">
                            {user.permisos.includes('roles:manage') && (
                              <Button variant="secondary" onClick={() => setRolesFor(u)}>
                                Roles
                              </Button>
                            )}
                            {user.permisos.includes('users:manage') && (
                              <>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    a.setError(null);
                                    setConfirm({
                                      u,
                                      type: u.estado === 'activo' ? 'bloqueado' : 'activo',
                                    });
                                  }}
                                >
                                  {u.estado === 'activo' ? 'Bloquear' : 'Activar'}
                                </Button>
                                <button
                                  className="icon-btn danger-text"
                                  aria-label={`Eliminar usuario ${u.email}`}
                                  onClick={() => {
                                    a.setError(null);
                                    setConfirm({ u, type: 'delete' });
                                  }}
                                >
                                  <Trash2 size={17} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager page={page} total={d.total} onChange={setPage} />
          </div>
        )}
      </Resource>
      {rolesFor && (
        <AssignRoles
          target={rolesFor}
          onClose={() => setRolesFor(null)}
          onSaved={() => {
            setRolesFor(null);
            r.reload();
          }}
        />
      )}
      {confirm && (
        <Confirm
          title={
            confirm.type === 'delete'
              ? '¿Eliminar este usuario?'
              : `¿${confirm.type === 'activo' ? 'Activar' : 'Bloquear'} esta cuenta?`
          }
          onClose={() => setConfirm(null)}
          busy={a.busy}
          error={a.error}
          onConfirm={() =>
            a.run(async () => {
              await api(
                `/admin/users/${confirm.u.id}${confirm.type === 'delete' ? '' : '/status'}`,
                { confirmar: true, ...(confirm.type === 'delete' ? {} : { estado: confirm.type }) },
                confirm.type === 'delete' ? 'DELETE' : 'PATCH',
              );
              setConfirm(null);
              r.reload();
            })
          }
        >
          {confirm.u.nombre} · {confirm.u.email}.{' '}
          {confirm.type === 'delete'
            ? 'Se eliminarán sus datos personales y deportivos. Esta acción no se puede deshacer.'
            : 'Se cerrarán sus sesiones abiertas. El último administrador activo está protegido.'}
        </Confirm>
      )}
    </>
  );
}
function AssignRoles({ target, onClose, onSaved }) {
  const r = useResource('/admin/roles'),
    [selected, setSelected] = useState(target.roles.map((r) => r.id)),
    a = useAction();
  return (
    <Modal title={`Roles de ${target.nombre}`} onClose={onClose}>
      <p className="muted">
        La asignación reemplaza sus roles actuales y cierra sus sesiones abiertas.
      </p>
      <Resource resource={r}>
        {(d) => (
          <div className="check-list">
            {d.items.map((r) => (
              <label className="check" key={r.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? [...selected, r.id] : selected.filter((id) => id !== r.id),
                    )
                  }
                />
                <span>
                  <strong>{r.nombre}</strong>
                  <small>{r.descripcion}</small>
                </span>
              </label>
            ))}
          </div>
        )}
      </Resource>
      <Feedback {...a} />
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          busy={a.busy}
          disabled={!selected.length}
          onClick={() =>
            a.run(async () => {
              await api(
                `/admin/users/${target.id}/roles`,
                { roles: selected, confirmar: true },
                'PUT',
              );
              onSaved();
            })
          }
        >
          Confirmar roles
        </Button>
      </div>
    </Modal>
  );
}
function RoleForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(
      initial
        ? pick(initial, ['nombre', 'descripcion', 'permisos'])
        : { nombre: '', descripcion: '', permisos: [] },
    ),
    a = useAction();
  return (
    <Modal title={initial ? 'Editar rol' : 'Crear rol personalizado'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.run(async () => {
            await api(
              initial ? `/admin/roles/${initial.id}` : '/admin/roles',
              f,
              initial ? 'PUT' : 'POST',
            );
            onSaved();
          });
        }}
      >
        <Field
          label="Nombre del rol"
          required
          minLength={2}
          maxLength={50}
          value={f.nombre}
          onChange={(e) => setF({ ...f, nombre: e.target.value })}
        />
        <Textarea
          label="Descripción"
          maxLength={255}
          value={f.descripcion}
          onChange={(e) => setF({ ...f, descripcion: e.target.value })}
        />
        <h3>Permisos</h3>
        <div className="check-list">
          {PERMISSIONS.map((p) => (
            <label className="check" key={p}>
              <input
                type="checkbox"
                checked={f.permisos.includes(p)}
                onChange={(e) =>
                  setF({
                    ...f,
                    permisos: e.target.checked
                      ? [...f.permisos, p]
                      : f.permisos.filter((v) => v !== p),
                  })
                }
              />
              {permissionLabels[p]}
            </label>
          ))}
        </div>
        <Feedback {...a} />
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button busy={a.busy} disabled={!f.permisos.length}>
            Guardar rol
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function AdminRoles() {
  const r = useResource('/admin/roles'),
    [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null),
    a = useAction();
  return (
    <>
      <AdminHeader />
      <div className="section-title">
        <h2>Roles y permisos</h2>
        <Button onClick={() => setEdit({})}>
          <Plus size={17} />
          Crear rol
        </Button>
      </div>
      <Resource resource={r}>
        {(d) => (
          <div className="plan-grid">
            {d.items.map((v) => (
              <article className="card" key={v.id}>
                <div className="section-title">
                  <h2>{v.nombre}</h2>
                  {v.sistema && <Badge>PROTEGIDO</Badge>}
                </div>
                <p className="muted">{v.descripcion}</p>
                <ul className="permissions-list">
                  {v.permisos.map((p) => (
                    <li key={p}>
                      <ShieldCheck size={15} />
                      {permissionLabels[p]}
                    </li>
                  ))}
                </ul>
                {!v.sistema && (
                  <div className="actions">
                    <Button variant="secondary" onClick={() => setEdit(v)}>
                      <Pencil size={16} />
                      Editar
                    </Button>
                    <Button
                      variant="ghost danger-text"
                      onClick={() => {
                        a.setError(null);
                        setRemove(v);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Resource>
      {edit && (
        <RoleForm
          initial={edit.id ? edit : null}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            r.reload();
          }}
        />
      )}
      {remove && (
        <Confirm
          title="¿Eliminar este rol?"
          onClose={() => setRemove(null)}
          error={a.error}
          busy={a.busy}
          onConfirm={() =>
            a.run(async () => {
              await api(`/admin/roles/${remove.id}`, { confirmar: true }, 'DELETE');
              setRemove(null);
              r.reload();
            })
          }
        >
          El rol {remove.nombre} solo podrá eliminarse si no tiene usuarios asignados.
        </Confirm>
      )}
    </>
  );
}
export function AdminAudit() {
  const [page, setPage] = useState(1),
    [module, setModule] = useState(''),
    [result, setResult] = useState(''),
    r = useResource(
      `/admin/audit?${new URLSearchParams({ page, ...(module ? { modulo: module } : {}), ...(result ? { resultado: result } : {}) })}`,
    );
  return (
    <>
      <AdminHeader />
      <div className="filters">
        <Select
          label="Módulo"
          value={module}
          onChange={(e) => {
            setModule(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          {[
            'cuentas',
            'perfil_fisico',
            'objetivos',
            'rutinas',
            'entrenamientos',
            'nutricion',
            'administracion',
          ].map((v) => (
            <option key={v} value={v}>
              {titleCase(v)}
            </option>
          ))}
        </Select>
        <Select
          label="Resultado"
          value={result}
          onChange={(e) => {
            setResult(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          {['exitoso', 'fallido', 'advertencia'].map((v) => (
            <option key={v} value={v}>
              {titleCase(v)}
            </option>
          ))}
        </Select>
      </div>
      <Resource resource={r}>
        {(d) => (
          <div className="card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Acción</th>
                    <th>Módulo</th>
                    <th>Resultado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.fecha_hora).toLocaleString('es-AR')}</td>
                      <td>{e.accion}</td>
                      <td>{titleCase(e.modulo)}</td>
                      <td>
                        <Badge tone={e.resultado === 'exitoso' ? 'green' : ''}>{e.resultado}</Badge>
                      </td>
                      <td>{e.descripcion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!d.items.length && <Empty title="Sin eventos para estos filtros" />}
            <Pager page={page} total={d.total} onChange={setPage} />
          </div>
        )}
      </Resource>
    </>
  );
}
export function AdminIntegrity() {
  const r = useResource('/admin/integrity');
  return (
    <>
      <AdminHeader />
      <div className="section-title">
        <h2>Integridad de los datos</h2>
        <Button busy={r.loading} onClick={r.reload}>
          Volver a verificar
        </Button>
      </div>
      <Resource resource={r}>
        {(d) => (
          <div className="card">
            <div className={`integrity-banner ${d.ok ? '' : 'bad'}`}>
              <ShieldCheck size={32} />
              <div>
                <h2>{d.ok ? 'Integridad verificada' : 'Se detectaron alteraciones'}</h2>
                <p>
                  {d.ok
                    ? 'Todas las firmas coinciden con los datos guardados.'
                    : 'Revisá las tablas afectadas antes de continuar.'}
                </p>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Tabla</th>
                    <th>Registros</th>
                    <th>Firma de tabla</th>
                    <th>Filas alteradas</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {d.tablas.map((t) => (
                    <tr key={t.tabla}>
                      <td>{t.tabla}</td>
                      <td>{t.filas}</td>
                      <td>{t.columna_valida ? 'Válida' : 'No coincide'}</td>
                      <td>{t.filas_alteradas.length}</td>
                      <td>
                        <Badge tone={t.ok ? 'green' : ''}>{t.ok ? 'Verificado' : 'Revisar'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              La verificación compara las firmas de cada registro y de cada tabla. No modifica datos
              ni repara alteraciones automáticamente.
            </p>
          </div>
        )}
      </Resource>
    </>
  );
}
