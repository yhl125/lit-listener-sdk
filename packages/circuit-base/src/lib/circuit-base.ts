import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { EventEmitter } from 'events';
import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import {
  IAction,
  ICondition,
  IConditionalLogic,
  IExecutionConstraints,
  ILogEntry,
  LogCategory,
  RunStatus,
} from '@lit-listener-sdk/types';
import { ConditionMonitorBase } from './condition-monitor-base';

export abstract class CircuitBase extends EventEmitter {
  /**
   * Boolean for locking start into one concurrent run.
   * @private
   */
  private isRunning: boolean = false;
  /**
   * Boolean for setting a secure key for the Lit Action.
   * @private
   */
  private useSecureKey: boolean = false;
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
  private satisfiedConditions: Set<string> = new Set();
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
   * The array of log messages.
   * @private
   */
  private logs: ILogEntry[] = [];
  /**
   * The current index of the log array.
   * @private
   */
  private logIndex = 0;
  /**
   * The LitNodeClient instance for interacting with Lit Protocol.
   * @private
   */
  private litClient: LitJsSdk.LitNodeClient;
  /**
   * The secure key inputted by the developer.
   * @private
   */
  private secureKey?: string;
  /**
   * The public key of the PKP.
   * @protected
   */
  protected pkpPubKey: string;
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
   * Flag indicating if the action helper function has been set.
   * @private
   */
  private hasSetActionHelperFunction = false;
  /**
   * Flag indicating whether to continue running the circuit.
   * @private
   */
  private continueRun: boolean = true;
  /**
   * The EventEmitter instance for handling events.
   * @private
   */
  private emitter = new EventEmitter();
  /**
   * Flag indicating whether to strict error throwing is enabled.
   * @protected
   */
  protected errorHandlingModeStrict: boolean = false;

  /**
   * Creates an instance of Circuit.
   * @param pkpContractAddress The address of the PKPNFT contract.
   * @param errorHandlingModeStrict Strict error handling enabled or not.
   */
  constructor(args: {
    monitor: ConditionMonitorBase;
    errorHandlingModeStrict: boolean;
    litNetwork: LIT_NETWORKS_KEYS;
    pkpPubKey: string;
    conditions: ICondition[];
    conditionalLogic: IConditionalLogic;
    options: IExecutionConstraints;
    actions: IAction[];
    authSig?: AuthSig;
    sessionSigs?: SessionSigs;
    secureKey?: string;
  }) {
    if (!args.authSig && !args.sessionSigs) {
      throw new Error(
        'Either authSig or sessionSigs must be provided to create a circuit.',
      );
    }
    super();
    this.errorHandlingModeStrict = args.errorHandlingModeStrict;
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
    if (args.secureKey) {
      this.secureKey = args.secureKey;
      this.useSecureKey = true;
    }

    this.conditions = args.conditions;
    this.conditionalLogic = args.conditionalLogic;
    this.conditionMonitorExecutions = args.options.conditionMonitorExecutions;
    this.startDate = args.options.startDate;
    this.endDate = args.options.endDate;
    this.maxLitActionCompletions = args.options.maxLitActionCompletions;
    this.actions = args.actions;

    this.monitor = args.monitor;
    this.monitor.on(
      'conditionMatched',
      (
        conditionId: string,
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
        this.log(
          LogCategory.CONDITION,
          `Condition Matched with Emitted Value: `,
          JSON.stringify(emittedValue),
          new Date().toISOString(),
        );
      },
    );
    this.monitor.on(
      'conditionNotMatched',
      (
        conditionId: string,
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
        this.log(
          LogCategory.CONDITION,
          `Condition Not Matched with Emitted Value: `,
          JSON.stringify(emittedValue),
          new Date().toISOString(),
        );
      },
    );
    this.monitor.on(
      'conditionError',
      (error: string, condition: ICondition) => {
        this.log(
          LogCategory.ERROR,
          `Error in condition monitoring with condition ${condition.id}`,
          error,
          new Date().toISOString(),
        );
      },
    );
    this.emitter.on('stop', () => {
      this.continueRun = false;
    });
  }

