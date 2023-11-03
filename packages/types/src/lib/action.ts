import { ValidatorProviderParamsOpts } from '@zerodev/sdk';
import { ECDSAValidatorParams } from '@zerodev/sdk/dist/types/kernel-zerodev/validator/ecdsa-validator';
import ObjectID from 'bson-objectid';
import { AccessList, Address, Chain, Hex, Transport } from 'viem';

export interface IAction {
  id: ObjectID;
  type: string;
}

export interface FetchActionBase extends IAction {
  /**
   * The base URL of the API endpoint.
   */
  url: string;
  /**
   * Optional init for fetch.
   */
  init?: RequestInit;
  /**
   * The path to access the expected value in the response body.
   */
  responsePath: string;
}

export interface ViemTransaction {
  to: Address;
  accessList?: AccessList;
  chain?: Chain;
  data?: Hex;
  gasPrice?: bigint | number | string;
  maxFeePerGas?: bigint | number | string;
  maxPriorityFeePerGas?: bigint | number | string;
  nonce?: number;
  value?: bigint | number | string;
}

export interface UserOperationCallData {
  /* the target of the call */
  target: Address;
  /* the data passed to the target */
  data: Hex;
  /* the amount of native token to send to the target (default: 0) */
  value?: bigint;
}

export class FetchActionViemTransaction implements FetchActionBase {
  id: ObjectID;
  url: string;
  init?: RequestInit;
  responsePath: string;
  type: 'fetch-viem';
  chain: Chain;
  transport: Transport;
  ignoreGas?: boolean;

  constructor(args: {
    url: string;
    init?: RequestInit;
    responsePath: string;
    chain: Chain;
    transport: Transport;
    ignoreGas?: boolean;
  }) {
    this.id = ObjectID();
    this.url = args.url;
    this.init = args.init;
    this.responsePath = args.responsePath;
    this.type = 'fetch-viem';
    this.chain = args.chain;
    this.transport = args.transport;
    this.ignoreGas = args.ignoreGas;
  }
}

export class ViemTransactionAction implements IAction, ViemTransaction {
  id: ObjectID;
  to: Address;
  accessList?: AccessList;
  data?: Hex;
  gasPrice?: bigint | number | string;
  maxFeePerGas?: bigint | number | string;
  maxPriorityFeePerGas?: bigint | number | string;
  nonce?: number;
  value?: bigint | number | string;
  type: 'viem';
  chain: Chain;
  transport: Transport;
  ignoreGas?: boolean;

  constructor(args: {
    to: Address;
    chain: Chain;
    transport: Transport;
    accessList?: AccessList;
    data?: Hex;
    gasPrice?: bigint | number | string;
    maxFeePerGas?: bigint | number | string;
    maxPriorityFeePerGas?: bigint | number | string;
    nonce?: number;
    value?: bigint | number | string;
    ignoreGas?: boolean;
  }) {
    this.id = ObjectID();
    this.to = args.to;
    this.accessList = args.accessList;
    this.data = args.data;
    this.gasPrice = args.gasPrice;
    this.maxFeePerGas = args.maxFeePerGas;
    this.maxPriorityFeePerGas = args.maxPriorityFeePerGas;
    this.nonce = args.nonce;
    this.value = args.value;
    this.type = 'viem';
    this.chain = args.chain;
    this.transport = args.transport;
    this.ignoreGas = args.ignoreGas;
  }
}

export class FetchActionZeroDevUserOperation implements FetchActionBase {
  id: ObjectID;
  url: string;
  init?: RequestInit;
  responsePath: string;
  type: 'fetch-zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;

  constructor(args: {
    url: string;
    responsePath: string;
    projectId: string;
    init?: RequestInit;
    opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
  }) {
    this.id = ObjectID();
    this.url = args.url;
    this.init = args.init;
    this.responsePath = args.responsePath;
    this.type = 'fetch-zerodev';
    this.projectId = args.projectId;
    this.opts = args.opts;
  }
}

export class ZeroDevUserOperationAction implements IAction {
  id: ObjectID;
  type: 'zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
  userOp: UserOperationCallData | UserOperationCallData[];

  constructor(args: {
    projectId: string;
    opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
    userOp: UserOperationCallData | UserOperationCallData[];
  }) {
    this.id = ObjectID();
    this.type = 'zerodev';
    this.projectId = args.projectId;
    this.opts = args.opts;
    this.userOp = args.userOp;
  }
}

export function isFetchActionViemTransaction(
  action: IAction,
): action is FetchActionViemTransaction {
  return action.type === 'fetch-viem';
}

export function isViemTransactionAction(
  action: IAction,
): action is ViemTransactionAction {
  return action.type === 'viem';
}

export function isFetchActionZeroDevUserOperation(
  action: IAction,
): action is FetchActionZeroDevUserOperation {
  return action.type === 'fetch-zerodev';
}

export function isZeroDevUserOperationAction(
  action: IAction,
): action is ZeroDevUserOperationAction {
  return action.type === 'zerodev';
}
