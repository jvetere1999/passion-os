/**
 * API Library Index
 *
 * Central export for all API client modules.
 * Wave 2: Core Productivity APIs added January 7, 2026
 * Wave 3: Fitness, Learning, Market APIs added January 2026
 * Wave 4: Platform Substrate APIs added January 2026
 * REFACTOR: Shared client extraction January 2026
 */

// Shared client - single source of truth for API communication
export * from './client';

// Wave 2: Core Productivity
export * from './reference-tracks';
export * from './focus';
export * from './habits';
export * from './goals';
export * from './quests';

// Wave 3: Fitness, Learning, Market
export * from './exercise';
export * from './books';
export * from './market';
export * from './learn';

// Wave 4: Platform Substrate
export * from './calendar';
export * from './daily-plan';
export * from './feedback';
export * from './ideas';
export * from './infobase';
export * from './onboarding';
export * from './user';