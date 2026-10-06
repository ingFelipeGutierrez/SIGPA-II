# Hallazgos y decisiones: prototipo vs. casos de uso (Paso 2.3)

Este archivo se va completando panel por panel y alimenta el documento maestro para Claude Code.

Tipos de hallazgo:

- **A** — Está en el caso de uso y **falta** en el prototipo.
- **B** — Está en el prototipo y **no está** en los casos de uso.
- **C** — Está en ambos, pero **no coincide**.

Avance de la revisión: **Estudiante ✅ · Docente ✅ · Director ✅ · Login e Inicio ✅ · Revisión cruzada ✅ (verificación automática) · Pendiente: documento maestro**

---

## 1. Panel del Estudiante (3 CU)

| ID | Tipo | Hallazgo | Decisión | Estado |
|---|---|---|---|---|
| E-01 | A | El formulario de bitácora no tenía el control para adjuntar evidencias. | Adjuntar dentro del formulario, con estilo de formulario por pasos. | Decidido |
| E-02 | A | "Mi práctica" no mostraba el tipo ni el nivel de práctica. | Agregarlos. | Decidido |
| E-03 | A | Solo había un badge "Activa"; faltaba el estado de aprobación con fecha de actualización y motivo de rechazo. | Agregarlos. | Decidido |
| E-04 | A | No existía la retroalimentación del docente. | Bloque nuevo en "Evaluaciones". | Decidido |
| E-05 | A | Faltaban las ramas de detalle (institución, requisitos del nivel, motivo de rechazo, horas por bitácora). | Ventanas modales y tabla desplegable. | Decidido |
| E-06 | B | Menú "Reportes" del estudiante; ningún CU lo respalda. | Eliminarlo. | Decidido |
| E-07 | B | Página "Evidencias" independiente. | Eliminarla; las evidencias van en la bitácora y se ven desde "Ver". | Decidido |
| E-08 | B | Página "Horas" separada de "Mi práctica". | Unificar en una sola vista. | Decidido |
| E-09 | B | La evaluación del Director aparecía al estudiante y la tabla tenía columna "Criterio". | Eliminar ambas. | Decidido |
| E-10 | B | La tarjeta "Evidencias" del Dashboard dependía de la página eliminada. | Reemplazarla por "Evaluaciones recibidas". | Decidido |
| E-11 | C | Las horas estaban escritas a mano (96 / 160) y las bitácoras aprobadas suman 7. | Calcular desde las bitácoras aprobadas. | Decidido |
| E-12 | C | Las evaluaciones no estaban ligadas a ninguna bitácora. | Cada nota queda asociada a la bitácora que califica. | Decidido |
| E-13 | C | Los CU describían "Guardar" en un formulario de un solo paso. | Reescribir el CU 3 para el formulario por pasos. | Decidido |
| E-14 | B | Enlaces del Dashboard, botón "Ver" del historial, filtro "Limpiar" y orden cronológico inverso no estaban en los CU. | Incorporarlos como ramas. | Decidido |
| E-15 | A | **Nuevo.** El CU del Docente dice que una bitácora con corrección solicitada "se habilita nuevamente para edición", pero el estudiante no podía ver el motivo ni corregir. | Botón "✏️ Corregir" que reabre el formulario por pasos con los datos; al guardar, la misma entrada vuelve a "Pendiente". Rama 2b del CU 3. | Decidido |
| E-16 | C | **Nuevo.** La retroalimentación se mostraba como "general", pero el CU del Docente la asocia a una bitácora. | Mostrarla indicando la bitácora relacionada. Ajustado en el CU 2. | Decidido |
| E-17 | C | **Nuevo.** Formato de la nota. | Mostrarla como "4.5 / 5.0". | Decidido |
| E-18 | C | **Nuevo.** El Estudiante usaba 4 estados de práctica y el Director 5, y nadie podía rechazar una práctica. | Cinco estados: "Pendiente", "En curso" y "Finalizada" los calcula el sistema; "Aprobada" y "Rechazada" las decide solo el director (con motivo). "Activa" pasa a llamarse "En curso". Ajustado en el CU 1. | Decidido |
| E-19 | A | **Nuevo.** Nada impedía registrar bitácoras antes de iniciar la práctica o después de terminarla. | "+ Nueva bitácora" solo con la práctica "En curso" (excepción 3b del CU 3). "Corregir" solo mientras la práctica no tenga resultado. | Decidido |