  /**
   * Starts the circuit with the specified parameters.
   * @param publicKey The public key of the PKP contract.
   * @param ipfsCID The IPFS CID of the Lit Action code.
   * @param authSig Optional. The authentication signature for executing Lit Actions.
   * @param secureKey Optional. The secureKey required to run the LitAction if set during setActions.
   * @throws {Error} If an error occurs while running the circuit.
   */
  start = async (): Promise<void> => {
    if (this.isRunning) {
      throw new Error('Circuit is already running');
    }

    this.isRunning = true;
    try {
      if (this.actions.length > 0) {
        // connect lit client
        await this.connectLit();

        while (this.continueRun) {
          const monitors: NodeJS.Timeout[] = [];
          const conditionPromises: Promise<void>[] = [];
          if (this.conditions.length > 0) {
            for (const condition of this.conditions) {
              const conditionPromise = this.monitor.createCondition(
                condition,
                this.errorHandlingModeStrict,
              );

              if (this.conditionalLogic.interval) {
                const timeoutPromise = new Promise<void>((resolve) =>
                  setTimeout(resolve, this.conditionalLogic.interval),
                );
                conditionPromises.push(
                  Promise.race([conditionPromise, timeoutPromise]).then(() => {
                    return Promise.resolve();
                  }),
                );
                const monitor = setTimeout(async () => {
                  await conditionPromise;
                }, this.conditionalLogic.interval);
                monitors.push(monitor);
              } else {
                conditionPromises.push(conditionPromise);
              }
            }

            if (!this.continueRun) break;

            await Promise.all(conditionPromises);
          } else {
            this.log(
              LogCategory.CONDITION,
              'No conditions set, skipping condition checks.',
              '',
              new Date().toISOString(),
            );
          }
          const conditionResBefore = this.checkConditionalLogicAndRun();
          const executionResBefore = this.checkExecutionLimitations();

          this.conditionExecutedCount++;
          this.log(
            LogCategory.EXECUTION,
            'Condition Monitor Count Increased',
            String(this.conditionExecutedCount),
            new Date().toISOString(),
          );
          if (
            conditionResBefore === RunStatus.ACTION_RUN &&
            executionResBefore === RunStatus.ACTION_RUN
          ) {
            await this.runActions();
            const executionResAfter = this.checkExecutionLimitations();
            if (executionResAfter === RunStatus.EXIT_RUN) {
              this.log(
                LogCategory.CONDITION,
                `Execution Condition Not Met to Continue Circuit.`,
                `Run Status ${RunStatus.EXIT_RUN}`,
                new Date().toISOString(),
              );
              this.emitter.emit('stop');
              break;
            }
          } else if (
            conditionResBefore === RunStatus.EXIT_RUN ||
            executionResBefore === RunStatus.EXIT_RUN
          ) {
            this.log(
              LogCategory.CONDITION,
              `Execution Condition Not Met to Continue Circuit.`,
              `Run Status ${RunStatus.EXIT_RUN}`,
              new Date().toISOString(),
            );
            this.emitter.emit('stop');
            break;
          }

          if (!this.continueRun) break;

          if (this.conditionalLogic.interval) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.conditionalLogic.interval),
            );
          }

          monitors.forEach((monitor) => clearTimeout(monitor));

          // check again in case of CONTINUE_RUN status
          const conditionResEnd = this.checkConditionalLogicAndRun();
          const executionResEnd = this.checkExecutionLimitations();
          if (
            conditionResEnd === RunStatus.EXIT_RUN ||
            executionResEnd === RunStatus.EXIT_RUN
          ) {
            this.log(
              LogCategory.CONDITION,
              `Execution Condition Not Met to Continue Circuit.`,
              `Run Status ${RunStatus.EXIT_RUN}`,
              new Date().toISOString(),
            );
            this.emitter.emit('stop');
            break;
          }
        }
      } else if (this.actions.length < 1) {
        throw new Error(`Actions have not been set. Run setActions() first.`);
      }
    } catch (error) {
      let message;
      if (error instanceof Error) message = error.message;
      else message = String(error);
      throw new Error(`Error running circuit: ${message}`);
    } finally {
      this.isRunning = false;
    }
  };

  abstract runActions(): Promise<void>;

  /**
   * Returns the logs of the circuit. 1000 logs are recorded on a rolling basis.
   * @param category - Optional. Returns logs of a specific type i.e. error, response, condition. If no category is passed then all logs are returned.
   * @returns The logs of the circuit.
   */
  getLogs = (category?: LogCategory): ILogEntry[] => {
    const logsInOrder = [
      ...this.logs.slice(this.logIndex),
      ...this.logs.slice(0, this.logIndex),
    ].filter((log) => log !== undefined);

    if (!category) {
      return logsInOrder;
    }

    return logsInOrder.filter((log) => log.category === category);
  };

  /**
   * Forcefully interrupts the circuit.
   */
  interrupt = () => {
    this.emitter.emit('stop');
    this.log(
      LogCategory.ERROR,
      'Circuit forcefully interrupted at ',
      `${Date.now()}`,
      new Date().toISOString(),
    );
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

        case 'TARGET':
          if (
            this.conditionalLogic.targetCondition &&
            this.satisfiedConditions.has(this.conditionalLogic.targetCondition)
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

  /**
   * Logs a message.
   * @param category - The type of message to log.
   * @param message - The message to log.
   * @param message - The response object to log.
   * @param message - The iso date to log.
   */
  protected log = (
    category: LogCategory,
    message: string,
    response: string,
    isoDate: string,
  ) => {
    this.logs[this.logIndex] = { category, message, response, isoDate };
    this.logIndex = this.logIndex + 1;
    this.emit(
      'log',
      JSON.stringify({
        message,
        response,
        isoDate,
      }),
    );
  };
}
