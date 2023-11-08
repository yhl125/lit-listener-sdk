import { ObjectId } from 'bson';

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

interface ILog {
  isoDate: string;
}

export interface ICircuitLog extends ILog {
  status: 'started' | 'stop' | 'error';
  message: string;
}

export interface IConditionLog extends ILog {
  conditionId: ObjectId;
  status: 'matched' | 'not matched' | 'error';
  emittedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
}

export interface ITransactionLog extends ILog {
  actionId: ObjectId;
  transactionHash: string;
}

export interface IUserOperationLog extends ILog {
  actionId: ObjectId;
  userOperationHash: string;
}

export interface ICheckWhenConditionMetLog extends ILog {
  status: 'action' | 'continue' | 'exit' | 'exit after action';
}
