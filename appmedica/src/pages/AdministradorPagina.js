import { useEffect, useState } from 'react'; 
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import AgregarHorario from "./AgregarHorario";
import GestionarCitas from "./GestionarCitas";
import logo from "../logoclinica.jpg";
import { Link } from 'react-router-dom';
import fondoClinica from "../fondoPaginaWeb.jpg";

const AdministradorPerfil = () => {
  const [vista, setVista] = useState("perfil"); // "perfil" | "horario" | "citas"
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

    const cargarEspecialidades = async () => {
      try {
        const colecRef = collection(db, "especialidades");
        const snapshot = await getDocs(colecRef);
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

  const validarCedula = (cedula) => {
    if (!/^\d{10}$/.test(cedula)) return false;
    const digitos = cedula.split('').map(Number);
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;
    const tercerDigito = digitos[2];
    if (tercerDigito >= 6) return false;

    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let val = digitos[i];
      if (i % 2 === 0) {
        val *= 2;
        if (val > 9) val -= 9;
      }
      suma += val;
    }
    const ultimoDigito = digitos[9];
    const decenaSuperior = Math.ceil(suma / 10) * 10;
    const digitoVerificador = decenaSuperior - suma === 10 ? 0 : decenaSuperior - suma;

    return digitoVerificador === ultimoDigito;
  };
  const validarTelefono = (telefono) => {
    return /^\d{10}$/.test(telefono);
  };
  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!validarCedula(datos.cedula)) {
      alert("La cédula ingresada no es válida.");
      return;
    }
    if (!validarTelefono(datos.telefono)) {
      alert("El teléfono debe contener exactamente 10 dígitos numéricos.");
      return;
    }
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

  // —— Estilos para menú lateral (sin cambios) ——
  const navBtnStyle = {
    display: "block",
    width: "100%",
    backgroundColor: "transparent",
    color: "white",
    border: "none",
    padding: "0.75rem 0",
    fontSize: "16px",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
  };

  // —— Estilos principales ——
  const estilos = {
    pageContainer: {
      display: "flex",
      minHeight: "100vh",
    },
    sidebar: {
      width: "220px",
      backgroundColor: "#2b6cb0",
      color: "white",
      padding: "1rem",
      boxShadow: "2px 0 5px rgba(0,0,0,0.2)",
    },
    logoMenu: {
      width: "100%",
      marginBottom: "2rem",
      cursor: "pointer",
    },
    // Capa A: el main que tiene la imagen de fondo y ocupa todo el espacio restante
    mainConFondo: {
      flexGrow: 1,
      backgroundImage: `url(${fondoClinica})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      display: "flex",
      justifyContent: "center",
      padding: "2rem",
    },
    // Capa B: contenedor interior blanco semitransparente
    contenedorBlanco: {
      width: "100%",
      maxWidth: "800px",
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    // Header azul dentro del contenedor blanco
    headerBlanco: {
      backgroundColor: "#2b6cb0",
      color: "white",
      padding: "1rem",
      textAlign: "center",
      fontSize: "1.5rem",
    },
    // Contenido dinámico dentro del contenedor blanco
    contenido: {
      padding: "2rem",
    },
    // Estilos para el formulario de perfil
    formStyle: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      backgroundColor: "white", // aquí podría quedar opaco o semitransparente; el contenedor padre ya es semitransp.
      padding: "2rem",
      borderRadius: "0 0 8px 8px",
      boxShadow: "0 0 10px rgba(0,0,0,0.05)",
    },
    btnGuardarStyle: {
      backgroundColor: "#2b6cb0",
      color: "white",
      border: "none",
      padding: "0.75rem",
      borderRadius: "4px",
      cursor: "pointer",
      marginTop: "1rem",
      alignSelf: "flex-start",
    },
  };

  return (
    <div style={estilos.pageContainer}>
      {/* Panel lateral sin cambios */}
      <nav style={estilos.sidebar}>
        <Link to="/">
          <img src={logo} alt="Logo" style={estilos.logoMenu} />
        </Link>
        <button onClick={() => setVista("perfil")} style={navBtnStyle}>
          Mi Perfil
        </button>
        <button onClick={() => setVista("horario")} style={navBtnStyle}>
          Agregar Horario
        </button>
        <button onClick={() => setVista("citas")} style={navBtnStyle}>
          Gestión de Citas
        </button>
      </nav>

      {/* Capa A: main con imagen de fondo y centrado */}
      <main style={estilos.mainConFondo}>
        {/* Capa B: contenedor blanco semitransparente */}
        <div style={estilos.contenedorBlanco}>
          {/* Header azul dentro del contenedor blanco */}
          <header style={estilos.headerBlanco}>
            Clínica San Sebastián
          </header>

          {/* Contenido dinámico */}
          <div style={estilos.contenido}>
            {vista === "perfil" && (
              <form onSubmit={guardarPerfil} style={estilos.formStyle}>
                <h2>Mi Perfil de Administrador</h2>

                <label>Nombre:</label>
                <input
                  type="text"
                  name="nombre"
                  value={datos.nombre}
                  onChange={manejarCambio}
                  required
                  style={{
                    padding: "0.5rem",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                />

                <label>Cédula:</label>
                <input
                  type="text"
                  name="cedula"
                  value={datos.cedula}
                  onChange={manejarCambio}
                  required
                  style={{
                    padding: "0.5rem",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                />

                <label>Teléfono:</label>
                <input
                  type="tel"
                  name="telefono"
                  value={datos.telefono}
                  onChange={manejarCambio}
                  required
                  style={{
                    padding: "0.5rem",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
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
                    style={{
                      padding: "0.6rem 0.8rem",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      fontSize: "1rem",
                    }}
                  >
                    <option value="">-- Selecciona una especialidad --</option>
                    {listaEspecialidades.map((esp) => (
                      <option key={esp.id} value={esp.especialidad}>
                        {esp.especialidad}
                      </option>
                    ))}
                  </select>
                )}

                <button type="submit" style={estilos.btnGuardarStyle}>
                  Guardar Cambios
                </button>
              </form>
            )}

            {vista === "horario" && <AgregarHorario />}

            {vista === "citas" && <GestionarCitas />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdministradorPerfil;