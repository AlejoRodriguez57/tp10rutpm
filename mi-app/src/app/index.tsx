import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { auth } from "../../services/firebase";
import { obtenerUsuarios, sumarPunto } from "../../services/api";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  puntuacion: number;
};

export default function Index() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const [sumandoPunto, setSumandoPunto] = useState(false);

  // Verificar si hay usuario logueado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargandoAuth(false);

      if (!user) {
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, []);

  // Cargar leaderboard solamente si hay usuario autenticado
  useEffect(() => {
    if (!usuario) {
      return;
    }

    cargarUsuarios();
  }, [usuario]);

  async function cargarUsuarios() {
    try {
      setCargandoUsuarios(true);

      const data = await obtenerUsuarios();

      setUsuarios(data);
    } catch (error: any) {
      console.error("ERROR GET USUARIOS:", error);

      Alert.alert(
        "Error",
        error.message || "No se pudieron cargar los usuarios"
      );
    } finally {
      setCargandoUsuarios(false);
    }
  }

  async function agregarPunto() {
    try {
      if (!usuario) {
        router.replace("/login");
        return;
      }

      setSumandoPunto(true);

      const token = await usuario.getIdToken();

      await sumarPunto(token);

      await cargarUsuarios();
    } catch (error: any) {
      console.error("ERROR SUMANDO PUNTO:", error);

      Alert.alert(
        "Error",
        error.message || "No se pudo sumar el punto"
      );
    } finally {
      setSumandoPunto(false);
    }
  }

  async function cerrarSesion() {
    try {
      await signOut(auth);

      // Mandar explícitamente al login
      router.replace("/login");
    } catch (error) {
      console.error("ERROR CERRANDO SESIÓN:", error);

      Alert.alert(
        "Error",
        "No se pudo cerrar la sesión"
      );
    }
  }

  // Mientras Firebase averigua si hay sesión
  if (cargandoAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Comprobando sesión...
        </Text>
      </View>
    );
  }

  // Si no hay sesión, no mostramos NADA del ranking
  if (!usuario) {
    return null;
  }

  const miUsuario = usuarios.find(
    (item) => item.id === usuario.uid
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏆 Ranking</Text>

          <Text style={styles.email}>
            {usuario.email}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={cerrarSesion}
        >
          <Text style={styles.logoutText}>
            Salir
          </Text>
        </TouchableOpacity>
      </View>

      {/* PUNTUACIÓN */}
      <View style={styles.myScore}>
        <Text style={styles.myScoreTitle}>
          Tu puntuación
        </Text>

        <Text style={styles.myScoreNumber}>
          {miUsuario?.puntuacion ?? 0}
        </Text>

        <TouchableOpacity
          style={styles.pointButton}
          onPress={agregarPunto}
          disabled={sumandoPunto}
        >
          <Text style={styles.pointButtonText}>
            {sumandoPunto
              ? "Sumando..."
              : "+1 punto"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LEADERBOARD */}
      <Text style={styles.rankingTitle}>
        Tabla de posiciones
      </Text>

      {cargandoUsuarios ? (
        <View style={styles.loadingRanking}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Cargando ranking...
          </Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.userRow,
                item.id === usuario.uid &&
                  styles.myUserRow,
              ]}
            >
              <Text style={styles.position}>
                {index + 1}
              </Text>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {item.nombre}
                </Text>

                <Text style={styles.userEmail}>
                  {item.email}
                </Text>
              </View>

              <Text style={styles.score}>
                {item.puntuacion}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay usuarios todavía.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#f5f5f5",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingRanking: {
    alignItems: "center",
    marginTop: 30,
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
  },

  email: {
    marginTop: 5,
    color: "#666",
  },

  logoutButton: {
    backgroundColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  logoutText: {
    color: "#d00",
    fontWeight: "bold",
  },

  myScore: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 25,
  },

  myScoreTitle: {
    fontSize: 18,
    color: "#666",
  },

  myScoreNumber: {
    fontSize: 50,
    fontWeight: "bold",
    marginVertical: 10,
  },

  pointButton: {
    backgroundColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  pointButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
  },

  rankingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  list: {
    paddingBottom: 30,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  myUserRow: {
    borderWidth: 2,
    borderColor: "#222",
  },

  position: {
    width: 35,
    fontSize: 20,
    fontWeight: "bold",
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 17,
    fontWeight: "bold",
  },

  userEmail: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  score: {
    fontSize: 22,
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
  },
});