---

## 2. Panel del Docente Asesor (4 CU)

Idea de diseño: una sola ventana modal **"Revisión de bitácora"** con tres pestañas, que comparten los CU 2, 3 y 4. Cada pestaña tiene su propio botón "Guardar".

| ID | Tipo | Hallazgo | Decisión | Estado |
|---|---|---|---|---|
| D-01 | B | Menú "Reportes" y tarjeta "Reportes recibidos" del Dashboard; ningún CU los respalda. | Eliminarlos. | Decidido |
| D-02 | B | Menú "Evaluaciones" con un solo formulario (estudiante, criterio, calificación y retroalimentación) que mezcla los CU 3 y 4. | Eliminar el menú; la nota y la retroalimentación se registran dentro del modal. | Decidido |
| D-03 | B | Desplegable "Criterio evaluado". | Eliminarlo. | Decidido |
| D-04 | A | Faltaba el modal de revisión con la información completa y las evidencias (CU 2, pasos 4 y 5). | Modal "Revisión de bitácora" con pestaña "Detalle". | Decidido |
| D-05 | B | Botones "Aprobar" y "Rechazar" en cada fila, con `alert`. | Pasan al modal; las confirmaciones son mensajes emergentes (toast). | Decidido |
| D-06 | C | El CU decía "Rechazada / Requiere corrección" sin elegir. | Estado **"Requiere corrección"** (naranja) y botón "Solicitar corrección" con motivo obligatorio. | Decidido |
| D-07 | A | No se podían abrir las evidencias (CU 2, rama 5a). | Visor simulado con nombre, tipo, tamaño y botón "Descargar". | Decidido |
| D-08 | A | Sin filtros por estudiante ni por estado; la tabla mostraba todo en orden de registro. | Filtros "Estudiante" y "Estado" y botón "Limpiar". Orden: "Pendiente" primero. | Decidido |
| D-09 | A | La tabla no mostraba evidencias ni nota. | Columnas "Evidencias" y "Nota". | Decidido |
| D-10 | A | "Mis estudiantes" sin detalle de avance, sin filtros y sin mensajes de excepción. | Filtros, tarjeta "Avance de horas" al elegir "Ver avance" y mensajes 4a, 6c y 7a. | Decidido |
| D-11 | C | Las horas estaban escritas a mano y "Estado" mostraba "1 por revisar / Al día". | Horas calculadas desde bitácoras aprobadas; "Estado" pasa a ser el estado de la práctica. | Decidido |
| D-12 | A | El botón "Ver bitácora" no filtraba por estudiante. | "Ver bitácoras" abre "Bitácoras por revisar" ya filtrada por ese estudiante. | Decidido |
| D-13 | A | La nota no estaba ligada a una bitácora. | La nota se registra desde el modal, **solo si la bitácora está "Aprobada"**. Escala 0.0 a 5.0 con un decimal. Observaciones opcionales de hasta 500 caracteres. Nota y observaciones editables después. | Decidido |
| D-14 | C | El diagrama de clases `NOTA` tiene calificación cualitativa. | **No se usa en el prototipo** (solo la nota numérica). | Decidido; falta ajustar el diagrama de clases |
| D-15 | A | Faltaba el límite de 200 palabras, el historial por estudiante y que la retroalimentación esté ligada a la bitácora. | Pestaña "Retroalimentación" con contador, historial y bitácora relacionada. Disponible en cualquier estado de la bitácora. | Decidido |
| D-16 | C | Decidir si el modal queda abierto o se cierra tras guardar. | **Se cierra solo** al guardar la nota, la retroalimentación, la aprobación o la solicitud de corrección, para ahorrarle clics al docente. Se eliminó la rama 12a del CU 3. | Decidido |
| D-17 | C | Excepción 2a ("el estudiante no está en la lista") no puede ocurrir con una lista cerrada. | Reemplazarla por el mensaje "No tienes estudiantes asignados." | Decidido |
| D-18 | C | El CU decía que el director también consulta la retroalimentación, pero ningún CU del Director lo hace. | Se quitó "y del director" del CU 4. El director ve las notas solo consolidadas en el reporte "Desempeño y resultado de las prácticas"; la retroalimentación no llega al director. | Decidido |
| D-19 | B | Tarjetas del Dashboard escritas a mano (4 estudiantes, 68 %). | Calcularlas: estudiantes a cargo, bitácoras por revisar, avance promedio de horas y bitácoras aprobadas sin nota. Listas de "últimas bitácoras" calculadas. | Propuesto, sin objeción |

