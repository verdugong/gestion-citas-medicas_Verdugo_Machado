import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function AgregarHorario() {
  // El médico ingresa fecha y hora usando un <input type="datetime-local" />
  const [datetimeLocal, setDatetimeLocal] = useState("");

  // Obtenemos el UID del médico autenticado:
  const medicoId = auth.currentUser?.uid;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!datetimeLocal) {
      alert("Debes elegir fecha y hora.");
      return;
    }

    try {
      // Convertimos el string "YYYY-MM-DDTHH:mm" a un objeto Date de JS
      const dateObj = new Date(datetimeLocal);

      // Creamos un Timestamp de Firebase a partir de ese Date
      const tsFirebase = Timestamp.fromDate(dateObj);

      // Agregamos un nuevo documento a "horarios"
      await addDoc(collection(db, "horarios"), {
        medicoId: medicoId,
        fecha: tsFirebase,
        disponible: true
      });

      alert("Horario guardado correctamente.");
      setDatetimeLocal("");
    } catch (error) {
      console.error("Error al crear horario:", error);
      alert("Hubo un error creando el horario.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "1rem auto" }}>
      <h3>Agregar Horario de Atención</h3>

      <label>Fecha y Hora:</label>
      <input
        type="datetime-local"
        value={datetimeLocal}
        onChange={(e) => setDatetimeLocal(e.target.value)}
        required
      />
      <br /><br />

      <button type="submit" style={{
        backgroundColor: "#2b6cb0",
        color: "white",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        cursor: "pointer",
        marginTop: "1rem"
      }} > Guardar Horario</button>

    </form>
  );
}
