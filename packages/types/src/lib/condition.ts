import { Abi, Transport } from 'viem';

export interface ICondition {
  id: string;
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  /**
   * emittedValue matchOperator expectedValue
   */
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
}

export interface IWebhookCondition extends ICondition {
  url: string;
  init?: RequestInit;
  responsePath: string;
  // in milliseconds
  interval: number;
}

export class WebhookCondition implements IWebhookCondition {
  readonly id: string;
  url: string;
  init?: RequestInit;
  responsePath: string;
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
  interval: number;

  constructor(args: {
    url: string;
    init?: RequestInit;
    responsePath: string;
    expectedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[];
    /**
     * emittedValue matchOperator expectedValue
     */
    matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
    /**
     * milliseconds
     */
    interval: number;
  }) {
    this.id = crypto.randomUUID();
    this.url = args.url;
    this.init = args.init;
    this.responsePath = args.responsePath;
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    this.interval = args.interval;
  }
}

export interface IViemContractCondition extends ICondition {
  abi: Abi;
  transport: Transport;
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
  contractAddress?: `0x${string}`;
  eventName?: string;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
}

export class ViemContractCondition implements IViemContractCondition {
  readonly id: string;
  abi: Abi;
  transport: Transport;
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
  contractAddress?: `0x${string}`;
  eventName?: string;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;

  constructor(args: {
    abi: Abi;
    transport: Transport;
    expectedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[];
    /**
     * emittedValue matchOperator expectedValue
     */
    matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
    contractAddress?: `0x${string}`;
    eventName?: string;
    eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
  }) {
    this.id = crypto.randomUUID();
    this.abi = args.abi;
    this.transport = args.transport;
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    this.contractAddress = args.contractAddress;
    this.eventName = args.eventName;
    this.eventArgs = args.eventArgs;
  }
}
