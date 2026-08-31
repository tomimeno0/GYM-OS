import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Activity, Dumbbell, Utensils, ChartNoAxesCombined } from 'lucide-react';
import { api, useAuth, useAction } from '../lib';
import { Button, Field, Feedback } from '../components/ui';
export function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <Activity size={22} />
      </span>
      GYM<span className="brand-light">—OS</span>
    </Link>
  );
}
export function Landing({ about = false }) {
  const { user } = useAuth();
  return (
    <div className="landing">
      <nav className="public-nav">
        <Brand />
        <div className="actions">
          <Link to="/nosotros">El proyecto</Link>
          <Link className="btn" to={user ? '/dashboard' : '/login'}>
            {user ? 'Abrir mi espacio' : 'Iniciar sesión'}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">ENTRENÁ CON INTENCIÓN</span>
            <h1>
              {about ? (
                'Un lugar para ver hasta dónde llegás.'
              ) : (
                <>
                  Cada esfuerzo
                  <br />
                  cuenta.
                  <br />
                  <em>Hacelo visible.</em>
                </>
              )}
            </h1>
            <p>
              {about
                ? 'GYM-OS reúne tus rutinas, alimentación y mediciones para que puedas registrar tu recorrido y tomar decisiones con tus propios datos.'
                : 'Tu entrenamiento, tu alimentación y tu progreso. Todo en un espacio pensado para que puedas concentrarte en avanzar.'}
            </p>
            <Link to={user ? '/dashboard' : '/registro'} className="btn lime">
              {user ? 'Volver a mi panel' : 'Crear mi cuenta'}
              <ArrowUpRight size={19} />
            </Link>
            <span className="hero-note">Tu ritmo. Tus objetivos. Tus datos.</span>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-word">
              GO
              <br />
              FURTHER<span>UN DÍA A LA VEZ / GYM—OS</span>
            </div>
            <div className="art-bottom">
              <Activity />
              <span>
                LA CONSTANCIA
                <br />
                ES TU MEJOR MARCA.
              </span>
              <span>↗</span>
            </div>
          </div>
        </section>
        <section className="feature-grid">
          {[
            [
              Dumbbell,
              '01 / ENTRENAMIENTO',
              'Un plan que podés seguir.',
              'Creá rutinas por día y registrá las series, repeticiones y cargas de cada sesión.',
            ],
            [
              Utensils,
              '02 / NUTRICIÓN',
              'Alimentación, en contexto.',
              'Organizá tus comidas y compará tus registros con las metas de tu plan.',
            ],
            [
              ChartNoAxesCombined,
              '03 / PROGRESO',
              'Más que un número.',
              'Conservá tu historial, observá los cambios y marcá tus objetivos cumplidos.',
            ],
          ].map(([Icon, k, t, d]) => (
            <article key={k}>
              <Icon />
              <p className="eyebrow">{k}</p>
              <h2>{t}</h2>
              <p>{d}</p>
            </article>
          ))}
        </section>
        <p className="disclaimer">
          GYM-OS es una herramienta de organización y registro. No sustituye la orientación de
          profesionales de salud, nutrición o entrenamiento.
        </p>
      </main>
      <footer>
        <Brand />
        <span>Hecho para el proceso, no solo para el resultado.</span>
      </footer>
    </div>
  );
}
export default function Auth({ mode }) {
  const { user, setUser } = useAuth(),
    action = useAction();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirm: '',
  });
  if (user && ['login', 'registro'].includes(mode)) return <Navigate to="/dashboard" replace />;
  const titles = {
    login: 'Volvé a tu ritmo.',
    registro: 'Tu próximo paso empieza acá.',
    recuperar: 'Recuperá tu acceso.',
    restablecer: 'Elegí una nueva contraseña.',
  };
  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });
  function submit(e) {
    e.preventDefault();
    action.run(
      async () => {
        if (mode === 'registro' || mode === 'restablecer') {
          if (form.password !== form.confirm) throw new Error('Las contraseñas no coinciden.');
        }
        if (mode === 'recuperar') return api('/auth/forgot-password', { email: form.email });
        if (mode === 'restablecer')
          return api('/auth/reset-password', {
            token: params.get('token') || '',
            password: form.password,
          });
        const data = await api(
          '/auth/' + (mode === 'login' ? 'login' : 'register'),
          mode === 'login'
            ? { email: form.email, password: form.password }
            : {
                nombre: form.nombre,
                apellido: form.apellido,
                email: form.email,
                password: form.password,
              },
        );
        setUser(data.user);
      },
      mode === 'recuperar'
        ? 'Si existe una cuenta habilitada con ese correo, recibirás un enlace de recuperación.'
        : mode === 'restablecer'
          ? 'Contraseña actualizada. Ya podés iniciar sesión.'
          : '',
    );
  }
  return (
    <div className="auth-layout">
      <aside>
        <Brand />
        <div>
          <p className="eyebrow">MENOS DESORDEN. MÁS CONSTANCIA.</p>
          <h2>
            Tu mejor versión
            <br />
            se construye
            <br />
            <em>día a día.</em>
          </h2>
          <div className="auth-lines" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <p>ENTRENAMIENTO + NUTRICIÓN + PROGRESO</p>
      </aside>
      <main>
        <Link className="back-link" to="/">
          ← Volver al inicio
        </Link>
        <div className="auth-form">
          <p className="eyebrow">GYM—OS / TU ESPACIO PERSONAL</p>
          <h1>{titles[mode]}</h1>
          <p className="muted">
            {mode === 'login'
              ? 'Ingresá a tu espacio y seguí donde lo dejaste.'
              : mode === 'registro'
                ? 'Creá tu cuenta. Después armamos tu perfil.'
                : 'Te acompañamos para que puedas volver a entrar.'}
          </p>
          <form onSubmit={submit}>
            {mode === 'registro' && (
              <div className="form-grid">
                <Field
                  label="Nombre"
                  autoComplete="given-name"
                  required
                  maxLength={100}
                  {...field('nombre')}
                />
                <Field
                  label="Apellido"
                  autoComplete="family-name"
                  maxLength={100}
                  {...field('apellido')}
                />
              </div>
            )}
            {mode !== 'restablecer' && (
              <Field
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                required
                {...field('email')}
              />
            )}{' '}
            {mode !== 'recuperar' && (
              <Field
                label="Contraseña"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'login' ? 1 : 10}
                hint={mode !== 'login' ? 'Al menos 10 caracteres.' : undefined}
                {...field('password')}
              />
            )}{' '}
            {['registro', 'restablecer'].includes(mode) && (
              <Field
                label="Repetir contraseña"
                type="password"
                autoComplete="new-password"
                required
                {...field('confirm')}
              />
            )}
            <Feedback {...action} />
            <Button busy={action.busy} className="full">
              {
                {
                  login: 'Iniciar sesión',
                  registro: 'Crear cuenta',
                  recuperar: 'Enviar enlace',
                  restablecer: 'Guardar contraseña',
                }[mode]
              }
              <ArrowUpRight size={18} />
            </Button>
          </form>
          {mode === 'login' ? (
            <>
              <Link to="/recuperar">Olvidé mi contraseña</Link>
              <p>
                ¿Todavía no tenés cuenta? <Link to="/registro">Registrate</Link>
              </p>
            </>
          ) : (
            <p>
              <Link to="/login">Volver a iniciar sesión</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
