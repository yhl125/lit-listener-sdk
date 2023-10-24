import { ConditionMonitorBase } from '@lit-listener-sdk/circuit-base';
import {
  ICondition,
  ViemContractCondition,
  ViemEventCondition,
  WebhookCondition,
} from '@lit-listener-sdk/types';
import { createPublicClient } from 'viem';

export class ConditionMonitorViem extends ConditionMonitorBase {
  protected unwatchContract: (() => void) | undefined;
  protected unwatchEvent: (() => void) | undefined;
  constructor() {
    super();
    this.on('stop', () => {
      if (this.unwatchContract) this.unwatchContract();
      if (this.unwatchEvent) this.unwatchEvent();
    });
  }
  override createCondition = async (condition: ICondition) => {
    if (condition instanceof WebhookCondition) {
      this.webhookInterval = await this.startMonitoringWebhook(condition);
    } else if (condition instanceof ViemContractCondition) {
      this.unwatchContract = await this.startMonitoringViemContract(condition);
    } else if (condition instanceof ViemEventCondition) {
      this.unwatchEvent = await this.startMonitoringViemEvent(condition);
    }
  };

  /**
   * @method startMonitoringViemContract
   * @description Starts monitoring a contract condition.
   * @private
   * @param condition - The contract condition to monitor.
   * @throws {Error} If an error occurs while processing contract event.
   */
  private startMonitoringViemContract = async (
    condition: ViemContractCondition,
  ) => {
    try {
      const publicClient = createPublicClient({
        transport: condition.transport,
      });
      const unwatch = publicClient.watchContractEvent({
        address: condition.contractAddress,
        abi: condition.abi,
        eventName: condition.eventName,
        args: condition.eventArgs,
        batch: condition.batch,
        pollingInterval: condition.pollingInterval,
        onLogs: async (logs) => {
          const emittedValues = logs.map((log) => {
            return log.data;
          });
          await this.checkAgainstExpected(condition, emittedValues);
        },
      });

      return unwatch;
    } catch (error) {
      let message;
      if (error instanceof Error) message = error.message;
      else message = String(error);
      this.emit('conditionError', message, condition);
      throw new Error(`Error in Contract Action: ${message}`);
    }
  };

  /**
   * @method startMonitoringViemEvent
   * @description Starts monitoring a event condition.
   * @private
   * @param condition - The event condition to monitor.
   * @throws {Error} If an error occurs while processing event condition.
   */
  private startMonitoringViemEvent = async (condition: ViemEventCondition) => {
    try {
      const publicClient = createPublicClient({
        transport: condition.transport,
      });
      const unwatch = publicClient.watchEvent({
        address: condition.address,
        event: condition.event,
        args: condition.eventArgs,
        batch: condition.batch,
        pollingInterval: condition.pollingInterval,
        onLogs: async (logs) => {
          const emittedValues = logs.map((log) => {
            return log.data;
          });
          await this.checkAgainstExpected(condition, emittedValues);
        },
      });

      return unwatch;
    } catch (error) {
      let message;
      if (error instanceof Error) message = error.message;
      else message = String(error);
      this.emit('conditionError', message, condition);
      throw new Error(`Error in Contract Action: ${message}`);
    }
  };
}
