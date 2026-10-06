# Documento maestro del prototipo de alta fidelidad — SIGPA

Sistema Integral de Gestión de Prácticas Académicas (versión web). Documento para construir el prototipo de alta fidelidad completo con Claude Code.

---

## 0. Cómo usar este documento

**Lee en este orden:**

1. Este documento completo (define todo lo que NO está en las secuencias de los casos de uso).
2. `DOCUMENTOS/Casos_de_Uso_Estudiante.md`, `DOCUMENTOS/Casos_de_Uso_Docente.md` y `DOCUMENTOS/Casos_de_Uso_Director.md`.
3. `DOCUMENTOS/Hallazgos_Prototipo_vs_CU.md` (registro del porqué de cada decisión).
4. El código actual de `PROTOTIPO/`.

**Fuente de verdad:**

| Qué | Dónde está |
|---|---|
| Pasos de cada flujo, ramas, excepciones, textos de mensajes y nombres exactos de botones, campos y menús | Los 3 archivos `Casos_de_Uso_*.md` |
| Diseño visual, responsive, datos, reglas de negocio, estados, pantallas de apoyo (Inicio), exportación, datos de ejemplo | Este documento |

Si encuentras una contradicción entre este documento y un archivo de casos de uso, **prevalece el archivo de casos de uso**: no la resuelvas por tu cuenta, anótala al final de tu respuesta.

**Reglas de trabajo acordadas con el equipo:**

- **No se crea ni se elimina ningún caso de uso.** Solo se construyen los 14 existentes.
- Todos los textos hablan **de tú** ("Ingresa", "Selecciona", "Escribe").
- Prima la comodidad: **menos clics para el docente y el director**. Los modales se cierran solos al guardar, los filtros se aplican al instante y el Inicio ofrece atajos.
- Comenta el código **en español**, con el estilo del prototipo actual: encabezado por archivo y secciones numeradas. El equipo lo usará para aprender.
- No hagas commit ni push automáticamente: el equipo revisa los cambios en GitKraken.
- Si en el repositorio existen versiones previas del panel del Estudiante generadas como referencia, úsalas solo como apoyo visual y ajústalas a este documento.

---

## 1. Contexto y objetivo

- **Programa de ejemplo:** Licenciatura en Matemáticas.
- **Actores y casos de uso:**
  - Estudiante: 3 CU.
  - Docente Asesor: 4 CU.
  - Director de Programa: 7 CU.
- **Etapas del proyecto:** este prototipo se construye con HTML, CSS y JavaScript. Después se migrará a React y se conectará a una API REST (Node, Express, PostgreSQL en Neon y dos bases MongoDB: login y seguimiento). Por eso la **capa de datos debe estar aislada** (sección 7.4).
- **Objetivo de esta entrega:** un prototipo de **alta fidelidad**: se ve y se comporta como el sistema final, con datos coherentes, validaciones, estados, mensajes y exportación real, aunque los datos vivan en el navegador.

---

## 2. Alcance

### Se construye

- Login.
- Los tres paneles completos, con todos los flujos, ramas y excepciones de los 14 CU.
- Pantallas de apoyo: el "Inicio" de cada panel.
- Exportación real a PDF y Excel.
- Diseño responsive: celular, tablet y escritorio.
- Datos de ejemplo coherentes del semestre 2026-2 (sección 8).

### NO se construye (diferido a la API y la base de datos)

| Qué | Por qué |
|---|---|
| Protección de páginas por sesión y rol | Se hará con la API de login. |
| Redirigir al panel si ya hay sesión | Se revisa después. |
| Varios usuarios de prueba y bloque "Modo demostración" | Se decide con la base de datos lista. Por ahora, **un usuario por rol**. |
| "Olvidé mi contraseña", bloqueos por intentos, notificaciones, edición o eliminación de plazas e instituciones | Serían funciones nuevas fuera de los CU. |
| Calificación cualitativa de la nota | Descartada. |
| "Informe final", "evaluación final", "reportes recibidos de docentes" | No existen en ningún CU. |

El checkbox **"Recordarme" se mantiene** en el login, aunque no haga nada todavía: funcionará cuando se conecte la API.

---

## 3. Restricciones técnicas y estructura de archivos

### Tecnología

- HTML5, CSS3 y JavaScript moderno (ES2020), **sin frameworks ni paso de compilación**. Debe abrirse con Live Server o sirviendo la carpeta estáticamente.
- **Un solo archivo CSS** (`css/comun.css`). Prohibido un CSS por rol: el color de cada rol se define con una clase en el `<body>`.
- Librerías externas permitidas, solo por CDN (cdnjs) y solo para exportar:
  - jsPDF 2.5.1: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
  - jsPDF-AutoTable 3.8.2: `https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js`
  - SheetJS 0.18.5: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
- Navegadores objetivo: versiones actuales de Chrome, Edge, Firefox y Safari (móvil y escritorio).
- Idioma `es-CO`, fechas `dd/mm/aaaa`, notas con punto decimal ("4.5 / 5.0"), zona horaria local.

### Estructura final

```
PROTOTIPO/
├── index.html                  (login)
├── css/
│   └── comun.css               (único CSS)
├── js/
│   ├── comun.js                (utilidades compartidas: UI, formato, toast, modal, tabs)
│   ├── datos.js                (capa de datos, reglas de negocio y semilla)   ← NUEVO
│   └── login.js
├── estudiante/
│   ├── estudiante.html
│   └── estudiante.js
├── docente/
│   ├── docente.html
│   └── docente.js
└── director/
    ├── director.html
    └── director.js
```

Orden de carga de scripts en cada panel: `comun.js`, luego `datos.js`, luego el `.js` del panel. Los paneles del Director cargan además las librerías de exportación (sección 13), con `defer`.

### Convenciones de código

- Nombres de funciones y variables en español y `camelCase`, como el código actual.
- Datos del usuario siempre escapados antes de pintarse con `innerHTML` (`escaparHtml`).
- Sin `alert`, `confirm` ni `prompt`: todo se hace con toast, modal o mensajes en pantalla.
- Cada panel es una página con secciones `.page` que se muestran u ocultan con `mostrarPagina(id, botonMenu)`. Si se llama sin botón, busca solo el botón del menú que la abre para dejarlo activo.

---

## 4. Identidad visual (se conserva)

Se mantiene la identidad actual: menú lateral azul oscuro, fondo gris claro, tarjetas blancas con borde fino, **color de acento distinto por rol**.

### 4.1 Tokens (ya existen en `comun.css`; no cambiar)

| Token | Valor | Uso |
|---|---|---|
| `--azul-oscuro` | `#173f78` | Menú lateral y login |
| `--azul` | `#2864c7` | Acento por defecto |
| `--acento` | según rol | Botones, menú activo, borde superior de tarjetas, barras de progreso |
| `--fondo` | `#f4f6f9` | Fondo de la página |
| `--texto` | `#26354d` | Texto principal |
| `--gris-texto` | `#777` | Texto secundario |
| `--borde` | `#e2e6eb` | Bordes |

- **Acento por rol (clase en el `<body>`):**
  - Estudiante `rol-estudiante`: `#2864c7` (azul).
  - Docente `rol-docente`: `#1f9d63` (verde).
  - Director `rol-director`: `#c9820f` (dorado).
- **Tipografía:** `Arial, Helvetica, sans-serif`. Tamaños base: tablas y botones 13 px, títulos de página 26 a 28 px, números de tarjetas 28 px, número de horas 35 px.
- **Medidas base:** menú lateral 230 px, barra superior 65 px, radio de tarjetas 8 px, radio de botones 5 px, espaciado de contenido 30 px (16 px en celular).

### 4.2 Estados y colores (etiquetas o "badges")

