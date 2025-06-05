// src/pages/Login.js

import React from "react";
import { loginConGoogle } from "../services/authService";
import { useNavigate } from "react-router-dom";
import logo from "../logoclinica.jpg";
import fondoClinica from "../fondoPaginaWeb.jpg"; // Asegúrate de ajustar la ruta si procede

function Login() {
  const navigate = useNavigate();

  const manejarLogin = async () => {
    try {
      const { rol } = await loginConGoogle();
      if (rol === "Administrador" || rol === "admin") {
        navigate("/Administrador");
      } else {
        navigate("/paciente");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  // Estilos
  const estilos = {
    pageContainer: {
      // Ocupa toda la pantalla y muestra la imagen de fondo
      backgroundImage: `url(${fondoClinica})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      backgroundColor: "#2b6cb0",
      color: "white",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },
    logo: {
      position: "absolute",
      left: "1rem",
      height: "50px",
    },
    titulo: {
      margin: 0,
      fontSize: "1.5rem",
    },
    // Asegura que el area debajo del header llene el resto de la pantalla
    mainWrapper: {
      flexGrow: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
    },
    // Contenedor blanco semitransparente que contiene solo Bienvenido + botón
    contenedorBlanco: {
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: "8px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "2rem",
      textAlign: "center",
    },
    subtitulo: {
      fontSize: "1.75rem",
      color: "black",
      marginBottom: "1.5rem",
    },
    boton: {
      backgroundColor: "#2b6cb0",
      color: "white",
      border: "none",
      padding: "0.8rem 1.5rem",
      fontSize: "1rem",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    botonHover: {
      backgroundColor: "#1e40af",
    },
  };

  // Manejo de hover para el botón (opcional)
  const [hover, setHover] = React.useState(false);

  return (
    <div style={estilos.pageContainer}>
      {/* Barra azul superior (header) */}
      <header style={estilos.header}>
        <img src={logo} alt="Logo Clínica" style={estilos.logo} />
        <h1 style={estilos.titulo}>Clínica San Sebastián</h1>
      </header>

      {/* Área principal, centrada, con el fondo de clínica detrás */}
      <div style={estilos.mainWrapper}>
        <div style={estilos.contenedorBlanco}>
          <h2 style={estilos.subtitulo}>Bienvenido</h2>
          <button
            onClick={manejarLogin}
            style={{
              ...estilos.boton,
              ...(hover ? estilos.botonHover : {}),
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Iniciar sesión con Google 🌐
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;


