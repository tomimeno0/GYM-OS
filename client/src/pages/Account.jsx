import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserRound, Trash2, Save } from 'lucide-react';
import { api, useAuth, useAction, pick, date, today } from '../lib';
import { PageTitle, Button, Field, Select, Feedback, Modal, Badge } from '../components/ui';
export default function Account() {
  const { user, setUser } = useAuth(),
    a = useAction(),
    del = useAction();
  const [f, setF] = useState({
      ...pick(user, [
        'nombre',
        'apellido',
        'telefono',
        'fecha_nacimiento',
        'genero',
        'zona_horaria',
      ]),
      telefono: user.telefono || '',
      fecha_nacimiento: user.fecha_nacimiento || '',
    }),
    [removing, setRemoving] = useState(false),
    [password, setPassword] = useState('');
  return (
    <>
      <PageTitle
        title="Tu perfil, al día."
        description="Administrá tu información personal y el acceso a tu cuenta."
      />
      <div className="profile-layout">
        <aside className="card profile-summary">
          <div className="avatar large">
            {user.nombre.slice(0, 1)}
            {user.apellido?.slice(0, 1)}
          </div>
          <h2>
            {user.nombre} {user.apellido}
          </h2>
          <p>{user.email}</p>
          <div className="day-tags">
            {user.roles.map((r) => (
              <Badge key={r.id} tone="green">
                {r.nombre}
              </Badge>
            ))}
          </div>
          <p className="small muted">Miembro desde {date(user.fecha_registro)}</p>
          <ShieldCheck size={28} />
          <p className="small muted">Tus datos físicos y registros pertenecen a tu cuenta.</p>
        </aside>
        <div>
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              a.run(async () => {
                const v = await api(
                  '/me',
                  { ...f, fecha_nacimiento: f.fecha_nacimiento || null },
                  'PATCH',
                );
                setUser(v.user);
              }, 'Tu perfil se actualizó correctamente.');
            }}
          >
            <div className="section-title">
              <h2>Información personal</h2>
              <UserRound size={22} />
            </div>
            <div className="form-grid">
              <Field
                label="Nombre"
                required
                minLength={2}
                maxLength={100}
                value={f.nombre}
                onChange={(e) => setF({ ...f, nombre: e.target.value })}
              />
              <Field
                label="Apellido"
                maxLength={100}
                value={f.apellido}
                onChange={(e) => setF({ ...f, apellido: e.target.value })}
              />
              <Field
                label="Teléfono"
                type="tel"
                maxLength={30}
                value={f.telefono}
                onChange={(e) => setF({ ...f, telefono: e.target.value })}
              />
              <Field
                label="Fecha de nacimiento"
                type="date"
                max={today(user.zona_horaria)}
                value={f.fecha_nacimiento}
                onChange={(e) => setF({ ...f, fecha_nacimiento: e.target.value })}
              />
              <Select
                label="Género"
                value={f.genero}
                onChange={(e) => setF({ ...f, genero: e.target.value })}
              >
                <option value="otro">Otro / Prefiero no indicar</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
              </Select>
              <Field
                label="Zona horaria"
                required
                value={f.zona_horaria}
                hint="Ejemplo: America/Argentina/Buenos_Aires"
                onChange={(e) => setF({ ...f, zona_horaria: e.target.value })}
              />
            </div>
            <Field
              label="Correo electrónico"
              type="email"
              value={user.email}
              readOnly
              hint="El correo identifica tu cuenta y no se modifica desde el perfil."
            />
            <Feedback {...a} />
            <div className="form-actions">
              <Button busy={a.busy}>
                <Save size={16} />
                Guardar cambios
              </Button>
            </div>
          </form>
          <article className="card">
            <h2>Seguridad</h2>
            <p className="muted">
              Para cambiar tu contraseña, solicitá un enlace seguro a tu correo. Las sesiones
              abiertas se cerrarán al restablecerla.
            </p>
            <Link className="btn secondary" to="/recuperar">
              Restablecer contraseña
            </Link>
          </article>
          <article className="card danger-zone">
            <h2>Eliminar mi cuenta</h2>
            <p>
              Esta acción elimina tus datos personales, medidas, objetivos, rutinas, comidas y
              entrenamientos. No se puede deshacer.
            </p>
            <Button variant="danger" onClick={() => setRemoving(true)}>
              <Trash2 size={16} />
              Eliminar cuenta
            </Button>
          </article>
        </div>
      </div>
      {removing && (
        <Modal title="¿Eliminar tu cuenta definitivamente?" onClose={() => setRemoving(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              del.run(async () => {
                await api('/me', { confirmar: true, password }, 'DELETE');
                setUser(null);
              });
            }}
          >
            <p className="muted">
              Se borrarán todos tus registros personales y deportivos. Ingresá tu contraseña actual
              para confirmar.
            </p>
            <Field
              label="Contraseña actual"
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Feedback {...del} />
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setRemoving(false)}>
                Conservar mi cuenta
              </Button>
              <Button variant="danger" busy={del.busy}>
                Eliminar definitivamente
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
