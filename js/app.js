// ===== Constantes ======
const URL_BACKEND = "https://script.google.com/macros/s/AKfycbyB0lKJ9_2PhfOXVRHwhDOgIxCDRXnif-hGP3NP_h7AUs3B200zQ9hGdh602jtOshoF/exec";
const ID_CLIENTE_GOOGLE = "426592081602-i3bd5afd82i1h9ai35lf3isb82isru4o.apps.googleusercontent.com";
const URL_REDIRECCION = "https://angarita86.github.io/historial-salud-familiar/";
const CLAVE_SESION = "sesionHistorialSaludFamiliar";

// ===== Estado global =====
window.correoUsuarioActivo = null;
window.idMiembroVisible = null;
window.nombreMiembroVisible = null;
window.listaMiembrosCache = null;
window.modoDialogoCita = "crear"; // "crear" o "reprogramar"
window.idCitaEnEdicion = null;

// ===== Helper genérico para llamar al backend =====
async function llamarBackend(accion, datos) {
  const cuerpo = Object.assign({ accion: accion }, datos || {});
  const respuesta = await fetch(URL_BACKEND, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(cuerpo),
  });
  const resultado = await respuesta.json();
  if (resultado && resultado.error) {
    throw new Error(resultado.error);
  }
  return resultado;
}

function obtenerCorreoUsuario() {
  return window.correoUsuarioActivo;
}

// ===== Sesión (localStorage) =====
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

// ===== Login / Logout =====
function mostrarAplicacionComoLogueado(email, nombre) {
  window.correoUsuarioActivo = email;
  const inicial = (nombre || email || "?").charAt(0).toUpperCase();
  document.getElementById("inicialUsuario").textContent = inicial;
  document.getElementById("avatarSaludo").textContent = inicial;
  document.getElementById("nombreSaludo").textContent = nombre || email;
  document.getElementById("pantallaLogin").classList.add("oculto");
  document.getElementById("aplicacion").classList.remove("oculto");
  resolverMiembroActivo();
  cargarResumenInicio();
}

function cerrarSesion() {
  window.correoUsuarioActivo = null;
  window.idMiembroVisible = null;
  window.nombreMiembroVisible = null;
  window.listaMiembrosCache = null;
  borrarSesionGuardada();
  document.getElementById("aplicacion").classList.add("oculto");
  document.getElementById("pantallaLogin").classList.remove("oculto");
}

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
    history.replaceState(null, "", window.location.pathname);
    return true;
  } catch (error) {
    alert("No se pudo completar el inicio de sesión. Detalle técnico: " + error.message);
    return false;
  }
}

// ===== Resolver miembro activo (mapea correo -> id_miembro) =====
async function resolverMiembroActivo() {
  try {
    const resumen = await llamarBackend("listarResumenInicio", {
      correoUsuario: obtenerCorreoUsuario(),
      idMiembroConsultado: "",
      codigoVerificacion: "",
    });
    const nombreResuelto = resumen.miembro;
    const respuestaMiembros = await llamarBackend("listarMiembros", {});
    const miembros = respuestaMiembros.miembros || [];
    window.listaMiembrosCache = miembros;
    const miembroPropio = miembros.filter(function (m) {
      return m.nombre === nombreResuelto;
    })[0];
    if (miembroPropio) {
      window.idMiembroVisible = miembroPropio.id_miembro;
      window.nombreMiembroVisible = miembroPropio.nombre;
    }
  } catch (error) {
    console.error("No se pudo resolver el miembro activo:", error.message);
  }
}

// ===== Resumen de inicio =====
async function cargarResumenInicio() {
  try {
    const resumen = await llamarBackend("listarResumenInicio", {
      correoUsuario: obtenerCorreoUsuario(),
      idMiembroConsultado: window.idMiembroVisible || "",
      codigoVerificacion: "",
    });
    // Aquí puedes ajustar más adelante el pintado del resumen (tomas y citas de hoy).
  } catch (error) {
    console.error("No se pudo cargar el resumen de inicio:", error.message);
  }
}