Se conserva la forma actual: píldora de 11 px en negrita. Colores existentes: verde `#dff4e7` con texto `#237744`; ámbar `#fff0d5` con `#9a6500`; rojo `#fdeaea` con `#b13030`; azul `#e3ecfb` con el acento azul. Se añaden dos colores nuevos: **naranja** `#fde8d4` con texto `#b4500b`, y **gris** `#e9edf2` con texto `#4a5568`.

| Entidad | Estado | Color |
|---|---|---|
| Bitácora | Pendiente | ámbar |
| | Aprobada | verde |
| | Requiere corrección | **naranja** |
| Práctica | Pendiente | ámbar |
| | En curso | azul |
| | Finalizada | **gris** |
| | Aprobada | verde |
| | Rechazada | rojo |
| Plaza | Pendiente | ámbar |
| | Aprobada | verde |
| | Rechazada | rojo |
| Convenio | Vigente | verde |
| | Próximo a vencer | ámbar |
| | Vencido | rojo |
| Cumplimiento de horas | Bajo | rojo |
| | Medio | ámbar |
| | Alto | verde |

Implementa un único helper `badge(estado, tipo)` en `comun.js` que reciba el estado y devuelva la píldora con el color correcto. Nunca decidas el color en los paneles.

### 4.3 Mensajes (toast) y avisos

| Tipo | Uso | Color de fondo |
|---|---|---|
| `ok` | Confirmaciones | `#237744` |
| `error` | Errores | `#b13030` |
| `info` | Informativos | `#15405a` |

- Los toast aparecen arriba a la derecha (en celular, ancho completo con margen), se cierran solos a los 4 segundos y usan `role="status"`.
- Los errores de campo van **debajo del campo**, en rojo, con el borde del campo también en rojo.
- Avisos en bloque (`.aviso-*`): celeste (informativo), ámbar (advertencia), rojo (error o bloqueo) y naranja (corrección). Todos con ícono y texto.

---

## 5. Diseño responsive (celular, tablet y escritorio)

El prototipo **debe verse y usarse bien desde un celular**. Puntos de quiebre:

| Ancho | Modo |
|---|---|
| 1024 px o más | Escritorio |
| 641 a 1023 px | Tablet |
| 640 px o menos | Celular |

Anchos de prueba obligatorios: 360, 390, 768, 1024 y 1440 px. **Nunca debe aparecer scroll horizontal en la página** (solo dentro de contenedores concretos).

| Elemento | Escritorio | Tablet | Celular |
|---|---|---|---|
| Menú lateral | Fijo, 230 px | Cajón lateral oculto con botón hamburguesa (☰) en la barra superior | Igual que tablet |
| Barra superior | Título, nombre y rol, avatar con iniciales | Igual | Hamburguesa, título corto y solo el avatar |
| Cajón del menú | — | 260 px, con fondo oscuro detrás | Igual. Se cierra al elegir una opción, al tocar el fondo o con Esc |
| Relleno del contenido | 30 px | 24 px | 16 px |
| Tarjetas de resumen | 4 columnas | 2 columnas | 1 columna |
| Rejillas de 2 columnas (`grid-2`) | 2 columnas | 1 columna | 1 columna |
| Tablas operativas | Tabla normal | Tabla normal con scroll horizontal si no cabe | **Cada fila se convierte en una tarjeta apilada**; cada celda muestra su etiqueta (técnica `data-label` con `::before`) |
| Tablas de reportes (6 o más columnas) | Tabla normal | Scroll horizontal | Scroll horizontal con la primera columna fija |
| Barras de filtros | En una fila | En una fila con salto | Apiladas, selectores a ancho completo |
| Modales | Centrados, máximo 560 px (el de revisión de bitácora, 760 px) | Igual | **Pantalla completa**: cabecera y pie fijos, cuerpo con scroll |
| Pestañas del modal | Normales | Normales | Con scroll horizontal |
| Indicador de pasos del formulario de bitácora | Pasos con nombre | Igual | Círculos numerados y la etiqueta "Paso 2 de 4 · Descripción" |
| Barra de resumen inferior del formulario | Fija abajo, en una fila | Igual | Fija abajo en dos filas: datos arriba, botones a ancho completo abajo, con margen para la zona segura del dispositivo |
| Listas con casillas y selección (Director) | Dos columnas lado a lado | Apiladas | Apiladas |
| Login | Dos paneles | Dos paneles | Panel de marca compacto arriba y formulario abajo |

Además, en celular:

- Zonas táctiles de al menos **44 px** de alto.
- Campos de texto con **16 px** de tamaño de letra, para que iOS no haga zoom.
- Los botones de acción dentro de las tarjetas apiladas ocupan el ancho completo.

---

## 6. Componentes compartidos (`comun.css` y `comun.js`)

Todos los paneles los reutilizan. Constrúyelos una sola vez.

| Componente | Descripción |
|---|---|
| Diseño general | Menú lateral, barra superior con avatar de iniciales (primeras letras de las dos primeras palabras del nombre), `.content`, `.page`, `.page-title` |
| Tarjeta de resumen | `.stat-card`: título, número grande, enlace de acción. Borde superior de 3 px con el acento |
| Tarjeta | `.card` |
| Tabla | `.table-container` con tabla y modo apilado en celular. Ayuda `data-label` en cada `td` |
| Etiqueta de estado | `badge(estado, tipo)` (sección 4.2) |
| Botones | Primario, secundario, **peligro** (rojo, para "Rechazar" y "Solicitar corrección"), enlace (`.enlace-accion`), deshabilitado y cargando |
| Formularios | Grupo (etiqueta, campo, error), contador de caracteres o palabras, selector de fecha |
| Zona de archivos | Área punteada con botón "Seleccionar archivos", lista con ✕ para quitar |
| Avisos | `.aviso-info`, `.aviso-ambar`, `.aviso-rojo`, `.aviso-naranja` |
| Toast | `mostrarToast(mensaje, tipo)` |
| Modal | `abrirModal(titulo, cuerpoHtml, opciones)` y `cerrarModal()`. Cierra con la ✕, el botón "Cerrar", la tecla Esc o tocando el fondo. Lleva `role="dialog"`, `aria-modal="true"` y manejo de foco (entra al modal, queda atrapado y regresa al elemento que lo abrió). Debe permitir un **segundo modal encima** (visor de evidencias) |
| Pestañas | `.tabs` con navegación por teclado (flechas) y `role="tablist"` |
| Indicador de pasos | Stepper con círculos numerados: hecho (✓, verde), actual (acento) y pendiente (gris) |
| Tarjeta de paso | Se pliega al completarse, mostrando un resumen y el enlace "Editar" |
| Barra de resumen inferior | Fija, con datos y botones |
| Barra de progreso | `.progress`. En supervisión de horas usa el color del nivel (rojo, ámbar o verde) |
| Barra de filtros | Selectores o fechas y botón "Limpiar". **Los selectores filtran al instante** (sin botón "Filtrar"); solo los filtros de fecha usan botón "Filtrar" |
| Estado vacío | Mensaje centrado en gris, con el texto exacto del CU |
| Enlace de regreso | "← Gestionar prácticas" (migas de pan de los sub-pasos) |
| Utilidades | `escaparHtml`, `formatearFecha(iso)`, `formatearHoras(n)`, `formatearNota(n)` ("4.5 / 5.0"), `iniciales(nombre)`, `fechaHoy()` (fecha local, no UTC), `contarPalabras(texto)` |

Accesibilidad mínima:

- Cada campo con `<label>` asociado.
- Errores enlazados con `aria-describedby`.
- Foco visible.
- Color nunca como única señal: las etiquetas de estado siempre llevan texto.
- Contraste suficiente.

---

## 7. Capa de datos, reglas de negocio y estados

### 7.1 Principio

