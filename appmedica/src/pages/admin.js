import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import AgregarHorario from "./AgregarHorario";
import GestionarCitas from "./GestionarCitas";

const AdminPerfil = () => {
  const [datos, setDatos] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    especialidad: ''

  });

  const auth = getAuth();
  const user = auth.currentUser;
  const [listaEspecialidades, setListaEspecialidades] = useState([]); 
  const [cargandoEspecialidades, setCargandoEspecialidades] = useState(true);

  useEffect(() => {
    if (user) {
      const cargarDatos = async () => {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDatos(docSnap.data());
        }
      };
      cargarDatos();
    }

    // 2. Cargar la lista de especialidades
    const cargarEspecialidades = async () => {
      try {
        const colecRef = collection(db, "especialidades");
        const snapshot = await getDocs(colecRef);
        // Suponemos que cada documento en "especialidades" tiene un campo "nombre".
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          especialidad: d.data().especialidad,
        }));
        setListaEspecialidades(arr);
      } catch (error) {
        console.error("Error cargando especialidades:", error);
      } finally {
        setCargandoEspecialidades(false);
      }
    };
    cargarEspecialidades();
  }, [user]);

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'usuarios', user.uid), {
        ...datos,
        rol: 'admin'
      });
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      {/* 2) Formulario de perfil del administrador */}
      <form onSubmit={guardarPerfil}>
        <h2>ADMINISTRADOR</h2>

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

        <label>Especialidad:</label>
        {cargandoEspecialidades ? (
          <p>Cargando especialidades...</p>
        ) : (
          <select
            name="especialidad"
            value={datos.especialidad}
            onChange={manejarCambio}
            required
          >
            <option value="">-- Selecciona una especialidad --</option>
            {listaEspecialidades.map((esp) => (
              <option key={esp.id} value={esp.especialidad}>
                {esp.especialidad}
              </option>
            ))}
          </select>
        )}

        <button type="submit" style={{ marginTop: "1rem" }}>
          Guardar Cambios
        </button>
      </form>

      {/* 3) Sepáranos con una línea horizontal */}
      <hr style={{ margin: "2rem 0" }} />

      {/* 4) Montamos el componente para agregar horarios */}
      <AgregarHorario />

      <hr style={{ margin: "2rem 0" }} />

      {/* Componente para gestionar (ver/confirmar/modificar) las citas */}
      <GestionarCitas />
    </div>
  );
};

export default AdminPerfil;
