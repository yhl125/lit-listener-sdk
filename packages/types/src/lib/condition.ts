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
  id: string;

  constructor(
    public baseUrl: string,
    public endpoint: string,
    public responsePath: string,
    public expectedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[],
    public matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=',
    public apiKey?: string,
  ) {
    this.id = crypto.randomUUID();
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
  id: string;

  constructor(
    public abi: Abi,
    public transport: Transport,
    public expectedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[],
    public matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=',
    public contractAddress?: `0x${string}`,
    public eventName?: string,
    public eventArgs?: readonly unknown[] | Record<string, unknown> | undefined,
  ) {
    this.id = crypto.randomUUID();
  }
}
