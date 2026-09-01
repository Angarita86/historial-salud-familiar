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

function alIniciarSesion(respuestaCredencial) {
  try {
    const datos = JSON.parse(decodificarBase64Url(respuestaCredencial.credential.split(".")[1]));
    window.correoUsuarioActivo = datos.email;
    document.getElementById("inicialUsuario").textContent = (datos.given_name || datos.email || "?")
      .charAt(0)
      .toUpperCase();

    // Ya identificado, se oculta la pantalla de login y se muestra la aplicación.
    document.getElementById("pantallaLogin").classList.add("oculto");
    document.getElementById("aplicacion").classList.remove("oculto");
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
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
}

// Inicializa el botón de Google en cuanto la librería de Google termina de cargar.
window.addEventListener("load", () => {
  google.accounts.id.initialize({
    client_id: ID_CLIENTE_GOOGLE,
    callback: alIniciarSesion,
  });
  google.accounts.id.renderButton(document.getElementById("botonGoogleSignIn"), {
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "pill",
  });
});

// Nota: para activar el inicio de sesión de Google, se debe incluir en index.html
// el script https://accounts.google.com/gsi/client y un contenedor que use
// ID_CLIENTE_GOOGLE junto con la función alIniciarSesion como callback. Este paso
// se completa una vez exista el ID de cliente OAuth real.
