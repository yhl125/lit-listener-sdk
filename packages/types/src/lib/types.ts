import { ObjectId } from 'bson';
import {
  Chain,
  FallbackTransportConfig,
  HttpTransportConfig,
  Transport,
  WebSocketTransportConfig,
  defineChain,
  fallback,
  http,
  webSocket,
} from 'viem';
import * as chains from 'viem/chains';
import {
  ChainConstants,
} from 'viem/types/chain';

/**
 * @enum RunStatus
 * @description Represents the status of the circuit run.
 */
export enum RunStatus {
  EXIT_RUN = 0,
  ACTION_RUN = 1,
  CONTINUE_RUN = 2,
}

export interface IExecutionConstraints {
  conditionMonitorExecutions?: number;
  startDate?: Date;
  endDate?: Date;
  maxLitActionCompletions?: number;
}

interface ILog {
  isoDate: string;
}

export interface ICircuitLog extends ILog {
  status: 'started' | 'action complete' | 'stop' | 'error';
  message: string;
}

export interface IConditionLog extends ILog {
  conditionId: ObjectId;
  status: 'matched' | 'not matched' | 'error';
  emittedValue:
    | number
    | string
    | bigint
    | object
    | (string | number | bigint | object)[];
}

export interface ITransactionLog extends ILog {
  actionId: ObjectId;
  transactionHash: string;
}

export interface IUserOperationLog extends ILog {
  actionId: ObjectId;
  userOperationHash: string;
}

export interface ICheckWhenConditionMetLog extends ILog {
  status: 'action' | 'continue' | 'exit' | 'exit after action';
}

export interface IViemChain {
  chainId: number;
  customChain: boolean;
  // customChain only fields
  chainConstants?: ChainConstants;
}

export function IViemChainToChain(chain: IViemChain): Chain {
  if (!chain.customChain) {
    return getChain(chain.chainId);
  } else {
    if (!chain.chainConstants)
      throw new Error('chainConstants is required for customChain');
    return defineChain(chain.chainConstants);
  }
}

function getChain(chainId: number) {
  for (const chain of Object.values(chains)) {
    if ('id' in chain) {
      if (chain.id === chainId) {
        return chain;
      }
    }
  }
  throw new Error(`Chain with id ${chainId} not found`);
}

export interface IViemTransport {
  type: 'http' | 'webSocket';
  url?: string;
  httpTransportConfig?: HttpTransportConfig;
  webSocketTransportConfig?: WebSocketTransportConfig;
}

export interface IFallbackViemTransport {
  type: 'fallback';
  viemTransports: IViemTransport[];
  fallbackTransportConfig: FallbackTransportConfig;
}

export function IViemTransportToTransport(
  transport: IViemTransport,
): Transport {
  if (transport.type === 'http') {
    return http(transport.url, transport.httpTransportConfig);
  } else {
    return webSocket(transport.url, transport.webSocketTransportConfig);
  }
}

export function IFallbackViemTransportToTransport(
  transport: IFallbackViemTransport,
): Transport {
  const viemTransports = transport.viemTransports.map((t) =>
    IViemTransportToTransport(t),
  );
  return fallback(viemTransports, transport.fallbackTransportConfig);
}
