import { ValidatorProviderParamsOpts } from '@zerodev/sdk';
import { ECDSAValidatorParams } from '@zerodev/sdk/dist/types/kernel-zerodev/validator/ecdsa-validator';
import { AccessList, Address, Chain, Hex, Transport } from 'viem';

export interface IAction {
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

export interface FetchActionViemTransaction extends FetchActionBase {
  type: 'fetch-viem';
  chain: Chain;
  transport: Transport;
  ignoreGas?: boolean;
}

export interface ViemTransactionAction extends IAction, ViemTransaction {
  type: 'viem';
  chain: Chain;
  transport: Transport;
  ignoreGas?: boolean;
}

export interface FetchActionZeroDevUserOperation extends FetchActionBase {
  type: 'fetch-zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
}

export interface ZeroDevUserOperationAction extends IAction {
  type: 'zerodev';
  projectId: string;
  opts?: ValidatorProviderParamsOpts<ECDSAValidatorParams>;
  userOp: UserOperationCallData | UserOperationCallData[];
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