import { PlanConfig, ResourceConfig, ConfigError } from './types';

export class AppConfig {
  // Application settings
  static APP_NAME = 'SAP Gestion';
  static APP_VERSION = '2.0.0';
  static DEBUG = process.env.NODE_ENV === 'development';

  // Security settings
  static MAX_FILE_SIZE_MB = 50;
  static ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];
  static SESSION_TIMEOUT_MINUTES = 60;

  // Resource configurations with validation
  static DEVELOPERS_CONFIG_GRID: Record<string, ResourceConfig> = {
    'Fabricio Sánchez': { level: 'SENIOR', max_tasks: 15 },
    'Oscar Castellanos': { level: 'SENIOR', max_tasks: 15 },
    'Gabriel Huamani': { level: 'SENIOR', max_tasks: 15 },
    'Luiggi Gonzales': { level: 'SENIOR', max_tasks: 15 },
    'Norman Tinco': { level: 'SENIOR', max_tasks: 4 },
    'Angel Burga': { level: 'SENIOR', max_tasks: 15 },
    'Oscar De Lama': { level: 'SENIOR', max_tasks: 15 },
  };

  static DEVELOPERS_CONFIG_FSM: Record<string, ResourceConfig> = {
    FSM1: { level: 'SENIOR', max_tasks: 15 },
    FSM2: { level: 'SENIOR', max_tasks: 15 },
  };

  static DEVELOPERS_CONFIG_C4E: Record<string, ResourceConfig> = {
    C4E1: { level: 'SENIOR', max_tasks: 15 },
  };

  static DEVELOPERS_CONFIG_ERP: Record<string, ResourceConfig> = {
    'Luis Ore': { level: 'SENIOR', max_tasks: 6 },
    'Angel Burga': { level: 'SENIOR', max_tasks: 15 },
    'Richard Galán': { level: 'SEMI_SENIOR', max_tasks: 12 },
    'Cesar Rivero': { level: 'SENIOR', max_tasks: 7 },
  };

  static DEVELOPERS_CONFIG_LOC: Record<string, ResourceConfig> = {
    'Jhonatan Colina': { level: 'PLENO', max_tasks: 6 },
    'Jose Aguilar': { level: 'PLENO', max_tasks: 12 },
  };

  static DEVELOPERS_CONFIG_PORTAL: Record<string, ResourceConfig> = {
    'Jhonatan Colina': { level: 'PLENO', max_tasks: 6 },
    'Jorge Clemente': { level: 'JUNIOR', max_tasks: 8 },
    'Jose Urbina': { level: 'JUNIOR', max_tasks: 8 },
  };

  static DEVELOPERS_CONFIG_HCM: Record<string, ResourceConfig> = {
    'Cesar Rivero': { level: 'SENIOR', max_tasks: 7 },
    'Katheryn Quiroz': { level: 'SEMI_SENIOR', max_tasks: 12 },
  };

  static TESTERS_CONFIG: Record<string, ResourceConfig> = {
    'Tester QA 1': { level: 'SENIOR', max_tasks: 15 },
    'Tester QA 2': { level: 'PLENO', max_tasks: 12 },
    'Tester QA 3': { level: 'JUNIOR', max_tasks: 10 },
  };

  // Group mapping
  static GROUP_CONFIG_MAPPING: Record<string, Record<string, ResourceConfig>> =
    {
      GRID: AppConfig.DEVELOPERS_CONFIG_GRID,
      FSM: AppConfig.DEVELOPERS_CONFIG_FSM,
      C4E: AppConfig.DEVELOPERS_CONFIG_C4E,
      ERP: AppConfig.DEVELOPERS_CONFIG_ERP,
      LOC: AppConfig.DEVELOPERS_CONFIG_LOC,
      PORTAL: AppConfig.DEVELOPERS_CONFIG_PORTAL,
      HCM: AppConfig.DEVELOPERS_CONFIG_HCM,
    };

  // Holiday configuration
  static PERU_HOLIDAYS: Record<string, string> = {
    '2025-07-28': 'Día de la Independencia del Perú',
    '2025-07-29': 'Fiestas Patrias',
    '2025-01-01': 'Año Nuevo',
    '2025-05-01': 'Día del Trabajador',
    '2025-12-08': 'Inmaculada Concepción',
    '2025-12-25': 'Navidad',
  };

  static getPlanConfig(planType: string): PlanConfig {
    if (planType === 'Plan de Desarrollo') {
      return {
        resource_col: 'abap_asignado',
        hours_col: 'plan_abap_dev_time',
        available_date_col: 'esfu_disponible',
        plan_date_col: 'plan_abap_dev_ini',
        start_date_col: 'Fecha Inicio Plan',
        end_date_col: 'Fecha Fin Plan',
        resource_title: 'Developer',
        resources_title: 'Developers',
        assigned_title: 'Assigned ABAPs',
        use_group_based_assignment: true,
      };
    } else if (planType === 'Plan de Mantenimiento') {
      return {
        resource_col: 'abap_asignado',
        hours_col: 'plan_abap_dev_time',
        available_date_col: 'esfu_disponible',
        plan_date_col: 'plan_abap_dev_ini',
        start_date_col: 'Fecha Inicio Plan',
        end_date_col: 'Fecha Fin Plan',
        resource_title: 'Developer',
        resources_title: 'Developers',
        assigned_title: 'Assigned ABAPs',
        use_group_based_assignment: true,
      };
    } else if (planType === 'Plan de Soporte') {
      return {
        resource_col: 'abap_asignado',
        hours_col: 'plan_abap_dev_time',
        available_date_col: 'esfu_disponible',
        plan_date_col: 'plan_abap_dev_ini',
        start_date_col: 'Fecha Inicio Plan',
        end_date_col: 'Fecha Fin Plan',
        resource_title: 'Developer',
        resources_title: 'Developers',
        assigned_title: 'Assigned ABAPs',
        use_group_based_assignment: true,
      };
    } else if (planType === 'Plan de Pruebas') {
      return {
        resource_col: 'abap_asignado',
        hours_col: 'plan_abap_pu_time',
        available_date_col: 'available_test_date',
        plan_date_col: 'plan_abap_pu_ini',
        start_date_col: 'pu_ini',
        end_date_col: 'Fecha Fin Real',
        resource_title: 'Tester',
        resources_title: 'Testers',
        assigned_title: 'Assigned Testers',
        use_group_based_assignment: false,
      };
    } else {
      throw new ConfigError(`Unknown plan type: ${planType}`);
    }
  }

  static getGroupConfig(groupName: string): Record<string, ResourceConfig> {
    if (!groupName) {
      return AppConfig.getAllDevelopersConfig();
    }

    const groupNameUpper = groupName.toUpperCase();
    if (groupNameUpper in AppConfig.GROUP_CONFIG_MAPPING) {
      return AppConfig.GROUP_CONFIG_MAPPING[groupNameUpper];
    }

    return AppConfig.getAllDevelopersConfig();
  }

  static getAllDevelopersConfig(): Record<string, ResourceConfig> {
    const allConfig: Record<string, ResourceConfig> = {};
    for (const config of Object.values(AppConfig.GROUP_CONFIG_MAPPING)) {
      Object.assign(allConfig, config);
    }
    return allConfig;
  }

  static validateConfig(): boolean {
    try {
      // Validate resource configurations
      for (const [groupName, config] of Object.entries(
        AppConfig.GROUP_CONFIG_MAPPING
      )) {
        for (const [name, details] of Object.entries(config)) {
          if (!details.level || !details.max_tasks) {
            throw new ConfigError(
              `Invalid resource config for ${name} in ${groupName}`
            );
          }
        }
      }

      // Validate testers configuration
      for (const [name, details] of Object.entries(AppConfig.TESTERS_CONFIG)) {
        if (!details.level || !details.max_tasks) {
          throw new ConfigError(`Invalid tester config for ${name}`);
        }
      }

      return true;
    } catch (error) {
      throw new ConfigError(`Configuration validation failed: ${error}`);
    }
  }
}
