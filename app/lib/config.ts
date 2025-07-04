import { ConfigError, PlanConfig, ResourceConfig } from './types';
import { DEVELOPERS_CONFIG, GROUP_CONFIG_MAPPING, TESTERS_CONFIG, getAllDevelopersConfig, getGroupConfig, validateDeveloperConfig } from './types/developers-config';
import { PERU_HOLIDAYS } from './types/holidays';
import { CONFIG_KEYS } from './types/config-keys';
import { BUSINESS_TYPES } from './types/business-types';

export class AppConfig {
  // Application settings
  static APP_NAME = 'SAP Gestion';
  static APP_VERSION = '2.0.0';
  static DEBUG = process.env[CONFIG_KEYS.NODE_ENV] === 'development';

  // Security settings
  static MAX_FILE_SIZE_MB = 50;
  static ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];
  static SESSION_TIMEOUT_MINUTES = 60;

  // Resource configurations (now imported)
  static DEVELOPERS_CONFIG = DEVELOPERS_CONFIG;
  static TESTERS_CONFIG = TESTERS_CONFIG;
  static GROUP_CONFIG_MAPPING = GROUP_CONFIG_MAPPING;

  // Holiday configuration
  static PERU_HOLIDAYS = PERU_HOLIDAYS;

  static getPlanConfig(planType: string): PlanConfig {
    if (planType === BUSINESS_TYPES.DEVELOPMENT_PLAN) {
      return {
        resource_col: 'abapAssigned',
        hours_col: 'abapDevelopmentTime',
        available_date_col: 'effortReadyDate',
        plan_date_col: 'plannedAbapDevStart',
        start_date_col: 'plannedAbapDevStart',
        end_date_col: 'plannedAbapDevEnd',
        resource_title: 'Developer',
        resources_title: 'Developers',
        assigned_title: 'Assigned ABAPs',
        use_group_based_assignment: true,
      };
    } else if (planType === BUSINESS_TYPES.MAINTENANCE_PLAN) {
      return {
        resource_col: 'abapAssigned',
        hours_col: 'abapDevelopmentTime',
        available_date_col: 'effortReadyDate',
        plan_date_col: 'plannedAbapDevStart',
        start_date_col: 'plannedAbapDevStart',
        end_date_col: 'plannedAbapDevEnd',
        resource_title: 'Developer',
        resources_title: 'Developers',
        assigned_title: 'Assigned ABAPs',
        use_group_based_assignment: true,
      };
    } else if (planType === BUSINESS_TYPES.SUPPORT_PLAN) {
      return {
        resource_col: 'abapAssigned',
        hours_col: 'abapDevelopmentTime',
        available_date_col: 'effortReadyDate',
        plan_date_col: 'plannedAbapDevStart',
        start_date_col: 'plannedAbapDevStart',
        end_date_col: 'plannedAbapDevEnd',
        resource_title: 'Developer',
        resources_title: 'Developers',
        assigned_title: 'Assigned ABAPs',
        use_group_based_assignment: true,
      };
    } else if (planType === BUSINESS_TYPES.TESTING_PLAN) {
      return {
        resource_col: 'abapAssigned',
        hours_col: 'abapTestTime',
        available_date_col: 'effortReadyDate',
        plan_date_col: 'plannedAbapDevStart',
        start_date_col: 'plannedAbapDevStart',
        end_date_col: 'plannedAbapDevEnd',
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
    return getGroupConfig(groupName);
  }

  static getAllDevelopersConfig(): Record<string, ResourceConfig> {
    return getAllDevelopersConfig();
  }

  static validateConfig(): boolean {
    return validateDeveloperConfig();
  }
}