---

## 3. Panel del Director de Programa (7 CU)

| ID | Tipo | Hallazgo | Decisión | Estado |
|---|---|---|---|---|
| DR-01 | B | El menú tenía 5 opciones; "Asignación de estudiantes" y "Prácticas activas" no corresponden a un CU. | Siete opciones: Inicio, Gestionar prácticas, Instituciones receptoras, Estado de las prácticas, Supervisión de horas, Reportes y Cerrar sesión. | Decidido |
| DR-02 | C | Estados de la práctica distintos entre Estudiante (4) y Director (5), y ningún CU permitía aprobar o rechazar una práctica. | Cinco estados. "Pendiente", "En curso" y "Finalizada" los calcula el sistema; "Aprobada" y "Rechazada" las decide **solo el director**. Sin CU nuevo. | Decidido |
| DR-03 | A | Faltaba la decisión del resultado de la práctica. | Acción "Decidir resultado de la práctica" dentro del CU 1 (pasos 18 a 23), accesible también desde el CU 7. Aprobar, o rechazar con motivo obligatorio. | Decidido |
| DR-04 | A | Ningún CU asignaba un estudiante a una plaza, y los "grupos de práctica" no existían en el prototipo. | El **grupo de práctica** (nombre, plaza, tipo, nivel, fechas, horas requeridas) entrega al estudiante su plaza y sus datos. | Decidido |
| DR-05 | A | Faltaba "Asignar docente asesor" como acción propia. | Lista de estudiantes sin docente, selección múltiple, máximo 6 estudiantes por docente. | Decidido |
| DR-06 | A | El CU 2 (registrar plaza) no existía. | Página "Plazas de práctica": institución, convenio automático, cupos, jornada y descripción opcional; revisión con aprobar, rechazar o decidir después. | Decidido |
| DR-07 | C | El CU 2 se contradecía: el paso 8 pedía convenio vigente y la excepción 8b permitía registrar con convenio vencido. | Se registra como "Pendiente", pero no se puede aprobar hasta renovar el convenio. | Decidido |
| DR-08 | C | Los cupos estaban duplicados (institución y plaza). | Los cupos viven solo en la plaza; la columna "Plazas" de la institución se calcula. | Decidido |
| DR-09 | A | El Estudiante muestra dirección, contacto y tipo de institución, pero ningún formulario los capturaba. El convenio no tenía fecha de inicio. | Se agregan al formulario de institución. | Decidido |
| DR-10 | A | Faltaban el detalle del convenio, la vigencia calculada y las alertas. | "Ver convenio" con estado "Vigente", "Próximo a vencer" (60 días o menos) o "Vencido". Se agrega la rama "Renovar convenio". | Decidido |
| DR-11 | C | El estado del convenio estaba escrito a mano y siempre se registraba "Vigente". | Estado calculado con la fecha de hoy; validaciones de fechas y de nombre repetido. | Decidido |
| DR-12 | B | Las tablas "Reportes recibidos" y "Reportes generados" no tienen CU. | Eliminarlas. | Decidido |
| DR-13 | A | El reporte no se presentaba en pantalla. | Reporte con indicadores y tabla; 4 tipos definidos en el CU 4 (incluye "Desempeño y resultado de las prácticas"). | Decidido |
| DR-14 | A | No existía la exportación. | Modal con PDF, Excel o ambos; descarga real; cuadro "Guardar como" del navegador o carpeta de descargas. | Decidido |
| DR-15 | C | "Prácticas activas" mostraba las horas de la última bitácora, no el total, y solo listaba estudiantes con bitácoras. | Página "Supervisión de horas": porcentaje con barra, orden de menor a mayor, nivel Bajo, Medio o Alto, filtro y detalle por estudiante. | Decidido |
| DR-16 | A | Faltaba el panel de estado general. | Tarjetas por estado que se pulsan, filtros por institución y docente, y detalle. | Decidido |
| DR-17 | B | El "Panorama general" tenía cifras escritas a mano y "Reportes recibidos". | "Inicio" con cifras calculadas y "Alertas de seguimiento" que llevan a cada acción. Sin "Reportes recibidos" ni "Bitácoras sin revisar". | Decidido |
| DR-18 | C | Las fechas de ejemplo (marzo a junio de 2026) ya vencieron. | Datos del semestre 2026-2, con fechas relativas a hoy. | Decidido |