Toda la información vive en `localStorage` y se accede **únicamente** a través de `datos.js`. Los paneles nunca leen ni escriben `localStorage` directamente. **Todas las funciones públicas de `datos.js` son `async` y devuelven una promesa**, aunque hoy resuelvan al instante: así, cuando llegue la API, solo cambia ese archivo.

### 7.2 Entidades y campos

Las llaves de `localStorage` llevan el prefijo `sigpa_` (por ejemplo `sigpa_bitacoras`). Los identificadores son enteros autoincrementales por colección.

| Entidad | Campos |
|---|---|
| `estudiante` | `id`, `nombre`, `programa` |
| `docente` | `id`, `nombre` |
| `director` | `id`, `nombre` |
| `institucion` | `id`, `nombre`, `tipo` ("Oficial" o "Privada"), `direccion`, `contacto`, `convenioInicio`, `convenioFin` |
| `plaza` | `id`, `institucionId`, `cupos`, `jornada` ("Mañana", "Tarde" o "Única"), `descripcion`, `estado` ("Pendiente", "Aprobada" o "Rechazada"), `motivoRechazo`, `fechaRegistro` |
| `grupo` | `id`, `nombre`, `plazaId`, `tipo` ("Observación", "Práctica intermedia" o "Práctica profesional"), `nivel` (1, 2 o 3), `fechaInicio`, `fechaFin`, `horasRequeridas` |
| `practica` | `id`, `estudianteId`, `grupoId` (o nulo), `docenteId` (o nulo), `resultado` (nulo, "Aprobada" o "Rechazada"), `motivoRechazo`, `fechaResultado`, `fechaAsignacion` |
| `bitacora` | `id`, `estudianteId`, `fecha`, `titulo`, `descripcion`, `horas`, `estado`, `motivoCorreccion`, `evidencias` (lista de `nombre`, `tipo`, `tamanoKB`), `fechaRegistro`, `fechaRevision` |
| `nota` | `id`, `bitacoraId`, `valor` (0.0 a 5.0, un decimal), `observaciones`, `fechaRegistro`, `docenteId` |
| `retroalimentacion` | `id`, `bitacoraId`, `estudianteId`, `docenteId`, `texto`, `fechaRegistro` |

**Catálogo de niveles (no editable):**

| Nivel | Requisitos (corto) | Requisitos ampliados |
|---|---|---|
| 1 | Observación participante en aula y registro de la dinámica escolar. | El estudiante observa clases del área de matemáticas, registra la dinámica del aula y la gestión del docente, y entrega sus bitácoras con evidencias. Cumple las horas exigidas para este nivel. |
| 2 | Acompañamiento en aula con intervención pedagógica supervisada. | El estudiante acompaña clases del área de matemáticas, diseña e implementa actividades de refuerzo, registra cada jornada en la bitácora con sus evidencias y cumple las horas exigidas para este nivel. |
| 3 | Diseño e implementación autónoma de clases con supervisión del docente asesor. | El estudiante planea y orienta clases completas con supervisión, diseña instrumentos de evaluación, registra cada jornada en la bitácora con sus evidencias y cumple las horas exigidas para este nivel. |

**Datos derivados** (se calculan siempre, **nunca se guardan**): estado de la práctica, estado del convenio, cupos ocupados de una plaza, horas aprobadas, porcentaje y nivel de cumplimiento, carga del docente.

### 7.3 Reglas de negocio

Los números de pasos y los textos exactos de mensajes están en los CU.

**Estado de la práctica** (función `estadoPractica(practica)`). Se evalúa en este orden con la fecha de hoy:

1. Si `resultado` es "Aprobada" o "Rechazada", ese es el estado.
2. Si falta el grupo, o falta el docente asesor, o hoy es anterior a la fecha de inicio del grupo: **"Pendiente"**.
3. Si hoy es menor o igual a la fecha de fin del grupo: **"En curso"**.
4. En otro caso: **"Finalizada"**.

El registro de la práctica se crea cuando el director asigna al estudiante a un grupo o le asigna docente asesor, lo que ocurra primero. Un estudiante sin ninguna de las dos asignaciones no tiene práctica.

**Estado del convenio** (`estadoConvenio(institucion)`): con `dias = convenioFin - hoy`: menor que 0, "Vencido"; hasta 60, "Próximo a vencer"; más de 60, "Vigente".

| # | Regla |
|---|---|
| R-01 | **Horas:** solo cuentan las de bitácoras "Aprobada". Horas requeridas: las del grupo (160 por defecto). El porcentaje se redondea al entero. |
| R-02 | **Nivel de cumplimiento:** menos de 50 % "Bajo"; de 50 % a 79 % "Medio"; 80 % o más "Alto". Se evalúa sobre el porcentaje redondeado. Umbrales fijos: no existe "avance esperado". |
| R-03 | **Nueva bitácora:** solo si la práctica está "En curso". |
| R-04 | **Bitácora:** fecha no posterior a hoy; horas mayores que 0 (paso de 0.5); título y descripción obligatorios. Evidencias opcionales: PDF, JPG, PNG, DOCX, PPTX o XLSX, máximo 5 MB cada una; no se repite el mismo archivo (mismo nombre y tamaño). |
| R-05 | **Aprobar y solicitar corrección:** solo sobre bitácoras "Pendiente" y con la práctica sin resultado. El motivo de la corrección es obligatorio. |
| R-06 | **Corregir (Estudiante):** solo bitácoras "Requiere corrección" con la práctica sin resultado. Se edita la **misma** entrada y, al guardar, vuelve a "Pendiente" (el motivo se borra). |
| R-07 | **Nota:** solo si la bitácora está "Aprobada" y la práctica sin resultado. Valor de 0.0 a 5.0 con un decimal. Observaciones opcionales, máximo 500 caracteres. **Una nota por bitácora**: al guardar de nuevo se actualiza (con los datos precargados). |
| R-08 | **Retroalimentación:** obligatoria, máximo 200 palabras (se cuentan separando por espacios). Se puede registrar sobre una bitácora en cualquier estado, mientras la práctica no tenga resultado. Puede haber varias por bitácora. |
| R-09 | **Docente asesor:** máximo 6 estudiantes. La carga cuenta las prácticas de ese docente que aún no tienen resultado. |
| R-10 | **Asignar docente:** si el estudiante no tenía práctica, la crea. Si la tenía, actualiza el docente. Registra `fechaAsignacion`. |
| R-11 | **Asignar a grupo:** exige cupos libres suficientes en la plaza del grupo (cupos ocupados = prácticas cuyo grupo usa esa plaza) y que el convenio de la institución no esté "Vencido". Si el estudiante no tenía práctica, la crea. Registra `fechaAsignacion`. **No se exige** que el convenio cubra hasta la fecha de fin del grupo. |
| R-12 | **Crear grupo:** la plaza debe estar "Aprobada" y con cupos libres. Fecha de fin posterior a la de inicio; horas requeridas mayores que 0; nombre obligatorio. Los grupos con fecha de fin anterior a hoy **no se ofrecen** al asignar estudiantes. |
| R-13 | **Plaza:** se registra "Pendiente". No se puede aprobar si el convenio está "Vencido" (se muestra el aviso rojo y se deshabilita "Aprobar plaza"). Con convenio "Próximo a vencer" se puede aprobar con un aviso ámbar. El rechazo exige motivo. Los cupos solo cuentan para plazas "Aprobada". |
| R-14 | **Institución y convenio:** nombre obligatorio y único (sin distinguir mayúsculas ni tildes). Fecha de fin posterior a la de inicio **y** a hoy. **Renovar:** la nueva fecha debe ser posterior a la fecha de fin actual y a hoy. La columna "Plazas" se calcula: cupos ocupados sobre cupos totales de las plazas aprobadas de la institución. |
| R-15 | **Resultado de la práctica:** el director solo puede decidir cuando el estado es "Finalizada". Aprobar, o rechazar con motivo obligatorio. No se bloquea la decisión aunque falten horas o haya bitácoras pendientes: solo se muestra el aviso ámbar. |
| R-16 | **Práctica cerrada** (con resultado): todas sus bitácoras quedan en solo consulta para todos los roles. |
| R-17 | **Última actualización del estado** (se muestra al estudiante): Pendiente = `fechaAsignacion`; En curso = fecha de inicio del grupo; Finalizada = fecha de fin del grupo; Aprobada o Rechazada = `fechaResultado`. |
| R-18 | **Nota promedio** de un estudiante: promedio de los valores de sus notas (un decimal). Si no tiene notas, se muestra "—". |
| R-19 | **Estudiantes en práctica** (Supervisión de horas): prácticas "En curso" o "Finalizada". |

