// src/pages/GestionarCitas.js

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";

export default function GestionarCitas() {
  // 1) Estado: lista de citas (sin pacienteNombre por ahora)
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 2) Estado para mapear pacienteId -> nombre actual
  const [nombresPacientes, setNombresPacientes] = useState({});

  // 3) UID del médico actualmente autenticado
  const medicoId = auth.currentUser?.uid;

  // 4) useEffect para cargar las citas (solo campos básicos)
  useEffect(() => {
    if (!medicoId) {
      setCitas([]);
      setCargando(false);
      return;
    }

    const cargarCitas = async () => {
      setCargando(true);
      try {
        const colRef = collection(db, "citas");
        const q = query(colRef, where("medicoId", "==", medicoId));
        const snapshot = await getDocs(q);

        // Solo tomamos los campos básicos (sin pacienteNombre)
        const arr = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          pacienteId: docSnap.data().pacienteId,
          fecha: docSnap.data().fecha,
          estado: docSnap.data().estado,
          // Si tienes otros campos (especialidad, horarioId, etc.), inclúyelos aquí
        }));
        setCitas(arr);
      } catch (error) {
        console.error("Error cargando citas:", error);
        setCitas([]);
      } finally {
        setCargando(false);
      }
    };

    cargarCitas();
  }, [medicoId]);

  // 5) useEffect que, cada vez que cambie `citas`, carga los nombres de usuario faltantes
  useEffect(() => {
    const fetchNombres = async () => {
      // Recopilamos todos los ids de paciente que aún no tengamos en el map
      const idsSinNombre = citas
        .map((c) => c.pacienteId)
        .filter((pid) => pid && !nombresPacientes[pid]);

      if (idsSinNombre.length === 0) {
        return; // Ya tenemos todos los nombres en el estado
      }

      // Para evitar duplicados, generamos un set de IDs únicos
      const uniqueIds = Array.from(new Set(idsSinNombre));

      // Creamos un objeto temporal para unir resultados
      const nuevosNombres = {};

      // Por cada pacienteId hacemos un getDoc
      await Promise.all(
        uniqueIds.map(async (pid) => {
          try {
            const docRef = doc(db, "usuarios", pid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              nuevosNombres[pid] = docSnap.data().nombre;
            } else {
              nuevosNombres[pid] = "<sin nombre>";
            }
          } catch (error) {
            console.error(`Error al leer usuario ${pid}:`, error);
            nuevosNombres[pid] = "<error>";
          }
        })
      );

      // Actualizamos el estado uniendo con lo que ya teníamos
      setNombresPacientes((prev) => ({
        ...prev,
        ...nuevosNombres
      }));
    };

    if (citas.length > 0) {
      fetchNombres();
    }
  }, [citas, nombresPacientes]);

  // 6) Función para cambiar el estado de una cita
  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      const refCita = doc(db, "citas", citaId);
      await updateDoc(refCita, { estado: nuevoEstado });

      // Actualizamos el estado local de esa cita
      setCitas((prev) =>
        prev.map((cita) =>
          cita.id === citaId ? { ...cita, estado: nuevoEstado } : cita
        )
      );
    } catch (error) {
      console.error("Error al cambiar estado de la cita:", error);
      alert("No se pudo actualizar el estado. Intenta otra vez.");
    }
  };

  // 7) Función para formatear el Timestamp a cadena legible
  const formatearTimestamp = (ts) => {
    if (!ts) return "";
    const dateObj = ts.toDate();
    const opciones = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return dateObj.toLocaleString("es-EC", opciones);
  };

  // 8) Renderizado del componente
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h2>Gestión de Citas (Mis Pacientes)</h2>

      {cargando ? (
        <p>Cargando citas...</p>
      ) : citas.length === 0 ? (
        <p>No tienes citas agendadas.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem"
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Paciente
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Fecha
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Estado Actual
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Cambiar Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => (
              <tr key={cita.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {/* Mostramos el nombre que tenemos mapeado, o un texto si no está listo */}
                  {nombresPacientes[cita.pacienteId] || "Cargando nombre..."}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {formatearTimestamp(cita.fecha)}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {cita.estado}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <select
                    value={cita.estado}
                    onChange={(e) =>
                      cambiarEstado(cita.id, e.target.value)
                    }
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="negada">Negada</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
