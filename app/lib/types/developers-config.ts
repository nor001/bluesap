/**
 * Centralized Developers Configuration
 * 
 * This file contains all developer configurations as constants.
 * To change a developer config, update it here and it will be reflected throughout the application.
 * 
 * @ai-function Provides centralized developer configuration management
 * @ai-returns Object with all developer configurations
 */

export interface ResourceConfig {
  level: 'JUNIOR' | 'PLENO' | 'SEMI_SENIOR' | 'SENIOR';
  max_tasks: number;
}

// Developer configurations by group
export const DEVELOPERS_CONFIG = {
  GRID: {
    'Fabricio Sánchez': { level: 'SENIOR', max_tasks: 15 },
    'Oscar Castellanos': { level: 'SENIOR', max_tasks: 15 },
    'Gabriel Huamani': { level: 'SENIOR', max_tasks: 15 },
    'Luiggi Gonzales': { level: 'SENIOR', max_tasks: 15 },
    'Norman Tinco': { level: 'SENIOR', max_tasks: 4 },
    'Angel Burga': { level: 'SENIOR', max_tasks: 15 },
    'Oscar De Lama': { level: 'SENIOR', max_tasks: 15 },
  },
  
  FSM: {
    FSM1: { level: 'SENIOR', max_tasks: 15 },
    FSM2: { level: 'SENIOR', max_tasks: 15 },
  },
  
  C4E: {
    C4E1: { level: 'SENIOR', max_tasks: 15 },
  },
  
  ERP: {
    'Luis Ore': { level: 'SENIOR', max_tasks: 6 },
    'Angel Burga': { level: 'SENIOR', max_tasks: 15 },
    'Richard Galán': { level: 'SEMI_SENIOR', max_tasks: 12 },
    'Cesar Rivero': { level: 'SENIOR', max_tasks: 7 },
  },
  
  LOC: {
    'Jhonatan Colina': { level: 'PLENO', max_tasks: 6 },
    'Jose Aguilar': { level: 'PLENO', max_tasks: 12 },
  },
  
  PORTAL: {
    'Jhonatan Colina': { level: 'PLENO', max_tasks: 6 },
    'Jorge Clemente': { level: 'JUNIOR', max_tasks: 8 },
    'Jose Urbina': { level: 'JUNIOR', max_tasks: 8 },
  },
  
  HCM: {
    'Cesar Rivero': { level: 'SENIOR', max_tasks: 7 },
    'Katheryn Quiroz': { level: 'SEMI_SENIOR', max_tasks: 12 },
  },
} as const;

// Testers configuration
export const TESTERS_CONFIG: Record<string, ResourceConfig> = {
  'Tester QA 1': { level: 'SENIOR', max_tasks: 15 },
  'Tester QA 2': { level: 'PLENO', max_tasks: 12 },
  'Tester QA 3': { level: 'JUNIOR', max_tasks: 10 },
};

// Group mapping for easy access
export const GROUP_CONFIG_MAPPING: Record<string, Record<string, ResourceConfig>> = {
  GRID: DEVELOPERS_CONFIG.GRID,
  FSM: DEVELOPERS_CONFIG.FSM,
  C4E: DEVELOPERS_CONFIG.C4E,
  ERP: DEVELOPERS_CONFIG.ERP,
  LOC: DEVELOPERS_CONFIG.LOC,
  PORTAL: DEVELOPERS_CONFIG.PORTAL,
  HCM: DEVELOPERS_CONFIG.HCM,
};

// Helper functions
export function getGroupConfig(groupName: string): Record<string, ResourceConfig> {
  if (!groupName) {
    return getAllDevelopersConfig();
  }

  const groupNameUpper = groupName.toUpperCase();
  if (groupNameUpper in GROUP_CONFIG_MAPPING) {
    return GROUP_CONFIG_MAPPING[groupNameUpper];
  }

  return getAllDevelopersConfig();
}

export function getAllDevelopersConfig(): Record<string, ResourceConfig> {
  const allConfig: Record<string, ResourceConfig> = {};
  for (const config of Object.values(GROUP_CONFIG_MAPPING)) {
    Object.assign(allConfig, config);
  }
  return allConfig;
}

export function validateDeveloperConfig(): boolean {
  try {
    // Validate resource configurations
    for (const [groupName, config] of Object.entries(GROUP_CONFIG_MAPPING)) {
      for (const [name, details] of Object.entries(config)) {
        if (!details.level || !details.max_tasks) {
          throw new Error(`Invalid resource config for ${name} in ${groupName}`);
        }
      }
    }

    // Validate testers configuration
    for (const [name, details] of Object.entries(TESTERS_CONFIG)) {
      if (!details.level || !details.max_tasks) {
        throw new Error(`Invalid tester config for ${name}`);
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Configuration validation failed: ${error}`);
  }
} 