### Recorrido completo del registro (cadena validada)

1. Registrar institución y convenio (CU 3).
2. Registrar y aprobar la plaza (CU 2).
3. Crear el grupo de práctica con esa plaza (CU 1).
4. Asignar estudiantes al grupo (CU 1).
5. Asignar docente asesor (CU 1).
6. La práctica pasa a "En curso" al llegar la fecha de inicio (automático).
7. El estudiante registra bitácoras y el docente las revisa, califica y retroalimenta.
8. La práctica pasa a "Finalizada" al llegar la fecha de fin (automático).
9. El director decide el resultado: "Aprobada" o "Rechazada" (CU 1).

Huecos que se encontraron y cómo se cerraron:

| ID | Hueco | Cierre |
|---|---|---|
| H-01 | No había forma de renovar un convenio vencido, necesario para aprobar plazas. | Rama "Renovar convenio" en el CU 3. |
| H-02 | Se podía asignar estudiantes a un grupo con convenio vencido. | Validación 15b del CU 1. La regla de que el convenio cubra hasta la fecha de fin del grupo se descartó: en la UDI no se maneja así. |
| H-03 | Se podían registrar bitácoras antes de iniciar o después de terminar. | Excepción 3b del CU 3 del Estudiante. |
| H-04 | El CU 2 se contradecía con el convenio vencido. | Plaza "Pendiente" hasta renovar (11a). |
| H-05 | Nadie capturaba tipo, nivel, fechas y horas requeridas de la práctica. | Formulario de grupo (14a.2). |
| H-06 | Cupos duplicados en institución y plaza. | Solo en la plaza. |

---

## 4. Login e Inicio

El login no es un caso de uso: se asume como un proceso estándar y por eso **no se modifican los CU** por este motivo.

| ID | Tipo | Hallazgo | Decisión | Estado |
|---|---|---|---|---|
| L-01 | B | El checkbox "Recordarme" no hace nada hoy. | Se mantiene en el prototipo; funcionará cuando se conecte la API de login. | Decidido |
| L-02 | C | Los mensajes del login hablaban de "usted" y el resto del sistema habla de "tú". | Tuteo: "Ingresa tu usuario y tu contraseña." y "Usuario o contraseña incorrectos."; placeholders "Ingresa tu usuario" e "Ingresa tu contraseña". | Decidido |
| L-03 | A | Los CU no contemplan excepciones de inicio de sesión. | No se agregan: el login se asume estándar. | Decidido |
| L-04 | A | Los paneles no verifican la sesión ni el rol. | Se difiere hasta conectar la API de login. | Diferido |
| L-05 | A | Si ya hay sesión, entrar a la página de login no lleva al panel. | Se revisa después. | Diferido |
| L-06 | B | Un solo usuario de prueba por rol. | Varios usuarios de prueba (director, 2 docentes y estudiantes en distintos estados) con bloque "Modo demostración" y botón "Usar". Aceptado en principio; se analiza con calma cuando la base de datos esté lista. Por ahora, un usuario por rol. | Diferido |
| L-07 | B | Pulido del login. | Se incluye: mostrar u ocultar contraseña, foco automático en "Usuario", botón en estado "Ingresando…" y avatar con iniciales en la barra superior. Se refina al llamar la API. | Decidido |
| L-08 | B / C | Inicio del Estudiante: saludo femenino fijo, "1" en "Práctica asignada", actividades y fechas escritas a mano, y "informe final" y "evaluación final" que no están en ningún CU. | Saludo neutro con el nombre; la tarjeta "Práctica asignada" muestra el estado y la institución; "Últimas actividades" calculadas con los movimientos reales; "Próximas fechas importantes" pasa a "Mi práctica en fechas" (inicio, fin y alerta de bitácoras que requieren corrección). | Decidido |

---

## 5. Definiciones transversales (acumuladas)

