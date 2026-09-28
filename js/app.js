// Punto de partida del frontend.
const URL_BACKEND = "https://script.google.com/macros/s/AKfycbzIyPXHDQNT1naY4PZEbKjG-3Yj3EVodrAl3rdISxQl0rbWByyVv-QtBTR1FGb74MQ/exec";
const ID_CLIENTE_GOOGLE = "426592081602-i3bd5afd82i1h9ai35lf3isb82isru4o.apps.googleusercontent.com";
const URL_REDIRECCION = "https://angarita86.github.io/historial-salud-familiar/";
const CLAVE_SESION = "sesionHistorialSaludFamiliar";

let idMiembroConsultado = null;
let codigoVerificacionActual = null;

const dialogoCodigo = document.getElementById("dialogoCodigoVerificacion");

/* ---------- Menú lateral ---------- */

const barraLateral = document.getElementById("barraLateral");
const superposicionMenu = document.getElementById("superposicionMenu");

function abrirMenu() {
  barraLateral.classList.add("barra-lateral--abierta");
  superposicionMenu.classList.add("superposicion--visible");
}
function cerrarMenu() {
  barraLateral.classList.remove("barra-lateral--abierta");
  superposicionMenu.classList.remove("superposicion--visible");
}

document.getElementById("botonMenu").addEventListener("click", abrirMenu);
superposicionMenu.addEventListener("click", cerrarMenu);

document.querySelectorAll(".barra-lateral__item").forEach((boton) => {
  boton.addEventListener("click", () => {
    document
      .querySelectorAll(".barra-lateral__item")
      .forEach((b) => b.classList.remove("barra-lateral__item--activo"));
    boton.classList.add("barra-lateral__item--activo");
    cerrarMenu();
    if (boton.dataset.vista !== "inicio") {
      alert("Esta sección todavía se está construyendo. Por ahora solo Inicio está disponible.");
    }
  });
});

/* ---------- Diálogo "Ver a otro miembro" ---------- */

document.getElementById("botonCambiarMiembro").addEventListener("click", async () => {
  const selector = document.getElementById("miembroSeleccionado");
  selector.innerHTML = '<option value="">Cargando miembros...</option>';
  dialogoCodigo.showModal();

  const respuesta = await llamarBackend("listarMiembros");
  selector.innerHTML = '<option value="">Selecciona un miembro</option>';
  (respuesta.miembros || []).forEach((miembro) => {
    const opcion = document.createElement("option");
    opcion.value = miembro.id_miembro;
    opcion.textContent = miembro.nombre;
    selector.appendChild(opcion);
  });
});

document.getElementById("botonCancelarCodigo").addEventListener("click", () => {
  dialogoCodigo.close();
});

document.getElementById("botonConfirmarCodigo").addEventListener("click", async (evento) => {
  evento.preventDefault();
  const idMiembroSeleccionado = document.getElementById("miembroSeleccionado").value;
  const codigoIngresado = document.getElementById("codigoVerificacion").value.trim();

  if (!idMiembroSeleccionado) {
    alert("Selecciona un miembro de la lista.");
    return;
  }

  const respuesta = await llamarBackend("listarResumenInicio", {
    idMiembroConsultado: idMiembroSeleccionado,
    codigoVerificacion: codigoIngresado,
  });

  if (respuesta.error) {
    alert(respuesta.error);
    return;
  }

  idMiembroConsultado = idMiembroSeleccionado;
  codigoVerificacionActual = codigoIngresado;
  document.getElementById("etiquetaPersonaVisible").textContent =
    "Viendo la información de: " + respuesta.miembro;
  dialogoCodigo.close();
});

document.getElementById("botonNuevaCita").addEventListener("click", () => {
  alert("El formulario para registrar una nueva cita se está construyendo. Muy pronto estará disponible aquí.");
});

document.getElementById("botonPerfil").addEventListener("click", () => {
  if (confirm("¿Deseas cerrar sesión?")) {
    cerrarSesion();
  }
});

/* ---------- Backend ---------- */

