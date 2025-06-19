import streamlit as st
from supabase import create_client

SUPABASE_URL = st.secrets["supabase"]["url"]
SUPABASE_KEY = st.secrets["supabase"]["key"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FILTER_KEYS = ["selected_proy", "selected_modulo", "selected_grupo"]

def save_filters_to_supabase(user_email, selected_proy, selected_modulo, selected_grupo):
    data = {
        "user_email": user_email,
        "selected_proy": selected_proy,
        "selected_modulo": selected_modulo,
        "selected_grupo": selected_grupo,
    }
    supabase.table("user_filters").upsert(data, on_conflict=["user_email"]).execute()

def load_filters_from_supabase(user_email, proy_options, modulo_options, grupo_options):
    resp = supabase.table("user_filters").select("*").eq("user_email", user_email).execute()
    if resp.data and len(resp.data) > 0:
        row = resp.data[0]
        selected_proy = row.get("selected_proy") or (proy_options[0] if proy_options else "Todos")
        selected_modulo = row.get("selected_modulo") or (modulo_options[0] if modulo_options else "Todos")
        selected_grupo = row.get("selected_grupo") or (grupo_options[0] if grupo_options else "Todos")
    else:
        selected_proy = proy_options[0] if proy_options else "Todos"
        selected_modulo = modulo_options[0] if modulo_options else "Todos"
        selected_grupo = grupo_options[0] if grupo_options else "Todos"
    return selected_proy, selected_modulo, selected_grupo

# --- TEMPORAL: Session state only ---
def save_filters(selected_proy, selected_modulo, selected_grupo):
    st.session_state["selected_proy"] = selected_proy
    st.session_state["selected_modulo"] = selected_modulo
    st.session_state["selected_grupo"] = selected_grupo

def load_filters(proy_options, modulo_options, grupo_options):
    selected_proy = st.session_state.get("selected_proy", proy_options[0] if proy_options else "Todos")
    selected_modulo = st.session_state.get("selected_modulo", modulo_options[0] if modulo_options else "Todos")
    selected_grupo = st.session_state.get("selected_grupo", grupo_options[0] if grupo_options else "Todos")
    return selected_proy, selected_modulo, selected_grupo

# --- FUTURE: Supabase integration ---
# def save_filters_to_supabase(user_id, selected_proy, selected_modulo, selected_grupo):
#     ...
# def load_filters_from_supabase(user_id, proy_options, modulo_options, grupo_options):
#     ... 