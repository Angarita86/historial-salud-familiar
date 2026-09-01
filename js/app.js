// Punto de partida del frontend.
// Antes de usar en producción hay que completar dos valores:
//   1) URL_BACKEND: la URL que entrega Apps Script al publicar el proyecto como aplicación web.
//   2) ID_CLIENTE_GOOGLE: el ID de cliente OAuth creado en Google Cloud para el inicio de sesión.

const URL_BACKEND = "https://script.google.com/macros/s/AKfycbzIyPXHDQNT1naY4PZEbKjG-3Yj3EVodrAl3rdISxQl0rbWByyVv-QtBTR1FGb74MQ/exec";
const ID_CLIENTE_GOOGLE = "426592081602-i3bd5afd82i1h9ai35lf3isb82isru4o.apps.googleusercontent.com";

// Miembro que se está consultando actualmente: por defecto, nadie más que uno
// mismo, hasta que se confirme un código de verificación válido para otro miembro.
let idMiembroConsultado = null;
let codigoVerificacionActual = null;

const dialogoCodigo = document.getElementById("dialogoCodigoVerificacion");

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

document.getElementById("dialogoCodigoVerificacion").addEventListener("close", async () => {
  if (dialogoCodigo.returnValue !== "default") return; // se cerró con "Cancelar" o al confirmar, ver abajo
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
    "Mostrando: " + respuesta.miembro;
  dialogoCodigo.close();
});

// Navegación entre las cinco secciones de la barra inferior.
// Por ahora solo Inicio tiene contenido construido; las demás avisan que están en camino.
document.querySelectorAll(".nav-inferior__item").forEach((boton) => {
  boton.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-inferior__item")
      .forEach((b) => b.classList.remove("nav-inferior__item--activo"));
    boton.classList.add("nav-inferior__item--activo");
    if (boton.dataset.vista !== "inicio") {
      alert("Esta sección todavía se está construyendo. Por ahora solo Inicio está disponible.");
    }
  });
});

document.getElementById("botonNuevaCita").addEventListener("click", () => {
  alert("El formulario para registrar una nueva cita se está construyendo. Muy pronto estará disponible aquí.");
});

document.getElementById("botonPerfil").addEventListener("click", () => {
  if (confirm("¿Deseas cerrar sesión?")) {
    cerrarSesion();
  }
});

// Llamado genérico al backend de Apps Script. Todas las lecturas y escrituras de la
// aplicación (citas, medicamentos, tomas, documentos) pasan por esta misma función.
async function llamarBackend(accion, datos = {}) {
  const respuesta = await fetch(URL_BACKEND, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ accion, correoUsuario: obtenerCorreoUsuario(), ...datos }),
  });
  return respuesta.json();
}

// Devuelve el correo de la persona que inició sesión con Google, una vez configurado
// el inicio de sesión más abajo. Mientras tanto retorna un valor de prueba.
function obtenerCorreoUsuario() {
  return window.correoUsuarioActivo || null;
}

function decodificarBase64Url(cadena) {
  const normalizada = cadena.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = normalizada + "=".repeat((4 - (normalizada.length % 4)) % 4);
  return atob(relleno);
}

// URL exacta de esta página, usada como redirect_uri. Debe coincidir EXACTAMENTE
// (incluyendo la barra final) con lo registrado en Google Cloud Console como
// "URI de redireccionamiento autorizados".
const URL_REDIRECCION = "https://angarita86.github.io/historial-salud-familiar/";

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
  if (!fragmento || !fragmento.includes("access_token")) return;

  const parametros = new URLSearchParams(fragmento.substring(1));
  const token = parametros.get("access_token");
  if (!token) return;

  try {
    const respuesta = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + token },
    });
    const datos = await respuesta.json();

    window.correoUsuarioActivo = datos.email;
    document.getElementById("inicialUsuario").textContent = (datos.given_name || datos.email || "?")
      .charAt(0)
      .toUpperCase();

    document.getElementById("pantallaLogin").classList.add("oculto");
    document.getElementById("aplicacion").classList.remove("oculto");

    // Limpia el token de la barra de direcciones para que no quede visible ni reutilizable.
    history.replaceState(null, "", window.location.pathname);
  } catch (error) {
    alert("No se pudo completar el inicio de sesión. Detalle técnico: " + error.message);
  }
}

function cerrarSesion() {
  window.correoUsuarioActivo = null;
  idMiembroConsultado = null;
  codigoVerificacionActual = null;
  document.getElementById("aplicacion").classList.add("oculto");
  document.getElementById("pantallaLogin").classList.remove("oculto");
}

document.getElementById("botonGoogleSignIn").addEventListener("click", iniciarLoginGoogle);

// Al cargar la página, revisa si venimos de vuelta de Google con un token en la URL.
window.addEventListener("load", revisarTokenEnUrl);

// Nota: este flujo usa redirección de página completa (no el botón incrustado de
// Google), porque es mucho más confiable en navegadores móviles que bloquean
// cookies de terceros. Requiere que URL_REDIRECCION esté registrada como "URI de
// redireccionamiento autorizados" en el cliente OAuth de Google Cloud Console.
