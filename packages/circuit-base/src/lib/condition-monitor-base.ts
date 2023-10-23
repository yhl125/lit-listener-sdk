import { EventEmitter } from 'events';
import { ICondition, WebhookCondition } from '@lit-listener-sdk/types';
import * as _ from 'lodash';
/**
 * @class ConditionMonitor
 * @description Class that monitors and handles conditions.
 */
export abstract class ConditionMonitorBase extends EventEmitter {
  protected webhookInterval: NodeJS.Timeout | undefined;
  constructor() {
    super();
    this.on('stop', () => {
      if (this.webhookInterval) clearInterval(this.webhookInterval);
    });
  }

  /**
   * @method createCondition
   * @description Accepts a condition and starts monitoring it.
   * @param condition - The condition to monitor.
   */
  createCondition = async (condition: ICondition) => {
    if (condition instanceof WebhookCondition) {
      this.webhookInterval = await this.startMonitoringWebhook(condition);
    }
  };

  /**
   * @method startMonitoringWebhook
   * @description Starts monitoring a webhook condition.
   * @protected
   * @param condition - The webhook condition to monitor.
   * @throws {Error} If an error occurs while retrieving webhook information.
   */
  protected startMonitoringWebhook = async (condition: WebhookCondition) => {
    // Monitor function, encapsulates the logic of querying the webhook and checking the response against the expected value.
    const webhookListener = async () => {
      try {
        const response = await fetch(condition.url, condition.init);
        const json = await response.json();
        const emittedValue = _.get(json, condition.responsePath);

        await this.checkAgainstExpected(condition, emittedValue);
      } catch (error) {
        let message;
        if (error instanceof Error) message = error.message;
        else message = String(error);
        this.emit('conditionError', message, condition);
        throw new Error(`Error in Webhook Action: ${message}`);
      }
    };

    return setInterval(async () => {
      await webhookListener();
    }, condition.interval);
  };

  /**
   * @method checkAgainstExpected
   * @description Checks the emitted value against the expected value and triggers the appropriate callbacks.
   * @protected
   * @param condition - The condition being checked.
   * @param emittedValue - The value emitted by the webhook or contract event.
   * @throws {Error} If an error occurs while running match or unmatch.
   */
  protected checkAgainstExpected = async (
    condition: ICondition,
    emittedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[],
  ) => {
    let match = false;

    if (
      typeof emittedValue === 'number' ||
      typeof emittedValue === 'string' ||
      typeof emittedValue === 'bigint'
    ) {
      match = this.compareValues(
        condition.expectedValue,
        emittedValue,
        condition.matchOperator,
      );
    } else if (
      Array.isArray(condition.expectedValue) &&
      Array.isArray(emittedValue)
    ) {
      if (condition.expectedValue.length !== emittedValue.length) {
        match = false;
      } else {
        match = condition.expectedValue.every((expected, index) => {
          const emitted = emittedValue[index];
          return this.compareValues(expected, emitted, condition.matchOperator);
        });
      }
    } else if (Array.isArray(emittedValue) && emittedValue.length === 1) {
      const emitted = emittedValue[0];
      match = this.compareValues(
        condition.expectedValue,
        emitted,
        condition.matchOperator,
      );
    } else if (
      typeof condition.expectedValue === 'object' &&
      typeof emittedValue === 'object'
    ) {
      _.isEqual(condition.expectedValue, emittedValue);
    }

    try {
      if (match) {
        this.emit('conditionMatched', condition.id, emittedValue);
      } else {
        this.emit('conditionNotMatched', condition.id, emittedValue);
      }
    } catch (error) {
      let message;
      if (error instanceof Error) message = error.message;
      else message = String(error);
      throw new Error(`Error in Checking Against Expected Values: ${message}`);
    }
  };

  /**
   * Compares the emittedValue with the expectedValue based on the operator provided.
   * The operator could be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
   * An error is thrown for any unsupported operator.
   *
   * @param {any} expectedValue - The expected value.
   * @param {any} emittedValue - The value that is being compared against the expected value.
   * @param {string} operator - The operator used for the comparison. It must be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
   * @return {boolean} - True if the condition holds based on the operator, otherwise false.
   * @throws {Error} - If the operator is unsupported.
   */ private compareValues = (
    expectedValue: number | string | bigint | object,
    emittedValue: number | string | bigint | object,
    operator: string,
  ): boolean => {
    this.emit(
      'conditionNotMatched',
      '',
      `emittedValue: ${emittedValue}, expectedValue: ${expectedValue}, operator: ${operator}`,
    );
    if (typeof emittedValue === 'object' || typeof expectedValue === 'object') {
      switch (operator) {
        case '==':
        case '===':
          return _.isEqual(expectedValue, emittedValue);
        case '!=':
        case '!==':
          return !_.isEqual(expectedValue, emittedValue);
        default:
          return false;
      }
    } else if (
      typeof emittedValue === 'bigint' ||
      typeof expectedValue === 'bigint'
    ) {
      switch (operator) {
        case '<':
          return BigInt(emittedValue) < BigInt(expectedValue);
        case '>':
          return BigInt(emittedValue) > BigInt(expectedValue);
        case '==':
          return BigInt(emittedValue) == BigInt(expectedValue);
        case '===':
          return BigInt(emittedValue) === BigInt(expectedValue);
        case '!==':
          return BigInt(emittedValue) !== BigInt(expectedValue);
        case '!=':
          return BigInt(emittedValue) != BigInt(expectedValue);
        case '>=':
          return BigInt(emittedValue) >= BigInt(expectedValue);
        case '<=':
          return BigInt(emittedValue) <= BigInt(expectedValue);
        default:
          return false;
      }
    } else if (
      typeof emittedValue === 'number' ||
      typeof expectedValue === 'number'
    ) {
      switch (operator) {
        case '<':
          return +emittedValue < +expectedValue;
        case '>':
          return +emittedValue > +expectedValue;
        case '==':
          return +emittedValue == +expectedValue;
        case '===':
          return +emittedValue === +expectedValue;
        case '!==':
          return +emittedValue !== +expectedValue;
        case '!=':
          return +emittedValue != +expectedValue;
        case '>=':
          return +emittedValue >= +expectedValue;
        case '<=':
          return +emittedValue <= +expectedValue;
        default:
          return false;
      }
    } else {
      switch (operator) {
        case '<':
          return emittedValue < expectedValue;
        case '>':
          return emittedValue > expectedValue;
        case '==':
          return emittedValue == expectedValue;
        case '===':
          return emittedValue === expectedValue;
        case '!==':
          return emittedValue !== expectedValue;
        case '!=':
          return emittedValue != expectedValue;
        case '>=':
          return emittedValue >= expectedValue;
        case '<=':
          return emittedValue <= expectedValue;
        default:
          return false;
      }
    }
  };
}