### 7.4 Funciones de la capa de datos (`datos.js`)

Todas `async`. Nombres sugeridos (puedes ajustar, manteniendo una función por operación):

| Área | Funciones |
|---|---|
| Sesión | `obtenerSesion()` |
| Instituciones | `obtenerInstituciones()`, `registrarInstitucion(datos)`, `renovarConvenio(id, nuevaFin)`, `estadoConvenio(institucion)` |
| Plazas | `obtenerPlazas(filtros)`, `registrarPlaza(datos)`, `decidirPlaza(id, decision, motivo)`, `cuposOcupados(plazaId)` |
| Grupos | `obtenerGrupos()`, `crearGrupo(datos)`, `asignarEstudiantesAGrupo(grupoId, estudiantesIds)` |
| Asignación | `asignarDocente(estudiantesIds, docenteId)`, `cargaDocente(docenteId)` |
| Prácticas | `obtenerPracticas(filtros)`, `estadoPractica(practica)`, `decidirResultado(practicaId, decision, motivo)`, `horasAprobadas(estudianteId)` |
| Bitácoras | `obtenerBitacoras(filtros)`, `registrarBitacora(datos)`, `corregirBitacora(id, datos)`, `aprobarBitacora(id)`, `solicitarCorreccion(id, motivo)` |
| Notas | `obtenerNota(bitacoraId)`, `registrarNota(bitacoraId, valor, observaciones)` |
| Retroalimentación | `obtenerRetroalimentaciones(filtros)`, `registrarRetroalimentacion(bitacoraId, texto)` |
| Reportes | `generarReporte(tipo, desde, hasta)` |

Cada función **valida las reglas** de la sección 7.3 y, si no se cumplen, lanza un error con un código reconocible (por ejemplo `CUPOS_INSUFICIENTES`, `CONVENIO_VENCIDO`) que el panel traduce al mensaje exacto del CU.

### 7.5 Versionado y reinicio de la semilla

- `datos.js` guarda en `localStorage` la versión de los datos y la fecha en que se creó la semilla.
- Si **cambia la versión o cambia el día**, borra todas las llaves `sigpa_*` y vuelve a generar la semilla. Así los estados (que dependen de la fecha) siempre se ven bien y no quedan datos viejos.
- Los cambios hechos en una demostración se conservan solo durante el día.

---

## 8. Datos de ejemplo del semestre 2026-2

Todas las fechas son **relativas a hoy** (`hoy` = el día en que se genera la semilla). Los textos son ficticios. Para lo aleatorio, usa un generador con **semilla fija** para que siempre salga lo mismo.

### 8.1 Usuarios de login (un usuario por rol)

| Usuario | Contraseña | Persona | Rol |
|---|---|---|---|
| `estudiante` | `123456` | Laura Fernández (estudiante 1) | Estudiante |
| `docente` | `123456` | Laura Sánchez (docente 1) | Docente Asesor |
| `director` | `123456` | Ricardo Jaime (director 1) | Director de Programa |

Cada usuario guarda el `id` de su entidad (`estudianteId`, `docenteId` o `directorId`) en la sesión. Deja la estructura de `usuarios` lista para agregar más usuarios más adelante, pero por ahora solo estos tres.

### 8.2 Docentes

Laura Sánchez (id 1) y Patricia Nieto (id 2).

### 8.3 Instituciones

| Id | Nombre | Tipo | Dirección | Contacto | Inicio del convenio | Fin del convenio | Estado resultante |
|---|---|---|---|---|---|---|---|
| 1 | Institución Educativa Simón Bolívar | Oficial | Carrera 25 # 30-15, Bucaramanga | Rectoría · Tel. (607) 555 0142 | hoy − 365 | hoy + 330 | Vigente |
| 2 | Institución Educativa Técnica del Norte | Oficial | Calle 52 # 14-40, Bucaramanga | Coordinación académica · Tel. (607) 555 0178 | hoy − 200 | hoy + 400 | Vigente |
| 3 | Colegio San Pedro Claver | Privada | Carrera 18 # 41-22, Bucaramanga | Rectoría · Tel. (607) 555 0119 | hoy − 700 | hoy + 40 | Próximo a vencer |
| 4 | Colegio La Presentación | Privada | Calle 36 # 22-08, Bucaramanga | Secretaría · Tel. (607) 555 0163 | hoy − 730 | hoy − 20 | Vencido |

### 8.4 Plazas

| Id | Institución | Jornada | Cupos | Estado | Descripción o motivo |
|---|---|---|---|---|---|
| 1 | Simón Bolívar | Mañana | 6 | Aprobada | Acompañamiento en las clases de matemáticas de básica secundaria. |
| 2 | Técnica del Norte | Única | 3 | Aprobada | Apoyo en el área de matemáticas de media técnica. |
| 3 | San Pedro Claver | Tarde | 2 | Aprobada | Refuerzo escolar en matemáticas de básica primaria. |
| 4 | La Presentación | Mañana | 2 | Pendiente | Acompañamiento en matemáticas de básica secundaria. (No se puede aprobar: el convenio está vencido.) |
| 5 | Simón Bolívar | Tarde | 2 | Rechazada | Motivo: "No hay docente de matemáticas disponible en esa jornada para acompañar a los estudiantes." |

### 8.5 Grupos

| Id | Nombre | Plaza | Tipo | Nivel | Inicio | Fin | Horas |
|---|---|---|---|---|---|---|---|
| 0 | Grupo 2026-1 · Simón Bolívar | 1 | Práctica intermedia | 2 | hoy − 150 | hoy − 8 | 160 |
| 1 | Grupo A · Simón Bolívar | 1 | Práctica intermedia | 2 | hoy − 45 | hoy + 60 | 160 |
| 2 | Grupo B · Técnica del Norte | 2 | Práctica profesional | 3 | hoy − 45 | hoy + 60 | 160 |
| 3 | Grupo C · San Pedro Claver | 3 | Observación | 1 | hoy + 10 | hoy + 90 | 160 |

### 8.6 Estudiantes y prácticas

Todos del programa "Licenciatura en Matemáticas".

| Id | Estudiante | Grupo | Docente | Estado resultante | Horas aprobadas | Fecha de asignación |
|---|---|---|---|---|---|---|
| 1 | Laura Fernández | 1 | Laura Sánchez | En curso | 96 (60 %, Medio) | hoy − 50 |
| 2 | María Paz Osorio | 1 | Laura Sánchez | En curso | 32 (20 %, Bajo) | hoy − 50 |
| 3 | Juan Camilo Rey | 2 | Laura Sánchez | En curso | 136 (85 %, Alto) | hoy − 50 |
| 4 | Diego Alarcón | 3 | Laura Sánchez | Pendiente | 0 | hoy − 6 |
| 5 | Sara Higuera | — | — | (sin práctica) | — | — |
| 6 | Camilo Ortega | — | Patricia Nieto | Pendiente | 0 | hoy − 3 |
| 7 | Valentina Ruiz | 0 | Patricia Nieto | Finalizada (por decidir) | 152 (95 %, Alto) | hoy − 155 |
| 8 | Andrés Castillo | 0 | Patricia Nieto | Aprobada | 160 (100 %) | hoy − 155 |
| 9 | Natalia Pérez | 0 | Patricia Nieto | Rechazada | 64 (40 %, Bajo) | hoy − 155 |