| Tema | Definición |
|---|---|
| Estados de bitácora | "Pendiente" (ámbar) · "Aprobada" (verde) · "Requiere corrección" (naranja). |
| Estados de práctica | "Pendiente" (ámbar) · "En curso" (azul) · "Finalizada" (gris) · "Aprobada" (verde) · "Rechazada" (rojo). Los tres primeros los calcula el sistema; los dos últimos los decide solo el director. El registro de la práctica se crea cuando el director asigna al estudiante a un grupo o le asigna docente asesor (lo que ocurra primero); es "Pendiente" mientras falte el grupo, el docente asesor o la fecha de inicio. |
| Login | No es un caso de uso: se asume estándar. Mantiene "Recordarme" (decorativo hasta la API). |
| Tono de los textos | Siempre de tú ("Ingresa", "Selecciona", "Escribe"). |
| Estados de plaza | "Pendiente" (ámbar) · "Aprobada" (verde) · "Rechazada" (rojo). |
| Estados de convenio | "Vigente" (verde) · "Próximo a vencer" (ámbar, 60 días o menos) · "Vencido" (rojo). Calculados con la fecha de hoy. |
| Cumplimiento de horas | "Bajo" (rojo, menos de 50 %) · "Medio" (ámbar, 50 % a 79 %) · "Alto" (verde, 80 % o más). Umbrales fijos: se acepta que al inicio del semestre todos aparezcan en "Bajo"; no se maneja un avance esperado. |
| Grupo de práctica | Nombre, plaza (con su institución), tipo (Observación, Práctica intermedia o Práctica profesional), nivel (1, 2 o 3), fecha de inicio, fecha de fin y horas requeridas (160 por defecto). |
| Docente asesor | Máximo 6 estudiantes con práctica sin resultado. |
| Práctica cerrada | Con resultado "Aprobada" o "Rechazada", las bitácoras quedan en solo consulta. |
| Exportación | PDF, Excel o ambos; cuadro "Guardar como" del navegador cuando lo permite, o carpeta de descargas. |
| Horas | Solo cuentan las de bitácoras "Aprobadas". Total requerido: 160 h. |
| Nota | 0.0 a 5.0 con un decimal, se muestra como "4.5 / 5.0". Solo si la bitácora está "Aprobada". Sin calificación cualitativa. |
| Observaciones de la nota | Opcionales, máximo 500 caracteres, editables. |
| Retroalimentación | Obligatoria, máximo 200 palabras, ligada a una bitácora y a un estudiante, en cualquier estado. |
| Evidencias | Opcionales. PDF, JPG, PNG, DOCX, PPTX y XLSX, máximo 5 MB por archivo. |
| Bitácora | Fecha no posterior a hoy; horas mayores que 0. |
| Mensajes | Confirmaciones en verde, errores en rojo, informativos en azul (toast). Errores de campo debajo del campo, en rojo. |
| Ventanas | Modal "Revisión de bitácora" del Docente, con pestañas "Detalle", "Nota" y "Retroalimentación". |
| Menú Estudiante | Inicio · Mi práctica · Bitácoras · Evaluaciones · Cerrar sesión. |
| Menú Docente | Inicio · Mis estudiantes · Bitácoras por revisar · Cerrar sesión. |
| Menú Director | Inicio · Gestionar prácticas · Instituciones receptoras · Estado de las prácticas · Supervisión de horas · Reportes · Cerrar sesión. |

---

## 6. Pendientes

| ID | Para | Pendiente |
|---|---|---|
| P-01 | General | Datos de ejemplo coherentes del semestre 2026-2, con fechas relativas a hoy: al menos una práctica en cada estado (incluida una "Finalizada" por decidir y una "Rechazada" con motivo), plazas en los tres estados y convenios en los tres estados. Se incluyen en el documento maestro para tu revisión. |
| P-02 | Astah | Clases: agregar `GRUPO_PRACTICA`; ampliar `PLAZA` (cupos, jornada, descripción, estado, motivo de rechazo), el convenio (fecha de inicio) y la institución (tipo, dirección, contacto); `PRACTICA` con estado, grupo, docente y motivo de rechazo; `BITACORA` con estado y motivo de corrección; quitar la calificación cualitativa de `NOTA`. |
| P-03 | API y base de datos | Protección de páginas por sesión y rol (L-04), redirección si ya hay sesión (L-05) y usuarios de prueba múltiples (L-06). |
| P-04 | Antes del documento maestro | Definir si el prototipo debe verse bien en celular, y si se conserva la identidad visual actual. |
