import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { EventEmitter2 } from 'eventemitter2';
import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import ObjectID from 'bson-objectid';

import {
  IAction,
  ICheckWhenConditionMetLog,
  ICircuitLog,
  ICondition,
  IConditionLog,
  IConditionalLogic,
  IExecutionConstraints,
  ITransactionLog,
  RunStatus,
} from '@lit-listener-sdk/types';
import { ConditionMonitorBase } from './condition-monitor-base';

export abstract class CircuitBase extends EventEmitter2 {
  id = ObjectID();
  /**
   * The public key of the PKP.
   */
  pkpPubKey: string;
  /**
   * Boolean for locking start into one concurrent run.
   * @private
   */
  private isRunning: boolean = false;
  /**
   * The array of conditions.
   * @private
   */
  private conditions: ICondition[] = [];
  /**
   * The condition monitor instance.
   * @private
   */
  private monitor: ConditionMonitorBase;
  /**
   * The conditional logic for executing actions.
   * @private
   */
  private conditionalLogic: IConditionalLogic;
  /**
   * Set of condition IDs that have been satisfied.
   * @private
   */
  private satisfiedConditions: Set<ObjectID> = new Set();
  /**
   * The array of actions to be executed.
   * @protected
   */
  protected actions: IAction[] = [];
  /**
   * The count of executed actions.
   * @private
   */
  private conditionExecutedCount: number = 0;
  /**
   * The count of successfully completed actions.
   * @protected
   */
  protected litActionCompletionCount: number = 0;
  /**
   * The maximum number of executions allowed.
   * @private
   */
  private conditionMonitorExecutions?: number;
  /**
   * The start date for executing actions.
   * @private
   */
  private startDate?: Date;
  /**
   * The end date for executing actions.
   * @private
   */
  private endDate?: Date;
  /**
   * The maximum number of successful completions allowed.
   * @private
   */
  private maxLitActionCompletions?: number;
  /**
   * The LitNodeClient instance for interacting with Lit Protocol.
   * @private
   */
  private litClient: LitJsSdk.LitNodeClient;
  /**
   * The authentication signature for executing Lit Actions.
   * @protected
   */
  protected authSig?: AuthSig;
  /**
   * The session signature for executing Lit Actions.
   * @protected
   */
  protected sessionSigs?: SessionSigs;

  /**
   * Creates an instance of Circuit.
   */
  constructor(args: {
    monitor: ConditionMonitorBase;
    litNetwork: LIT_NETWORKS_KEYS;
    pkpPubKey: string;
    conditions: ICondition[];
    conditionalLogic: IConditionalLogic;
    options: IExecutionConstraints;
    actions: IAction[];
    authSig?: AuthSig;
    sessionSigs?: SessionSigs;
  }) {
    if (!args.authSig && !args.sessionSigs) {
      throw new Error(
        'Either authSig or sessionSigs must be provided to create a circuit.',
      );
    }
    super();
    args.litNetwork;
    this.litClient = new LitJsSdk.LitNodeClient({
      litNetwork: args.litNetwork,
      debug: false,
    });
    this.pkpPubKey = args.pkpPubKey;
    if (args.authSig) {
      this.authSig = args.authSig;
    }
    if (args.sessionSigs) {
      this.sessionSigs = args.sessionSigs;
    }

    this.conditions = args.conditions;
    this.conditionalLogic = args.conditionalLogic;
    this.conditionMonitorExecutions = args.options.conditionMonitorExecutions;
    this.startDate = args.options.startDate;
    this.endDate = args.options.endDate;
    this.maxLitActionCompletions = args.options.maxLitActionCompletions;
    if (args.actions.length === 0) {
      throw new Error('Must provide at least one action');
    }
    this.actions = args.actions;

    this.monitor = args.monitor;
    this.monitor.on(
      'conditionMatched',
      async (
        conditionId: ObjectID,
        emittedValue:
          | number
          | string
          | number[]
          | string[]
          | bigint
          | bigint[]
          | object
          | object[]
          | (string | number | bigint | object)[],
      ) => {
        this.satisfiedConditions.add(conditionId);
        this.conditionLog(
          'matched',
          conditionId,
          emittedValue,
          new Date().toISOString(),
        );
        await this.checkWhenConditionMet();
      },
    );
    this.monitor.on(
      'conditionNotMatched',
      (
        conditionId: ObjectID,
        emittedValue:
          | number
          | string
          | number[]
          | string[]
          | bigint
          | bigint[]
          | object
          | object[]
          | (string | number | bigint | object)[],
      ) => {
        this.satisfiedConditions.delete(conditionId);
        this.conditionLog(
          'not matched',
          conditionId,
          emittedValue,
          new Date().toISOString(),
        );
      },
    );
    this.monitor.on(
      'conditionError',
      (conditionId: ObjectID, error: string) => {
        this.conditionLog(
          'error',
          conditionId,
          error,
          new Date().toISOString(),
        );
      },
    );
    this.on('stop', () => {
      this.circuitLogSync('stop', 'Circuit stopped', new Date().toISOString());
      this.isRunning = false;
      this.monitor.removeAllListeners();
      this.removeAllListeners();
    });
  }

