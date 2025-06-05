import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";


const obtenerCitasDePaciente = async (uid) => {
  const citasRef = collection(db, "citas");
  const q = query(citasRef, where("pacienteId", "==", uid));
  const querySnapshot = await getDocs(q);
  const citas = [];

  for (const docSnap of querySnapshot.docs) {
    const citaData = docSnap.data();
    let nombreMedico = "Desconocido";

    try {
      if (citaData.medicoId) {
        const medicoRef = doc(db, "usuarios", citaData.medicoId);
        const medicoSnap = await getDoc(medicoRef);
        if (medicoSnap.exists()) {
          nombreMedico = medicoSnap.data().nombre;
        }
      }
    } catch (error) {
      console.error("Error obteniendo datos del doctor:", error);
    }
    // Convierte el timestamp de fecha a string legible
    let fechaFormateada = "Sin fecha";
    if (citaData.fecha instanceof Timestamp) {
      fechaFormateada = citaData.fecha.toDate().toLocaleString();
    }

    citas.push({
      id: docSnap.id,
      especialidad: citaData.especialidad || "No especificada",
      fecha: fechaFormateada,
      motivo: citaData.motivo || "Sin motivo",
      estado: citaData.estado || "Pendiente",
      nombreMedico,
      horarioId: citaData.horarioId || "No especificado",
    });
  }

  return citas;
};

export default obtenerCitasDePaciente;