// ===== Menú lateral =====
function abrirMenu() {
  document.getElementById("barraLateral").classList.add("barra-lateral--abierta");
  document.getElementById("superposicionMenu").classList.add("superposicion--visible");
}

function cerrarMenu() {
  document.getElementById("barraLateral").classList.remove("barra-lateral--abierta");
  document.getElementById("superposicionMenu").classList.remove("superposicion--visible");
}

// ===== Cambiar de vista =====
function mostrarVista(nombreVista) {
  document.querySelectorAll(".contenido").forEach(function (vista) {
    vista.classList.add("oculto");
  });
  const vistaObjetivo = document.getElementById(
    "vista" + nombreVista.charAt(0).toUpperCase() + nombreVista.slice(1)
  );
  if (vistaObjetivo) {
    vistaObjetivo.classList.remove("oculto");
  }
  document.querySelectorAll(".barra-lateral__item").forEach(function (item) {
    item.classList.toggle("barra-lateral__item--activo", item.dataset.vista === nombreVista);
  });
  cerrarMenu();

  if (nombreVista === "citas") {
    cargarCitas();
  }
}

// ===== CITAS =====
async function cargarCitas() {
  const contenedor = document.getElementById("listaCitas");
  contenedor.innerHTML = '<p class="texto-vacio">Cargando citas...</p>';
  try {
    const citas = await llamarBackend("listarCitas", { idMiembro: window.idMiembroVisible });
    if (!citas || !citas.length) {
      contenedor.innerHTML = '<p class="texto-vacio">No hay citas registradas todavía.</p>';
      return;
    }
    contenedor.innerHTML = "";
    citas.forEach(function (cita) {
      contenedor.appendChild(crearTarjetaCita(cita));
    });
  } catch (error) {
    contenedor.innerHTML = '<p class="texto-vacio">No se pudieron cargar las citas: ' + error.message + "</p>";
  }
}

function formatearFechaVisible(fecha) {
  if (!fecha) return "";
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function crearTarjetaCita(cita) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta--cita-item";

  const linea1 = document.createElement("div");
  linea1.className = "tarjeta--cita-item__linea1";
  const titulo = document.createElement("strong");
  titulo.textContent = cita.especialidad + (cita.medico ? " · " + cita.medico : "");
  const estado = document.createElement("span");
  estado.className = "tarjeta--cita-item__estado estado--" + (cita.estado || "programada");
  estado.textContent = cita.estado || "programada";
  linea1.appendChild(titulo);
  linea1.appendChild(estado);
  tarjeta.appendChild(linea1);

  const detalle = document.createElement("div");
  detalle.textContent =
    formatearFechaVisible(cita.fecha) + " · " + (cita.hora || "") + (cita.lugar ? " · " + cita.lugar : "");
  tarjeta.appendChild(detalle);

  if (cita.notas) {
    const notas = document.createElement("div");
    notas.textContent = cita.notas;
    tarjeta.appendChild(notas);
  }

  if (cita.temas && cita.temas.length) {
    const contenedorTemas = document.createElement("div");
    contenedorTemas.className = "tarjeta--cita-item__temas";
    cita.temas.forEach(function (nombreTema) {
      const etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta-tema";
      etiqueta.textContent = nombreTema;
      contenedorTemas.appendChild(etiqueta);
    });
    tarjeta.appendChild(contenedorTemas);
  }

  if ((cita.estado || "programada") === "programada") {
    const acciones = document.createElement("div");
    acciones.className = "tarjeta--cita-item__acciones";

    const botonAtendida = document.createElement("button");
    botonAtendida.textContent = "Marcar atendida";
    botonAtendida.addEventListener("click", function () {
      abrirDialogoResultado(cita.id_cita);
    });

    const botonCancelar = document.createElement("button");
    botonCancelar.textContent = "Cancelar";
    botonCancelar.addEventListener("click", function () {
      cancelarCitaExistente(cita.id_cita);
    });

    const botonReprogramar = document.createElement("button");
    botonReprogramar.textContent = "Reprogramar";
    botonReprogramar.addEventListener("click", function () {
      abrirDialogoCita("reprogramar", cita);
    });

    acciones.appendChild(botonAtendida);
    acciones.appendChild(botonCancelar);
    acciones.appendChild(botonReprogramar);
    tarjeta.appendChild(acciones);
  }

  return tarjeta;
}

