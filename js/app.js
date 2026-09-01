/* Sistema visual — Historial de Salud Familiar
   Paleta: fondo cálido neutro, acento salvia (calma/salud), ámbar (recordatorio),
   ladrillo suave (atrasado). Tipografía: Lora para títulos, Inter para el resto.
   Tamaños pensados para uso por adultos mayores: texto base grande y áreas
   táctiles amplias (mínimo ~56px de alto en cualquier botón). */

@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --color-fondo: #F6F3ED;
  --color-superficie: #FFFFFF;
  --color-tinta: #23302B;
  --color-tinta-suave: #5C6B63;
  --color-borde: #E3DED3;
  --color-salvia: #4F6F64;
  --color-salvia-suave: #E4ECE8;
  --color-ambar: #C98A3E;
  --color-ambar-suave: #F5E6D0;
  --color-atrasado: #B5533E;
  --color-atrasado-suave: #F5E1DC;
  --radio: 16px;
  --sombra: 0 1px 3px rgba(35, 48, 43, 0.08);
}

* { box-sizing: border-box; }

html { font-size: 18px; } /* base más grande que el estándar de 16px */

body {
  margin: 0;
  background: var(--color-fondo);
  color: var(--color-tinta);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 108px;
}

h1, h2, .tarjeta__titulo {
  font-family: 'Lora', serif;
  font-weight: 600;
  margin: 0;
}

button { cursor: pointer; }
button:active { opacity: 0.85; }

.oculto { display: none; }

.pantalla-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.pantalla-login__contenido {
  text-align: center;
  max-width: 360px;
}

.pantalla-login__icono {
  display: inline-block;
  width: 56px;
  height: 56px;
  color: var(--color-salvia);
  margin-bottom: 8px;
}
.pantalla-login__icono svg { width: 100%; height: 100%; }

.pantalla-login__contenido h2 {
  font-size: 1.6rem;
  margin: 8px 0 10px;
}

.pantalla-login__contenido p {
  color: var(--color-tinta-suave);
  font-size: 1.1rem;
  margin: 0 0 26px;
  line-height: 1.5;
}

#botonGoogleSignIn {
  display: flex;
  justify-content: center;
}

.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 18px 16px;
  background: var(--color-fondo);
  position: sticky;
  top: 0;
  z-index: 5;
  gap: 10px;
}

.encabezado__marca {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.encabezado__icono {
  width: 30px;
  height: 30px;
  color: var(--color-salvia);
  flex-shrink: 0;
}
.encabezado__icono svg { width: 100%; height: 100%; }

.encabezado h1 {
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.encabezado__acciones {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.encabezado__cambiar {
  border: 2px solid var(--color-salvia);
  background: var(--color-superficie);
  color: var(--color-salvia);
  border-radius: 999px;
  padding: 14px 18px;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  min-height: 56px;
}

.contenido__persona {
  margin: 4px 0 0;
  font-size: 0.95rem;
  color: var(--color-tinta-suave);
}

.dialogo-codigo {
  border: none;
  border-radius: var(--radio);
  padding: 0;
  max-width: 380px;
  width: 90%;
}
.dialogo-codigo::backdrop { background: rgba(35, 48, 43, 0.5); }

.dialogo-codigo__form {
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dialogo-codigo__titulo {
  font-family: 'Lora', serif;
  font-weight: 600;
  font-size: 1.3rem;
  margin: 0;
}

.dialogo-codigo__ayuda {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--color-tinta-suave);
  line-height: 1.4;
}

.dialogo-codigo__form input,
.dialogo-codigo__form select {
  border: 2px solid var(--color-borde);
  border-radius: 12px;
  padding: 16px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  min-height: 56px;
  width: 100%;
}

.dialogo-codigo__botones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.dialogo-codigo__cancelar {
  border: 2px solid transparent;
  background: transparent;
  color: var(--color-tinta-suave);
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  padding: 14px 16px;
  min-height: 56px;
}

.dialogo-codigo__confirmar {
  border: none;
  background: var(--color-salvia);
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 999px;
  padding: 14px 22px;
  min-height: 56px;
}

.encabezado__perfil {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--color-salvia);
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contenido {
  padding: 6px 18px 30px;
  max-width: 520px;
  margin: 0 auto;
}

.resumen { margin-top: 26px; }

.resumen__titulo {
  font-size: 1.2rem;
  color: var(--color-tinta);
  margin-bottom: 12px;
}

.lista-tarjetas {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tarjeta {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  box-shadow: var(--sombra);
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.tarjeta--toma .tarjeta__hora {
  min-width: 78px;
  font-weight: 700;
  color: var(--color-ambar);
  font-size: 1.1rem;
}

.tarjeta--vencida .tarjeta__hora { color: var(--color-atrasado); }
.tarjeta--vencida { border-color: var(--color-atrasado-suave); background: var(--color-atrasado-suave); }

.tarjeta__cuerpo { flex: 1; min-width: 0; }

.tarjeta__titulo { font-size: 1.15rem; }

.tarjeta__detalle {
  margin: 4px 0 0;
  font-size: 1rem;
  color: var(--color-tinta-suave);
}

.tarjeta__accion {
  border: 2px solid var(--color-salvia);
  color: var(--color-salvia);
  background: transparent;
  border-radius: 999px;
  padding: 12px 16px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  min-height: 52px;
}

.tarjeta--cita .tarjeta__fecha {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: var(--color-salvia-suave);
  color: var(--color-salvia);
  flex-shrink: 0;
}
.tarjeta__dia { font-weight: 700; font-size: 1.3rem; line-height: 1; }
.tarjeta__mes { font-size: 0.85rem; text-transform: lowercase; }

.boton-flotante {
  position: fixed;
  right: 20px;
  bottom: 116px;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: none;
  background: var(--color-salvia);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 111, 100, 0.4);
}
.boton-flotante svg { width: 30px; height: 30px; }

.nav-inferior {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--color-superficie);
  border-top: 1px solid var(--color-borde);
  padding: 10px 4px calc(10px + env(safe-area-inset-bottom));
  z-index: 10;
}

.nav-inferior__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--color-tinta-suave);
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 8px 2px;
  min-height: 64px;
  border-radius: 12px;
}

.nav-inferior__item svg { width: 28px; height: 28px; }

.nav-inferior__item--activo {
  color: var(--color-salvia);
  background: var(--color-salvia-suave);
}
