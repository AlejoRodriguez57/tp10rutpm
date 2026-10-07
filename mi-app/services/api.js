const API_URL = "http://192.168.1.37:3000";

export async function obtenerUsuarios() {
  const response = await fetch(`${API_URL}/usuarios`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Error al obtener usuarios"
    );
  }

  return data;
}

export async function crearUsuario(token, nombre) {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Error al crear usuario"
    );
  }

  return data;
}

export async function sumarPunto(token) {
  const response = await fetch(
    `${API_URL}/usuarios/punto`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Error al sumar punto"
    );
  }

  return data;
}