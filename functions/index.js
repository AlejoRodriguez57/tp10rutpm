const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(
    require("./apptp9basicrut-firebase-adminsdk-fbsvc-2039642261.json")
  ),
});

const db = admin.firestore();

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// VERIFICAR AUTENTICACIÓN
// ==============================

async function verificarUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Falta el token de autenticación",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    const usuario = await admin.auth().verifyIdToken(token);

    req.usuario = usuario;

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      error: "Token inválido o expirado",
    });
  }
}


// ==============================
// GET USUARIOS
// ==============================

app.get("/usuarios", async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .orderBy("puntuacion", "desc")
      .get();

    const usuarios = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(usuarios);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al obtener usuarios",
    });
  }
});


// ==============================
// POST USUARIO
// ==============================

app.post("/usuarios", verificarUsuario, async (req, res) => {
  try {
    const uid = req.usuario.uid;
    const email = req.usuario.email;

    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: "El nombre es obligatorio",
      });
    }

    const usuarioRef = db.collection("users").doc(uid);

    const usuarioExistente = await usuarioRef.get();

    if (usuarioExistente.exists) {
      return res.status(409).json({
        error: "El usuario ya existe",
      });
    }

    await usuarioRef.set({
      email: email,
      nombre: nombre,
      puntuacion: 0,
    });

    res.status(201).json({
      mensaje: "Usuario creado correctamente",
      id: uid,
      email: email,
      nombre: nombre,
      puntuacion: 0,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al crear usuario",
    });
  }
});

// ==============================
// Subir puntos
// ==============================

app.post("/usuarios/punto", verificarUsuario, async (req, res) => {
  try {
    const uid = req.usuario.uid;

    const usuarioRef = db.collection("users").doc(uid);

    const usuario = await usuarioRef.get();

    if (!usuario.exists) {
      return res.status(404).json({
        error: "El usuario no existe en Firestore",
      });
    }

    await usuarioRef.update({
      puntuacion: admin.firestore.FieldValue.increment(1),
    });

    const usuarioActualizado = await usuarioRef.get();

    res.json({
      mensaje: "Punto agregado correctamente",
      puntuacion: usuarioActualizado.data().puntuacion,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al sumar punto",
    });
  }
});

// ==============================
// INICIAR SERVIDOR
// ==============================

app.listen(3000, "0.0.0.0", () => {
  console.log("API corriendo en el puerto 3000");
});