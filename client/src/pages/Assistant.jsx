import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Dumbbell, Send, Sparkles, Utensils } from 'lucide-react';
import { api, useAction, useResource } from '../lib';
import {
  Badge,
  Button,
  Confirm,
  Feedback,
  PageTitle,
  Resource,
  Select,
  Textarea,
} from '../components/ui';

function PlanTool({ kind, icon: Icon, title, items, onChanged }) {
  const singular = kind === 'routines' ? 'rutina' : 'dieta';
  const [selected, setSelected] = useState('');
  const [instructions, setInstructions] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [created, setCreated] = useState(null);
  const action = useAction();
  const execute = () =>
    action.run(
      async () => {
        const value = selected
          ? await api(`/ai/${kind}/${selected}/adapt`, { instrucciones: instructions })
          : await api(`/ai/${kind}/generate`, { preferencias: instructions });
        setCreated(value);
        setConfirm(false);
        onChanged();
      },
      selected ? `La ${singular} fue adaptada.` : `La ${singular} fue creada.`,
    );
  return (
    <article className="card ai-plan-tool">
      <div className="section-title">
        <span className="ai-icon">
          <Icon size={20} />
        </span>
        <Badge tone="green">IA</Badge>
      </div>
      <h2>{title}</h2>
      <p className="muted">
        Usamos tu medición, objetivo activo e historial disponible. Revisá siempre el resultado.
      </p>
      <Select
        label={`Acción sobre tu ${singular}`}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Crear una nueva con IA</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            Adaptar: {item.nombre}
          </option>
        ))}
      </Select>
      <Textarea
        label={selected ? 'Qué querés cambiar' : 'Preferencias opcionales'}
        placeholder={
          selected
            ? 'Ejemplo: bajá el volumen de los lunes…'
            : 'Ejemplo: tres días, sesiones cortas…'
        }
        minLength={selected ? 2 : undefined}
        maxLength={1000}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />
      <Feedback {...action} />
      {created && (
        <p className="ai-result">
          <strong>{created.nombre}</strong>
          <Link to={`/${kind === 'routines' ? 'rutinas' : 'dietas'}/${created.id}`}>
            Abrir resultado ↗
          </Link>
        </p>
      )}
      <Button
        busy={action.busy}
        disabled={selected && instructions.trim().length < 2}
        onClick={() => (selected ? setConfirm(true) : execute())}
      >
        <Sparkles size={17} />
        {selected ? 'Adaptar con IA' : 'Generar con IA'}
      </Button>
      {confirm && (
        <Confirm
          title={`¿Adaptar esta ${singular}?`}
          action="Sí, reemplazar plan"
          busy={action.busy}
          error={action.error}
          onClose={() => setConfirm(false)}
          onConfirm={execute}
        >
          La IA reemplazará el contenido actual de este plan. Tus registros de entrenamiento y
          comidas se conservan.
        </Confirm>
      )}
    </article>
  );
}

function Chat() {
  const conversations = useResource('/ai/conversations');
  const [conversation, setConversation] = useState(null);
  const [mode, setMode] = useState('entrenador');
  const [question, setQuestion] = useState('');
  const action = useAction();
  async function open(id) {
    action.setError(null);
    setConversation(await api(`/ai/conversations/${id}`));
    setMode(conversations.data.items.find((item) => item.id === id)?.modo || 'entrenador');
  }
  return (
    <section className="card ai-chat">
      <div className="section-title">
        <div>
          <p className="eyebrow">CU031 · ASISTENTE</p>
          <h2>Consultá y seguí la conversación.</h2>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setConversation(null);
            setQuestion('');
            action.setError(null);
          }}
        >
          Nueva conversación
        </Button>
      </div>
      <div className="ai-chat-layout">
        <aside className="ai-history" aria-label="Conversaciones anteriores">
          <strong>Historial</strong>
          <Resource resource={conversations}>
            {(data) =>
              data.items.length ? (
                data.items.map((item) => (
                  <button
                    key={item.id}
                    className={conversation?.id === item.id ? 'active' : ''}
                    onClick={() => open(item.id)}
                  >
                    <span>{item.titulo}</span>
                    <small>{item.modo}</small>
                  </button>
                ))
              ) : (
                <p className="small muted">Todavía no hay conversaciones.</p>
              )
            }
          </Resource>
        </aside>
        <div className="ai-thread">
          <div className="ai-messages" aria-live="polite">
            {conversation?.mensajes?.length ? (
              conversation.mensajes.map((message) => (
                <div key={message.id} className={`ai-message ${message.rol}`}>
                  <small>{message.rol === 'user' ? 'Vos' : 'GYM—OS'}</small>
                  <p>{message.contenido}</p>
                </div>
              ))
            ) : (
              <div className="ai-welcome">
                <Bot size={30} />
                <h3>¿En qué te ayudo?</h3>
                <p>
                  Preguntá sobre tu entrenamiento, hábitos, nutrición general o el uso de GYM—OS.
                </p>
              </div>
            )}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              action.run(async () => {
                const result = await api('/ai/chat', {
                  ...(conversation ? { conversacion_id: conversation.id } : {}),
                  modo: mode,
                  consulta: question,
                });
                setConversation(result);
                setQuestion('');
                conversations.reload();
              });
            }}
          >
            <Select
              label="Modo"
              value={mode}
              disabled={Boolean(conversation)}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="entrenador">Entrenador</option>
              <option value="soporte">Soporte de la aplicación</option>
            </Select>
            <Textarea
              label="Tu consulta"
              required
              minLength={1}
              maxLength={2000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Feedback {...action} />
            <Button type="submit" busy={action.busy} disabled={!question.trim()}>
              <Send size={17} />
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function Assistant() {
  const status = useResource('/ai/status');
  const routines = useResource('/routines');
  const diets = useResource('/diets');
  return (
    <>
      <PageTitle
        eyebrow="ASISTENCIA PERSONAL"
        title="IA con tu contexto."
        description="Generá planes, adaptalos según tu progreso y resolvé consultas dentro de GYM—OS."
      >
        {status.data && (
          <Badge tone={status.data.configurado ? 'green' : ''}>
            {status.data.configurado ? 'DISPONIBLE' : 'SIN CONFIGURAR'}
          </Badge>
        )}
      </PageTitle>
      <Resource resource={status}>
        {(state) =>
          !state.configurado && (
            <div className="notice error">
              El servicio de IA no está configurado. Las funciones manuales siguen disponibles.
            </div>
          )
        }
      </Resource>
      <div className="ai-tools">
        <Resource resource={routines}>
          {(data) => (
            <PlanTool
              kind="routines"
              icon={Dumbbell}
              title="Rutinas a tu medida"
              items={data.items}
              onChanged={routines.reload}
            />
          )}
        </Resource>
        <Resource resource={diets}>
          {(data) => (
            <PlanTool
              kind="diets"
              icon={Utensils}
              title="Planes alimentarios"
              items={data.items}
              onChanged={diets.reload}
            />
          )}
        </Resource>
      </div>
      <Chat />
      <p className="small muted ai-disclaimer">
        La IA brinda orientación general. No reemplaza una evaluación médica, nutricional ni
        profesional.
      </p>
    </>
  );
}
