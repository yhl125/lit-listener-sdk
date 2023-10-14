import { Abi, Transport } from 'viem';

export interface ICondition {
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
  id?: string;
  sdkOnMatched?: () => Promise<void>;
  sdkOnUnMatched?: () => Promise<void>;

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
  ) {}
}

export interface IViemContractCondition extends ICondition {
  contractAddress: `0x${string}`;
  abi: Abi;
  transport: Transport;
  eventName: string;
  eventArgName: string[];
  expectedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
  matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
}

export class ViemContractCondition implements IViemContractCondition {
  id?: string;
  sdkOnMatched?: () => Promise<void>;
  sdkOnUnMatched?: () => Promise<void>;

  constructor(
    public contractAddress: `0x${string}`,
    public abi: Abi,
    public transport: Transport,
    public eventName: string,
    public eventArgName: string[],
    public expectedValue:
      | number
      | string
      | bigint
      | object
      | (string | number | bigint | object)[],
    public matchOperator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=',
  ) {}
}
