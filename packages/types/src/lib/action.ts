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
