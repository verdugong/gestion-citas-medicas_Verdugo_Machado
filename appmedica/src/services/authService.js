import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function loginConGoogle() {
  const resultado = await signInWithPopup(auth, provider);
  const user = resultado.user;

  const refUsuario = doc(db, "usuarios", user.uid);
  const docSnap = await getDoc(refUsuario);

  if (!docSnap.exists()) {
    await setDoc(refUsuario, {
      nombre: user.displayName,
      email: user.email,
      rol: "paciente"
    });
  }

  const datos = (await getDoc(refUsuario)).data();
  return { user, rol: datos.rol };
}
