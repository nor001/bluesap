import streamlit as st
from supabase import create_client
from utils.supabase_auth import SUPABASE_URL, SUPABASE_KEY

def main():
    st.title("Iniciar sesión")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Detectar el código en la URL
    code = st.query_params.get("code")
    if code and "user" not in st.session_state:
        # 2. Intercambiar el código por el token y el usuario
        response = supabase.auth.exchange_code_for_session(code)
        user = response.user
        access_token = response.session.access_token
        # 3. Guardar en session_state
        st.session_state["user"] = user
        st.session_state["access_token"] = access_token
        st.success(f"Logueado como: {user.email}")
        st.write("Redirigiendo a planificación...")
        st.experimental_rerun()
    elif "user" in st.session_state and st.session_state["user"] is not None:
        user = st.session_state["user"]
        st.success(f"Logueado como: {user.email}")
        st.page_link("pages/planificacion.py", label="Ir a planificación", icon="📅")
    else:
        # Si no está logueado, muestra el botón de login
        login_url = supabase.auth.sign_in_with_oauth({"provider": "google"}).url
        st.markdown(f"[Iniciar sesión con Google]({login_url})", unsafe_allow_html=True)

if __name__ == "__main__":
    main() 