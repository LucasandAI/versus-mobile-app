export interface AuthorizationQueryOptions {
  all: string[];
  read: string[];
  write: string[];
}

export interface SingleQueryOptions {
  sampleName: string;
  startDate: string;
  endDate: string;
  limit?: number;
  unit?: string;
}

export interface QueryOutput<T> {
  countReturn: number;
  resultData: T[];
}

export type HealthKitAuthorizationStatus = 'authorized' | 'denied' | 'notDetermined' | 'notAvailable';

export interface AuthStatusResult {
  [key: string]: { read: HealthKitAuthorizationStatus; write: HealthKitAuthorizationStatus; } | HealthKitAuthorizationStatus;
}

export interface CapacitorHealthkitPlugin {
  /**
   * Checks if HealthKit is available on the device
   * @returns Promise<{ value: boolean }> - Resolves to true if HealthKit is available
   */
  isAvailable(): Promise<{ value: boolean }>;
  
  requestAuthorization(options: AuthorizationQueryOptions): Promise<AuthStatusResult>;
  
  queryHKitSampleType<T = any>(options: SingleQueryOptions): Promise<QueryOutput<T>>;
  
  multipleQueryHKitSampleType<T = any>(options: SingleQueryOptions): Promise<QueryOutput<T>[]>;
  
  checkAuthStatus(options: { types: string[] }): Promise<{ status: AuthStatusResult }>;
  
  isAuthorized?(options: { type: string }): Promise<{ authorized: boolean }>;
  
  isMultipleTypesAuthorized?(options: { types: string[] }): Promise<{ allAuthorized: boolean }>;
}

export const CapacitorHealthkit: CapacitorHealthkitPlugin;

export enum SampleNames {
  STEP_COUNT = "stepCount",
  FLIGHTS_CLIMBED = "flightsClimbed",
  APPLE_EXERCISE_TIME = "appleExerciseTime",
  ACTIVE_ENERGY_BURNED = "activeEnergyBurned",
  BASAL_ENERGY_BURNED = "basalEnergyBurned",
  DISTANCE_WALKING_RUNNING = "distanceWalkingRunning",
  DISTANCE_CYCLING = "distanceCycling",
  BLOOD_GLUCOSE = "bloodGlucose",
  SLEEP_ANALYSIS = "sleepAnalysis",
  WORKOUT_TYPE = "workoutType",
  WEIGHT = "weight",
  HEART_RATE = "heartRate",
  RESTING_HEART_RATE = "restingHeartRate",
  RESPIRATORY_RATE = "respiratoryRate",
  BODY_FAT = "bodyFat",
  OXYGEN_SATURATION = "oxygenSaturation",
  BASAL_BODY_TEMPERATURE = "basalBodyTemperature",
  BODY_TEMPERATURE = "bodyTemperature",
  BLOOD_PRESSURE_SYSTOLIC = "bloodPressureSystolic",
  BLOOD_PRESSURE_DIASTOLIC = "bloodPressureDiastolic"
}
