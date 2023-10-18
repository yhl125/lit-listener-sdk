/**
 * @enum RunStatus
 * @description Represents the status of the circuit run.
 */
export enum RunStatus {
  EXIT_RUN = 0,
  ACTION_RUN = 1,
  CONTINUE_RUN = 2,
}

export interface IExecutionConstraints {
  conditionMonitorExecutions?: number;
  startDate?: Date;
  endDate?: Date;
  maxLitActionCompletions?: number;
}

export enum LogCategory {
  ERROR = 0,
  RESPONSE = 1,
  CONDITION = 2,
  BROADCAST = 3,
  EXECUTION = 4,
}

export interface ILogEntry {
  category: LogCategory;
  message: string;
  response: string;
  isoDate: string;
}
