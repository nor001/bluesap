# SAP Project Planning Tool

A comprehensive planning and resource allocation tool for SAP projects, built with Streamlit.

## Features

- **Resource Assignment**: Automatically assign developers and testers to tasks based on availability and capacity
- **Group-Based Assignment**: Assign resources based on development groups (GRID, FSM, C4E, ERP, LOC, PORTAL, HCM)
- **Timeline Visualization**: Interactive Gantt charts showing task timelines
- **Resource Distribution**: Visual representation of resource allocation
- **Conflict Detection**: Identify and resolve scheduling conflicts
- **Holiday Management**: Automatic holiday detection for Peru
- **Export Capabilities**: Download results as CSV files

## Group-Based Assignment

The system now supports assigning developers based on their development groups:

### Available Groups:
- **GRID**: Grid Development Team
- **FSM**: Field Service Management Team
- **C4E**: Cloud for Enterprise Team
- **ERP**: Enterprise Resource Planning Team
- **LOC**: Localization Team
- **PORTAL**: Portal Development Team
- **HCM**: Human Capital Management Team

### How it works:
1. Your CSV file should include a `grupo_dev` column with the group name
2. The system will automatically assign tasks to developers from the corresponding group
3. If no group is specified, general developers will be used
4. Each group has its own set of developers with specific capacities

## CSV File Format

Your CSV file should include the following columns:

### Date Format Support

The system supports multiple date formats:
- **dd.mm.yyyy** (European format) - e.g., 15.01.2025
- **mm.dd.yyyy** (US format) - e.g., 01.15.2025

**Automatic Detection**: The system will automatically detect your date format, but you can also manually select it in the sidebar.

### For Development Plan:
- `PROY`: Project identifier
- `Módulo`: Module name
- `grupo_dev`: Development group (GRID, FSM, C4E, ERP, LOC, PORTAL, HCM)
- `plan_abap_dev_time`: Planned development hours
- `esfu_disponible`: Available effort date
- `plan_abap_dev_ini`: Planned development start date
- `plan_abap_dev_fin`: Planned development end date

### For Testing Plan:
- `PROY`: Project identifier
- `Módulo`: Module name
- `plan_abap_pu_time`: Planned testing hours
- `available_test_date`: Available testing date
- `plan_abap_pu_ini`: Planned testing start date
- `plan_abap_pu_fin`: Planned testing end date

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   streamlit run home.py
   ```

## Usage

1. Upload your CSV file with project data
2. Select the planning type (Development or Testing)
3. Configure filters as needed
4. Click "Assign Developers/Testers" to run the allocation algorithm
5. View results in the different tabs:
   - Resource Distribution
   - Timeline
   - Summary
   - Group Statistics
   - Data

## Configuration

Developer and tester configurations can be modified in `utils/config.py`:

- Adjust maximum tasks per resource
- Add new developers or testers
- Modify group assignments
- Update holiday dates

## Requirements

- Python 3.8+
- Streamlit
- Pandas
- Plotly
- Other dependencies listed in `requirements.txt`