/**
 * Historial de Salud Familiar — backend en Apps Script.
 * Pegar completo en el editor vinculado al Google Sheets (Extensiones > Apps Script).
 *
 * Convención de formatos que el frontend debe respetar al enviar datos:
 *   - fechas: "yyyy-MM-dd" (formato estándar de un <input type="date">)
 *   - horas: "HH:mm" en 24 horas (formato estándar de un <input type="time">)
 */

const LIBRO = SpreadsheetApp.getActiveSpreadsheet();
const CARPETA_DOCUMENTOS_ID = "1eHAsTUEbljbbZbY9Jd-a0q0KuGKSGE5k";
const DIAS_AVISO_CITA = [2, 1, 0]; // días de anticipación en que se envía el recordatorio de una cita

function doPost(peticion) {
  const cuerpo = JSON.parse(peticion.postData.contents);
  let resultado;
  try {
    switch (cuerpo.accion) {
      case "listarResumenInicio":
        resultado = listarResumenInicio(cuerpo.correoUsuario, cuerpo.idMiembroConsultado, cuerpo.codigoVerificacion);
        break;
      case "registrarCita":
        resultado = registrarCita(cuerpo);
        break;
      case "cancelarCita":
        resultado = cancelarCita(cuerpo);
        break;
      case "marcarCitaAtendida":
        resultado = marcarCitaAtendida(cuerpo);
        break;
      case "reprogramarCita":
        resultado = reprogramarCita(cuerpo);
        break;
      case "registrarResultado":
        resultado = registrarResultado(cuerpo);
        break;
      case "registrarMedicamento":
        resultado = registrarMedicamento(cuerpo);
        break;
      case "marcarToma":
        resultado = marcarToma(cuerpo);
        break;
      case "subirDocumento":
        resultado = subirDocumento(cuerpo);
        break;
      default:
        resultado = { error: "Acción no reconocida: " + cuerpo.accion };
    }
  } catch (error) {
    resultado = { error: error.message };
  }
  return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Utilidades generales de lectura/escritura sobre las hojas ---------- */

function obtenerHoja(nombre) {
  const hoja = LIBRO.getSheetByName(nombre);
  if (!hoja) throw new Error("No existe la hoja: " + nombre);
  return hoja;
}

/** Lee todas las filas de una hoja (desde la fila 2) como objetos, usando la fila 1 como encabezados. */
function filasComoObjetos(nombreHoja) {
  const hoja = obtenerHoja(nombreHoja);
  const valores = hoja.getDataRange().getValues();
  const encabezados = valores[0];
  const filas = [];
  for (let i = 1; i < valores.length; i++) {
    if (valores[i].join("") === "") continue;
    const objeto = { _fila: i + 1 };
    encabezados.forEach((encabezado, indice) => { objeto[encabezado] = valores[i][indice]; });
    filas.push(objeto);
  }
  return filas;
}

/** Agrega una fila nueva respetando el orden real de las columnas de la hoja. */
function agregarFila(nombreHoja, objetoValores) {
  const hoja = obtenerHoja(nombreHoja);
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const fila = encabezados.map((encabezado) => (objetoValores[encabezado] !== undefined ? objetoValores[encabezado] : ""));
  hoja.appendRow(fila);
}

/** Actualiza, por número real de fila, solo los campos indicados. */
function actualizarFila(nombreHoja, numeroFila, camposActualizados) {
  const hoja = obtenerHoja(nombreHoja);
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  encabezados.forEach((encabezado, indice) => {
    if (camposActualizados[encabezado] !== undefined) {
      hoja.getRange(numeroFila, indice + 1).setValue(camposActualizados[encabezado]);
    }
  });
}

function generarId(prefijo) {
  return prefijo + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function formatearFecha(fecha) {
  return Utilities.formatDate(fecha, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function quitarHora(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/* ---------- Miembros ---------- */

function obtenerMiembroPorCorreo(correo) {
  return filasComoObjetos("Miembros").find((m) => m.correo_propio === correo || m.correo_cuidador === correo) || null;
}

function obtenerMiembroPorId(idMiembro) {
  return filasComoObjetos("Miembros").find((m) => m.id_miembro === idMiembro) || null;
}

function obtenerMiembroPorNombre(nombre) {
  return filasComoObjetos("Miembros").find((m) => String(m.nombre).trim().toLowerCase() === String(nombre).trim().toLowerCase()) || null;
}

function resolverDestinatario(miembro) {
  if (miembro.destinatario_avisos === "cuidador") return miembro.correo_cuidador || null;
  if (miembro.destinatario_avisos === "ambos") {
    return [miembro.correo_propio, miembro.correo_cuidador].filter(Boolean).join(",") || null;
  }
  return miembro.correo_propio || null;
}

/* ---------- Pantalla de inicio ---------- */

function listarResumenInicio(correoUsuario, idMiembroConsultado, codigoVerificacion) {
  const miembro = idMiembroConsultado
    ? (obtenerMiembroPorId(idMiembroConsultado) || obtenerMiembroPorNombre(idMiembroConsultado))
    : obtenerMiembroPorCorreo(correoUsuario);

  if (!miembro) return { error: "No se encontró el miembro correspondiente." };
  if (idMiembroConsultado && String(miembro.codigo_verificacion) !== String(codigoVerificacion)) {
    return { error: "Código de verificación incorrecto." };
  }

  const hoy = formatearFecha(new Date());

  const medicamentosDelMiembro = filasComoObjetos("Medicamentos").filter((m) => m.id_miembro === miembro.id_miembro);
  const idsMedicamentos = medicamentosDelMiembro.map((m) => m.id_medicamento);

  const tomasHoy = filasComoObjetos("Tomas")
    .filter((t) => idsMedicamentos.includes(t.id_medicamento) && t.fecha === hoy)
    .map((t) => {
      const medicamento = medicamentosDelMiembro.find((m) => m.id_medicamento === t.id_medicamento);
      return {
        id_toma: t.id_toma,
        hora: t.hora_programada,
        estado: t.estado,
        medicamento: medicamento ? medicamento.nombre + " " + medicamento.dosis : "",
      };
    })
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const citasProximas = filasComoObjetos("Citas")
    .filter((c) => c.id_miembro === miembro.id_miembro && c.estado === "programada" && c.fecha >= hoy)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 5)
    .map((c) => ({ id_cita: c.id_cita, especialidad: c.especialidad, medico: c.medico, fecha: c.fecha, hora: c.hora, lugar: c.lugar }));

  return { miembro: miembro.nombre, tomasHoy: tomasHoy, citasProximas: citasProximas };
}

/* ---------- Citas ---------- */

function registrarCita(datos) {
  const idCita = generarId("C");
  agregarFila("Citas", {
    id_cita: idCita,
    id_miembro: datos.idMiembro,
    especialidad: datos.especialidad,
    medico: datos.medico,
    fecha: datos.fecha,
    hora: datos.hora,
    lugar: datos.lugar,
    estado: "programada",
    id_cita_reemplazo: "",
    es_recurrente: datos.esRecurrente ? "si" : "no",
    notas: datos.notas || "",
  });

  if (datos.idsTemas && datos.idsTemas.length) {
    datos.idsTemas.forEach((idTema) => agregarFila("Citas_Temas", { id_cita: idCita, id_tema: idTema }));
  }

  return { ok: true, idCita: idCita };
}

function cancelarCita(datos) {
  const cita = filasComoObjetos("Citas").find((c) => c.id_cita === datos.idCita);
  if (!cita) return { error: "No se encontró la cita." };
  actualizarFila("Citas", cita._fila, { estado: "cancelada" });
  return { ok: true };
}

function marcarCitaAtendida(datos) {
  const cita = filasComoObjetos("Citas").find((c) => c.id_cita === datos.idCita);
  if (!cita) return { error: "No se encontró la cita." };
  actualizarFila("Citas", cita._fila, { estado: "atendida" });
  return { ok: true };
}

function reprogramarCita(datos) {
  const citaOriginal = filasComoObjetos("Citas").find((c) => c.id_cita === datos.idCitaCancelada);
  if (!citaOriginal) return { error: "No se encontró la cita original." };

  const nuevaCita = registrarCita({
    idMiembro: citaOriginal.id_miembro,
    especialidad: citaOriginal.especialidad,
    medico: citaOriginal.medico,
    fecha: datos.nuevaFecha,
    hora: datos.nuevaHora,
    lugar: datos.nuevoLugar || citaOriginal.lugar,
    notas: citaOriginal.notas,
  });

  actualizarFila("Citas", citaOriginal._fila, { estado: "cancelada", id_cita_reemplazo: nuevaCita.idCita });
  return { ok: true, idCitaNueva: nuevaCita.idCita };
}

/* ---------- Resultados ---------- */

function registrarResultado(datos) {
  const idResultado = generarId("R");
  agregarFila("Resultados", {
    id_resultado: idResultado,
    id_cita: datos.idCita,
    recomendaciones: datos.recomendaciones || "",
    examenes_nuevos: datos.examenesNuevos || "",
    fecha_registro: formatearFecha(new Date()),
  });
  marcarCitaAtendida({ idCita: datos.idCita });
  return { ok: true, idResultado: idResultado };
}

/* ---------- Medicamentos y tomas ---------- */

function registrarMedicamento(datos) {
  const idMedicamento = generarId("MED");
  agregarFila("Medicamentos", {
    id_medicamento: idMedicamento,
    id_miembro: datos.idMiembro,
    id_resultado: datos.idResultado || "",
    nombre: datos.nombre,
    dosis: datos.dosis,
    fecha_inicio: datos.fechaInicio,
    fecha_fin: datos.fechaFin,
    horarios: datos.horarios.join(", "),
  });

  generarTomasParaMedicamento(idMedicamento, datos.fechaInicio, datos.fechaFin, datos.horarios);
  return { ok: true, idMedicamento: idMedicamento };
}

function generarTomasParaMedicamento(idMedicamento, fechaInicio, fechaFin, horarios) {
  let fechaActual = new Date(fechaInicio + "T00:00:00");
  const fechaLimite = new Date(fechaFin + "T00:00:00");

  while (fechaActual <= fechaLimite) {
    const fechaTexto = formatearFecha(fechaActual);
    horarios.forEach((hora) => {
      agregarFila("Tomas", {
        id_toma: generarId("TO"),
        id_medicamento: idMedicamento,
        fecha: fechaTexto,
        hora_programada: hora,
        estado: "pendiente",
        fecha_confirmacion: "",
      });
    });
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
}

function marcarToma(datos) {
  const toma = filasComoObjetos("Tomas").find((t) => t.id_toma === datos.idToma);
  if (!toma) return { error: "No se encontró la toma." };
  actualizarFila("Tomas", toma._fila, {
    estado: datos.estado,
    fecha_confirmacion: formatearFecha(new Date()) + " " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm"),
  });
  return { ok: true };
}

/* ---------- Documentos (con subcarpetas automáticas por miembro y tema) ---------- */

function subirDocumento(datos) {
  const miembro = obtenerMiembroPorId(datos.idMiembro);
  if (!miembro) return { error: "No se encontró el miembro." };

  const carpetaGeneral = DriveApp.getFolderById(CARPETA_DOCUMENTOS_ID);
  const carpetaMiembro = obtenerOCrearSubcarpeta(carpetaGeneral, miembro.nombre);
  const carpetaDestino = datos.nombreTema ? obtenerOCrearSubcarpeta(carpetaMiembro, datos.nombreTema) : carpetaMiembro;

  const bytes = Utilities.base64Decode(datos.contenidoBase64);
  const blob = Utilities.newBlob(bytes, datos.tipoMime, datos.nombreArchivo);
  const archivo = carpetaDestino.createFile(blob);

  const idDocumento = generarId("D");
  agregarFila("Documentos", {
    id_documento: idDocumento,
    id_miembro: datos.idMiembro,
    id_cita: datos.idCita || "",
    tipo: datos.tipo || "",
    url_drive: archivo.getUrl(),
    descripcion: datos.descripcion || "",
    fecha_subida: formatearFecha(new Date()),
  });

  return { ok: true, idDocumento: idDocumento, url: archivo.getUrl() };
}

function obtenerOCrearSubcarpeta(carpetaPadre, nombreSubcarpeta) {
  const existentes = carpetaPadre.getFoldersByName(nombreSubcarpeta);
  if (existentes.hasNext()) return existentes.next();
  return carpetaPadre.createFolder(nombreSubcarpeta);
}

/* ---------- Recordatorios ---------- */

/**
 * Tarea programada: crear en Activadores (icono de reloj) un disparador de tiempo
 * que ejecute esta función cada 15 minutos, para que las citas y las tomas
 * pendientes se revisen y reenvíen dentro de esa misma ventana.
 */
function revisarRecordatorios() {
  enviarRecordatoriosDeCitas();
  enviarRecordatoriosDeTomas();
}

function enviarRecordatoriosDeCitas() {
  const hoy = quitarHora(new Date());
  filasComoObjetos("Citas")
    .filter((c) => c.estado === "programada")
    .forEach((cita) => {
      const fechaCita = new Date(cita.fecha + "T00:00:00");
      const diasFaltantes = Math.round((fechaCita - hoy) / (1000 * 60 * 60 * 24));
      if (!DIAS_AVISO_CITA.includes(diasFaltantes)) return;

      const miembro = obtenerMiembroPorId(cita.id_miembro);
      const destinatario = miembro && resolverDestinatario(miembro);
      if (!destinatario) return;

      enviarCorreoRecordatorio(
        destinatario,
        "Recordatorio de cita: " + cita.especialidad + " el " + cita.fecha,
        "Hola,\n\nTienes una cita de " + cita.especialidad + " con " + cita.medico +
          " el " + cita.fecha + " a las " + cita.hora + " en " + cita.lugar + "."
      );
    });
}

function enviarRecordatoriosDeTomas() {
  const ahora = new Date();
  const medicamentos = filasComoObjetos("Medicamentos");

  filasComoObjetos("Tomas")
    .filter((t) => t.estado === "pendiente")
    .forEach((toma) => {
      const momentoProgramado = new Date(toma.fecha + "T" + toma.hora_programada + ":00");
      if (momentoProgramado > ahora) return;

      const medicamento = medicamentos.find((m) => m.id_medicamento === toma.id_medicamento);
      const miembro = medicamento && obtenerMiembroPorId(medicamento.id_miembro);
      const destinatario = miembro && resolverDestinatario(miembro);
      if (!destinatario) return;

      enviarCorreoRecordatorio(
        destinatario,
        "Recordatorio de medicamento: " + medicamento.nombre,
        "Hola,\n\nEs hora de tomar " + medicamento.nombre + " " + medicamento.dosis +
          " (programado a las " + toma.hora_programada + "). Marca la toma en la aplicación una vez la tomes."
      );
    });
}

function enviarCorreoRecordatorio(destinatario, asunto, cuerpo) {
  MailApp.sendEmail(destinatario, asunto, cuerpo);
}
