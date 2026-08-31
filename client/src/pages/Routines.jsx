import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Dumbbell,
  Plus,
  Trash2,
  Pencil,
  Play,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import { DAYS } from '@gym-os/shared/constants';
import { api, useResource, useAction, pick, date, number, titleCase } from '../lib';
import {
  Resource,
  PageTitle,
  Empty,
  Button,
  Badge,
  Field,
  Textarea,
  Select,
  Feedback,
  Modal,
  Confirm,
  Pager,
} from '../components/ui';
const exerciseKeys = [
  'ejercicio_id',
  'nombre_ejercicio',
  'grupo_muscular',
  'dia_semana',
  'orden',
  'series',
  'repeticiones',
  'peso_sugerido_kg',
  'descanso_segundos',
  'observaciones',
];
export function ExerciseCatalog({ onSelect }) {
  const [query, setQuery] = useState(''),
    [q, setQ] = useState(''),
    [category, setCategory] = useState(''),
    [equipment, setEquipment] = useState(''),
    [page, setPage] = useState(1),
    [detail, setDetail] = useState(null);
  const r = useResource(
    `/exercises?${new URLSearchParams({ q, category, equipment, page, limit: 24 })}`,
  );
  return (
    <>
      {!onSelect && (
        <PageTitle
          title="Encontrá tu próximo ejercicio."
          description="1.324 ejercicios con instrucciones. Buscá por nombre, músculo o equipamiento."
        />
      )}
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(query);
        }}
      >
        <Field
          label="Buscar ejercicios"
          placeholder="Por ejemplo: espalda, sentadilla, dumbbell…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit">
          <Search size={17} />
          Buscar
        </Button>
      </form>
      <div className="filters">
        <Select
          label="Grupo muscular"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          {r.data?.filters.categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          label="Equipamiento"
          value={equipment}
          onChange={(e) => {
            setEquipment(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          {r.data?.filters.equipment.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      <Resource resource={r}>
        {(d) => (
          <>
            {!d.items.length && (
              <Empty title="No encontramos coincidencias">
                Probá con otro nombre o quitá los filtros.
              </Empty>
            )}
            <div className="exercise-grid">
              {d.items.map((e) => (
                <article className="exercise-card" key={e.id}>
                  <div className="exercise-symbol">
                    <Dumbbell size={23} />
                    <span>#{e.id}</span>
                  </div>
                  <Badge>
                    {d.filters.categories.find((c) => c.value === e.category)?.label || e.category}
                  </Badge>
                  <h3>{titleCase(e.name)}</h3>
                  <p>
                    {d.filters.equipment.find((c) => c.value === e.equipment)?.label || e.equipment}{' '}
                    · {e.target}
                  </p>
                  <div className="actions">
                    <Button variant="secondary" onClick={() => setDetail(e)}>
                      Instrucciones
                    </Button>
                    {onSelect && (
                      <Button onClick={() => onSelect(e)}>
                        <Plus size={15} />
                        Agregar
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <Pager page={page} total={d.total} limit={24} onChange={setPage} />
            <p className="small muted">
              Datos de{' '}
              <a
                href="https://github.com/hasaneyldrm/exercises-dataset"
                target="_blank"
                rel="noreferrer"
              >
                exercises-dataset
              </a>
              , licencia MIT. No se incluyen imágenes o GIF con licencia separada. Las instrucciones
              son una referencia; adaptá el ejercicio con un profesional.
            </p>
          </>
        )}
      </Resource>
      {detail && (
        <Modal title={titleCase(detail.name)} onClose={() => setDetail(null)}>
          <Badge>{detail.equipment}</Badge>
          <p className="muted">Músculo principal: {detail.target}</p>
          {Array.isArray(detail.instructions.es) ? (
            <ol className="instructions">
              {detail.instructions.es.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          ) : (
            <p className="pre-wrap">{detail.instructions.es || detail.instructions.en}</p>
          )}
          {onSelect && (
            <Button
              onClick={() => {
                onSelect(detail);
                setDetail(null);
              }}
            >
              Agregar a mi rutina
            </Button>
          )}
        </Modal>
      )}
    </>
  );
}
export function RoutineList() {
  const r = useResource('/routines');
  return (
    <>
      <PageTitle
        title="Tu plan. Tu ritmo."
        description="Organizá tus días y encontrá el próximo paso."
      >
        <Link className="btn secondary" to="/asistente">
          Generar con IA
        </Link>
        <Link className="btn" to="/rutinas/nueva">
          <Plus size={17} />
          Crear rutina
        </Link>
      </PageTitle>
      <Resource resource={r}>
        {(d) =>
          d.items.length ? (
            <div className="plan-grid">
              {d.items.map((v, i) => (
                <article className="card plan-card" key={v.id}>
                  <div className="section-title">
                    <span className="ordinal">{String(i + 1).padStart(2, '0')}</span>
                    <Badge tone="green">{v.tipo_generacion === 'ia' ? 'IA' : 'MANUAL'}</Badge>
                  </div>
                  <h2>{v.nombre}</h2>
                  <p className="muted">{v.descripcion || 'Tu plan de entrenamiento personal.'}</p>
                  <div className="day-tags">
                    {DAYS.filter((day) => v.ejercicios.some((e) => e.dia_semana === day)).map(
                      (day) => (
                        <Badge key={day}>{titleCase(day)}</Badge>
                      ),
                    )}
                  </div>
                  <div className="plan-bottom">
                    <span>{v.ejercicios.length} ejercicios</span>
                    <Link className="btn secondary" to={`/rutinas/${v.id}`}>
                      Abrir rutina
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty title="Tu próxima rutina empieza acá" to="/rutinas/nueva" action="Crear rutina">
              Elegí ejercicios del catálogo o agregá los tuyos.
            </Empty>
          )
        }
      </Resource>
    </>
  );
}
export function RoutineEditor() {
  const { id } = useParams(),
    r = useResource(id ? `/routines/${id}` : '/goals');
  return (
    <Resource resource={r}>
      {(d) => <RoutineForm key={id || 'new'} initial={id ? d : null} />}
    </Resource>
  );
}
function RoutineForm({ initial }) {
  const navigate = useNavigate(),
    a = useAction(),
    goals = useResource('/goals');
  const [f, setF] = useState(
      initial
        ? {
            nombre: initial.nombre,
            descripcion: initial.descripcion,
            objetivo_id: initial.objetivo_id,
            ejercicios: initial.ejercicios.map((e) => pick(e, exerciseKeys)),
          }
        : { nombre: '', descripcion: '', objetivo_id: null, ejercicios: [] },
    ),
    [day, setDay] = useState('lunes'),
    [catalog, setCatalog] = useState(false);
  function update(index, key, value) {
    setF((v) => ({
      ...v,
      ejercicios: v.ejercicios.map((e, i) => (i === index ? { ...e, [key]: value } : e)),
    }));
  }
  function add(e) {
    setF((v) => ({
      ...v,
      ejercicios: [
        ...v.ejercicios,
        {
          ejercicio_id: e?.id || null,
          nombre_ejercicio: e?.name || '',
          grupo_muscular: e?.category || '',
          dia_semana: day,
          orden: v.ejercicios.length,
          series: 3,
          repeticiones: 10,
          peso_sugerido_kg: 0,
          descanso_segundos: 90,
          observaciones: '',
        },
      ],
    }));
    setCatalog(false);
  }
  function move(i, offset) {
    const candidates = f.ejercicios
      .map((e, index) => ({ e, index }))
      .filter((x) => x.e.dia_semana === day);
    const at = candidates.findIndex((x) => x.index === i),
      other = candidates[at + offset];
    if (!other) return;
    const list = [...f.ejercicios];
    [list[i], list[other.index]] = [list[other.index], list[i]];
    setF({ ...f, ejercicios: list });
  }
  return (
    <>
      <PageTitle
        eyebrow={initial ? 'EDITAR RUTINA' : 'NUEVA RUTINA'}
        title={initial ? 'Ajustá tu plan.' : 'Construí tu próxima rutina.'}
        description="Agregá ejercicios a cada día. Las sesiones anteriores conservarán sus datos."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.run(async () => {
            const result = await api(
              initial ? `/routines/${initial.id}` : '/routines',
              { ...f, ejercicios: f.ejercicios.map((v, i) => ({ ...v, orden: i })) },
              initial ? 'PUT' : 'POST',
            );
            navigate(`/rutinas/${result.id}`);
          });
        }}
      >
        <div className="card">
          <div className="form-grid">
            <Field
              label="Nombre de la rutina"
              required
              minLength={2}
              maxLength={100}
              value={f.nombre}
              onChange={(e) => setF({ ...f, nombre: e.target.value })}
            />
            <Select
              label="Objetivo asociado"
              value={f.objetivo_id || ''}
              onChange={(e) => setF({ ...f, objetivo_id: e.target.value || null })}
            >
              <option value="">Sin objetivo asociado</option>
              {goals.data?.items
                .filter((g) => g.estado === 'activo' || g.id === f.objetivo_id)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                    {g.estado !== 'activo' ? ' (completado; desvincular para editar)' : ''}
                  </option>
                ))}
            </Select>
          </div>
          <Textarea
            label="Descripción"
            maxLength={2000}
            value={f.descripcion}
            onChange={(e) => setF({ ...f, descripcion: e.target.value })}
          />
        </div>
        <div className="day-tabs" aria-label="Día de la rutina">
          {DAYS.map((v) => (
            <button
              key={v}
              type="button"
              className={v === day ? 'selected' : ''}
              aria-pressed={v === day}
              onClick={() => setDay(v)}
            >
              {titleCase(v).slice(0, 3)}
              <span>{f.ejercicios.filter((e) => e.dia_semana === v).length}</span>
            </button>
          ))}
        </div>
        <div className="section-title">
          <h2>{titleCase(day)}</h2>
          <div className="actions">
            <Button type="button" variant="secondary" onClick={() => add(null)}>
              Ejercicio propio
            </Button>
            <Button type="button" onClick={() => setCatalog(true)}>
              <Plus size={17} />
              Elegir del catálogo
            </Button>
          </div>
        </div>
        {!f.ejercicios.some((e) => e.dia_semana === day) && (
          <Empty title="Un día para armar a tu medida">
            Agregá ejercicios o dejalo libre para descansar.
          </Empty>
        )}
        {f.ejercicios.map(
          (ex, index) =>
            ex.dia_semana === day && (
              <article className="card exercise-editor" key={index}>
                <div className="section-title">
                  <Badge>
                    {ex.ejercicio_id ? `CATÁLOGO / ${ex.ejercicio_id}` : 'EJERCICIO PROPIO'}
                  </Badge>
                  <div className="actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Subir ejercicio"
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp size={17} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Bajar ejercicio"
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={17} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger-text"
                      aria-label={`Quitar ${ex.nombre_ejercicio || 'ejercicio'}`}
                      onClick={() =>
                        setF({ ...f, ejercicios: f.ejercicios.filter((_, i) => i !== index) })
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <Field
                    label="Nombre del ejercicio"
                    required
                    readOnly={!!ex.ejercicio_id}
                    minLength={2}
                    maxLength={150}
                    value={ex.nombre_ejercicio}
                    onChange={(e) => update(index, 'nombre_ejercicio', e.target.value)}
                  />
                  <Field
                    label="Grupo muscular"
                    readOnly={!!ex.ejercicio_id}
                    maxLength={100}
                    value={ex.grupo_muscular}
                    onChange={(e) => update(index, 'grupo_muscular', e.target.value)}
                  />
                </div>
                <div className="form-grid four">
                  {[
                    ['series', 'Series', 1, 20, 1],
                    ['repeticiones', 'Repeticiones', 1, 200, 1],
                    ['peso_sugerido_kg', 'Carga (kg)', 0, 1000, 0.1],
                    ['descanso_segundos', 'Descanso (seg.)', 0, 1800, 1],
                  ].map(([k, l, min, max, step]) => (
                    <Field
                      key={k}
                      label={l}
                      type="number"
                      required
                      min={min}
                      max={max}
                      step={step}
                      value={ex[k]}
                      onChange={(e) => update(index, k, Number(e.target.value))}
                    />
                  ))}
                </div>
                <Field
                  label="Indicaciones (opcional)"
                  maxLength={2000}
                  value={ex.observaciones}
                  onChange={(e) => update(index, 'observaciones', e.target.value)}
                />
              </article>
            ),
        )}
        <Feedback {...a} />
        <div className="sticky-actions">
          <span>
            {f.ejercicios.length} ejercicios · {new Set(f.ejercicios.map((e) => e.dia_semana)).size}{' '}
            días
          </span>
          <div className="actions">
            <Link className="btn secondary" to={initial ? `/rutinas/${initial.id}` : '/rutinas'}>
              Cancelar
            </Link>
            <Button busy={a.busy} disabled={!f.ejercicios.length}>
              Guardar rutina
            </Button>
          </div>
        </div>
      </form>
      {catalog && (
        <Modal title={`Elegí ejercicios para ${day}`} wide onClose={() => setCatalog(false)}>
          <ExerciseCatalog onSelect={add} />
        </Modal>
      )}
    </>
  );
}
export function RoutineDetail() {
  const { id } = useParams(),
    navigate = useNavigate(),
    r = useResource(`/routines/${id}`),
    a = useAction();
  const [day, setDay] = useState(null),
    [remove, setRemove] = useState(false);
  return (
    <Resource resource={r}>
      {(v) => {
        const selected = day || DAYS.find((d) => v.ejercicios.some((e) => e.dia_semana === d));
        return (
          <>
            <PageTitle eyebrow="MI RUTINA" title={v.nombre} description={v.descripcion}>
              <Link className="btn secondary" to={`/rutinas/${id}/editar`}>
                <Pencil size={16} />
                Editar
              </Link>
              <Button variant="ghost danger-text" onClick={() => setRemove(true)}>
                <Trash2 size={17} />
                Eliminar
              </Button>
            </PageTitle>
            <div className="day-tabs">
              {DAYS.filter((d) => v.ejercicios.some((e) => e.dia_semana === d)).map((d) => (
                <button
                  key={d}
                  className={selected === d ? 'selected' : ''}
                  aria-pressed={selected === d}
                  onClick={() => setDay(d)}
                >
                  {titleCase(d)}
                </button>
              ))}
            </div>
            <div className="card">
              <div className="section-title">
                <h2>{titleCase(selected)}</h2>
                <Badge>
                  {v.ejercicios.filter((e) => e.dia_semana === selected).length} ejercicios
                </Badge>
              </div>
              {v.ejercicios
                .filter((e) => e.dia_semana === selected)
                .map((e, i) => (
                  <div className="exercise-row" key={e.id}>
                    <span className="ordinal">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{titleCase(e.nombre_ejercicio)}</h3>
                      <p>
                        {e.series} series × {e.repeticiones} repeticiones ·{' '}
                        {number(e.peso_sugerido_kg)} kg · {e.descanso_segundos}s de descanso
                      </p>
                      {e.observaciones && <p className="small">{e.observaciones}</p>}
                    </div>
                    <Dumbbell size={21} />
                  </div>
                ))}
            </div>
            <Feedback {...a} />
            <div className="sticky-actions">
              <span>Prepará tu espacio. Vamos paso a paso.</span>
              <Button
                busy={a.busy}
                onClick={() =>
                  a.run(async () => {
                    const w = await api('/workouts', { rutina_id: id, dia_semana: selected });
                    navigate(`/entrenamientos/${w.id}`);
                  })
                }
              >
                <Play size={17} />
                Comenzar entrenamiento
              </Button>
            </div>
            {remove && (
              <Confirm
                title="¿Eliminar esta rutina?"
                onClose={() => setRemove(false)}
                busy={a.busy}
                error={a.error}
                onConfirm={() =>
                  a.run(async () => {
                    await api(`/routines/${id}`, { confirmar: true }, 'DELETE');
                    navigate('/rutinas');
                  })
                }
              >
                Se quitará de tus rutinas. El historial de entrenamientos se conserva.
              </Confirm>
            )}
          </>
        );
      }}
    </Resource>
  );
}
export function Workouts() {
  const [page, setPage] = useState(1),
    r = useResource(`/workouts?page=${page}`);
  return (
    <>
      <PageTitle title="Cada sesión cuenta." description="Tu historial completo de entrenamiento.">
        <Link className="btn" to="/rutinas">
          <Dumbbell size={17} />
          Elegir rutina
        </Link>
      </PageTitle>
      <Resource resource={r}>
        {(d) =>
          d.items.length ? (
            <div className="card">
              {d.items.map((w) => (
                <Link className="list-row workout-list" key={w.id} to={`/entrenamientos/${w.id}`}>
                  <span className="empty-icon">
                    <Dumbbell size={23} />
                  </span>
                  <div>
                    <h3>{w.nombre_rutina}</h3>
                    <p>
                      {date(w.fecha)} · {titleCase(w.dia_semana)} ·{' '}
                      {w.ejercicios.filter((e) => e.realizado).length}/{w.ejercicios.length}{' '}
                      ejercicios
                    </p>
                  </div>
                  <Badge tone={w.estado === 'completado' ? 'green' : ''}>
                    {titleCase(w.estado)}
                  </Badge>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
              <Pager page={page} total={d.total} onChange={setPage} />
            </div>
          ) : (
            <Empty title="Tu primera sesión te espera" to="/rutinas" action="Ver mis rutinas">
              Elegí una rutina para comenzar a registrar tu entrenamiento.
            </Empty>
          )
        }
      </Resource>
    </>
  );
}
export function WorkoutDetail() {
  const { id } = useParams(),
    r = useResource(`/workouts/${id}`);
  return <Resource resource={r}>{(d) => <WorkoutForm key={d.id} initial={d} />}</Resource>;
}
function WorkoutForm({ initial }) {
  const [f, setF] = useState(initial),
    a = useAction(),
    [confirm, setConfirm] = useState(null);
  const finished = f.estado !== 'iniciado';
  const done = f.ejercicios.filter((e) => e.realizado).length;
  function save(state) {
    return a.run(
      async () => {
        const v = await api(
          `/workouts/${f.id}`,
          {
            estado: state,
            distancia_km: Number(f.distancia_km || 0),
            observaciones: f.observaciones || '',
            ejercicios: f.ejercicios.map((e) => ({
              ...pick(e, ['id', 'series', 'repeticiones', 'peso_utilizado_kg', 'realizado']),
              realizado: !!e.realizado,
              observaciones: e.observaciones || '',
            })),
          },
          'PUT',
        );
        setF(v);
        setConfirm(null);
      },
      state === 'iniciado' ? 'Avance guardado.' : 'Entrenamiento guardado.',
    );
  }
  function edit(i, k, v) {
    setF({ ...f, ejercicios: f.ejercicios.map((e, j) => (i === j ? { ...e, [k]: v } : e)) });
  }
  return (
    <>
      <PageTitle
        eyebrow="SESIÓN DE ENTRENAMIENTO"
        title={f.nombre_rutina}
        description={`${date(f.fecha)} · ${titleCase(f.dia_semana)}`}
      >
        <Badge tone={finished ? '' : 'green'}>{titleCase(f.estado)}</Badge>
      </PageTitle>
      <div className="session-progress">
        <strong>
          {done}
          <span> / {f.ejercicios.length} ejercicios</span>
        </strong>
        <div className="track">
          <span style={{ width: `${(done / f.ejercicios.length) * 100}%` }} />
        </div>
      </div>
      {f.ejercicios.map((e, i) => (
        <article className={`card workout-exercise ${e.realizado ? 'done' : ''}`} key={e.id}>
          <div className="section-title">
            <h2>
              <span className="ordinal">{String(i + 1).padStart(2, '0')}</span>
              {titleCase(e.nombre_ejercicio)}
            </h2>
            <label className="check">
              <input
                type="checkbox"
                disabled={finished}
                checked={!!e.realizado}
                onChange={(ev) => edit(i, 'realizado', ev.target.checked)}
              />
              Realizado
            </label>
          </div>
          <div className="form-grid three">
            {[
              ['series', 'Series realizadas', 20],
              ['repeticiones', 'Repeticiones', 200],
              ['peso_utilizado_kg', 'Carga utilizada (kg)', 1000],
            ].map(([k, l, max]) => (
              <Field
                key={k}
                label={l}
                type="number"
                disabled={finished}
                min="0"
                max={max}
                step={k === 'peso_utilizado_kg' ? '0.1' : '1'}
                value={e[k]}
                onChange={(ev) => edit(i, k, Number(ev.target.value))}
              />
            ))}
          </div>
          <Field
            label="Notas del ejercicio"
            disabled={finished}
            value={e.observaciones || ''}
            onChange={(ev) => edit(i, 'observaciones', ev.target.value)}
          />
        </article>
      ))}
      <div className="card">
        <div className="form-grid">
          <Field
            label="Distancia recorrida (km, si corresponde)"
            type="number"
            min="0"
            max="500"
            step="0.01"
            disabled={finished}
            value={f.distancia_km || 0}
            onChange={(e) => setF({ ...f, distancia_km: Number(e.target.value) })}
          />
          <Field
            label="Notas de la sesión"
            disabled={finished}
            value={f.observaciones || ''}
            onChange={(e) => setF({ ...f, observaciones: e.target.value })}
          />
        </div>
      </div>
      <Feedback {...a} />
      {!finished ? (
        <div className="sticky-actions">
          <Button variant="ghost danger-text" onClick={() => setConfirm('cancelado')}>
            Cancelar sesión
          </Button>
          <div className="actions">
            <Button variant="secondary" busy={a.busy} onClick={() => save('iniciado')}>
              Guardar avance
            </Button>
            <Button
              disabled={!done}
              onClick={() => setConfirm(done === f.ejercicios.length ? 'completado' : 'incompleto')}
            >
              Finalizar entrenamiento
            </Button>
          </div>
        </div>
      ) : (
        <Link className="btn" to="/entrenamientos">
          Volver al historial
        </Link>
      )}
      {confirm && (
        <Confirm
          title={
            confirm === 'cancelado' ? '¿Cancelar esta sesión?' : '¿Finalizar el entrenamiento?'
          }
          onClose={() => setConfirm(null)}
          busy={a.busy}
          error={a.error}
          onConfirm={() => save(confirm)}
        >
          {confirm === 'incompleto'
            ? 'Quedan ejercicios sin realizar. La sesión se guardará como incompleta.'
            : confirm === 'completado'
              ? 'Completaste todos los ejercicios. Se guardarán tus registros.'
              : 'La sesión quedará cancelada en tu historial.'}{' '}
          Una sesión finalizada no se puede reabrir.
        </Confirm>
      )}
    </>
  );
}
