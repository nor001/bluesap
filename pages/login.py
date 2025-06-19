import streamlit as st
from utils.supabase_auth import login_with_google

def main():
    st.title("Iniciar sesión")
    user, access_token = login_with_google()
    st.success(f"Logueado como: {user['email']}")
    st.write("Ahora puedes ir a la página de planificación.")
    st.page_link("pages/planificacion.py", label="Ir a planificación", icon="📅")

if __name__ == "__main__":
    main() 