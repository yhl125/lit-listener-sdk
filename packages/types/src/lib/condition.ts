import { Abi, Transport } from 'viem';

export interface ICondition {
  id: string;
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
}

export interface IWebhookCondition extends ICondition {
  baseUrl: string;
  endpoint: string;
  responsePath: string;
  apiKey?: string;
}

export class WebhookCondition implements IWebhookCondition {
  readonly id: string;
  baseUrl: string;
  endpoint: string;
  responsePath: string;
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
  apiKey?: string;

  constructor(args: {
    baseUrl: string;
    endpoint: string;
    responsePath: string;
    expectedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[];
    matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
    apiKey?: string;
  }) {
    this.id = crypto.randomUUID();
    this.baseUrl = args.baseUrl;
    this.endpoint = args.endpoint;
    this.responsePath = args.responsePath;
    this.expectedValue = args.expectedValue;
    this.matchOperator = args.matchOperator;
    this.apiKey = args.apiKey;
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
