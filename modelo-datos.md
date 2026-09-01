# Modelo de datos

La totalidad de la información estructurada de la aplicación se almacena en un único archivo de Google Sheets, dentro del cual cada pestaña cumple el papel de una tabla independiente. Los archivos adjuntos, al no poder residir dentro de una celda, se guardan en Google Drive y lo que queda registrado en la hoja correspondiente es únicamente el enlace al archivo. A continuación se describe cada pestaña con sus columnas.

### Miembros

| Columna | Descripción |
|---|---|
| id_miembro | Identificador único del integrante |
| nombre | Nombre completo |
| fecha_nacimiento | Fecha de nacimiento |
| correo_propio | Correo del miembro, si maneja uno propio |
| correo_cuidador | Correo del cuidador responsable, si aplica |
| destinatario_avisos | Indica si los avisos van al propio miembro, al cuidador, o a ambos |
| codigo_verificacion | Código que otro usuario debe ingresar para consultar la información de este miembro |

### Temas

| Columna | Descripción |
|---|---|
| id_tema | Identificador único del tema |
| nombre | Nombre del tema de salud (ej. Cardiovascular, Tensión arterial) |
| descripcion | Descripción libre del alcance del tema |

### Citas

| Columna | Descripción |
|---|---|
| id_cita | Identificador único de la cita |
| id_miembro | Miembro al que corresponde |
| especialidad | Especialidad médica |
| medico | Nombre del profesional |
| fecha | Fecha de la cita |
| hora | Hora de la cita |
| lugar | Lugar de atención |
| estado | Programada, atendida o cancelada |
| id_cita_reemplazo | Referencia a la nueva cita creada al reprogramar esta, si fue cancelada con ese fin |
| es_recurrente | Reservado para futuras versiones con controles periódicos |
| notas | Observaciones libres |

Cuando una cita pasa a estado cancelada y se decide reprogramarla, se crea una fila nueva en esta misma pestaña con su propia fecha, hora y estado programada, y el identificador de esa fila nueva queda anotado en id_cita_reemplazo de la cita cancelada, preservando así la relación entre ambas.

### Citas_Temas

| Columna | Descripción |
|---|---|
| id_cita | Referencia a la cita |
| id_tema | Referencia al tema asociado |

Esta pestaña resuelve la relación de varios a varios entre citas y temas, ya que una misma cita puede tocar más de un tema de salud a la vez.

### Resultados

| Columna | Descripción |
|---|---|
| id_resultado | Identificador único del resultado |
| id_cita | Cita que dio origen a este resultado |
| recomendaciones | Recomendaciones o diagnóstico entregado |
| examenes_nuevos | Exámenes ordenados |
| fecha_registro | Fecha en que se registró el resultado |

### Medicamentos

| Columna | Descripción |
|---|---|
| id_medicamento | Identificador único del medicamento |
| id_miembro | Miembro al que corresponde |
| id_resultado | Resultado que originó la formulación, si aplica |
| nombre | Nombre del medicamento |
| dosis | Dosis indicada |
| fecha_inicio | Fecha de inicio del tratamiento |
| fecha_fin | Fecha de finalización del tratamiento |
| horarios | Horas fijas de toma, separadas por coma (ej. 07:00, 15:00, 23:00) |

### Tomas

| Columna | Descripción |
|---|---|
| id_toma | Identificador único de la toma |
| id_medicamento | Medicamento al que corresponde |
| fecha | Fecha de la toma programada |
| hora_programada | Hora programada para esa toma |
| estado | Pendiente, tomada u omitida |
| fecha_confirmacion | Momento en que se marcó la toma |

Esta pestaña se alimenta de manera automática a partir de los horarios definidos en Medicamentos: por cada día de vigencia del tratamiento y por cada horario fijo, se genera una fila independiente que representa una toma puntual, lo que permite marcar cada una individualmente y disparar los reintentos de recordatorio sobre las que sigan pendientes después de la hora programada.

### Documentos

| Columna | Descripción |
|---|---|
| id_documento | Identificador único del documento |
| id_miembro | Miembro al que pertenece |
| id_cita | Cita o resultado al que se asocia, si aplica; queda vacío si es un documento suelto |
| tipo | Tipo de documento (fórmula, examen, carné, historial previo, otro) |
| url_drive | Enlace al archivo almacenado en Google Drive |
| descripcion | Descripción libre |
| fecha_subida | Fecha en que se cargó el documento |