async function llamarBackend(accion, datos = {}) {
  const respuesta = await fetch(URL_BACKEND, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ accion, correoUsuario: obtenerCorreoUsuario(), ...datos }),
  });
  return respuesta.json();
}

function obtenerCorreoUsuario() {
  return window.correoUsuarioActivo || null;
}

/* ---------- Sesión: guardado y restauración ---------- */

function guardarSesion(datosPerfil, expiraEnSegundos) {
  const sesion = {
    email: datosPerfil.email,
    nombre: datosPerfil.given_name || datosPerfil.name || datosPerfil.email,
    expiraEn: Date.now() + Number(expiraEnSegundos || 3600) * 1000,
  };
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

function leerSesionGuardada() {
  const crudo = localStorage.getItem(CLAVE_SESION);
  if (!crudo) return null;
  try {
    const sesion = JSON.parse(crudo);
    if (!sesion.expiraEn || sesion.expiraEn < Date.now()) {
      localStorage.removeItem(CLAVE_SESION);
      return null;
    }
    return sesion;
  } catch (error) {
    localStorage.removeItem(CLAVE_SESION);
    return null;
  }
}

function borrarSesionGuardada() {
  localStorage.removeItem(CLAVE_SESION);
}

function mostrarAplicacionComoLogueado(email, nombre) {
  window.correoUsuarioActivo = email;
  document.getElementById("inicialUsuario").textContent = (nombre || email || "?").charAt(0).toUpperCase();
  document.getElementById("avatarSaludo").textContent = (nombre || email || "?").charAt(0).toUpperCase();
  document.getElementById("nombreSaludo").textContent = nombre || email;
  document.getElementById("pantallaLogin").classList.add("oculto");
  document.getElementById("aplicacion").classList.remove("oculto");
}

function cerrarSesion() {
  window.correoUsuarioActivo = null;
  idMiembroConsultado = null;
  codigoVerificacionActual = null;
  borrarSesionGuardada();
  document.getElementById("aplicacion").classList.add("oculto");
  document.getElementById("pantallaLogin").classList.remove("oculto");
}

/* ---------- Login con Google (redirección de página completa) ---------- */

function iniciarLoginGoogle() {
  const parametros = new URLSearchParams({
    client_id: ID_CLIENTE_GOOGLE,
    redirect_uri: URL_REDIRECCION,
    response_type: "token",
    scope: "openid email profile",
    include_granted_scopes: "true",
    prompt: "select_account",
  });
  window.location.href = "https://accounts.google.com/o/oauth2/v2/auth?" + parametros.toString();
}

async function revisarTokenEnUrl() {
  const fragmento = window.location.hash;
  if (!fragmento || !fragmento.includes("access_token")) return false;

  const parametros = new URLSearchParams(fragmento.substring(1));
  const token = parametros.get("access_token");
  const expiraEnSegundos = parametros.get("expires_in");
  if (!token) return false;

  try {
    const respuesta = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + token },
    });
    const datos = await respuesta.json();

    guardarSesion(datos, expiraEnSegundos);
    mostrarAplicacionComoLogueado(datos.email, datos.given_name || datos.name);

    // Limpia el token de la barra de direcciones para que no quede visible ni reutilizable.
    history.replaceState(null, "", window.location.pathname);
    return true;
  } catch (error) {
    alert("No se pudo completar el inicio de sesión. Detalle técnico: " + error.message);
    return false;
  }
}

document.getElementById("botonGoogleSignIn").addEventListener("click", iniciarLoginGoogle);

window.addEventListener("load", async () => {
  // 1) ¿Venimos de un regreso de Google con un token nuevo en la URL?
  const entroConTokenNuevo = await revisarTokenEnUrl();
  if (entroConTokenNuevo) return;

  // 2) Si no, ¿hay una sesión guardada y todavía vigente de una visita anterior?
  const sesionGuardada = leerSesionGuardada();
  if (sesionGuardada) {
    mostrarAplicacionComoLogueado(sesionGuardada.email, sesionGuardada.nombre);
  }
  // 3) Si tampoco hay sesión guardada, se queda en la pantalla de login normalmente.
});