- Estudiante 8: `resultado` "Aprobada", `fechaResultado` hoy − 4.
- Estudiante 9: `resultado` "Rechazada", `fechaResultado` hoy − 4, motivo "No alcanzó las horas mínimas exigidas para el nivel."

Cupos ocupados: plaza 1 con 5 de 6 (estudiantes 1, 2, 7, 8 y 9), plaza 2 con 1 de 3, plaza 3 con 1 de 2, plazas 4 y 5 en 0.

### 8.7 Bitácoras (generación)

Cada bitácora aprobada tiene 8 horas. La fecha de la actividad se reparte dentro de la práctica, nunca después de hoy; `fechaRegistro` es la misma fecha; `fechaRevision` es la fecha + 2 días (sin pasar de hoy).

| Estudiante | Aprobadas | Pendientes | Requiere corrección | Notas | Retroalimentaciones |
|---|---|---|---|---|---|
| 1 Laura | 12 (96 h) | 1 | 1 | 6 (promedio cercano a 4.2) | 2 |
| 2 María Paz | 4 (32 h) | 2 | 0 | 2 (promedio cercano a 3.5) | 1 |
| 3 Juan Camilo | 17 (136 h) | 1 | 0 | 8 (promedio cercano a 4.1) | 3 |
| 7 Valentina | 19 (152 h) | 1 | 0 | 10 (promedio cercano a 4.3) | 3 |
| 8 Andrés | 20 (160 h) | 0 | 0 | 15 (promedio cercano a 4.6) | 3 |
| 9 Natalia | 8 (64 h) | 0 | 0 | 4 (promedio cercano a 2.8) | 2 |

**Bitácoras fijas de Laura Fernández (no aleatorias):**

- **Pendiente:** fecha hoy − 2, título "Clase sobre funciones, grado 9°", 4 horas, con una evidencia JPG.
- **Requiere corrección:** fecha hoy − 5, título "Refuerzo de fracciones, grado 6°", 3 horas, descripción "Se trabajó fracciones.", sin evidencias, `fechaRevision` hoy − 3, motivo "La descripción es muy general. Indica los temas, las actividades realizadas y las dificultades observadas."

**Reglas para el resto:**

- **Títulos:** tómalos de este conjunto, sin repetir seguidos.
  - Taller de números primos
  - Clase de geometría: ángulos de un triángulo
  - Refuerzo de fracciones
  - Evaluación diagnóstica de álgebra
  - Resolución de problemas con proporcionalidad
  - Juego de lógica matemática
  - Introducción a las ecuaciones lineales
  - Taller de áreas y perímetros
  - Revisión de tareas y retroalimentación
  - Clase de estadística básica
  - Construcción de tablas de frecuencia
  - Actividad con material concreto
  - Preparación de guía de ejercicios
  - Acompañamiento en feria de matemáticas
  - Clase sobre funciones
  - Repaso de operaciones con enteros
  - Taller de potenciación
  - Uso de regla y transportador
  - Planeación de clase con el docente titular
  - Observación de clase de geometría
- **Descripción:** frase tipo "Se desarrolló la actividad «título» con el grupo de «grado», empleando material concreto y ejercicios guiados; se registraron las dificultades observadas." (grado de 6° a 11°).
- **Evidencias:** cerca del 70 % de las bitácoras con una o dos evidencias (nombres como `planeacion_clase_03.pdf` o `fotos_actividad_05.jpg`, tamaños entre 150 KB y 3 MB); el resto sin evidencias.
- **Notas:** repartidas entre bitácoras aprobadas; observaciones tomadas de este conjunto, con algunas vacías:
  - "Buen desarrollo de la actividad; el material fue pertinente."
  - "Cumple con los objetivos; falta mayor participación de los estudiantes en el cierre."
  - "Excelente manejo del grupo y claridad en la explicación."
  - "Se recomienda profundizar en la evaluación del aprendizaje."
  - "Planeación completa y evidencias claras."
- **Retroalimentaciones:** textos de 25 a 60 palabras, por ejemplo: "La planeación de clases mejora semana a semana. Te recomiendo incluir actividades de cierre que permitan verificar lo aprendido y registrar con más detalle las dificultades que observes en el grupo." Ligadas a una bitácora aprobada del estudiante, con fecha igual a su `fechaRevision`.

### 8.8 Valores de verificación

Si la semilla está bien hecha, estos valores deben coincidir exactamente.

**Estudiante (usuario `estudiante`, Laura Fernández)**

| Pantalla | Valor |
|---|---|
| Inicio | "Hola, Laura"; práctica "En curso" con "Institución Educativa Simón Bolívar"; horas "96 / 160"; 14 bitácoras; 6 evaluaciones; alerta "1 bitácora requiere corrección" |
| Mi práctica | Grupo A, Práctica intermedia, Nivel 2; avance 60 %; pendientes 64 h; detalle de horas con 12 filas; estado "En curso" con última actualización igual a la fecha de inicio del grupo |

**Docente (usuario `docente`, Laura Sánchez)**

| Pantalla | Valor |
|---|---|
| Inicio | Estudiantes a cargo: 4; bitácoras por revisar: 4; avance promedio de horas: 55 %; bitácoras sin nota: 17 |
| Mis estudiantes | Laura F. 96 / 160 "En curso"; María Paz 32 / 160 "En curso"; Juan Camilo 136 / 160 "En curso"; Diego 0 / 160 "Pendiente" |
| Cupos | Docente Laura Sánchez 4 de 6; docente Patricia Nieto 2 de 6 |

**Director (usuario `director`, Ricardo Jaime)**

| Pantalla | Valor |
|---|---|
| Inicio | Prácticas en curso: 3; convenios vigentes: 3 (1 próximo a vencer); plazas disponibles: 4; cumplimiento promedio: 65 % |
| Alertas | Sin docente asesor: 1; sin grupo: 2; plazas pendientes: 1; finalizadas por decidir: 1; convenios por vencer o vencidos: 2; bajo cumplimiento: 1 |
| Estado de las prácticas | Todas 8; Pendiente 2; En curso 3; Finalizada 1; Aprobada 1; Rechazada 1 |
| Supervisión de horas | 4 estudiantes. Orden: María Paz 20 % Bajo, Laura 60 % Medio, Juan Camilo 85 % Alto, Valentina 95 % Alto. Promedio 65 %; con bajo cumplimiento: 1 |
| Instituciones, columna "Plazas" | Simón Bolívar "5 / 6"; Técnica del Norte "1 / 3"; San Pedro Claver "1 / 2"; La Presentación "0 / 0" |
| Decidir resultado | 1 fila (Valentina): 152 / 160 horas, aviso ámbar de horas incompletas y de 1 bitácora pendiente |
| Asignar a grupo | Estudiantes sin grupo: Sara y Camilo. Grupos ofrecidos: A, B y C (el grupo 2026-1 no, porque ya terminó) |

---

## 9. Login (`index.html`, `js/login.js`)

El login **no es un caso de uso**: se asume estándar y no lleva excepciones propias en los CU. Se conserva el diseño actual (panel de marca a la izquierda y formulario a la derecha) con estos ajustes:

