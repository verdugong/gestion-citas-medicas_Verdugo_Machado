// src/pages/SolicitarCita.js

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";

const SolicitarCita = () => {
  // 1) Estados de la interfaz
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadSel, setEspecialidadSel] = useState("");

  const [medicos, setMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState("");

  const [horarios, setHorarios] = useState([]);
  const [horarioSel, setHorarioSel] = useState("");
  const [timestampSeleccionado, setTimestampSeleccionado] = useState(null);
  // timestampSeleccionado almacenará el objeto Timestamp de Firestore

  const [cargando, setCargando] = useState({
    especialidades: true,
    medicos: false,
    horarios: false,
  });

  // 2) UID del paciente autenticado
  const pacienteId = auth.currentUser?.uid;
  const pacienteNombre = auth.currentUser?.displayName || "Paciente Anónimo";

  // 3) Cargar lista de especialidades al montar el componente
  useEffect(() => {
    const cargarEspecialidades = async () => {
      try {
        const colRef = collection(db, "especialidades");
        const snapshot = await getDocs(colRef);
        const arr = snapshot.docs.map((doc) => ({
          id: doc.id,
          especialidad: doc.data().especialidad, 
          // Nota: aquí usamos el campo "especialidad" en lugar de "nombre"
        }));
        setEspecialidades(arr);
      } catch (error) {
        console.error("Error al cargar especialidades:", error);
      } finally {
        setCargando((prev) => ({ ...prev, especialidades: false }));
      }
    };
    cargarEspecialidades();
  }, []);

  // 4) Cargar médicos cuando cambia la especialidad seleccionada
  useEffect(() => {
    if (!especialidadSel) {
      setMedicos([]);
      return;
    }

    const cargarMedicos = async () => {
      setCargando((prev) => ({ ...prev, medicos: true }));
      try {
        const colRef = collection(db, "usuarios");
        const q = query(
          colRef,
          where("rol", "==", "admin"),
          where("especialidad", "==", especialidadSel)
        );
        const snapshot = await getDocs(q);
        const arr = snapshot.docs.map((doc) => ({
          uid: doc.id,
          nombre: doc.data().nombre,
        }));
        setMedicos(arr);
      } catch (error) {
        console.error("Error al cargar médicos:", error);
      } finally {
        setCargando((prev) => ({ ...prev, medicos: false }));
      }
    };

    cargarMedicos();
  }, [especialidadSel]);

  // 5) Cargar horarios disponibles cuando cambia el médico seleccionado
  useEffect(() => {
    if (!medicoSel) {
      setHorarios([]);
      return;
    }

    const cargarHorarios = async () => {
      setCargando((prev) => ({ ...prev, horarios: true }));
      try {
        const colRef = collection(db, "horarios");
        const q = query(
          colRef,
          where("medicoId", "==", medicoSel),
          where("disponible", "==", true)
        );
        const snapshot = await getDocs(q);
        const arr = snapshot.docs.map((doc) => ({
          id: doc.id,
          fechaTimestamp: doc.data().fecha, 
          // aquí guardamos el Timestamp completo
        }));
        setHorarios(arr);
      } catch (error) {
        console.error("Error al cargar horarios:", error);
      } finally {
        setCargando((prev) => ({ ...prev, horarios: false }));
      }
    };

    cargarHorarios();
  }, [medicoSel]);

  // 6) Función para agendar la cita al enviar el formulario
  const agendarCita = async (e) => {
    e.preventDefault();

    if (!especialidadSel || !medicoSel || !horarioSel) {
      alert("Debes seleccionar especialidad, médico y horario.");
      return;
    }

    try {
      // 6.1) Crear la cita en Firestore
      const nuevaCita = {
        pacienteId: pacienteId,
        pacienteNombre: pacienteNombre, // <—nuevo campo
        medicoId: medicoSel,
        especialidad: especialidadSel,
        fecha: timestampSeleccionado, // aquí guardamos directamente el Timestamp
        horarioId: horarioSel,
        estado: "pendiente",
      };
      await addDoc(collection(db, "citas"), nuevaCita);

      // 6.2) Actualizar el documento de horario para marcarlo como no disponible
      const refHorario = doc(db, "horarios", horarioSel);
      await updateDoc(refHorario, {
        disponible: false,
      });

      alert("¡Cita agendada con éxito!");
      // Limpiar selects
      setEspecialidadSel("");
      setMedicoSel("");
      setHorarios([]);
      setHorarioSel("");
      setTimestampSeleccionado(null);
    } catch (error) {
      console.error("Error al agendar cita:", error);
      alert("Hubo un problema al agendar la cita. Intenta de nuevo.");
    }
  };

  // 7) Utilidad para formatear el Timestamp a cadena legible
  const formatearTimestamp = (ts) => {
    if (!ts) return "";
    const dateObj = ts.toDate(); // convierte a Date de JS
    // Ajusta el formato a tu gusto. Ejemplo: "YYYY-MM-DD HH:mm"
    const opciones = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return dateObj.toLocaleString("es-EC", opciones);
  };

  // 8) Estilos internos para el formulario
  const estilos = {
    titulo: {
      color: "black",
      fontSize: "1.75rem",
      marginBottom: "1.5rem",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
    },
    label: {
      fontWeight: "500",
      color: "black",
      marginBottom: "0.3rem",
    },
    select: {
      padding: "0.6rem 0.8rem",
      borderRadius: "5px",
      border: "1px solid #ccc",
      fontSize: "1rem",
      width: "100%",
      boxSizing: "border-box",
    },
    boton: {
      backgroundColor: "#2b6cb0",
      color: "white",
      border: "none",
      padding: "0.75rem 1rem",
      fontSize: "1rem",
      fontWeight: "500",
      borderRadius: "5px",
      cursor: "pointer",
      marginTop: "1rem",
      alignSelf: "flex-start",
      transition: "background-color 0.2s",
    },
    botonDisabled: {
      backgroundColor: "#a0aec0",
      cursor: "not-allowed",
    },
  };

  // Determina si el botón debe habilitarse
  const puedeAgendar =
    especialidadSel !== "" && medicoSel !== "" && horarioSel !== "";

  return (
    <div style={{ width: "100%" }}>

      {/* Formulario */}
      <form style={estilos.form} onSubmit={agendarCita}>
        {/* 8.1) Select de Especialidades */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="especialidad" style={estilos.label}>
            Especialidad
          </label>
          {cargando.especialidades ? (
            <p>Cargando especialidades...</p>
          ) : (
            <select
              id="especialidad"
              value={especialidadSel}
              onChange={(e) => setEspecialidadSel(e.target.value)}
              required
              style={estilos.select}
            >
              <option value="">-- Selecciona una especialidad --</option>
              {especialidades.map((esp) => (
                <option key={esp.id} value={esp.especialidad}>
                  {esp.especialidad}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 8.2) Select de Médicos */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="medico" style={estilos.label}>
            Médico
          </label>
          {cargando.medicos ? (
            <p>Cargando médicos...</p>
          ) : (
            <select
              id="medico"
              value={medicoSel}
              onChange={(e) => setMedicoSel(e.target.value)}
              required
              disabled={!especialidadSel}
              style={estilos.select}
            >
              <option value="">-- Selecciona un médico --</option>
              {medicos.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 8.3) Select de Horarios */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="horario" style={estilos.label}>
            Fecha y Hora
          </label>
          {cargando.horarios ? (
            <p>Cargando horarios...</p>
          ) : (
            <select
              id="horario"
              value={horarioSel}
              onChange={(e) => {
                const idHor = e.target.value;
                setHorarioSel(idHor);
                const obj = horarios.find((h) => h.id === idHor);
                if (obj) {
                  setTimestampSeleccionado(obj.fechaTimestamp);
                } else {
                  setTimestampSeleccionado(null);
                }
              }}
              required
              disabled={!medicoSel}
              style={estilos.select}
            >
              <option value="">-- Selecciona un horario --</option>
              {horarios.map((h) => (
                <option key={h.id} value={h.id}>
                  {formatearTimestamp(h.fechaTimestamp)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 8.4) Botón para confirmar la cita */}
        <button
          type="submit"
          style={{
            ...estilos.boton,
            ...(puedeAgendar ? {} : estilos.botonDisabled),
          }}
          disabled={!puedeAgendar}
        >
          Agendar Cita
        </button>
      </form>
    </div>
  );
};

export default SolicitarCita;

