import streamlit as st
from supabase import create_client

SUPABASE_URL = st.secrets["supabase"]["url"]
SUPABASE_KEY = st.secrets["supabase"]["key"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def login_with_google():
    if "user" not in st.session_state:
        st.session_state["user"] = None
        st.session_state["access_token"] = None

    # Si ya está logueado
    if st.session_state["user"] is not None:
        return st.session_state["user"], st.session_state["access_token"]

    # Si no está logueado, muestra el botón de login
    login_url = supabase.auth.sign_in_with_oauth({"provider": "google"}).url
    st.markdown(f"[Iniciar sesión con Google]({login_url})", unsafe_allow_html=True)
    st.stop()


def set_user_from_callback(user, access_token):
    st.session_state["user"] = user
    st.session_state["access_token"] = access_token 