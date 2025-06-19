# --- RESOURCE CONFIGURATION ---

# Developer configuration for different groups
DEVELOPERS_CONFIG_GRID = {
    "Fabricio Sánchez": {"level": "SENIOR", "max_tasks": 15, "color": "#FF6B6B"},
    "Oscar Castellanos": {"level": "SENIOR", "max_tasks": 15, "color": "#4ECDC4"},
    "Gabriel Huamani": {"level": "SENIOR", "max_tasks": 15, "color": "#45B7D1"},
    "Luiggi Gonzales": {"level": "SENIOR", "max_tasks": 15, "color": "#96CEB4"},
    "Norman Tinco": {"level": "SENIOR", "max_tasks": 4, "color": "#FFEAA7"},
    "senior6": {"level": "SENIOR", "max_tasks": 15, "color": "#DDA0DD"},
    "senior7": {"level": "SENIOR", "max_tasks": 15, "color": "#98D8C8"},
}

DEVELOPERS_CONFIG_FSM = {
    "FSM1": {"level": "SENIOR", "max_tasks": 15, "color": "#9370DB"},
    "FSM2": {"level": "SENIOR", "max_tasks": 15, "color": "#32CD32"},
}

DEVELOPERS_CONFIG_C4E = {
    "c4e1": {"level": "SENIOR", "max_tasks": 15, "color": "#FF6347"},
}

DEVELOPERS_CONFIG_ERP = {
    "Luis Ore": {"level": "SENIOR", "max_tasks": 6, "color": "#FF4500"},
    "Angel Burga": {"level": "SENIOR", "max_tasks": 15, "color": "#1E90FF"},
    "Richard Galán": {"level": "SEMI_SENIOR", "max_tasks": 12, "color": "#32CD32"},
    "Cesar Rivero": {"level": "SENIOR", "max_tasks": 7, "color": "#27AE60"},
}

DEVELOPERS_CONFIG_LOC = {
    "Jhonatan Colina": {"level": "PLENO", "max_tasks": 6, "color": "#FF7F50"},
    "Jose Aguilar": {"level": "PLENO", "max_tasks": 12, "color": "#20B2AA"},
}

DEVELOPERS_CONFIG_PORTAL = {
    "Jhonatan Colina": {"level": "PLENO", "max_tasks": 6, "color": "#FF7F50"},
    "Jorge Clemente": {"level": "JUNIOR", "max_tasks": 8, "color": "#FFB347"},
    "Jose Urbina": {"level": "JUNIOR", "max_tasks": 8, "color": "#87CEEB"},
}

DEVELOPERS_CONFIG_HCM = {
    "Cesar Rivero": {"level": "SENIOR", "max_tasks": 7, "color": "#27AE60"},
    "Katheryn Quiroz": {"level": "SEMI_SENIOR", "max_tasks": 12, "color": "#E91E63"},
}

OTHER_DEVELOPERS_CONFIG = {
    "junior1": {"level": "JUNIOR", "max_tasks": 10, "color": "#FF9999"},
    "pleno1": {"level": "PLENO", "max_tasks": 12, "color": "#99CCFF"},
    "senior1": {"level": "SENIOR", "max_tasks": 15, "color": "#99FF99"},
}

# Combine all developer configurations into a single dictionary
DEVELOPERS_CONFIG = {
    **DEVELOPERS_CONFIG_GRID,
    **DEVELOPERS_CONFIG_FSM,
    **DEVELOPERS_CONFIG_C4E,
    **DEVELOPERS_CONFIG_ERP,
    **DEVELOPERS_CONFIG_LOC,
    **DEVELOPERS_CONFIG_PORTAL,
    **DEVELOPERS_CONFIG_HCM,
    **OTHER_DEVELOPERS_CONFIG,
}

# Mapping of group names to their specific configurations
GROUP_CONFIG_MAPPING = {
    "GRID": DEVELOPERS_CONFIG_GRID,
    "FSM": DEVELOPERS_CONFIG_FSM,
    "C4E": DEVELOPERS_CONFIG_C4E,
    "ERP": DEVELOPERS_CONFIG_ERP,
    "LOC": DEVELOPERS_CONFIG_LOC,
    "PORTAL": DEVELOPERS_CONFIG_PORTAL,
    "HCM": DEVELOPERS_CONFIG_HCM,
}

# --- ACTION REQUIRED! ---
# Define tester configuration here (QA team)
TESTERS_CONFIG_GENERAL = {
    "Tester QA 1": {"level": "SENIOR", "max_tasks": 15, "color": "#FF6B6B"},
    "Tester QA 2": {"level": "PLENO", "max_tasks": 12, "color": "#4ECDC4"},
    "Tester QA 3": {"level": "JUNIOR", "max_tasks": 10, "color": "#45B7D1"},
}

# Holiday dates configuration in Peru
PERU_HOLIDAYS = {
    "2025-07-28": "Día de la Independencia del Perú",
    "2025-07-29": "Fiestas Patrias",
    "2025-01-01": "Año Nuevo",
    "2025-05-01": "Día del Trabajador",
    "2025-12-08": "Inmaculada Concepción",
    "2025-12-25": "Navidad",
}


def get_group_config(group_name):
    """
    Get the specific developer configuration for a given group.
    Returns the group-specific config if available, otherwise returns the general config.
    """
    if group_name and group_name.upper() in GROUP_CONFIG_MAPPING:
        return GROUP_CONFIG_MAPPING[group_name.upper()]
    return DEVELOPERS_CONFIG


def get_plan_config(plan_type):
    """
    Returns specific configuration for the selected plan type.
    This allows functions to be generic and reusable.
    """
    if plan_type == "Plan de Desarrollo":
        return {
            "resource_col": "abap_asignado",
            "hours_col": "plan_abap_dev_time",
            "available_date_col": "esfu_disponible",
            "plan_date_col": "plan_abap_dev_ini",
            "start_date_col": "real_abap_dev_ini",
            "end_date_col": "plan_abap_dev_fin",
            "resource_config": DEVELOPERS_CONFIG,
            "resource_title": "Developer",
            "resources_title": "Developers",
            "assigned_title": "Assigned ABAPs",
            "use_group_based_assignment": True,  # Enable group-based assignment
        }
    elif plan_type == "Plan de Pruebas":
        return {
            "resource_col": "abap_asignado",
            "hours_col": "plan_abap_pu_time",
            "available_date_col": "available_test_date",
            "plan_date_col": "plan_abap_pu_ini",
            "start_date_col": "real_abap_pu_ini",
            "end_date_col": "plan_abap_pu_fin",
            "resource_config": TESTERS_CONFIG_GENERAL,
            "resource_title": "Tester",
            "resources_title": "Testers",
            "assigned_title": "Assigned Testers",
            "use_group_based_assignment": False,  # Testers don't use group-based assignment
        }
    # More plans can be added here (e.g., "Plan de Integración")
    return {} 