import { CircuitBase } from '@lit-listener-sdk/circuit-base';
import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import { ConditionMonitorViem } from '@lit-listener-sdk/circuit-viem';
import {
  ICondition,
  IConditionalLogic,
  IExecutionConstraints,
  LogCategory,
  ViemTransaction,
  isFetchActionZeroDevUserOperation,
  isZeroDevUserOperationAction,
  FetchActionZeroDevUserOperation,
  ZeroDevUserOperationAction,
  UserOperationCallData,
} from '@lit-listener-sdk/types';
import {
  PKPViemAccount,
  convertAccountToSmartAccountSigner,
} from '@altpd13/pkp-viem';
import * as _ from 'lodash';
import { ECDSAProvider } from '@zerodev/sdk';
import { Hash } from 'viem';

export class CircuitZeroDev extends CircuitBase {
  constructor(args: {
    litNetwork: LIT_NETWORKS_KEYS;
    pkpPubKey: string;
    conditions: ICondition[];
    conditionalLogic: IConditionalLogic;
    options: IExecutionConstraints;
    actions: (FetchActionZeroDevUserOperation | ZeroDevUserOperationAction)[];
    authSig?: AuthSig;
    sessionSigs?: SessionSigs;
    secureKey?: string;
  }) {
    super({
      monitor: new ConditionMonitorViem(),
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
        if (isZeroDevUserOperationAction(action)) {
          const ecdsaProvider = await ECDSAProvider.init({
            projectId: action.projectId,
            owner: convertAccountToSmartAccountSigner(account),
            opts: action.opts,
          });
          const { hash } = await ecdsaProvider.sendUserOperation(action.userOp);
          const transactionHash =
            await ecdsaProvider.waitForUserOperationTransaction(hash as Hash);
          this.log(
            LogCategory.RESPONSE,
            'transactionHash',
            transactionHash,
            new Date().toISOString(),
          );
        } else if (isFetchActionZeroDevUserOperation(action)) {
          const response = await fetch(action.url, action.init);
          const json = await response.json();
          const ecdsaProvider = await ECDSAProvider.init({
            projectId: action.projectId,
            owner: convertAccountToSmartAccountSigner(account),
            opts: action.opts,
          });
          let transactions: ViemTransaction | ViemTransaction[];
          if (action.responsePath === '') transactions = json;
          else transactions = _.get(json, action.responsePath);

          if (Array.isArray(transactions)) {
            const userOps: UserOperationCallData[] = transactions.map(
              (transaction) => this.viemTransactionToUserOp(transaction),
            );
            const { hash } = await ecdsaProvider.sendUserOperation(userOps);
            const transactionHash =
              await ecdsaProvider.waitForUserOperationTransaction(hash as Hash);
            this.log(
              LogCategory.RESPONSE,
              'transactionHash',
              transactionHash,
              new Date().toISOString(),
            );
          } else {
            const userOp = this.viemTransactionToUserOp(transactions);
            const { hash } = await ecdsaProvider.sendUserOperation(userOp);
            const transactionHash =
              await ecdsaProvider.waitForUserOperationTransaction(hash as Hash);
            this.log(
              LogCategory.RESPONSE,
              'transactionHash',
              transactionHash,
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
    }
  }

  private viemTransactionToUserOp(
    transaction: ViemTransaction,
  ): UserOperationCallData {
    return {
      target: transaction.to,
      data: transaction.data ? transaction.data : '0x',
      value: transaction.value ? BigInt(transaction.value) : undefined,
    };
  }
}