function abrirDialogoResultado(idCita) {
  window.idCitaResultado = idCita;
  document.getElementById("resultadoRecomendaciones").value = "";
  document.getElementById("resultadoExamenes").value = "";
  document.getElementById("listaPendientesFormulario").innerHTML = "";
  document.getElementById("dialogoResultado").showModal();
}

function agregarFilaPendienteAlFormulario() {
  const fila = document.createElement("div");
  fila.className = "fila-pendiente";

  const selectTipo = document.createElement("select");
  selectTipo.className = "pendiente-tipo";
  [
    { valor: "control", texto: "Cita de control" },
    { valor: "examen", texto: "Examen" },
    { valor: "medicamento", texto: "Medicamento" },
  ].forEach(function (opcion) {
    const elementoOpcion = document.createElement("option");
    elementoOpcion.value = opcion.valor;
    elementoOpcion.textContent = opcion.texto;
    selectTipo.appendChild(elementoOpcion);
  });

  const inputDescripcion = document.createElement("input");
  inputDescripcion.type = "text";
  inputDescripcion.className = "pendiente-descripcion";
  inputDescripcion.placeholder = "Descripción";

  const etiquetaAutorizacion = document.createElement("label");
  const casillaAutorizacion = document.createElement("input");
  casillaAutorizacion.type = "checkbox";
  casillaAutorizacion.className = "pendiente-autorizacion";
  etiquetaAutorizacion.appendChild(casillaAutorizacion);
  etiquetaAutorizacion.appendChild(document.createTextNode("Requiere autorización"));

  const botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.textContent = "✕";
  botonEliminar.addEventListener("click", function () {
    fila.remove();
  });

  fila.appendChild(selectTipo);
  fila.appendChild(inputDescripcion);
  fila.appendChild(etiquetaAutorizacion);
  fila.appendChild(botonEliminar);

  document.getElementById("listaPendientesFormulario").appendChild(fila);
}

async function guardarResultado() {
  const recomendaciones = document.getElementById("resultadoRecomendaciones").value.trim();
  const examenesNuevos = document.getElementById("resultadoExamenes").value.trim();

  const pendientes = Array.from(document.querySelectorAll("#listaPendientesFormulario .fila-pendiente"))
    .map(function (fila) {
      return {
        tipo: fila.querySelector(".pendiente-tipo").value,
        descripcion: fila.querySelector(".pendiente-descripcion").value.trim(),
        requiereAutorizacion: fila.querySelector(".pendiente-autorizacion").checked,
      };
    })
    .filter(function (p) {
      return p.descripcion !== "";
    });

  try {
    await llamarBackend("registrarResultado", {
      idCita: window.idCitaResultado,
      idMiembro: window.idMiembroVisible,
      recomendaciones: recomendaciones,
      examenesNuevos: examenesNuevos,
      pendientes: pendientes,
    });
    document.getElementById("dialogoResultado").close();
    alert("Resultado guardado correctamente.");
    cargarCitas();
  } catch (error) {
    alert("No se pudo guardar el resultado: " + error.message);
  }
}

async function cancelarCitaExistente(idCita) {
  if (!confirm("¿Deseas cancelar esta cita?")) return;
  try {
    await llamarBackend("cancelarCita", { idCita: idCita });
    cargarCitas();
  } catch (error) {
    alert("No se pudo cancelar la cita: " + error.message);
  }
}