| Elemento | Especificación |
|---|---|
| Campos | "Usuario" y "Contraseña". Placeholders: "Ingresa tu usuario" e "Ingresa tu contraseña" |
| Mostrar contraseña | Botón ojo dentro del campo, con `aria-label` "Mostrar contraseña" u "Ocultar contraseña" |
| Foco | Al cargar, el cursor queda en "Usuario" |
| "Recordarme" | **Se mantiene** (casilla). Sin función hasta la API |
| Botón | "Iniciar sesión". Mientras valida muestra "Ingresando…" y queda deshabilitado (unos 600 ms simulados). La tecla Enter también envía |
| Errores | Aviso rojo sobre los campos. Campos vacíos: "Ingresa tu usuario y tu contraseña." Credenciales incorrectas: "Usuario o contraseña incorrectos." |
| Éxito | Guarda en `sessionStorage` el usuario, el nombre, el rol y el `id` de la entidad, y redirige a su panel (la página "Inicio") |
| Usuarios de prueba | Se conserva el recuadro actual con los tres usuarios |
| Responsive | Según la sección 5 |

---

## 10. Panel del Estudiante

Menú: "🏠 Inicio", "📋 Mi práctica", "📝 Bitácoras", "⭐ Evaluaciones", "🚪 Cerrar sesión". Acento azul. Flujos exactos: `Casos_de_Uso_Estudiante.md`.

### 10.1 Inicio (pantalla de apoyo)

- Encabezado: "Hola, {primer nombre}" y "Este es el resumen de tu práctica académica."
- Cuatro tarjetas de resumen:
  - "Práctica asignada": muestra la etiqueta de estado de la práctica y el nombre de la institución (o "Sin asignar"). Enlace "Ver práctica".
  - "Horas cumplidas": "96 / 160". Enlace "Ver avance de horas".
  - "Bitácoras registradas": el total. Enlace "Ver bitácoras".
  - "Evaluaciones recibidas": cantidad de notas. Enlace "Ver evaluaciones".
- Tarjeta **"Últimas actividades"**: hasta 5 movimientos reales, del más reciente al más antiguo (bitácora registrada, aprobada, corrección solicitada, nota recibida, retroalimentación recibida), cada uno con título y "título de la bitácora · fecha". Si no hay, "Aún no tienes actividad."
- Tarjeta **"Mi práctica en fechas"**: fecha de inicio, fecha de fin y horas pendientes, y, si hay bitácoras en "Requiere corrección", un aviso naranja "Tienes N bitácora(s) que requieren corrección" con enlace "Ver bitácoras". Sin práctica: "Aún no tienes una práctica asignada."

### 10.2 Mi práctica (CU 1)

Una sola vista con cuatro tarjetas en rejilla de 2 por 2 (una columna en celular): **Plaza asignada**, **Tipo y nivel de práctica**, **Estado de aprobación** y **Avance de horas**. Debajo, la tabla "Horas por bitácora aprobada", oculta hasta pulsar "Ver detalle".

- Plaza: nombre de la institución (también es enlace), programa, docente asesor, director de programa, fechas, y enlace "Ver más detalles" (ventana con dirección, contacto y tipo de institución).
- Tipo y nivel: tipo, "Nivel N", requisitos cortos del catálogo y enlace "Ver requisitos del nivel" (requisitos ampliados).
- Estado: etiqueta (colores de la sección 4.2), "Última actualización" (R-17). En "Finalizada" añade "Pendiente de la decisión del director". En "Rechazada", enlace "Ver detalle" con el motivo.
- Horas: número grande, "de N horas requeridas", barra de progreso, "Avance: P % · Pendientes: X h" y enlace "Ver detalle".

### 10.3 Bitácoras y formulario (CU 3)

- **Historial:** tabla con columnas fecha, título, descripción, horas, evidencias ("📎 n" o "—"), estado y acciones. Ordenada de la más reciente a la más antigua. Acciones: "👁️ Ver" siempre, y "✏️ Corregir" solo en "Requiere corrección" con la práctica sin resultado. "+ Nueva bitácora" arriba a la derecha; deshabilitado si la práctica no está "En curso", con el mensaje del CU.
- **"Ver":** ventana con fecha, horas, estado, descripción y evidencias (nombre, tipo y tamaño). Si el estado es "Requiere corrección", incluye el bloque naranja con el motivo.
- **Formulario "Nueva bitácora" / "Corregir bitácora":** el estilo es el de una compra de tiquetes en línea (referencia visual: formulario por pasos de una aerolínea).
  - Aviso celeste superior.
  - Indicador de 4 pasos: Actividad, Descripción, Evidencias, Revisión.
  - Una tarjeta por paso. La del paso actual está abierta con su botón "Siguiente" y el enlace "Atrás". Las completadas se pliegan mostrando su resumen y "Editar". No se puede saltar hacia adelante.
  - Barra de resumen inferior fija con fecha, horas dedicadas, número de evidencias, "Cancelar" y "Guardar bitácora". Se actualiza mientras se escribe.
  - Zona de archivos con las reglas R-04.
  - Al corregir, el formulario se abre con los datos cargados, el aviso naranja con el motivo y el botón "Guardar corrección" (todos los pasos accesibles).
  - Al guardar: toast verde, regreso a "Bitácoras" con la nueva fila arriba. Textos exactos en el CU.

### 10.4 Evaluaciones (CU 2)

- Barra de filtros con "Desde", "Hasta", "Filtrar" y "Limpiar".
- Bloque "Nota y observaciones por bitácora": tabla fecha, bitácora, evaluador, nota ("4.5 / 5.0"), observaciones y acciones ("👁️ Ver" abre la ventana de la evaluación).
- Bloque **"Retroalimentación del docente asesor"**: tarjetas con fecha, evaluador, **bitácora a la que corresponde** y texto completo, de la más reciente a la más antigua.

---

## 11. Panel del Docente

Menú: "🏠 Inicio", "👥 Mis estudiantes", "📝 Bitácoras por revisar", "🚪 Cerrar sesión". Acento verde. Flujos exactos: `Casos_de_Uso_Docente.md`.

### 11.1 Inicio (pantalla de apoyo)

- "Hola, {primer nombre}".
- Cuatro tarjetas:
  - "Estudiantes a cargo" (enlace "Ver estudiantes").
  - "Bitácoras por revisar", con las pendientes (enlace "Revisar ahora").
  - "Avance promedio de horas", promedio de los estudiantes con práctica "En curso" o "Finalizada" (enlace "Ver detalle").
  - "Bitácoras sin nota": aprobadas sin nota (enlace "Calificar": abre "Bitácoras por revisar" con el estado "Aprobada").
- Tarjeta **"Últimas bitácoras recibidas"**: las 5 más recientes de sus estudiantes, con estudiante, título, fecha y etiqueta. Al tocar una abre la ventana de revisión.
- Tarjeta **"Avance de mis estudiantes"**: nombre y barra de progreso con porcentaje.

### 11.2 Mis estudiantes (CU 1)

- Filtros "Institución receptora" y "Estado de la práctica" (los cinco estados) y "Limpiar".
- Tabla con columnas estudiante, institución, horas, estado y acciones ("Ver avance" y "Ver bitácoras"). Un estudiante sin grupo muestra "Sin asignar" en institución.
- Al elegir "Ver avance", la fila queda resaltada y debajo aparece la tarjeta **"Avance de horas"**: nombre del estudiante, horas cumplidas, requeridas, pendientes, porcentaje con barra y la tabla "Horas por bitácora aprobada". Al elegir otro estudiante la tarjeta se actualiza.
- "Ver bitácoras" abre "Bitácoras por revisar" ya filtrada por ese estudiante.

### 11.3 Bitácoras por revisar (CU 2, CU 3 y CU 4)

