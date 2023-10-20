import { ConditionMonitorBase } from '@lit-listener-sdk//circuit-base';
import {
  ICondition,
  ViemContractCondition,
  WebhookCondition,
} from '@lit-listener-sdk//types';
import { createPublicClient } from 'viem';

export class ConditionMonitorViem extends ConditionMonitorBase {
  protected unwatchContract: (() => void) | undefined;
  constructor() {
    super();
    this.on('stop', () => {
      if (this.unwatchContract) this.unwatchContract();
    });
  }
  override createCondition = async (condition: ICondition) => {
    if (condition instanceof WebhookCondition) {
      await this.startMonitoringWebHook(condition);
    } else if (condition instanceof ViemContractCondition) {
      this.unwatchContract = await this.startMonitoringViemContract(condition);
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
      const { contractAddress, abi, transport, eventName, eventArgs } =
        condition;
      const publicClient = createPublicClient({
        transport: transport,
      });
      const unwatch = publicClient.watchContractEvent({
        address: contractAddress,
        abi: abi,
        eventName: eventName,
        args: eventArgs,
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
