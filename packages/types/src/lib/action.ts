import { ValidatorProviderParamsOpts } from '@zerodev/sdk';
import { ECDSAValidatorParams } from '@zerodev/sdk/dist/types/kernel-zerodev/validator/ecdsa-validator';
import { ObjectId } from 'bson';
import { AccessList, Address, Chain, Hex, Transport } from 'viem';
import {
  IFallbackViemTransport,
  IFallbackViemTransportToTransport,
  IViemChain,
  IViemChainToChain,
  IViemTransport,
  IViemTransportToTransport,
} from './types';

export interface IAction {
  id: ObjectId;
  type: string;
}

export interface FetchActionBase {
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
  data?: Hex;
  gasPrice?: bigint | number | string;
  maxFeePerGas?: bigint | number | string;
  maxPriorityFeePerGas?: bigint | number | string;
  nonce?: number;
  value?: bigint | number | string;
}

export interface UserOperation {
  /* the target of the call */
  target: Address;
  /* the data passed to the target */
  data: Hex;
  /* the amount of native token to send to the target (default: 0) */
  value?: bigint | number | string;
}

export interface IFetchActionViemTransaction extends FetchActionBase {
  type: 'fetch-viem';
  chain: IViemChain;
  transport: IViemTransport | IFallbackViemTransport;
  ignoreGas?: boolean;
}

export class FetchActionViemTransaction implements IAction, FetchActionBase {
  id: ObjectId;
  url: string;
  init?: RequestInit;
  responsePath: string;
  type: 'fetch-viem';
  chain: Chain;
  transport: Transport;
  ignoreGas?: boolean;

  constructor(args: IFetchActionViemTransaction) {
    this.id = new ObjectId();
    this.url = args.url;
    this.init = args.init;
    this.responsePath = args.responsePath;
    this.type = 'fetch-viem';
    this.chain = IViemChainToChain(args.chain);
    if (args.transport.type !== 'fallback') {
      this.transport = IViemTransportToTransport(args.transport);
    } else {
      this.transport = IFallbackViemTransportToTransport(args.transport);
    }
    this.ignoreGas = args.ignoreGas;
  }
}

export interface IViemTransactionAction extends ViemTransaction {
  type: 'viem';
  chain: IViemChain;
  transport: IViemTransport | IFallbackViemTransport;
  ignoreGas?: boolean;
}

export class ViemTransactionAction implements IAction, ViemTransaction {
  id: ObjectId;
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

  constructor(args: IViemTransactionAction) {
    this.id = new ObjectId();
    this.to = args.to;
    this.accessList = args.accessList;
    this.data = args.data;
    this.gasPrice = args.gasPrice;
    this.maxFeePerGas = args.maxFeePerGas;
    this.maxPriorityFeePerGas = args.maxPriorityFeePerGas;
    this.nonce = args.nonce;
    this.value = args.value;
    this.type = 'viem';
    this.chain = IViemChainToChain(args.chain);
    if (args.transport.type !== 'fallback') {
      this.transport = IViemTransportToTransport(args.transport);
    } else {
      this.transport = IFallbackViemTransportToTransport(args.transport);
    }
    this.ignoreGas = args.ignoreGas;
  }
}

export interface IFetchActionZeroDevUserOperation extends FetchActionBase {
  type: 'fetch-zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
}

export class FetchActionZeroDevUserOperation
  implements IAction, FetchActionBase
{
  id: ObjectId;
  url: string;
  init?: RequestInit;
  responsePath: string;
  type: 'fetch-zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;

  constructor(args: IFetchActionZeroDevUserOperation) {
    this.id = new ObjectId();
    this.url = args.url;
    this.init = args.init;
    this.responsePath = args.responsePath;
    this.type = 'fetch-zerodev';
    this.projectId = args.projectId;
    this.opts = args.opts;
  }
}

export interface IZeroDevUserOperationAction {
  type: 'zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
  userOp: UserOperation | UserOperation[];
}

export class ZeroDevUserOperationAction implements IAction {
  id: ObjectId;
  type: 'zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
  userOp: UserOperation | UserOperation[];

  constructor(args: IZeroDevUserOperationAction) {
    this.id = new ObjectId();
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
