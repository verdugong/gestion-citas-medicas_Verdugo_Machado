import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import SolicitarCita from "./SolicitarCita";
import obtenerCitasDePaciente from './MostrarCita';
import logo from "../logoclinica.jpg";
import fondoClinica from "../fondoPaginaWeb.jpg";
import { Link } from 'react-router-dom';

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

  // Estado para controlar qué vista está activa
  const [vistaActiva, setVistaActiva] = useState('perfil'); // 'perfil', 'solicitar', 'citas'

  const [hoverCancel, setHoverCancel] = useState(null);

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
    return () => unsubscribe();
  }, [auth]);

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  // Función para validar cédula ecuatoriana
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

// Función para validar teléfono (10 dígitos numéricos)
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
      await setDoc(doc(db, "usuarios", user.uid), {
        ...datos,
        rol: "paciente"
      });
      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
    }
  };

  // Función para cancelar una cita y liberar el horario
  const cancelarCita = async (citaId, horarioId) => {
    const confirmado = window.confirm(
      "¿Estás seguro de que quieres cancelar esta cita?"
    );
    if (!confirmado) return;

    try {
      // 1) Primero, liberamos el horario: disponible = true
      if (horarioId) {
        const refHorario = doc(db, "horarios", horarioId);
        await updateDoc(refHorario, { disponible: true });
      }

      // 2) Luego, eliminamos la cita de la colección "citas"
      await deleteDoc(doc(db, "citas", citaId));

      // 3) Actualizamos el estado local para que la UI se refresque
      setCitas((prev) => prev.filter((cita) => cita.id !== citaId));

      alert("Cita cancelada correctamente.");
    } catch (error) {
      console.error("Error al cancelar la cita o liberar el horario:", error);
      alert("No se pudo cancelar la cita. Por favor, intenta de nuevo.");
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

  // —— Estilos del menú lateral (sin cambios), + estilos generales —— 
  const estilos = {
    pageContainer: {
      display: "flex",
      minHeight: "100vh"
    },
    sidebar: {
      width: "220px",
      backgroundColor: "#2b6cb0",
      color: "white",
      padding: "1rem",
      boxShadow: "2px 0 5px rgba(0,0,0,0.2)",
    },
    logoSidebar: {
      height: "50px",
      marginBottom: "1rem",
      cursor: "pointer"
    },
    botonMenu: {
      backgroundColor: "transparent",
      border: "none",
      color: "white",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      width: "100%",
      textAlign: "left",
      fontSize: "1rem",
      transition: "background-color 0.3s"
    },
    botonActivo: {
      backgroundColor: "#1e40af",
      fontWeight: "bold"
    },
    // Capa A: main con imagen de fondo que ocupa todo el espacio restante
    mainConFondo: {
      flexGrow: 1,
      backgroundImage: `url(${fondoClinica})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      display: "flex",
      justifyContent: "center",
      padding: "2rem"
    },
    // Capa B: contenedor interior blanco semitransparente
    contenedorBlanco: {
      width: "100%",
      maxWidth: "600px",
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      overflow: "hidden"
    },
    headerBlanco: {
      backgroundColor: "#2b6cb0",
      color: "white",
      padding: "1rem",
      textAlign: "center",
      fontSize: "1.5rem"
    },
    contenido: {
      padding: "2rem"
    },
    tituloSeccion: {
      marginBottom: "1rem",
      color: "black"
    },
    inputStyle: {
      padding: "0.5rem",
      borderRadius: "5px",
      border: "1px solid #ccc"
    },
    botonGuardar: {
      backgroundColor: "#2b6cb0",
      color: "white",
      border: "none",
      padding: "0.75rem",
      borderRadius: "4px",
      cursor: "pointer",
      marginTop: "1rem",
      alignSelf: "flex-start"
    },
    tarjetaCita: {
      border: "1px solid #ccc",
      marginBottom: "1rem",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      backgroundColor: "white",
      position: "relative",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    botonCancelar: {
      backgroundColor: "#e53e3e",
      color: "white",
      border: "none",
      padding: "0.5rem 1rem",
      borderRadius: "4px",
      cursor: "pointer",
      position: "absolute",
      right: "1rem",
      bottom: "1rem",
      fontWeight: "500",
      transition: "background-color 0.2s, transform 0.1s"
    },
    botonCancelarHover: {
      backgroundColor: "#c53030"
    },
    botonCancelarDisabled: {
      backgroundColor: "#a0aec0",
      color: "#e2e8f0",
      border: "none",
      padding: "0.5rem 1rem",
      borderRadius: "4px",
      cursor: "not-allowed",
      position: "absolute",
      right: "1rem",
      bottom: "1rem"
    }
  };

  return (
    <div style={estilos.pageContainer}>
      {/* ── MENÚ LATERAL ── */}
      <nav style={estilos.sidebar}>
        <Link to="/">
          <img src={logo} alt="Logo Clínica" style={estilos.logoSidebar} />
        </Link>
        <button onClick={() => setVistaActiva("perfil")} style={navBtnStyle}>
          Mi Perfil
        </button>
        <button onClick={() => setVistaActiva("solicitar")} style={navBtnStyle}>
          Solicitar Cita
        </button>
        <button onClick={() => setVistaActiva("citas")} style={navBtnStyle}>
          Mis Citas
        </button>
      </nav>

      {/* ── Capa A: MAIN con fondo de clínica ── */}
      <main style={estilos.mainConFondo}>
        {/* ── Capa B: contenedor blanco semitransparente ── */}
        <div style={estilos.contenedorBlanco}>
          {/* Cabecera azul dentro del contenedor blanco */}
          <header style={estilos.headerBlanco}>Clínica San Sebastián</header>

          {/* Contenido dinámico */}
          <div style={estilos.contenido}>
            {vistaActiva === "perfil" && (
              <form onSubmit={guardarPerfil} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 style={estilos.tituloSeccion}>Mi Perfil de Paciente</h2>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label htmlFor="nombre">Nombre:</label>
                  <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={datos.nombre}
                    onChange={manejarCambio}
                    required
                    style={estilos.inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label htmlFor="cedula">Cédula:</label>
                  <input
                    id="cedula"
                    type="text"
                    name="cedula"
                    value={datos.cedula}
                    onChange={manejarCambio}
                    required
                    style={estilos.inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label htmlFor="telefono">Teléfono:</label>
                  <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    value={datos.telefono}
                    onChange={manejarCambio}
                    required
                    style={estilos.inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label htmlFor="direccion">Dirección:</label>
                  <input
                    id="direccion"
                    type="text"
                    name="direccion"
                    value={datos.direccion}
                    onChange={manejarCambio}
                    required
                    style={estilos.inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label htmlFor="genero">Género:</label>
                  <input
                    id="genero"
                    type="text"
                    name="genero"
                    value={datos.genero}
                    onChange={manejarCambio}
                    required
                    style={estilos.inputStyle}
                  />
                </div>

                <button type="submit" style={estilos.botonGuardar}>
                  Guardar Cambios
                </button>
              </form>
            )}

            {vistaActiva === "solicitar" && (
              <>
                <h2 style={estilos.tituloSeccion}>Solicitar Cita</h2>
                <SolicitarCita />
              </>
            )}

            {vistaActiva === "citas" && (
              <>
                <h2 style={estilos.tituloSeccion}>Mis Citas</h2>
                {citas.length === 0 ? (
                  <p>No tienes citas registradas.</p>
                ) : (
                  <ul style={{ paddingLeft: 0 }}>
                    {citas.map((cita) => (
                      <li key={cita.id} style={estilos.tarjetaCita}>
                        <p>
                          <strong>Especialidad:</strong> {cita.especialidad}
                        </p>
                        <p>
                          <strong>Doctor:</strong> {cita.nombreMedico}
                        </p>
                        <p>
                          <strong>Fecha:</strong> {cita.fecha}
                        </p>
                        <p>
                          <strong>Estado:</strong> {cita.estado}
                        </p>

                        <button
                          style={{
                            ...(cita.estado === "pendiente" ||
                            cita.estado === "confirmada"
                              ? {
                                  ...estilos.botonCancelar,
                                  ...(hoverCancel === cita.id
                                    ? estilos.botonCancelarHover
                                    : {})
                                }
                              : estilos.botonCancelarDisabled)
                          }}
                          onClick={() => cancelarCita(cita.id, cita.horarioId)}
                          disabled={
                            !(
                              cita.estado === "pendiente" ||
                              cita.estado === "confirmada"
                            )
                          }
                          onMouseEnter={() => setHoverCancel(cita.id)}
                          onMouseLeave={() => setHoverCancel(null)}
                        >
                          Cancelar Cita
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PacientePerfil;