- Filtros "Estudiante" (con todos sus estudiantes) y "Estado" (Pendiente, Aprobada, Requiere corrección) y "Limpiar".
- Tabla con columnas estudiante, fecha, título, descripción (recortada), evidencias, horas, estado, nota y acciones. Orden: "Pendiente" primero y, dentro de cada estado, la fecha más reciente primero. Botón "Revisar" en las pendientes (acento) y "Ver" en las demás.
- **Ventana modal "Revisión de bitácora"** (760 px). Cabecera: "Revisión de bitácora" con "estudiante · título". Tres pestañas:
  - **Detalle:** datos de la bitácora, evidencias con botón "Abrir" y, si aplica, bloque naranja con el motivo de la corrección. Pie con "Aprobar" y "Solicitar corrección" (solo en pendientes con la práctica sin resultado). "Solicitar corrección" despliega la caja "Motivo de la corrección" con "Guardar" y "Cancelar".
  - **Nota:** campo "Nota (0.0 a 5.0)", caja "Observaciones (opcional)" con contador "0 / 500" y botón "Guardar". Si la bitácora no está aprobada, solo el mensaje del CU.
  - **Retroalimentación:** caja "Retroalimentación" con contador "0 / 200 palabras" (rojo al superarse), botón "Guardar" y, debajo, "Retroalimentaciones registradas para este estudiante" (fecha, bitácora relacionada y texto).
- **El modal se cierra solo** al aprobar, solicitar corrección, guardar la nota y guardar la retroalimentación.
- **Visor de evidencias** (segundo modal encima): nombre, tipo y tamaño; una vista previa simulada (recuadro gris con ícono según el tipo: imagen o documento); botones "Descargar" (toast azul "Descargando {nombre}") y "Cerrar".
- Si la práctica del estudiante ya tiene resultado, la ventana abre en modo consulta (sin acciones de escritura).

---

## 12. Panel del Director

Menú: "🏠 Inicio", "📋 Gestionar prácticas", "🏫 Instituciones receptoras", "📊 Estado de las prácticas", "⏱️ Supervisión de horas", "📈 Reportes", "🚪 Cerrar sesión". Acento dorado. Flujos exactos: `Casos_de_Uso_Director.md`.

### 12.1 Inicio (pantalla de apoyo)

- "Hola, {primer nombre}".
- Cuatro tarjetas:
  - "Prácticas en curso".
  - "Convenios vigentes": vigentes más próximos a vencer, con el subtítulo "N próximos a vencer".
  - "Plazas disponibles": cupos libres de plazas aprobadas.
  - "Cumplimiento promedio": promedio de los estudiantes con práctica "En curso" o "Finalizada".
- Tarjeta **"Alertas de seguimiento"**: una línea por alerta con su cantidad y un enlace directo a la acción (cantidad 0 en gris):
  - "Estudiantes sin docente asesor"
  - "Estudiantes sin grupo"
  - "Plazas pendientes de decisión"
  - "Prácticas finalizadas por decidir"
  - "Convenios por vencer o vencidos"
  - "Estudiantes con bajo cumplimiento"
- Tarjeta **"Últimas asignaciones"**: las 5 más recientes según `fechaAsignacion` ("Estudiante asignado a «grupo»" o "Estudiante asignado a docente «nombre»") con su fecha.

### 12.2 Gestionar prácticas (CU 1 y CU 2)

- **Página principal:** cuatro tarjetas de acción grandes, cada una con un indicador de pendientes: "Asignar docente asesor", "Asignar estudiantes a grupo de práctica", "Plazas de práctica" y "Decidir resultado de la práctica".
- **Sub-páginas** con el enlace "← Gestionar prácticas":
  - **Asignar docente asesor:** dos columnas. Izquierda: estudiantes sin docente, con casillas. Derecha: docentes con su carga "n / 6"; los llenos aparecen deshabilitados con "Sin disponibilidad". Botón "Asignar" fijo abajo.
  - **Asignar estudiantes a grupo:** estudiantes sin grupo con casillas, desplegable "Grupo de práctica" (cada opción con institución y cupos libres, más "+ Crear nuevo grupo"), resumen del grupo elegido o formulario de nuevo grupo, y botón "Asignar".
  - **Plazas de práctica (CU 2):** filtro "Estado", tabla (institución, jornada, cupos ocupados sobre totales, convenio, estado, acciones "Revisar" o "Ver") y botón "+ Registrar plaza". El formulario se despliega encima de la tabla. Después de "Guardar plaza" se abre la ventana "Revisión de plaza".
  - **Decidir resultado de la práctica:** tabla de prácticas finalizadas por decidir (con nota promedio) y ventana "Resultado de la práctica" con el resumen, avisos ámbar no bloqueantes y los botones "Aprobar práctica" y "Rechazar práctica" (caja de motivo).

### 12.3 Instituciones receptoras (CU 3)

- Botón "+ Registrar institución" y tabla con institución, tipo, convenio (inicio y fin), plazas (calculadas), estado de vigencia y "Ver convenio". El formulario se despliega encima de la tabla.
- Ventana "Convenio institucional" con los datos, los días restantes, el estado y las alertas ámbar o roja; botón "Renovar convenio" (campo "Nueva fecha de finalización") para convenios próximos a vencer o vencidos.

### 12.4 Estado de las prácticas (CU 7)

- Filtros "Institución receptora" y "Docente asesor" y "Limpiar".
- Tarjetas de estado en fila (se pueden tocar): "Todas", "Pendiente", "En curso", "Finalizada", "Aprobada" y "Rechazada", cada una con su cantidad y el color de su estado. La seleccionada queda resaltada. Por defecto, "Todas".
- Tabla de prácticas con estudiante, institución, docente asesor, grupo, fechas, horas, estado y acciones ("Ver detalle" y, solo en "Finalizada", "Decidir resultado").

### 12.5 Supervisión de horas (CU 6)

- Tres tarjetas de resumen (estudiantes en práctica, cumplimiento promedio, con bajo cumplimiento) y filtro "Nivel de cumplimiento" con "Limpiar".
- Tabla con estudiante, institución, docente asesor, horas, **barra de progreso con porcentaje en el color del nivel**, etiqueta del nivel y "Ver detalle". Orden de menor a mayor cumplimiento.
- La ventana "Horas del estudiante" incluye las horas de bitácoras pendientes de aprobación como dato informativo.

### 12.6 Reportes (CU 4 y CU 5)

- Tarjeta con el formulario: "Tipo de reporte", "Fecha inicial", "Fecha final" y "📄 Generar reporte". **No hay historial** de reportes.
- Debajo, el reporte generado: título (tipo y periodo), tarjetas de indicadores, tabla de detalle y el botón **"Exportar"** a la derecha.
- Contenido de cada tipo de reporte: ver la nota del CU 4. Cálculos:

| Reporte | Qué cuenta |
|---|---|
| 1. Cumplimiento de horas por institución | Una fila por institución con prácticas que ya iniciaron (cualquier estado menos "Pendiente"). Horas del periodo = horas aprobadas con fecha dentro del periodo. Horas acumuladas = horas aprobadas con fecha hasta la fecha final. Horas requeridas = suma de las requeridas de esas prácticas. Cumplimiento = acumuladas sobre requeridas. Indicadores: estudiantes en práctica, horas acumuladas y cumplimiento promedio (total acumulado sobre total requerido) |
| 2. Bitácoras por docente asesor | Una fila por docente: estudiantes con práctica y bitácoras del periodo por estado (pendientes, aprobadas, requieren corrección). Indicadores: total de bitácoras y pendientes de revisión |
| 3. Desempeño y resultado de las prácticas | Una fila por práctica que ya inició: horas acumuladas sobre requeridas hasta la fecha final, bitácoras calificadas y nota promedio (de las bitácoras con fecha del periodo; "—" si no hay) y el estado actual. Indicadores: aprobadas, rechazadas, finalizadas por decidir y nota promedio general |
| 4. Estado de los convenios | Instituciones cuyo convenio se solapa con el periodo. Columnas: fechas, estado de vigencia y plazas ocupadas sobre totales. Indicadores: vigentes, próximos a vencer y vencidos (estado actual) |

