import { Abi, Address, Transport } from 'viem';
import { AbiEvent } from 'abitype';

export interface ICondition {
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
  contractAddress?: Address;
  eventName?: string;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
  batch: boolean;
  pollingInterval?: number;
}

export class ViemContractCondition implements IViemContractCondition {
  abi: Abi;
  transport: Transport;
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
  contractAddress?: Address;
  eventName?: string;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
  batch: boolean;
  pollingInterval?: number;

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
    contractAddress?: Address;
    eventName?: string;
    eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
    batch?: boolean;
    pollingInterval?: number;
  }) {
    this.abi = args.abi;
    this.transport = args.transport;
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    this.contractAddress = args.contractAddress;
    this.eventName = args.eventName;
    this.eventArgs = args.eventArgs;
    this.batch = args.batch ?? true;
    this.pollingInterval = args.pollingInterval;
  }
}

export interface IViemEventCondition extends ICondition {
  transport: Transport;
  address?: Address | Address[];
  event?: AbiEvent;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
  batch: boolean;
  pollingInterval?: number;
}

export class ViemEventCondition implements IViemEventCondition {
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
  transport: Transport;
  address?: Address | Address[];
  event?: AbiEvent;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
  batch: boolean;
  pollingInterval?: number;

  constructor(args: {
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
    transport: Transport;
    address?: Address | Address[];
    event?: AbiEvent;
    eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
    batch?: boolean;
    pollingInterval?: number;
  }) {
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    this.transport = args.transport;
    this.address = args.address;
    this.event = args.event;
    this.eventArgs = args.eventArgs;
    this.batch = args.batch ?? true;
    this.pollingInterval = args.pollingInterval;
  }
}
