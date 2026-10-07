
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import { crearUsuario } from "../../services/api";
import { router } from "expo-router";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrarse() {
    if (!nombre || !email || !password || !confirmarPassword) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }

    if (password !== confirmarPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Error",
        "La contraseña debe tener al menos 6 caracteres"
      );
      return;
    }

    try {
      setCargando(true);

      // 1. Crear usuario en Firebase Authentication
      const resultado = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Obtener el token del usuario autenticado
      const token = await resultado.user.getIdToken();

      // 3. Crear el usuario en nuestra API / Firestore
      await crearUsuario(token, nombre);

      // 4. Ir a la pantalla principal
      Alert.alert(
        "Cuenta creada",
        "Tu cuenta fue creada correctamente"
      );

      router.replace("/");
    } catch (error: any) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Error",
          "Ese email ya está registrado"
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert(
          "Error",
          "El email no es válido"
        );
      } else if (error.code === "auth/weak-password") {
        Alert.alert(
          "Error",
          "La contraseña debe tener al menos 6 caracteres"
        );
      } else if (error.message?.includes("Network request failed")) {
        Alert.alert(
          "Error de conexión",
          "No se pudo conectar con el servidor. Revisá la IP de la API."
        );
      } else {
        Alert.alert(
          "Error",
          error.message || "No se pudo crear la cuenta"
        );
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Repetir contraseña"
        secureTextEntry
        value={confirmarPassword}
        onChangeText={setConfirmarPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={registrarse}
        disabled={cargando}
      >
        <Text style={styles.buttonText}>
          {cargando ? "Creando..." : "Crear cuenta"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/login")}
        disabled={cargando}
      >
        <Text style={styles.link}>
          ¿Ya tenés una cuenta? Iniciá sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  link: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
  },
});
