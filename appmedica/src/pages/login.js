import { loginConGoogle } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const manejarLogin = async () => {
    try {
      const { rol } = await loginConGoogle();
      if (rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/paciente");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20vh" }}>
      <h1>App Médica</h1>
      <button onClick={manejarLogin}>Iniciar sesión con Google</button>
    </div>
  );
}

export default Login;