  /**
   * Starts the circuit with the specified parameters.
   * @throws {Error} If an error occurs while running the circuit.
   */
  start = async (): Promise<void> => {
    if (this.isRunning) {
      throw new Error('Circuit is already running');
    }
    this.isRunning = true;

    // connect lit client
    await this.connectLit();

    if (this.conditions.length > 0) {
      const conditionPromises: Promise<void>[] = [];
      for (const condition of this.conditions) {
        const conditionPromise = this.monitor.createCondition(condition);

        conditionPromises.push(conditionPromise);
      }
      await Promise.all(conditionPromises);
      this.circuitLog(
        'started',
        'Circuit started with conditions',
        new Date().toISOString(),
      );
    } else {
      this.circuitLog(
        'started',
        'Circuit started without conditions',
        new Date().toISOString(),
      );
      await this.checkWhenConditionMet();
    }
  };

  abstract runActions(): Promise<void>;

  terminate = () => {
    this.circuitLogSync(
      'stop',
      'Circuit forcefully interrupted',
      new Date().toISOString(),
    );
    this.emit('stop');
  };

  updateSessionSigs(sessionSigs: SessionSigs) {
    this.sessionSigs = sessionSigs;
  }

  private checkWhenConditionMet = async (): Promise<void> => {
    const conditionLogicStatus = this.checkConditionalLogicAndRun();
    const executionLimitStatus = this.checkExecutionLimitations();

    this.conditionExecutedCount++;
    if (
      conditionLogicStatus === RunStatus.ACTION_RUN &&
      executionLimitStatus === RunStatus.ACTION_RUN
    ) {
      this.checkWhenConditionMetLog('action', new Date().toISOString());
      await this.runActions();
      const executionLimitStatusAfterRun = this.checkExecutionLimitations();
      if (executionLimitStatusAfterRun === RunStatus.EXIT_RUN) {
        this.checkWhenConditionMetLog(
          'exit after action',
          new Date().toISOString(),
        );
        this.emit('stop');
        return;
      }
    }
    if (
      conditionLogicStatus === RunStatus.EXIT_RUN ||
      executionLimitStatus === RunStatus.EXIT_RUN
    ) {
      this.checkWhenConditionMetLog('exit', new Date().toISOString());
      this.emit('stop');
      return;
    }
    this.checkWhenConditionMetLog('continue', new Date().toISOString());
    return;
  };

