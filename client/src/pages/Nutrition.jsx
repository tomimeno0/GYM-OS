import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowUpRight, Search, Utensils, Flame } from 'lucide-react';
import { MEAL_TYPES } from '@gym-os/shared/constants';
import {
  api,
  useResource,
  useAction,
  useAuth,
  number,
  today,
  titleCase,
  pick,
  localDateTime,
} from '../lib';
import {
  PageTitle,
  Resource,
  Empty,
  Button,
  Badge,
  Field,
  Textarea,
  Select,
  Feedback,
  Modal,
  Confirm,
  Stat,
  Meter,
} from '../components/ui';
const foodKeys = [
  'nombre',
  'cantidad',
  'unidad',
  'calorias',
  'proteinas_g',
  'carbohidratos_g',
  'grasas_g',
  'fuente',
];
const mealKeys = ['nombre_comida', 'tipo_comida', 'hora', 'observaciones', 'alimentos'];
const targetKeys = [
  'calorias_objetivo',
  'proteinas_objetivo_g',
  'carbohidratos_objetivo_g',
  'grasas_objetivo_g',
];
const blankFood = () => ({
  nombre: '',
  cantidad: 100,
  unidad: 'g',
  calorias: 0,
  proteinas_g: 0,
  carbohidratos_g: 0,
  grasas_g: 0,
  fuente: 'Registro manual',
});
const blankMeal = () => ({
  nombre_comida: '',
  tipo_comida: 'desayuno',
  hora: '08:00',
  observaciones: '',
  alimentos: [blankFood()],
});
function estimate(foods) {
  const totals = { calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 };
  for (const f of foods)
    for (const k of Object.keys(totals))
      totals[k] += (Number(f[k]) * Number(f.cantidad)) / (f.unidad === 'porcion' ? 1 : 100);
  return totals;
}
function FoodSearch({ onSelect, onClose }) {
  const [q, setQ] = useState(''),
    [items, setItems] = useState(null),
    a = useAction();
  return (
    <Modal title="Buscar alimentos" onClose={onClose}>
      <p className="muted">
        Buscá por nombre o código de barras. Confirmá siempre los valores con la etiqueta del
        producto.
      </p>
      <div className="search-bar">
        <Field label="Nombre o código de barras" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button
          type="button"
          busy={a.busy}
          disabled={q.trim().length < 2}
          onClick={() =>
            a.run(async () =>
              setItems(
                (
                  await api(
                    `/foods?${/^\d{8,14}$/.test(q.trim()) ? 'barcode' : 'q'}=${encodeURIComponent(q.trim())}`,
                  )
                ).items,
              ),
            )
          }
        >
          <Search size={17} />
          Buscar
        </Button>
      </div>
      <Feedback {...a} />
      {items?.length === 0 && (
        <Empty title="Sin resultados">Podés registrar el alimento manualmente.</Empty>
      )}
      {items?.map((f, i) => (
        <article className="food-result" key={i}>
          <div>
            <h3>{f.nombre}</h3>
            <p>
              {f.marca} ·{' '}
              {f.disponible ? `${f.calorias} kcal / 100 g` : 'Información nutricional incompleta'}
            </p>
          </div>
          <Button
            type="button"
            disabled={!f.disponible}
            onClick={() => {
              onSelect(pick(f, foodKeys));
              onClose();
            }}
          >
            Agregar
          </Button>
        </article>
      ))}
      <p className="small muted">
        Fuente: Open Food Facts · ODbL. Base colaborativa; no es una recomendación nutricional.
      </p>
    </Modal>
  );
}
export function FoodEditor({ foods, onChange }) {
  const [search, setSearch] = useState(false);
  const update = (i, k, v) => onChange(foods.map((f, j) => (i === j ? { ...f, [k]: v } : f)));
  const total = estimate(foods);
  return (
    <div className="food-editor">
      {foods.map((f, i) => (
        <fieldset className="food-fields" key={i}>
          <legend>Alimento {i + 1}</legend>
          <div className="section-title">
            <Field
              label="Nombre del alimento"
              required
              minLength={2}
              maxLength={150}
              value={f.nombre}
              onChange={(e) => update(i, 'nombre', e.target.value)}
            />
            <button
              type="button"
              className="icon-btn danger-text"
              aria-label={`Quitar alimento ${i + 1}`}
              disabled={foods.length === 1}
              onClick={() => onChange(foods.filter((_, j) => i !== j))}
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div className="form-grid">
            <Field
              label="Cantidad consumida / planificada"
              required
              type="number"
              min="0.1"
              max="10000"
              step="0.1"
              value={f.cantidad}
              onChange={(e) => update(i, 'cantidad', Number(e.target.value))}
            />
            <Select
              label="Unidad"
              value={f.unidad}
              onChange={(e) => update(i, 'unidad', e.target.value)}
            >
              <option value="g">Gramos</option>
              <option value="ml">Mililitros</option>
              <option value="porcion">Porciones</option>
            </Select>
          </div>
          <p className="input-help">
            <strong>
              Valores de la etiqueta por {f.unidad === 'porcion' ? '1 porción' : `100 ${f.unidad}`}.
            </strong>{' '}
            Calculamos el total según la cantidad indicada arriba.
          </p>
          <div className="form-grid four">
            {[
              ['calorias', 'Energía (kcal)', 10000],
              ['proteinas_g', 'Proteínas (g)', 1000],
              ['carbohidratos_g', 'Carbohidratos (g)', 1000],
              ['grasas_g', 'Grasas (g)', 1000],
            ].map(([k, l, max]) => (
              <Field
                key={k}
                label={l}
                type="number"
                required
                min="0"
                max={max}
                step="0.1"
                value={f[k]}
                onChange={(e) => update(i, k, Number(e.target.value))}
              />
            ))}
          </div>
          <p className="small muted">{f.fuente}</p>
        </fieldset>
      ))}
      <div className="actions">
        <Button type="button" variant="secondary" onClick={() => onChange([...foods, blankFood()])}>
          <Plus size={15} />
          Otro alimento
        </Button>
        <Button type="button" variant="ghost" onClick={() => setSearch(true)}>
          <Search size={15} />
          Buscar en Open Food Facts
        </Button>
      </div>
      <div className="meal-totals">
        <strong>{number(total.calorias)} kcal</strong>
        <span>P {number(total.proteinas_g)} g</span>
        <span>C {number(total.carbohidratos_g)} g</span>
        <span>G {number(total.grasas_g)} g</span>
      </div>
      {search && (
        <FoodSearch
          onClose={() => setSearch(false)}
          onSelect={(f) => onChange(foods.length === 1 && !foods[0].nombre ? [f] : [...foods, f])}
        />
      )}
    </div>
  );
}
function ConsumedForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(
      initial
        ? {
            nombre_comida: initial.nombre_comida,
            tipo_comida: initial.tipo_comida,
            fecha_consumo: localDateTime(initial.fecha_consumo),
            alimentos: initial.alimentos.map((f) => pick(f, foodKeys)),
          }
        : {
            nombre_comida: '',
            tipo_comida: 'desayuno',
            fecha_consumo: localDateTime(),
            alimentos: [blankFood()],
          },
    ),
    a = useAction();
  return (
    <Modal
      wide
      title={initial ? 'Editar comida registrada' : 'Registrar una comida'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.run(async () => {
            await api(
              initial ? `/consumed/${initial.id}` : '/consumed',
              { ...f, fecha_consumo: new Date(f.fecha_consumo).toISOString() },
              initial ? 'PUT' : 'POST',
            );
            onSaved();
          });
        }}
      >
        <div className="form-grid">
          <Field
            label="Nombre de la comida"
            required
            minLength={2}
            maxLength={150}
            value={f.nombre_comida}
            onChange={(e) => setF({ ...f, nombre_comida: e.target.value })}
          />
          <Select
            label="Momento del día"
            value={f.tipo_comida}
            onChange={(e) => setF({ ...f, tipo_comida: e.target.value })}
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {titleCase(m)}
              </option>
            ))}
          </Select>
        </div>
        <Field
          label="Fecha y hora (zona horaria de este dispositivo)"
          type="datetime-local"
          required
          max={localDateTime()}
          value={f.fecha_consumo}
          onChange={(e) => setF({ ...f, fecha_consumo: e.target.value })}
        />
        <FoodEditor foods={f.alimentos} onChange={(alimentos) => setF({ ...f, alimentos })} />
        <Feedback {...a} />
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button busy={a.busy}>Guardar comida</Button>
        </div>
      </form>
    </Modal>
  );
}
export function Nutrition() {
  const { user } = useAuth(),
    [day, setDay] = useState(today(user.zona_horaria)),
    [diet, setDiet] = useState(''),
    r = useResource(`/nutrition?${new URLSearchParams({ date: day, ...(diet ? { diet } : {}) })}`),
    diets = useResource('/diets'),
    [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null),
    a = useAction();
  return (
    <>
      <PageTitle
        title="Alimentá tu constancia."
        description="Tus comidas y macros, con el contexto que necesitás."
      >
        <Link className="btn secondary" to="/dietas">
          Mis planes
        </Link>
        <Button onClick={() => setEdit({})}>
          <Plus size={17} />
          Registrar comida
        </Button>
      </PageTitle>
      <div className="filters">
        <Field
          label="Día"
          type="date"
          max={today(user.zona_horaria)}
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
        />
        <Select label="Comparar con el plan" value={diet} onChange={(e) => setDiet(e.target.value)}>
          <option value="">Último plan activo</option>
          {diets.data?.items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </Select>
      </div>
      <Resource resource={r}>
        {(n) => (
          <>
            <div className="stats-grid">
              <Stat
                label="Energía registrada"
                value={number(n.totales.calorias)}
                unit="kcal"
                icon={Flame}
                accent
              >
                {n.dieta
                  ? `Meta: ${number(n.dieta.calorias_objetivo)} kcal`
                  : 'Sin meta configurada'}
              </Stat>
              {[
                ['proteinas', 'Proteínas'],
                ['carbohidratos', 'Carbohidratos'],
                ['grasas', 'Grasas'],
              ].map(([k, l]) => (
                <Stat key={k} label={l} value={number(n.totales[`${k}_g`])} unit="g">
                  <Meter
                    label=""
                    value={n.totales[`${k}_g`]}
                    max={n.dieta?.[`${k}_objetivo_g`] || 0}
                    unit="g"
                  />
                </Stat>
              ))}
            </div>
            <div className="card">
              <div className="section-title">
                <h2>Tu registro del día</h2>
                <Badge>{n.comidas.length} comidas</Badge>
              </div>
              <p className="small muted">
                Día calculado en {n.zona_horaria}. Los valores provienen de los alimentos que
                registraste.
              </p>
              {n.comidas.length ? (
                n.comidas.map((c) => (
                  <article className="meal-entry" key={c.id}>
                    <span className="meal-time">
                      {new Intl.DateTimeFormat('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: user.zona_horaria,
                      }).format(new Date(c.fecha_consumo))}
                    </span>
                    <div>
                      <Badge>{titleCase(c.tipo_comida)}</Badge>
                      <h3>{c.nombre_comida}</h3>
                      <p>
                        {c.alimentos
                          .map((f) => `${f.nombre} (${number(f.cantidad)} ${f.unidad})`)
                          .join(' · ')}
                      </p>
                      <span className="small">
                        P {number(c.proteinas_totales_g)} g · C {number(c.carbohidratos_totales_g)}{' '}
                        g · G {number(c.grasas_totales_g)} g
                      </span>
                    </div>
                    <strong>
                      {number(c.calorias_totales)} <small>kcal</small>
                    </strong>
                    <div className="actions">
                      <button
                        className="icon-btn"
                        aria-label={`Editar ${c.nombre_comida}`}
                        onClick={() => setEdit(c)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-btn danger-text"
                        aria-label={`Eliminar ${c.nombre_comida}`}
                        onClick={() => {
                          a.setError(null);
                          setRemove(c);
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <Empty
                  title="Todavía no registraste comidas"
                  action="Registrar mi primera comida"
                  onClick={() => setEdit({})}
                >
                  Empezá con lo que comiste. Cada registro suma contexto.
                </Empty>
              )}
            </div>
            {n.dieta && (
              <div className="card">
                <div className="section-title">
                  <div>
                    <p className="eyebrow">TU PLAN DE REFERENCIA</p>
                    <h2>{n.dieta.nombre}</h2>
                  </div>
                  <Link to={`/dietas/${n.dieta.id}`}>Ver plan ↗</Link>
                </div>
                <p className="muted">
                  Lo planificado no se registra como consumido automáticamente.
                </p>
                <div className="day-tags">
                  {n.dieta.comidas.map((c) => (
                    <Badge key={c.id}>
                      {c.hora?.slice(0, 5)} · {c.nombre_comida}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Resource>
      {edit && (
        <ConsumedForm
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
          title="¿Eliminar esta comida registrada?"
          onClose={() => setRemove(null)}
          busy={a.busy}
          error={a.error}
          onConfirm={() =>
            a.run(async () => {
              await api(`/consumed/${remove.id}`, { confirmar: true }, 'DELETE');
              setRemove(null);
              r.reload();
            })
          }
        >
          Se quitará del registro y se recalcularán los macros del día. El plan alimentario no
          cambia.
        </Confirm>
      )}
    </>
  );
}
export function Diets() {
  const r = useResource('/diets');
  return (
    <>
      <PageTitle
        title="Comidas con un plan."
        description="Organizá tus horarios, alimentos y metas nutricionales."
      >
        <Link className="btn" to="/dietas/nueva">
          <Plus size={17} />
          Crear plan
        </Link>
      </PageTitle>
      <Resource resource={r}>
        {(d) =>
          d.items.length ? (
            <div className="plan-grid">
              {d.items.map((v) => (
                <article className="card plan-card" key={v.id}>
                  <div className="section-title">
                    <Utensils />
                    <Badge tone="green">MANUAL</Badge>
                  </div>
                  <h2>{v.nombre}</h2>
                  <p className="muted">{v.descripcion || 'Tu plan alimentario personal.'}</p>
                  <div className="meal-totals">
                    <strong>{number(v.calorias_objetivo)} kcal objetivo</strong>
                    <span>{v.comidas.length} comidas</span>
                  </div>
                  <div className="plan-bottom">
                    <span>
                      P {number(v.proteinas_objetivo_g)} · C {number(v.carbohidratos_objetivo_g)} ·
                      G {number(v.grasas_objetivo_g)} g
                    </span>
                    <Link className="btn secondary" to={`/dietas/${v.id}`}>
                      Abrir plan
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty title="Dale un lugar a tu alimentación" to="/dietas/nueva" action="Crear plan">
              Definí tus metas con un profesional y organizá acá tus comidas.
            </Empty>
          )
        }
      </Resource>
    </>
  );
}
export function DietEditor() {
  const { id } = useParams(),
    r = useResource(id ? `/diets/${id}` : '/goals');
  return <Resource resource={r}>{(d) => <DietForm initial={id ? d : null} />}</Resource>;
}
function DietForm({ initial }) {
  const navigate = useNavigate(),
    goals = useResource('/goals'),
    a = useAction(),
    [f, setF] = useState(
      initial
        ? {
            ...pick(initial, ['nombre', 'descripcion', 'objetivo_id', ...targetKeys]),
            comidas: initial.comidas.map((m) => ({
              ...pick(m, mealKeys),
              hora: m.hora.slice(0, 5),
              alimentos: m.alimentos.map((f) => pick(f, foodKeys)),
            })),
          }
        : {
            nombre: '',
            descripcion: '',
            objetivo_id: null,
            calorias_objetivo: '',
            proteinas_objetivo_g: '',
            carbohidratos_objetivo_g: '',
            grasas_objetivo_g: '',
            comidas: [blankMeal()],
          },
    );
  const update = (i, k, v) =>
    setF({ ...f, comidas: f.comidas.map((m, j) => (j === i ? { ...m, [k]: v } : m)) });
  return (
    <>
      <PageTitle
        eyebrow={initial ? 'EDITAR PLAN' : 'NUEVO PLAN ALIMENTARIO'}
        title="Organizá tu alimentación."
        description="Registrá metas definidas con un profesional. Los totales de comidas se calculan por separado."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.run(async () => {
            const saved = await api(
              initial ? `/diets/${initial.id}` : '/diets',
              { ...f, ...Object.fromEntries(targetKeys.map((k) => [k, Number(f[k])])) },
              initial ? 'PUT' : 'POST',
            );
            navigate(`/dietas/${saved.id}`);
          });
        }}
      >
        <div className="card">
          <div className="form-grid">
            <Field
              label="Nombre del plan"
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
          <div className="form-grid four">
            {targetKeys.map((k, i) => (
              <Field
                key={k}
                label={
                  [
                    'Meta de calorías (kcal)',
                    'Meta de proteínas (g)',
                    'Meta de carbohidratos (g)',
                    'Meta de grasas (g)',
                  ][i]
                }
                type="number"
                required
                min="0"
                max={i === 0 ? 10000 : i === 2 ? 1500 : 1000}
                step="0.1"
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
              />
            ))}
          </div>
        </div>
        {f.comidas.map((m, i) => (
          <article className="card" key={i}>
            <div className="section-title">
              <h2>Comida {i + 1}</h2>
              <Button
                type="button"
                variant="ghost danger-text"
                disabled={f.comidas.length === 1}
                onClick={() => setF({ ...f, comidas: f.comidas.filter((_, j) => i !== j) })}
              >
                <Trash2 size={17} />
                Quitar comida
              </Button>
            </div>
            <div className="form-grid three">
              <Field
                label="Nombre de la comida"
                required
                minLength={2}
                maxLength={150}
                value={m.nombre_comida}
                onChange={(e) => update(i, 'nombre_comida', e.target.value)}
              />
              <Select
                label="Momento del día"
                value={m.tipo_comida}
                onChange={(e) => update(i, 'tipo_comida', e.target.value)}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {titleCase(t)}
                  </option>
                ))}
              </Select>
              <Field
                label="Horario"
                type="time"
                required
                value={m.hora}
                onChange={(e) => update(i, 'hora', e.target.value)}
              />
            </div>
            <FoodEditor foods={m.alimentos} onChange={(v) => update(i, 'alimentos', v)} />
            <Field
              label="Indicaciones (opcional)"
              maxLength={2000}
              value={m.observaciones}
              onChange={(e) => update(i, 'observaciones', e.target.value)}
            />
          </article>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={f.comidas.length >= 15}
          onClick={() => setF({ ...f, comidas: [...f.comidas, blankMeal()] })}
        >
          <Plus size={17} />
          Agregar otra comida
        </Button>
        <Feedback {...a} />
        <div className="sticky-actions">
          <span>{f.comidas.length} comidas planificadas</span>
          <div className="actions">
            <Link className="btn secondary" to={initial ? `/dietas/${initial.id}` : '/dietas'}>
              Cancelar
            </Link>
            <Button busy={a.busy}>Guardar plan</Button>
          </div>
        </div>
      </form>
    </>
  );
}
export function DietDetail() {
  const { id } = useParams(),
    r = useResource(`/diets/${id}`),
    navigate = useNavigate(),
    [remove, setRemove] = useState(false),
    a = useAction();
  return (
    <Resource resource={r}>
      {(v) => (
        <>
          <PageTitle eyebrow="MI PLAN ALIMENTARIO" title={v.nombre} description={v.descripcion}>
            <Link className="btn secondary" to={`/dietas/${id}/editar`}>
              <Pencil size={17} />
              Editar
            </Link>
            <Button variant="ghost danger-text" onClick={() => setRemove(true)}>
              <Trash2 size={17} />
              Eliminar
            </Button>
          </PageTitle>
          <div className="stats-grid">
            {targetKeys.map((k, i) => (
              <Stat
                key={k}
                label={
                  [
                    'Meta de energía',
                    'Meta de proteínas',
                    'Meta de carbohidratos',
                    'Meta de grasas',
                  ][i]
                }
                value={number(v[k])}
                unit={i === 0 ? 'kcal' : 'g'}
                accent={i === 0}
              >
                Planificado:{' '}
                {number(v.totales[['calorias', 'proteinas_g', 'carbohidratos_g', 'grasas_g'][i]])}{' '}
                {i === 0 ? 'kcal' : 'g'}
              </Stat>
            ))}
          </div>
          {v.comidas.map((c) => (
            <article className="card" key={c.id}>
              <div className="section-title">
                <div className="actions">
                  <span className="meal-time">{c.hora?.slice(0, 5)}</span>
                  <div>
                    <Badge>{titleCase(c.tipo_comida)}</Badge>
                    <h2>{c.nombre_comida}</h2>
                  </div>
                </div>
                <strong>{number(c.calorias)} kcal</strong>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Alimento</th>
                      <th>Cantidad</th>
                      <th>kcal</th>
                      <th>Proteínas (g)</th>
                      <th>Carbohidratos (g)</th>
                      <th>Grasas (g)</th>
                      <th>Fuente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.alimentos.map((f, i) => (
                      <tr key={i}>
                        <td>{f.nombre}</td>
                        <td>
                          {number(f.cantidad)} {f.unidad}
                        </td>
                        {['calorias', 'proteinas_g', 'carbohidratos_g', 'grasas_g'].map((k) => (
                          <td key={k}>{number(estimate([f])[k])}</td>
                        ))}
                        <td>{f.fuente}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted">{c.observaciones}</p>
              <div className="meal-totals">
                <span>Proteínas {number(c.proteinas_g)} g</span>
                <span>Carbohidratos {number(c.carbohidratos_g)} g</span>
                <span>Grasas {number(c.grasas_g)} g</span>
              </div>
            </article>
          ))}
          <Link className="btn" to="/nutricion">
            Ir a mi registro de comidas
            <ArrowUpRight size={17} />
          </Link>
          {remove && (
            <Confirm
              title="¿Eliminar este plan?"
              onClose={() => setRemove(false)}
              busy={a.busy}
              error={a.error}
              onConfirm={() =>
                a.run(async () => {
                  await api(`/diets/${id}`, { confirmar: true }, 'DELETE');
                  navigate('/dietas');
                })
              }
            >
              El plan dejará de aparecer. Las comidas que ya registraste se conservan.
            </Confirm>
          )}
        </>
      )}
    </Resource>
  );
}
