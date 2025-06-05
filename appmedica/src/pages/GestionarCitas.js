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
  // 1) Estado: lista de citas (incluye horarioId)
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 2) Mapeo pacienteId -> nombre actual
  const [nombresPacientes, setNombresPacientes] = useState({});

  // 3) UID del médico autenticado
  const medicoId = auth.currentUser?.uid;

  // 4) useEffect para cargar las citas de este médico
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

        const arr = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          pacienteId: docSnap.data().pacienteId,
          fecha: docSnap.data().fecha,
          estado: docSnap.data().estado,
          horarioId: docSnap.data().horarioId, 
          // ¡Asegúrate de que tu documento "citas" en Firestore tiene este campo `horarioId`!
        }));
        console.log("→ Citas cargadas:", arr);
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

  // 5) useEffect para cargar nombres de pacientes según pacienteId
  useEffect(() => {
    const fetchNombres = async () => {
      const idsSinNombre = citas
        .map((c) => c.pacienteId)
        .filter((pid) => pid && !nombresPacientes[pid]);

      if (idsSinNombre.length === 0) return;

      const uniqueIds = Array.from(new Set(idsSinNombre));
      const nuevosNombres = {};

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
            nuevosNombres[pid] = "<error al leer>";
          }
        })
      );

      setNombresPacientes((prev) => ({
        ...prev,
        ...nuevosNombres
      }));
    };

    if (citas.length > 0) {
      fetchNombres();
    }
  }, [citas, nombresPacientes]);

  // 6) Función para cambiar el estado de una cita y actualizar el horario si es negada
  const cambiarEstado = async (citaId, nuevoEstado, horarioId) => {
    console.log(`→ Intentando cambiar estado de cita ${citaId} a "${nuevoEstado}". HorarioId asociado: ${horarioId}`);

    if (!horarioId) {
      console.warn("   ¡No se recibió horarioId! No puedo actualizar la disponibilidad del horario.");
    }

    try {
      // 6.1) Actualizamos solo el campo 'estado' de la cita
      const refCita = doc(db, "citas", citaId);
      await updateDoc(refCita, { estado: nuevoEstado });
      console.log(`   ✓ Cita ${citaId} actualizada a estado "${nuevoEstado}"`);

      // 6.2) Si el estado es "negada", reabrimos el horario (disponible: true)
      if (nuevoEstado === "negada" && horarioId) {
        const refHorario = doc(db, "horarios", horarioId);

        // Opcional: revisa primero en consola cómo está el doc del horario
        const horarioSnap = await getDoc(refHorario);
        if (!horarioSnap.exists()) {
          console.error(`   ✗ No existe el horario ${horarioId} en Firestore.`);
        } else {
          console.log("   • Antes de actualizar, doc horario:", horarioSnap.data());
          await updateDoc(refHorario, { disponible: true });
          console.log(`   ✓ Horario ${horarioId} marcado como disponible (true).`);
        }
      }

      // 6.3) Si el estado es "confirmada" o "pendiente", aseguramos que el horario quede bloqueado (false)
      if ((nuevoEstado === "confirmada" || nuevoEstado === "pendiente") && horarioId) {
        const refHorario = doc(db, "horarios", horarioId);
        const horarioSnap = await getDoc(refHorario);
        if (horarioSnap.exists()) {
          console.log("   • Antes de actualizar (confirmada/pendiente), doc horario:", horarioSnap.data());
          await updateDoc(refHorario, { disponible: false });
          console.log(`   ✓ Horario ${horarioId} marcado como no disponible (false).`);
        }
      }

      // 6.4) Actualizamos el estado local de la cita para refrescar la UI
      setCitas((prev) =>
        prev.map((cita) =>
          cita.id === citaId ? { ...cita, estado: nuevoEstado } : cita
        )
      );
    } catch (error) {
      console.error("Error al cambiar estado de la cita o del horario:", error);
      alert("Hubo un problema actualizando la cita o el horario. Revisa la consola.");
    }
  };

  // 7) Formatear Timestamp a string legible
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

  // 8) Renderizado
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
                      cambiarEstado(cita.id, e.target.value, cita.horarioId)
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