  /**
   * Establishes a connection with the LitJsSDK.
   * @throws {Error} If an error occurs while connecting with LitJsSDK.
   */
  private connectLit = async (): Promise<void> => {
    try {
      await this.litClient.connect();
    } catch (error) {
      let message;
      if (error instanceof Error) message = error.message;
      else message = String(error);
      throw new Error(`Error connecting with LitJsSDK: ${message}`);
    }
  };

  /**
   * Checks the execution limitations and returns the run status.
   * @returns The run status.
   */
  private checkExecutionLimitations = (): RunStatus => {
    if (
      this.conditionMonitorExecutions === undefined &&
      this.startDate === undefined &&
      this.endDate === undefined &&
      this.maxLitActionCompletions === undefined
    ) {
      return RunStatus.ACTION_RUN;
    }

    const withinExecutionLimit = this.conditionMonitorExecutions
      ? this.conditionExecutedCount < this.conditionMonitorExecutions
      : true;
    const withinTimeRange =
      this.startDate && this.endDate
        ? new Date() >= this.startDate && new Date() <= this.endDate
        : this.startDate && !this.endDate
        ? new Date() >= this.startDate
        : this.endDate && !this.startDate
        ? new Date() <= this.endDate
        : true;
    const withinSuccessfulCompletions = this.maxLitActionCompletions
      ? this.litActionCompletionCount < this.maxLitActionCompletions
      : true;
    const executionConstraintsMet =
      withinExecutionLimit && withinTimeRange && withinSuccessfulCompletions;

    if (!executionConstraintsMet) {
      return RunStatus.EXIT_RUN;
    } else {
      return RunStatus.ACTION_RUN;
    }
  };

  /**
   * Checks the conditional logic and runs the actions accordingly.
   * @returns The run status.
   */
  private checkConditionalLogicAndRun = (): RunStatus => {
    if (this.conditionalLogic) {
      switch (this.conditionalLogic.type) {
        case 'THRESHOLD':
          if (
            this.conditionalLogic.value &&
            this.satisfiedConditions.size >= this.conditionalLogic.value
          ) {
            return RunStatus.ACTION_RUN;
          } else {
            return RunStatus.CONTINUE_RUN;
          }

        case 'EVERY':
          if (this.satisfiedConditions.size === this.conditions.length) {
            return RunStatus.ACTION_RUN;
          } else {
            return RunStatus.CONTINUE_RUN;
          }
      }
    } else {
      return RunStatus.CONTINUE_RUN;
    }
  };

  protected circuitLog = (
    status: 'started' | 'stop' | 'error',
    message: string,
    isoDate: string,
  ) => {
    const log: ICircuitLog = {
      circuitId: this.id,
      status,
      message,
      isoDate,
    };
    this.emitAsync(`circuitLog`, log);
  };

  private circuitLogSync = (
    status: 'started' | 'stop' | 'error',
    message: string,
    isoDate: string,
  ) => {
    const log: ICircuitLog = {
      circuitId: this.id,
      status,
      message,
      isoDate,
    };
    this.emit(`circuitLog`, log);
  };

  private conditionLog = (
    status: 'matched' | 'not matched' | 'error',
    conditionId: ObjectID,
    emittedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[],
    isoDate: string,
  ) => {
    const log: IConditionLog = {
      circuitId: this.id,
      conditionId,
      status,
      emittedValue,
      isoDate,
    };
    this.emitAsync(`conditionLog`, log);
  };

  private checkWhenConditionMetLog = (
    status: 'action' | 'continue' | 'exit' | 'exit after action',
    isoDate: string,
  ) => {
    const log: ICheckWhenConditionMetLog = {
      circuitId: this.id,
      status,
      isoDate,
    };
    this.emitAsync(`checkWhenConditionMetLog`, log);
  };

  protected transactionLog = (
    actionId: ObjectID,
    transactionHash: string,
    isoDate: string,
  ) => {
    const log: ITransactionLog = {
      circuitId: this.id,
      actionId,
      transactionHash,
      isoDate,
    };
    this.emitAsync(`transactionLog`, log);
  };
}
