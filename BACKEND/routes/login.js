const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const neondb = require("../db/neondb");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const DOMINIO_PERMITIDO = "udi.edu.co";

// POST /api/login  body: { credential: "<token de Google>" }
router.post("/", async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: "Falta el token de Google (credential)" });
        }

        // 1) Verificar que el token es real y fue emitido para NUESTRA app
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub: googleSub, email, given_name, family_name } = payload;

        // 2) Validar dominio institucional
        if (!email || !email.endsWith("@" + DOMINIO_PERMITIDO)) {
            return res.status(403).json({ error: "Solo se permiten cuentas @udi.edu.co" });
        }

        // 3) Buscar el usuario por correo
        const usuario = await neondb.query(
            "SELECT id_usuario, nombre, apellido, email, rol FROM usuario WHERE email = $1",
            [email]
        );

        if (usuario.rows.length > 0) {
            const u = usuario.rows[0];
            return res.json({
                autenticado: true,
                usuario: { id_usuario: u.id_usuario, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol }
            });
        }

        // 4) No existe: revisar si ya tiene solicitud pendiente
        const solicitud = await neondb.query(
            "SELECT id_solicitud, estado FROM solicitud_registro WHERE email = $1 AND estado = 'PENDIENTE'",
            [email]
        );
        if (solicitud.rows.length > 0) {
            return res.status(202).json({
                autenticado: false,
                estado: "PENDIENTE",
                mensaje: "Tu solicitud de registro está pendiente de aprobación"
            });
        }

        // 5) No existe ni solicitud: el frontend debe mostrar el formulario de registro
        return res.status(404).json({
            autenticado: false,
            estado: "NO_REGISTRADO",
            mensaje: "Cuenta no registrada. Debes solicitar acceso.",
            datos_google: { google_sub: googleSub, email, nombre: given_name, apellido: family_name }
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: "Token de Google inválido o expirado" });
    }
});

// ---------------------------------------------------------------------
// LOGIN DE PRUEBA (para los calificadores del proyecto)
//
// POST /api/login/prueba  body: { usuario: "estudiante", password: "123456" }
//
// Es un camino APARTE del flujo de Google: no toca Google ni crea
// solicitudes. Mapea 4 nombres de usuario de prueba a 4 usuarios
// dedicados de la base (los crea el script de semilla) y responde con
// la MISMA forma que el login real ({ autenticado, usuario }), así el
// frontend no distingue de dónde viene la sesión.
//
// Está protegido por la variable de entorno ENABLE_TEST_LOGIN: si no es
// exactamente "true", la ruta responde 404 como si no existiera. En
// producción real basta con no definirla.
// ---------------------------------------------------------------------
const CLAVE_PRUEBA = "123456";
const USUARIOS_PRUEBA = {
    estudiante: "prueba.estudiante@udi.edu.co",
    docente: "prueba.docente@udi.edu.co",
    director: "prueba.director@udi.edu.co",
    admin: "prueba.admin@udi.edu.co"
};

router.post("/prueba", async (req, res) => {
    if (process.env.ENABLE_TEST_LOGIN !== "true") {
        return res.status(404).json({ error: "Ruta no disponible" });
    }
    try {
        const { usuario, password } = req.body || {};
        if (!usuario || !password) {
            return res.status(400).json({ error: "Ingresa tu usuario y tu contraseña." });
        }

        const email = USUARIOS_PRUEBA[String(usuario).trim().toLowerCase()];
        if (!email || password !== CLAVE_PRUEBA) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }

        const resultado = await neondb.query(
            "SELECT id_usuario, nombre, apellido, email, rol FROM usuario WHERE email = $1",
            [email]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "El usuario de prueba aún no existe en la base de datos (falta correr el script de semilla)." });
        }

        const u = resultado.rows[0];
        res.json({
            autenticado: true,
            usuario: { id_usuario: u.id_usuario, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al iniciar sesión de prueba" });
    }
});

module.exports = router;