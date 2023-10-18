import { CircuitBase } from '@lit-listener-sdk//circuit-base';
import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import { ConditionMonitorViem } from './condition-monitor-viem';
import {
  ICondition,
  IConditionalLogic,
  IExecutionConstraints,
  FetchActionViemTransaction,
  ViemTransactionAction,
  LogCategory,
  isViemTransactionAction,
  isFetchActionViemTransaction,
  ViemTransaction,
} from '@lit-listener-sdk//types';
import { PKPViemAccount } from '@altpd13/pkp-viem';
import { createWalletClient } from 'viem';

export class CircuitViem extends CircuitBase {
  constructor(args: {
    errorHandlingModeStrict: boolean;
    litNetwork: LIT_NETWORKS_KEYS;
    pkpPubKey: string;
    conditions: ICondition[];
    conditionalLogic: IConditionalLogic;
    options: IExecutionConstraints;
    actions: (FetchActionViemTransaction | ViemTransactionAction)[];
    authSig?: AuthSig;
    sessionSigs?: SessionSigs;
    secureKey?: string;
  }) {
    super({
      monitor: new ConditionMonitorViem(),
      errorHandlingModeStrict: args.errorHandlingModeStrict,
      litNetwork: args.litNetwork,
      pkpPubKey: args.pkpPubKey,
      conditions: args.conditions,
      conditionalLogic: args.conditionalLogic,
      options: args.options,
      actions: args.actions,
      authSig: args.authSig,
      sessionSigs: args.sessionSigs,
      secureKey: args.secureKey,
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
          const hash = action.gasPrice
            ? await walletClient.sendTransaction({
                account,
                to: action.to,
                accessList: action.accessList,
                chain: action.chain,
                data: action.data,
                gasPrice: action.gasPrice,
                nonce: action.nonce,
                value: action.value,
              })
            : await walletClient.sendTransaction({
                account,
                to: action.to,
                accessList: action.accessList,
                chain: action.chain,
                data: action.data,
                maxFeePerGas: action.maxFeePerGas,
                maxPriorityFeePerGas: action.maxPriorityFeePerGas,
                nonce: action.nonce,
                value: action.value,
              });
          this.log(
            LogCategory.RESPONSE,
            'transactionHash',
            hash,
            new Date().toISOString(),
          );
        } else if (isFetchActionViemTransaction(action)) {
          const response = await fetch(action.url, action.init);
          const json = await response.json();
          const walletClient = createWalletClient({
            account: account,
            transport: action.transport,
            chain: action.chain,
          });
          const transactions: ViemTransaction | ViemTransaction[] =
            json[action.responsePath];
          if (Array.isArray(transactions)) {
            for (const tx of transactions) {
              const hash = tx.gasPrice
                ? await walletClient.sendTransaction({
                    account,
                    to: tx.to,
                    accessList: tx.accessList,
                    chain: tx.chain,
                    data: tx.data,
                    gasPrice: tx.gasPrice,
                    nonce: tx.nonce,
                    value: tx.value,
                  })
                : await walletClient.sendTransaction({
                    account,
                    to: tx.to,
                    accessList: tx.accessList,
                    chain: tx.chain,
                    data: tx.data,
                    maxFeePerGas: tx.maxFeePerGas,
                    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
                    nonce: tx.nonce,
                    value: tx.value,
                  });
              this.log(
                LogCategory.RESPONSE,
                'transactionHash',
                hash,
                new Date().toISOString(),
              );
            }
          } else {
            const hash = transactions.gasPrice
              ? await walletClient.sendTransaction({
                  account,
                  to: transactions.to,
                  accessList: transactions.accessList,
                  chain: transactions.chain,
                  data: transactions.data,
                  gasPrice: transactions.gasPrice,
                  nonce: transactions.nonce,
                  value: transactions.value,
                })
              : await walletClient.sendTransaction({
                  account,
                  to: transactions.to,
                  accessList: transactions.accessList,
                  chain: transactions.chain,
                  data: transactions.data,
                  maxFeePerGas: transactions.maxFeePerGas,
                  maxPriorityFeePerGas: transactions.maxPriorityFeePerGas,
                  nonce: transactions.nonce,
                  value: transactions.value,
                });
            this.log(
              LogCategory.RESPONSE,
              'transactionHash',
              hash,
              new Date().toISOString(),
            );
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
      this.log(
        LogCategory.ERROR,
        `Lit Action failed.`,
        message,
        new Date().toISOString(),
      );
      if (this.errorHandlingModeStrict) {
        throw new Error(`Error running Lit Action: ${error}`);
      }
    }
  }
}
