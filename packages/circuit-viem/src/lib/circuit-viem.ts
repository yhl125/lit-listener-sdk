import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import { PKPViemAccount } from 'pkp-viem';
import { createWalletClient } from 'viem';
import * as _ from 'lodash';

import { CircuitBase } from '@lit-listener-sdk/circuit-base';
import {
  ICondition,
  IConditionalLogic,
  IExecutionConstraints,
  FetchActionViemTransaction,
  ViemTransactionAction,
  isViemTransactionAction,
  isFetchActionViemTransaction,
  ViemTransaction,
} from '@lit-listener-sdk/types';
import { ConditionMonitorViem } from './condition-monitor-viem';
import { ObjectId } from 'bson';

export class CircuitViem extends CircuitBase {
  constructor(args: {
    id?: ObjectId;
    litNetwork: LIT_NETWORKS_KEYS;
    pkpPubKey: string;
    conditions: ICondition[];
    conditionalLogic: IConditionalLogic;
    options: IExecutionConstraints;
    actions: (FetchActionViemTransaction | ViemTransactionAction)[];
    authSig?: AuthSig;
    sessionSigs?: SessionSigs;
  }) {
    super({
      id: args.id,
      monitor: new ConditionMonitorViem(),
      litNetwork: args.litNetwork,
      pkpPubKey: args.pkpPubKey,
      conditions: args.conditions,
      conditionalLogic: args.conditionalLogic,
      options: args.options,
      actions: args.actions,
      authSig: args.authSig,
      sessionSigs: args.sessionSigs,
    });
  }

  override async runActions(): Promise<void> {
    const account = new PKPViemAccount({
      controllerAuthSig: this.authSig,
      controllerSessionSigs: this.sessionSigs,
      pkpPubKey: this.pkpPubKey,
    });
    try {
      for (const action of this.actions) {
        if (isViemTransactionAction(action)) {
          const walletClient = createWalletClient({
            account: account,
            transport: action.transport,
            chain: action.chain,
          });
          if (action.ignoreGas) {
            action.gasPrice = undefined;
            action.maxFeePerGas = undefined;
            action.maxPriorityFeePerGas = undefined;
          }
          const hash = action.gasPrice
            ? await walletClient.sendTransaction({
                account,
                to: action.to,
                accessList: action.accessList,
                chain: action.chain,
                data: action.data,
                gasPrice: action.gasPrice ? BigInt(action.gasPrice) : undefined,
                nonce: action.nonce,
                value: action.value ? BigInt(action.value) : undefined,
              })
            : await walletClient.sendTransaction({
                account,
                to: action.to,
                accessList: action.accessList,
                chain: action.chain,
                data: action.data,
                maxFeePerGas: action.maxFeePerGas
                  ? BigInt(action.maxFeePerGas)
                  : undefined,
                maxPriorityFeePerGas: action.maxPriorityFeePerGas
                  ? BigInt(action.maxPriorityFeePerGas)
                  : undefined,
                nonce: action.nonce,
                value: action.value ? BigInt(action.value) : undefined,
              });
          this.transactionLog(action.id, hash, new Date().toISOString());
        } else if (isFetchActionViemTransaction(action)) {
          const response = await fetch(action.url, action.init);
          const json = await response.json();
          const walletClient = createWalletClient({
            account: account,
            transport: action.transport,
            chain: action.chain,
          });
          let transactions: ViemTransaction | ViemTransaction[];
          if (action.responsePath === '') transactions = json;
          else transactions = _.get(json, action.responsePath);

          if (Array.isArray(transactions)) {
            for (const tx of transactions) {
              if (action.ignoreGas) {
                tx.gasPrice = undefined;
                tx.maxFeePerGas = undefined;
                tx.maxPriorityFeePerGas = undefined;
              }
              const hash = tx.gasPrice
                ? await walletClient.sendTransaction({
                    account,
                    to: tx.to,
                    accessList: tx.accessList,
                    chain: tx.chain,
                    data: tx.data,
                    gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
                    nonce: tx.nonce,
                    value: tx.value ? BigInt(tx.value) : undefined,
                  })
                : await walletClient.sendTransaction({
                    account,
                    to: tx.to,
                    accessList: tx.accessList,
                    chain: tx.chain,
                    data: tx.data,
                    maxFeePerGas: tx.maxFeePerGas
                      ? BigInt(tx.maxFeePerGas)
                      : undefined,
                    maxPriorityFeePerGas: tx.maxPriorityFeePerGas
                      ? BigInt(tx.maxPriorityFeePerGas)
                      : undefined,
                    nonce: tx.nonce,
                    value: tx.value ? BigInt(tx.value) : undefined,
                  });
              this.transactionLog(action.id, hash, new Date().toISOString());
            }
          } else {
            if (action.ignoreGas) {
              transactions.gasPrice = undefined;
              transactions.maxFeePerGas = undefined;
              transactions.maxPriorityFeePerGas = undefined;
            }
            const hash = transactions.gasPrice
              ? await walletClient.sendTransaction({
                  account,
                  to: transactions.to,
                  accessList: transactions.accessList,
                  chain: transactions.chain,
                  data: transactions.data,
                  gasPrice: transactions.gasPrice
                    ? BigInt(transactions.gasPrice)
                    : undefined,
                  nonce: transactions.nonce,
                  value: transactions.value
                    ? BigInt(transactions.value)
                    : undefined,
                })
              : await walletClient.sendTransaction({
                  account,
                  to: transactions.to,
                  accessList: transactions.accessList,
                  chain: transactions.chain,
                  data: transactions.data,
                  maxFeePerGas: transactions.maxFeePerGas
                    ? BigInt(transactions.maxFeePerGas)
                    : undefined,
                  maxPriorityFeePerGas: transactions.maxPriorityFeePerGas
                    ? BigInt(transactions.maxPriorityFeePerGas)
                    : undefined,
                  nonce: transactions.nonce,
                  value: transactions.value
                    ? BigInt(transactions.value)
                    : undefined,
                });
            this.transactionLog(action.id, hash, new Date().toISOString());
          }
        } else {
          throw new Error(`Unknown action type: ${action.type}`);
        }
      }
      this.litActionCompletionCount++;
    } catch (error) {
      let message;
      if (error instanceof Error) message = error.message;
      else message = String(error);
      this.circuitLog(
        'error',
        `Lit Action failed. ${message}`,
        new Date().toISOString(),
      );
    }
  }
}
