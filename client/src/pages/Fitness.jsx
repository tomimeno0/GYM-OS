import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Dumbbell,
  Flame,
  Plus,
  Target,
  TrendingUp,
  Weight,
  Check,
  Trash2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { GOAL_LABELS, GOAL_TYPES } from '@gym-os/shared/constants';
import {
  api,
  useAuth,
  useResource,
  useAction,
  number,
  date,
  today,
  unitLabel,
  titleCase,
} from '../lib';
import {
  PageTitle,
  Resource,
  Empty,
  Stat,
  Meter,
  Button,
  Field,
  Select,
  Textarea,
  Modal,
  Confirm,
  Feedback,
  Badge,
} from '../components/ui';
export function WeightChart({ measurements }) {
  if (!measurements?.length)
    return (
      <Empty title="Tu historia empieza con un registro">
        Cargá tus medidas para ver tu evolución.
      </Empty>
    );
  const values = measurements.map((m) => ({ ...m, dia: date(m.fecha_medicion) }));
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Evolución de peso: ${values.map((m) => `${m.dia}, ${m.peso_kg} kg`).join('; ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={values} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8df98" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#c8df98" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e7e9e2" strokeDasharray="4 4" />
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 11, fill: '#6b746b' }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            domain={['dataMin - 2', 'dataMax + 2']}
            tick={{ fontSize: 11, fill: '#6b746b' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [`${number(v)} kg`, 'Peso']}
            contentStyle={{ borderRadius: 12, borderColor: '#e0e4dc' }}
          />
          <Area
            type="monotone"
            dataKey="peso_kg"
            stroke="#487353"
            strokeWidth={2.5}
            fill="url(#weight-fill)"
            dot={{ r: 4, fill: '#487353', stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Dashboard() {
  const { user } = useAuth(),
    r = useResource('/dashboard');
  return (
    <>
      <PageTitle
        eyebrow={new Intl.DateTimeFormat('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          timeZone: user.zona_horaria,
        }).format(new Date())}
        title={`Vamos de nuevo, ${user.nombre}.`}
        description="Un paso más cerca de lo que te proponés."
      >
        <Link className="btn secondary" to="/progreso">
          <Plus size={17} />
          Registrar medidas
        </Link>
      </PageTitle>
      <Resource resource={r}>
        {(d) => {
          const p = d.progreso,
            n = d.nutricion,
            g = p.objetivos.find((g) => g.estado === 'activo');
          return (
            <>
              <section className="dashboard-banner">
                <div>
                  <Badge tone="light">TU CONSTANCIA HACE LA DIFERENCIA</Badge>
                  <h2>
                    {d.entrenamiento_activo
                      ? 'Tu entrenamiento te espera.'
                      : 'Hoy es un buen día para avanzar.'}
                  </h2>
                  <p>
                    {d.entrenamiento_activo
                      ? 'Retomá tu sesión y guardá cada repetición.'
                      : 'Encontrá tu rutina, preparate y hacé que cuente.'}
                  </p>
                  <Link
                    className="btn lime"
                    to={
                      d.entrenamiento_activo
                        ? `/entrenamientos/${d.entrenamiento_activo.id}`
                        : '/rutinas'
                    }
                  >
                    {d.entrenamiento_activo ? 'Retomar entrenamiento' : 'Ver mis rutinas'}
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
                <div className="banner-symbol" aria-hidden="true">
                  <Dumbbell strokeWidth={0.9} />
                </div>
              </section>
              <section className="stats-grid">
                <Stat
                  label="Entrenamientos esta semana"
                  value={p.entrenamientos_semana}
                  unit={`/ ${g?.frecuencia_semanal || '—'}`}
                  icon={Dumbbell}
                >
                  {g ? 'Días entrenados / meta semanal' : 'Días con sesiones completas'}
                </Stat>
                <Stat
                  label="Peso actual"
                  value={p.actual ? number(p.actual.peso_kg) : '—'}
                  unit="kg"
                  icon={Weight}
                >
                  {p.actual
                    ? `${date(p.actual.fecha_medicion, user.zona_horaria)} · Última medición`
                    : 'Tu primera medición está pendiente'}
                </Stat>
                <Stat
                  label="Energía registrada hoy"
                  value={number(n.totales.calorias)}
                  unit="kcal"
                  icon={Flame}
                >
                  {n.dieta
                    ? `Objetivo: ${number(n.dieta.calorias_objetivo)} kcal`
                    : 'Sin plan alimentario seleccionado'}
                </Stat>
                <Stat
                  label="Objetivo actual"
                  value={g?.porcentaje == null ? '—' : number(g.porcentaje)}
                  unit="%"
                  icon={Target}
                  accent
                >
                  {g ? g.nombre : 'Definí tu próximo objetivo'}
                </Stat>
              </section>
              <section className="dashboard-grid">
                <article className="card">
                  <div className="section-title">
                    <div>
                      <p className="eyebrow">LA FOTO COMPLETA</p>
                      <h2>Tu evolución</h2>
                    </div>
                    <Link to="/progreso">Ver progreso ↗</Link>
                  </div>
                  <WeightChart measurements={p.mediciones} />
                </article>
                <article className="card">
                  <div className="section-title">
                    <h2>Nutrición de hoy</h2>
                    <Link to="/nutricion">Ver detalle ↗</Link>
                  </div>
                  <div className="macro-total">
                    <strong>{number(n.totales.calorias)}</strong>
                    <span>kcal registradas</span>
                  </div>
                  <Meter
                    label="Proteínas"
                    value={n.totales.proteinas_g}
                    max={n.dieta?.proteinas_objetivo_g || 0}
                    unit="g"
                    color="#537c57"
                  />
                  <Meter
                    label="Carbohidratos"
                    value={n.totales.carbohidratos_g}
                    max={n.dieta?.carbohidratos_objetivo_g || 0}
                    unit="g"
                    color="#bd945f"
                  />
                  <Meter
                    label="Grasas"
                    value={n.totales.grasas_g}
                    max={n.dieta?.grasas_objetivo_g || 0}
                    unit="g"
                    color="#8a8db7"
                  />
                  {!n.dieta && (
                    <p className="muted small">Creá un plan para comparar con tus metas.</p>
                  )}
                </article>
              </section>
              <section className="card">
                <div className="section-title">
                  <h2>Tu próximo movimiento</h2>
                  <Link to="/rutinas">Todas mis rutinas ↗</Link>
                </div>
                {d.rutinas.length ? (
                  <div className="routine-strip">
                    {d.rutinas.map((routine, i) => (
                      <Link
                        key={routine.id}
                        to={`/rutinas/${routine.id}`}
                        className="routine-teaser"
                      >
                        <span className="ordinal">0{i + 1}</span>
                        <div>
                          <h3>{routine.nombre}</h3>
                          <p>{routine.descripcion || 'Tu plan de entrenamiento'}</p>
                        </div>
                        <ArrowUpRight />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Dale estructura a tu entrenamiento"
                    to="/rutinas/nueva"
                    action="Crear mi primera rutina"
                  >
                    Elegí ejercicios, organizá tus días y registrá tus sesiones.
                  </Empty>
                )}
              </section>
            </>
          );
        }}
      </Resource>
    </>
  );
}
function MeasurementForm({ current, onClose, onSaved }) {
  const a = useAction();
  const [f, setF] = useState({
    peso_kg: current?.peso_kg || '',
    altura_cm: current?.altura_cm || '',
    nivel_actividad: current?.nivel_actividad || 'media',
    grasa_corporal: current?.grasa_corporal ?? '',
    musculo_corporal: current?.musculo_corporal ?? '',
    cintura_cm: current?.cintura_cm ?? '',
    pecho_cm: current?.pecho_cm ?? '',
    brazos_cm: current?.brazos_cm ?? '',
    piernas_cm: current?.piernas_cm ?? '',
  });
  return (
    <Modal
      title={current ? 'Registrar nuevas medidas' : 'Tu perfil físico inicial'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.run(async () => {
            const body = Object.fromEntries(
              Object.entries(f).map(([k, v]) => [
                k,
                k === 'nivel_actividad' ? v : v === '' ? null : Number(v),
              ]),
            );
            await api(current ? '/measurements' : '/measurements/initial', body);
            onSaved();
          });
        }}
      >
        <p className="muted">
          {current
            ? 'Guardamos una nueva medición; tu historial anterior se conserva.'
            : 'Empezá con peso y altura. Los demás datos son opcionales.'}
        </p>
        <div className="form-grid">
          {[
            ['peso_kg', 'Peso (kg)', 20, 400],
            ['altura_cm', 'Altura (cm)', 80, 250],
            ['grasa_corporal', 'Grasa corporal (%)', 0, 75],
            ['musculo_corporal', 'Músculo corporal (%)', 0, 90],
            ['cintura_cm', 'Cintura (cm)', 20, 250],
            ['pecho_cm', 'Pecho (cm)', 20, 250],
            ['brazos_cm', 'Brazos (cm)', 5, 100],
            ['piernas_cm', 'Piernas (cm)', 10, 150],
          ].map(([k, l, min, max]) => (
            <Field
              key={k}
              label={l}
              type="number"
              min={min}
              max={max}
              step="0.1"
              required={['peso_kg', 'altura_cm'].includes(k)}
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          ))}
        </div>
        <Select
          label="Nivel de actividad"
          value={f.nivel_actividad}
          onChange={(e) => setF({ ...f, nivel_actividad: e.target.value })}
        >
          {['baja', 'media', 'alta'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Feedback {...a} />
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button busy={a.busy}>Guardar medición</Button>
        </div>
      </form>
    </Modal>
  );
}
export function Progress() {
  const [days, setDays] = useState(90),
    [modal, setModal] = useState(false);
  const r = useResource(`/progress?days=${days}`);
  return (
    <>
      <PageTitle
        title="El progreso está en los detalles."
        description="Observá tus cambios sin perder de vista el recorrido."
      >
        <Button onClick={() => setModal(true)}>
          <Plus size={17} />
          Registrar medidas
        </Button>
      </PageTitle>
      <Resource resource={r}>
        {(p) => (
          <>
            <div className="stats-grid">
              <Stat
                label="Peso inicial"
                value={p.inicial ? number(p.inicial.peso_kg) : '—'}
                unit="kg"
                icon={Weight}
              >
                {date(p.inicial?.fecha_medicion)}
              </Stat>
              <Stat
                label="Peso actual"
                value={p.actual ? number(p.actual.peso_kg) : '—'}
                unit="kg"
                icon={Activity}
              >
                {date(p.actual?.fecha_medicion)}
              </Stat>
              <Stat
                label="Cambio registrado"
                value={
                  p.diferencia_peso == null
                    ? '—'
                    : `${p.diferencia_peso > 0 ? '+' : ''}${number(p.diferencia_peso)}`
                }
                unit="kg"
                icon={TrendingUp}
              >
                Respecto de tu primera medición
              </Stat>
              <Stat
                label="Sesiones completadas"
                value={p.entrenamientos_completados}
                icon={Dumbbell}
                accent
              >
                Desde que empezaste
              </Stat>
            </div>
            <div className="card">
              <div className="section-title">
                <h2>Evolución del peso</h2>
                <Select
                  label="Período"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  {[30, 90, 180, 365, 730].map((n) => (
                    <option key={n} value={n}>
                      {n} días
                    </option>
                  ))}
                </Select>
              </div>
              <WeightChart measurements={p.mediciones} />
            </div>
            <div className="card">
              <div className="section-title">
                <h2>Historial de mediciones</h2>
                <Badge>{p.mediciones.length} registros en el período</Badge>
              </div>
              {p.mediciones.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Peso</th>
                        <th>Altura</th>
                        <th>Grasa</th>
                        <th>Músculo</th>
                        <th>Cintura</th>
                        <th>Pecho</th>
                        <th>Brazos</th>
                        <th>Piernas</th>
                        <th>Actividad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...p.mediciones].reverse().map((m) => (
                        <tr key={m.id}>
                          <td>{date(m.fecha_medicion)}</td>
                          {[
                            'peso_kg',
                            'altura_cm',
                            'grasa_corporal',
                            'musculo_corporal',
                            'cintura_cm',
                            'pecho_cm',
                            'brazos_cm',
                            'piernas_cm',
                          ].map((k) => (
                            <td key={k}>{m[k] == null ? '—' : number(m[k])}</td>
                          ))}
                          <td>{titleCase(m.nivel_actividad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="Todavía no hay mediciones">
                  Registrá tus datos físicos para empezar.
                </Empty>
              )}
            </div>
            <div className="card">
              <div className="section-title">
                <h2>Últimos entrenamientos</h2>
                <Link to="/entrenamientos">Ver historial ↗</Link>
              </div>
              {p.historial_entrenamientos.slice(0, 8).map((w) => (
                <Link to={`/entrenamientos/${w.id}`} className="list-row" key={w.id}>
                  <span>
                    {date(w.fecha)} · {titleCase(w.dia_semana)}
                  </span>
                  <Badge tone={w.estado === 'completado' ? 'green' : ''}>
                    {titleCase(w.estado)}
                  </Badge>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
              {!p.historial_entrenamientos.length && (
                <p className="muted">No hay entrenamientos en este período.</p>
              )}
            </div>
            {modal && (
              <MeasurementForm
                current={p.actual}
                onClose={() => setModal(false)}
                onSaved={() => {
                  setModal(false);
                  r.reload();
                }}
              />
            )}
          </>
        )}
      </Resource>
    </>
  );
}
const units = {
  bajar_peso: 'kg',
  ganar_masa_muscular: 'kg',
  mantener_peso: 'kg',
  definir: 'porcentaje',
  mejorar_resistencia: 'km',
  aumentar_frecuencia_entrenamiento: 'veces_por_semana',
};
function GoalForm({ onClose, onSaved }) {
  const { user } = useAuth(),
    a = useAction();
  const [f, setF] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'bajar_peso',
    valor_objetivo: '',
    frecuencia_semanal: 3,
    actividad_objetivo: 'media',
    fecha_inicio: today(user.zona_horaria),
    fecha_fin_estimada: '',
  });
  const field = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  return (
    <Modal title="Definir un objetivo" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.run(async () => {
            await api('/goals', {
              ...f,
              valor_objetivo: Number(f.valor_objetivo),
              frecuencia_semanal: Number(f.frecuencia_semanal),
              unidad: units[f.tipo],
              fecha_fin_estimada: f.fecha_fin_estimada || null,
            });
            onSaved();
          });
        }}
      >
        <p className="muted">
          Un objetivo activo a la vez para mantener el foco. Necesitás tu perfil físico inicial.
        </p>
        <Field
          label="Nombre del objetivo"
          required
          minLength={2}
          maxLength={100}
          {...field('nombre')}
        />
        <Select label="Tipo de objetivo" {...field('tipo')}>
          {GOAL_TYPES.map((v) => (
            <option value={v} key={v}>
              {GOAL_LABELS[v]}
            </option>
          ))}
        </Select>
        <Textarea label="Descripción" maxLength={2000} {...field('descripcion')} />
        <div className="form-grid">
          <Field
            label={`Valor objetivo (${unitLabel(units[f.tipo])})`}
            type="number"
            min="0.1"
            max="10000"
            step="0.1"
            required
            {...field('valor_objetivo')}
          />
          <Field
            label="Días de entrenamiento por semana"
            type="number"
            min="1"
            max="7"
            required
            {...field('frecuencia_semanal')}
          />
          <Field
            label="Fecha de inicio"
            type="date"
            max={today(user.zona_horaria)}
            required
            {...field('fecha_inicio')}
          />
          <Field
            label="Fecha estimada de logro (opcional)"
            type="date"
            min={f.fecha_inicio}
            {...field('fecha_fin_estimada')}
          />
        </div>
        <Select label="Actividad objetivo" {...field('actividad_objetivo')}>
          {['baja', 'media', 'alta'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </Select>
        <Feedback {...a} />
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button busy={a.busy}>Crear objetivo</Button>
        </div>
      </form>
    </Modal>
  );
}
export function Goals() {
  const r = useResource('/progress'),
    [creating, setCreating] = useState(false),
    [confirm, setConfirm] = useState(null),
    a = useAction();
  return (
    <>
      <PageTitle
        title="Una dirección clara."
        description="Definí qué querés lograr y seguí cada avance."
      >
        <Button
          disabled={!r.data?.actual || r.data?.objetivos.some((g) => g.estado === 'activo')}
          onClick={() => setCreating(true)}
        >
          <Plus size={17} />
          Nuevo objetivo
        </Button>
      </PageTitle>
      <Resource resource={r}>
        {(p) => (
          <>
            {!p.actual && (
              <div className="notice">
                Primero cargá tu perfil físico. <Link to="/progreso">Registrar medidas →</Link>
              </div>
            )}
            {!p.objetivos.length ? (
              <Empty
                title="¿Qué te gustaría lograr?"
                onClick={p.actual ? () => setCreating(true) : undefined}
                action="Definir mi objetivo"
              >
                Tu objetivo te ayuda a darle sentido a cada entrenamiento.
              </Empty>
            ) : (
              p.objetivos.map((g) => (
                <article
                  className={`card goal-card ${g.estado === 'activo' ? 'active-goal' : ''}`}
                  key={g.id}
                >
                  <div className="section-title">
                    <Badge tone={g.estado === 'activo' ? 'green' : ''}>
                      {g.estado === 'activo' ? 'OBJETIVO ACTIVO' : 'COMPLETADO'}
                    </Badge>
                    <span className="muted small">Desde {date(g.fecha_inicio)}</span>
                  </div>
                  <h2>{g.nombre}</h2>
                  <p className="muted">{g.descripcion || GOAL_LABELS[g.tipo]}</p>
                  <div className="goal-values">
                    <div>
                      <span>Punto de partida</span>
                      <strong>
                        {number(g.valor_inicial)} <small>{unitLabel(g.unidad)}</small>
                      </strong>
                    </div>
                    <div>
                      <span>Registro actual</span>
                      <strong>
                        {g.valor_actual == null ? '—' : number(g.valor_actual)}{' '}
                        <small>{unitLabel(g.unidad)}</small>
                      </strong>
                    </div>
                    <div>
                      <span>Tu meta</span>
                      <strong>
                        {number(g.valor_objetivo)} <small>{unitLabel(g.unidad)}</small>
                      </strong>
                    </div>
                  </div>
                  <Meter label="Avance medido" value={g.porcentaje || 0} max={100} unit="%" />
                  <p className="small muted">
                    {g.frecuencia_semanal} días de entrenamiento por semana ·{' '}
                    {g.fecha_fin_estimada
                      ? `Fecha estimada: ${date(g.fecha_fin_estimada)}`
                      : 'Sin fecha límite'}
                    {g.estado === 'completado' ? ' · Marcado como cumplido por vos.' : ''}
                  </p>
                  <div className="actions">
                    {g.estado === 'activo' && (
                      <Button
                        onClick={() => {
                          a.setError(null);
                          setConfirm({ g, type: 'complete' });
                        }}
                      >
                        <Check size={16} />
                        Marcar como cumplido
                      </Button>
                    )}
                    <Button
                      variant="ghost danger-text"
                      onClick={() => {
                        a.setError(null);
                        setConfirm({ g, type: 'delete' });
                      }}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </Button>
                  </div>
                </article>
              ))
            )}
          </>
        )}
      </Resource>
      {creating && (
        <GoalForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            r.reload();
          }}
        />
      )}
      {confirm && (
        <Confirm
          title={
            confirm.type === 'complete' ? '¿Cumpliste tu objetivo?' : '¿Eliminar este objetivo?'
          }
          onClose={() => setConfirm(null)}
          busy={a.busy}
          error={a.error}
          onConfirm={() =>
            a.run(async () => {
              await api(
                `/goals/${confirm.g.id}${confirm.type === 'complete' ? '/complete' : ''}`,
                { confirmar: true },
                confirm.type === 'complete' ? 'POST' : 'DELETE',
              );
              setConfirm(null);
              r.reload();
            })
          }
        >
          {confirm.type === 'complete'
            ? 'Se guardará como completado y podrás definir uno nuevo. El progreso medido se conserva por separado.'
            : 'El objetivo dejará de aparecer. Tus mediciones y entrenamientos se conservan.'}
        </Confirm>
      )}
    </>
  );
}
