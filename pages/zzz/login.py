import streamlit as st
from supabase import create_client
import re

# Configuración de Supabase
SUPABASE_URL = st.secrets["supabase"]["url"]
SUPABASE_KEY = st.secrets["supabase"]["key"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    st.title("Iniciar sesión")

    user = st.session_state.get("user", None)
    if user:
        st.success(f"Bienvenido {user.get('email')}!")
        st.switch_page("pages/planificacion.py")
        return

    tab_login, tab_register = st.tabs(["Iniciar sesión", "Registrarse"])

    with tab_login:
        st.subheader("Acceso de usuario")
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Contraseña", type="password", key="login_password")
        if st.button("Iniciar sesión", key="login_btn"):
            if not email or not password:
                st.error("Por favor, completa todos los campos.")
            else:
                try:
                    resp = supabase.auth.sign_in_with_password({"email": email, "password": password})
                    user_data = resp.user
                    if user_data:
                        st.session_state["user"] = {"email": user_data.email}
                        st.success("¡Login exitoso! Redirigiendo...")
                        st.switch_page("pages/planificacion.py")
                    else:
                        st.error("Email o contraseña incorrectos.")
                except Exception as e:
                    st.error("Email o contraseña incorrectos.")

    with tab_register:
        st.subheader("Crear nueva cuenta")
        reg_email = st.text_input("Email", key="reg_email")
        reg_password = st.text_input("Contraseña", type="password", key="reg_password")
        reg_password2 = st.text_input("Repite la contraseña", type="password", key="reg_password2")
        if st.button("Registrarse", key="register_btn"):
            if not reg_email or not reg_password or not reg_password2:
                st.error("Por favor, completa todos los campos.")
            elif reg_password != reg_password2:
                st.error("Las contraseñas no coinciden.")
            elif not re.match(r"[^@]+@[^@]+\.[^@]+", reg_email):
                st.error("Email no válido.")
            elif len(reg_password) < 6:
                st.error("La contraseña debe tener al menos 6 caracteres.")
            else:
                try:
                    resp = supabase.auth.sign_up({"email": reg_email, "password": reg_password})
                    user_data = resp.user
                    if user_data:
                        st.success("Usuario registrado. Revisa tu correo para confirmar la cuenta y luego inicia sesión.")
                    else:
                        st.error("No se pudo registrar el usuario. ¿Ya existe?")
                except Exception as e:
                    st.error("No se pudo registrar el usuario. ¿Ya existe?")

if __name__ == "__main__":
    main() 