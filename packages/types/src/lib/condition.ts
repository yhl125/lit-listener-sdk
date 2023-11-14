import { Abi, Address, Transport } from 'viem';
import { AbiEvent } from 'abitype';
import { ObjectId } from 'bson';
import {
  IViemTransport,
  IFallbackViemTransport,
  IViemTransportToTransport,
  IFallbackViemTransportToTransport,
} from './types';

interface IConditionWithoutId {
  type: string;
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

export interface ICondition extends IConditionWithoutId {
  id: ObjectId;
}

export interface IWebhookCondition extends IConditionWithoutId {
  id?: ObjectId;
  type: 'webhook';
  url: string;
  init?: RequestInit;
  responsePath: string;
  // in milliseconds
  interval: number;
}

export class WebhookCondition implements IWebhookCondition, ICondition {
  type: 'webhook';
  id: ObjectId;
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

  constructor(args: IWebhookCondition) {
    this.type = 'webhook';
    if (args.id) this.id = args.id;
    else this.id = new ObjectId();
    this.url = args.url;
    this.init = args.init;
    this.responsePath = args.responsePath;
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    this.interval = args.interval;
  }
}

export interface IViemContractCondition extends IConditionWithoutId {
  id?: ObjectId;
  type: 'viem-contract';
  abi: Abi;
  transport: IViemTransport | IFallbackViemTransport;
  contractAddress?: Address;
  eventName?: string;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
  batch?: boolean;
  pollingInterval?: number;
}

export class ViemContractCondition implements ICondition {
  type: 'viem-contract';
  id: ObjectId;
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

  constructor(args: IViemContractCondition) {
    this.type = 'viem-contract';
    if (args.id) this.id = args.id;
    else this.id = new ObjectId();
    this.abi = args.abi;
    if (args.transport.type !== 'fallback') {
      this.transport = IViemTransportToTransport(args.transport);
    } else {
      this.transport = IFallbackViemTransportToTransport(args.transport);
    }
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    this.contractAddress = args.contractAddress;
    this.eventName = args.eventName;
    this.eventArgs = args.eventArgs;
    this.batch = args.batch ?? true;
    this.pollingInterval = args.pollingInterval;
  }
}

export interface IViemEventCondition extends IConditionWithoutId {
  id?: ObjectId;
  type: 'viem-event';
  transport: IViemTransport | IFallbackViemTransport;
  address?: Address | Address[];
  event?: AbiEvent;
  eventArgs?: readonly unknown[] | Record<string, unknown> | undefined;
  batch: boolean;
  pollingInterval?: number;
}

export class ViemEventCondition implements ICondition {
  type: 'viem-event';
  id: ObjectId;
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

  constructor(args: IViemEventCondition) {
    this.type = 'viem-event';
    if (args.id) this.id = args.id;
    else this.id = new ObjectId();
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    if (args.transport.type !== 'fallback') {
      this.transport = IViemTransportToTransport(args.transport);
    } else {
      this.transport = IFallbackViemTransportToTransport(args.transport);
    }
    this.address = args.address;
    this.event = args.event;
    this.eventArgs = args.eventArgs;
    this.batch = args.batch ?? true;
    this.pollingInterval = args.pollingInterval;
  }
}
