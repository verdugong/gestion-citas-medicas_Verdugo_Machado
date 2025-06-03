import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import SolicitarCita from "./SolicitarCita";
import obtenerCitasDePaciente from './mostrarCita';
import { onAuthStateChanged } from 'firebase/auth';

const PacientePerfil = () => {
  const [datos, setDatos] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    direccion: '',
    genero: ''

  });

  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    if (user) {
      const cargarDatos = async () => {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDatos(docSnap.data());
        }
        const citasObtenidas = await obtenerCitasDePaciente(user.uid);
        setCitas(citasObtenidas);
      };
      cargarDatos();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
    });

    // Cleanup al desmontar componente
    return () => unsubscribe();
  }, [auth]);

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "usuarios", user.uid), {
        ...datos,
        rol: "paciente"
      });
      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      {/* Formulario de perfil del paciente */}
      <form onSubmit={guardarPerfil}>
        <h2>Mi Perfil De Paciente</h2>

        <label>Nombre:</label>
        <input
          type="text"
          name="nombre"
          value={datos.nombre}
          onChange={manejarCambio}
          required
        />

        <label>Cedula:</label>
        <input
          type="text"
          name="cedula"
          value={datos.cedula}
          onChange={manejarCambio}
          required
        />

        <label>Teléfono:</label>
        <input
          type="tel"
          name="telefono"
          value={datos.telefono}
          onChange={manejarCambio}
          required
        />

        <label>Dirección:</label>
        <input
          type="text"
          name="direccion"
          value={datos.direccion}
          onChange={manejarCambio}
          required
        />

        <label>Genero:</label>
        <input
          type="text"
          name="genero"
          value={datos.genero}
          onChange={manejarCambio}
          required
        />

        <button type="submit">Guardar Cambios</button>
      </form>

      {/* Separador o título opcional */}
      <hr style={{ margin: "2rem 0" }} />

      {/* Aquí montas el componente SolicitarCita */}
      <SolicitarCita />

      <h3>Mis Citas</h3>
      {citas.length === 0 ? (
      <p>No tienes citas registradas.</p>
        ) : (
       <ul>
           {citas.map((cita) => (
              <li key={cita.id} style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem", borderRadius: "8px" }}>
                <p><strong>Especialidad:</strong> {cita.especialidad}</p>
                <p><strong>Doctor:</strong> {cita.nombreMedico}</p>
                <p><strong>Fecha:</strong> {cita.fecha}</p>
                <p><strong>Estado:</strong> {cita.estado}</p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default PacientePerfil;