- **Exportar (CU 5):** ventana con las opciones PDF, Excel y Ambos; ver la sección 13.

---

## 13. Exportación (PDF y Excel)

- **Generación en el navegador**, sin servidor, con las librerías de la sección 3.
- **Nombre del archivo:** `Reporte_{tipo-en-minusculas-con-guiones}_{aaaa-mm-dd}.pdf` o `.xlsx` (por ejemplo `Reporte_cumplimiento-de-horas-por-institucion_2026-10-06.pdf`).
- **PDF:**
  - Orientación horizontal si la tabla tiene más de 6 columnas.
  - Encabezado "SIGPA · {tipo}", línea "Periodo: dd/mm/aaaa a dd/mm/aaaa" y línea "Generado el dd/mm/aaaa hh:mm por {nombre del director}".
  - Indicadores en una fila.
  - Tabla con `jspdf-autotable`, con el color de acento del Director en el encabezado de la tabla.
  - Número de página al pie.
- **Excel:** libro con dos hojas, "Indicadores" (indicador y valor) y "Detalle" (la tabla, con anchos de columna razonables y la fila de encabezado en negrita).
- **Dónde se guarda:** si el navegador lo permite (Chrome y Edge de escritorio), usar `showSaveFilePicker` con el nombre sugerido para que el director **elija la carpeta**; en caso contrario, descarga directa a la carpeta de descargas con un enlace temporal (`<a download>`). Si el director cancela el cuadro (`AbortError`), mostrar el toast azul "Exportación cancelada." y no tratarlo como error.
- **"Ambos":** genera los dos archivos de manera consecutiva. Si el navegador no permite abrir el segundo cuadro "Guardar como" sin una nueva interacción, el segundo archivo se descarga directamente.
- Cualquier fallo en la generación muestra el toast rojo del CU y deja la ventana abierta para reintentar.

---

## 14. Cambios respecto al prototipo actual

| Archivo | Acción |
|---|---|
| `index.html` y `js/login.js` | Ajustar según la sección 9. Conservar "Recordarme" y los usuarios de prueba |
| `css/comun.css` | Extender (nuevos colores de estado, avisos, modal, pestañas, indicador de pasos, barra de resumen, toast, responsive de la sección 5). No crear otros CSS |
| `js/comun.js` | Ampliar con las utilidades de la sección 6. Conservar las funciones existentes que sigan vigentes |
| `js/datos.js` | **Nuevo.** Sección 7 y sección 8 |
| `estudiante/*` | Reescribir según la sección 10. Eliminar las páginas "Evidencias", "Horas" y "Reportes" |
| `docente/*` | Reescribir según la sección 11. Eliminar "Reportes" y "Evaluaciones" y el formulario de evaluación con "Criterio" |
| `director/*` | Reescribir según la sección 12. Eliminar "Asignación de estudiantes", "Prácticas activas" y las tablas "Reportes recibidos" y "Reportes generados" |
| Todos | Quitar `alert`, textos escritos a mano de cifras, datos de ejemplo dentro de los paneles y funciones repetidas |

**Notas de migración de datos de pantallas actuales:**

- Los textos "Docente asesor: Laura Sánchez", "Director: Ricardo Jaime" y los nombres de estudiantes salen ahora de `datos.js`.
- Los estados antiguos "Activa" y "Rechazada" (de bitácora) desaparecen: ahora son "En curso" (práctica) y "Requiere corrección" (bitácora).

---

## 15. Orden de trabajo sugerido

1. `datos.js` completo, con la semilla y las reglas. Probar las funciones sin interfaz.
2. `comun.css` y `comun.js`: componentes y responsive.
3. Login.
4. Panel del Estudiante.
5. Panel del Docente.
6. Panel del Director (en este orden: Instituciones, Plazas, Grupos y asignaciones, Decidir resultado, Estado de las prácticas, Supervisión de horas, Reportes y exportación, Inicio).
7. Revisión transversal: valores de verificación (8.8), los cinco anchos de pantalla, consola sin errores y checklist de la sección 16.

Verifica con un navegador automatizado (Playwright o jsdom si están disponibles) los flujos principales y los cinco anchos de pantalla, y reporta los resultados.

---

## 16. Criterios de aceptación

### Generales

- [ ] Sin errores en la consola en ningún panel.
- [ ] Sin scroll horizontal en la página a 360, 390, 768, 1024 y 1440 px.
- [ ] Un solo CSS; ninguna etiqueta `<style>` ni `style=""` con colores de estado.
- [ ] Ningún `alert`, `confirm` ni `prompt`.
- [ ] Todo el texto visible está en tuteo y coincide con los mensajes de los CU.
- [ ] Los valores de la sección 8.8 coinciden.
- [ ] Al cambiar de día, la semilla se regenera y los estados se recalculan.

### Estudiante

- [ ] CU 1: las 4 tarjetas en una vista; ramas 6a, 7a, 8a y 9a; excepciones 5a, 7b, 8b y 9b (probar quitando datos).
- [ ] CU 2: filtro por fechas, rango inválido, estados vacíos y detalle.
- [ ] CU 3: formulario por pasos completo; validaciones de cada paso; archivo con formato o tamaño inválido; guardar incompleto desde la barra; "Cancelar"; "Corregir" sobre la bitácora que requiere corrección (vuelve a "Pendiente").
- [ ] Con práctica no "En curso", "+ Nueva bitácora" está deshabilitado con su mensaje.

### Docente

- [ ] CU 1: filtros, "Ver avance" (con cambio de estudiante), "Ver bitácoras" filtrada, excepciones 4a, 6c y 7a.
- [ ] CU 2: aprobar suma horas al avance del estudiante; solicitar corrección con motivo vacío y válido; visor de evidencias; bitácora sin evidencias.
- [ ] CU 3: nota solo en aprobadas; rango inválido; observaciones de más de 500 caracteres; editar una nota guardada.
- [ ] CU 4: contador de palabras; más de 200 palabras; texto vacío; historial; el modal se cierra solo al guardar.
- [ ] Con la práctica con resultado, la revisión queda en solo consulta.

### Director

- [ ] CU 1: asignar docente (uno y varios; docente sin cupos); asignar a grupo existente y nuevo (cupos insuficientes, convenio vencido, campos vacíos); decidir resultado (aprobar, rechazar con y sin motivo).
- [ ] CU 2: registrar plaza, aprobar, rechazar, "Decidir después" y "Revisar" posterior; plaza con convenio vencido (no se puede aprobar) y con convenio próximo a vencer (aviso).
- [ ] CU 3: registrar institución (validaciones, nombre repetido, fechas), "Ver convenio" en los tres estados, renovar convenio.
- [ ] CU 4: los cuatro tipos; periodo vacío o invertido; sin datos.
- [ ] CU 5: PDF, Excel y Ambos; cancelar el cuadro "Guardar como"; archivos abren correctamente.
- [ ] CU 6: orden, semáforo, filtro, detalle y caso sin estudiantes.
- [ ] CU 7: tarjetas, filtros, detalle y "Decidir resultado" desde la fila.
- [ ] Efectos cruzados: aprobar una bitácora como docente cambia las horas que ve el estudiante y el director; asignar docente o grupo actualiza el estado de la práctica y lo que ve el docente y el estudiante; decidir el resultado cierra las bitácoras.

---

## 17. Pendientes que NO hay que construir ahora

Quedan registrados para cuando se conecte la API y la base de datos:

- Protección de páginas por sesión y rol, y redirección si ya hay sesión.
- Varios usuarios de prueba y bloque "Modo demostración" (director, 2 docentes y estudiantes en distintos estados).
- Autenticación real y función efectiva de "Recordarme".
- Almacenamiento real de los archivos de evidencia (hoy solo se guarda nombre, tipo y tamaño).
