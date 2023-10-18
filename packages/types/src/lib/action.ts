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
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  value?: bigint;
}

export interface FetchActionViemTransaction extends FetchActionBase {
  type: 'fetch-viem';
  chain: Chain;
  transport: Transport;
}

export interface ViemTransactionAction extends IAction, ViemTransaction {
  type: 'viem';
  chain: Chain;
  transport: Transport;
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