async function cargarTemasEnFormulario(temasSeleccionados) {
  const contenedor = document.getElementById("temasCitaContenedor");
  contenedor.innerHTML = "Cargando temas...";
  try {
    const temas = await llamarBackend("listarTemas", { idMiembro: window.idMiembroVisible });
    contenedor.innerHTML = "";
    if (!temas || !temas.length) {
      contenedor.innerHTML = '<span class="texto-vacio">No hay temas creados todavía.</span>';
      return;
    }
    temas.forEach(function (tema) {
      const etiqueta = document.createElement("label");
      const casilla = document.createElement("input");
      casilla.type = "checkbox";
      casilla.value = tema.id_tema;
      casilla.checked = (temasSeleccionados || []).indexOf(tema.nombre) !== -1;
      etiqueta.appendChild(casilla);
      etiqueta.appendChild(document.createTextNode(tema.nombre));
      contenedor.appendChild(etiqueta);
    });
  } catch (error) {
    contenedor.innerHTML = '<span class="texto-vacio">No se pudieron cargar los temas.</span>';
  }
}

function abrirDialogoCita(modo, citaOriginal) {
  window.modoDialogoCita = modo;
  window.idCitaEnEdicion = citaOriginal ? citaOriginal.id_cita : null;

  document.getElementById("tituloDialogoCita").textContent =
    modo === "reprogramar" ? "Reprogramar cita" : "Nueva cita";
  document.getElementById("etiquetaCitaPara").textContent = "Para: " + (window.nombreMiembroVisible || "");
  document.getElementById("citaEspecialidad").value = citaOriginal ? citaOriginal.especialidad || "" : "";
  document.getElementById("citaMedico").value = citaOriginal ? citaOriginal.medico || "" : "";
  document.getElementById("citaLugar").value = citaOriginal ? citaOriginal.lugar || "" : "";
  document.getElementById("citaNotas").value = citaOriginal ? citaOriginal.notas || "" : "";
  document.getElementById("citaFecha").value = "";
  document.getElementById("citaHora").value = "";
    const hoy = new Date();
  const hoyFormateada =
    hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
  document.getElementById("citaFecha").min = hoyFormateada;

  cargarTemasEnFormulario(citaOriginal ? citaOriginal.temas : []);

  document.getElementById("dialogoCita").showModal();
}

async function guardarCita() {
  const especialidad = document.getElementById("citaEspecialidad").value.trim();
  const medico = document.getElementById("citaMedico").value.trim();
  const fecha = document.getElementById("citaFecha").value;
  const hora = document.getElementById("citaHora").value;
  const lugar = document.getElementById("citaLugar").value.trim();
  const notas = document.getElementById("citaNotas").value.trim();
    const hoy = new Date();
  const hoyFormateada =
    hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
  if (fecha < hoyFormateada) {
    alert("No puedes registrar una cita en una fecha anterior a hoy.");
    return;
  }

  if (!especialidad || !fecha || !hora) {
    alert("Especialidad, fecha y hora son obligatorios.");
    return;
  }

  const idsTemas = Array.from(document.querySelectorAll("#temasCitaContenedor input:checked")).map(function (c) {
    return c.value;
  });

  const datos = {
    idMiembro: window.idMiembroVisible,
    especialidad: especialidad,
    medico: medico,
    fecha: fecha,
    hora: hora,
    lugar: lugar,
    notas: notas,
    idsTemas: idsTemas,
  };

  try {
    if (window.modoDialogoCita === "reprogramar") {
      datos.idCitaOriginal = window.idCitaEnEdicion;
      await llamarBackend("reprogramarCita", datos);
    } else {
      await llamarBackend("registrarCita", datos);
    }
    document.getElementById("dialogoCita").close();
    alert("Cita guardada correctamente.");
    cargarCitas();
  } catch (error) {
    alert("No se pudo guardar la cita: " + error.message);
  }
}

// ===== Cambiar de miembro visible (con código de verificación) =====
async function abrirDialogoCambioMiembro() {
  try {
    let miembros = window.listaMiembrosCache;
    if (!miembros) {
      const respuesta = await llamarBackend("listarMiembros", {});
      miembros = respuesta.miembros || [];
      window.listaMiembrosCache = miembros;
    }
    const selector = document.getElementById("miembroSeleccionado");
    selector.innerHTML = "";
    miembros.forEach(function (miembro) {
      const opcion = document.createElement("option");
      opcion.value = miembro.id_miembro;
      opcion.textContent = miembro.nombre;
      selector.appendChild(opcion);
    });
    document.getElementById("dialogoCodigoVerificacion").showModal();
  } catch (error) {
    alert("No se pudieron cargar los miembros: " + error.message);
  }
}

async function confirmarCambioMiembro() {
  const idSeleccionado = document.getElementById("miembroSeleccionado").value;
  const codigo = document.getElementById("codigoVerificacion").value.trim();
  try {
    const resumen = await llamarBackend("listarResumenInicio", {
      correoUsuario: obtenerCorreoUsuario(),
      idMiembroConsultado: idSeleccionado,
      codigoVerificacion: codigo,
    });
    window.idMiembroVisible = idSeleccionado;
    const miembro = (window.listaMiembrosCache || []).filter(function (m) {
      return m.id_miembro === idSeleccionado;
    })[0];
    window.nombreMiembroVisible = miembro ? miembro.nombre : "";
    document.getElementById("etiquetaPersonaVisible").textContent = "Mostrando: " + window.nombreMiembroVisible;
    document.getElementById("dialogoCodigoVerificacion").close();
    document.getElementById("codigoVerificacion").value = "";
    cargarResumenInicio();
    if (document.getElementById("vistaCitas") && !document.getElementById("vistaCitas").classList.contains("oculto")) {
      cargarCitas();
    }
  } catch (error) {
    alert("No se pudo verificar el código: " + error.message);
  }
}

// ===== Conexión de eventos al cargar la página =====
window.addEventListener("load", async function () {
  document.getElementById("botonGoogleSignIn").addEventListener("click", iniciarLoginGoogle);
  document.getElementById("botonMenu").addEventListener("click", abrirMenu);
  document.getElementById("superposicionMenu").addEventListener("click", cerrarMenu);

  document.querySelectorAll(".barra-lateral__item").forEach(function (item) {
    item.addEventListener("click", function () {
      const vista = item.dataset.vista;
      if (vista === "inicio" || vista === "citas") {
        mostrarVista(vista);
      } else {
        cerrarMenu();
        alert("Esta sección todavía está en construcción.");
      }
    });
  });

  document.getElementById("botonCambiarMiembro").addEventListener("click", abrirDialogoCambioMiembro);
  document.getElementById("botonConfirmarCodigo").addEventListener("click", confirmarCambioMiembro);

  document.getElementById("botonPerfil").addEventListener("click", function () {
    if (confirm("¿Deseas cerrar sesión?")) {
      cerrarSesion();
    }
  });

  document.getElementById("botonNuevaCita").addEventListener("click", function () {
    abrirDialogoCita("crear", null);
  });
  document.getElementById("botonNuevaCitaVista").addEventListener("click", function () {
    abrirDialogoCita("crear", null);
  });
  document.getElementById("botonCancelarCita").addEventListener("click", function () {
    document.getElementById("dialogoCita").close();
  });
  document.getElementById("botonGuardarCita").addEventListener("click", guardarCita);
  document.getElementById("botonAgregarPendiente").addEventListener("click", agregarFilaPendienteAlFormulario);
  document.getElementById("botonCancelarResultado").addEventListener("click", function () {
    document.getElementById("dialogoResultado").close();
  });
  document.getElementById("botonGuardarResultado").addEventListener("click", guardarResultado);

  const entroConTokenNuevo = await revisarTokenEnUrl();
  if (entroConTokenNuevo) return;
  const sesionGuardada = leerSesionGuardada();
  if (sesionGuardada) {
    mostrarAplicacionComoLogueado(sesionGuardada.email, sesionGuardada.nombre);
  }
});
