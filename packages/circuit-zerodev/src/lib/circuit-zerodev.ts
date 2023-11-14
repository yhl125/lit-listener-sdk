import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import { PKPViemAccount } from 'pkp-viem';
import * as _ from 'lodash';
import {
  ECDSAProvider,
  convertWalletClientToAccountSigner,
} from '@zerodev/sdk';
import { Address, Hash, Hex, createWalletClient, http } from 'viem';

import { CircuitBase } from '@lit-listener-sdk/circuit-base';
import { ConditionMonitorViem } from '@lit-listener-sdk/circuit-viem';
import {
  ICondition,
  IConditionalLogic,
  IExecutionConstraints,
  ViemTransaction,
  isFetchActionZeroDevUserOperation,
  isZeroDevUserOperationAction,
  FetchActionZeroDevUserOperation,
  ZeroDevUserOperationAction,
  UserOperation,
  IUserOperationLog,
} from '@lit-listener-sdk/types';
import { ObjectId } from 'bson';
import { mainnet } from 'viem/chains';

export class CircuitZeroDev extends CircuitBase {
  constructor(args: {
    id?: ObjectId;
    litNetwork: LIT_NETWORKS_KEYS;
    pkpPubKey: string;
    conditions: ICondition[];
    conditionalLogic: IConditionalLogic;
    options: IExecutionConstraints;
    actions: (FetchActionZeroDevUserOperation | ZeroDevUserOperationAction)[];
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
    const walletClient = createWalletClient({
      account: account,
      transport: http(),
      chain: mainnet,
    });

    try {
      this.isActionRunning = true;

      for (const action of this.actions) {
        if (isZeroDevUserOperationAction(action)) {
          const ecdsaProvider = await ECDSAProvider.init({
            projectId: action.projectId,
            owner: convertWalletClientToAccountSigner(walletClient),
            opts: action.opts,
          });
          if (Array.isArray(action.userOp)) {
            const userOp = this.userOpsToZeroDevUserOps(action.userOp);
            await this.sendUserOperationAndLog(
              ecdsaProvider,
              userOp,
              action.id,
            );
          } else {
            const userOp = this.userOpToZeroDevUserOp(action.userOp);
            await this.sendUserOperationAndLog(
              ecdsaProvider,
              userOp,
              action.id,
            );
          }
        } else if (isFetchActionZeroDevUserOperation(action)) {
          const response = await fetch(action.url, action.init);
          const json = await response.json();
          const ecdsaProvider = await ECDSAProvider.init({
            projectId: action.projectId,
            owner: convertWalletClientToAccountSigner(walletClient),
            opts: action.opts,
          });
          let transactions: ViemTransaction | ViemTransaction[];
          if (action.responsePath === '') transactions = json;
          else transactions = _.get(json, action.responsePath);

          if (Array.isArray(transactions)) {
            const userOp = this.viemTransactionsToZeroDevUserOps(transactions);
            await this.sendUserOperationAndLog(
              ecdsaProvider,
              userOp,
              action.id,
            );
          } else {
            const userOp = this.viemTransactionToZeroDevUserOp(transactions);
            await this.sendUserOperationAndLog(
              ecdsaProvider,
              userOp,
              action.id,
            );
          }
        } else {
          throw new Error(`Unknown action type: ${action.type}`);
        }
      }
      this.litActionCompletionCount++;
      this.isActionRunning = false;
      this.circuitLog(
        'action complete',
        `litActionCompletionCount increased to ${this.litActionCompletionCount}`,
        new Date().toISOString(),
      );
    } catch (error) {
      this.isActionRunning = false;
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

  private async sendUserOperationAndLog(
    ecdsaProvider: ECDSAProvider,
    userOp: ZeroDevUserOperation | ZeroDevUserOperation[],
    actionId: ObjectId,
  ) {
    const { hash } = await ecdsaProvider.sendUserOperation(userOp);
    this.userOperationLog(actionId, hash, new Date().toISOString());
    const transactionHash = await ecdsaProvider.waitForUserOperationTransaction(
      hash as Hash,
    );
    this.transactionLog(actionId, transactionHash, new Date().toISOString());
  }

  private viemTransactionsToZeroDevUserOps(
    transactions: ViemTransaction[],
  ): ZeroDevUserOperation[] {
    return transactions.map((transaction) =>
      this.viemTransactionToZeroDevUserOp(transaction),
    );
  }

  private viemTransactionToZeroDevUserOp(
    transaction: ViemTransaction,
  ): ZeroDevUserOperation {
    return {
      target: transaction.to,
      data: transaction.data ? transaction.data : '0x',
      value: transaction.value ? BigInt(transaction.value) : undefined,
    };
  }

  private userOpsToZeroDevUserOps(
    userOps: UserOperation[],
  ): ZeroDevUserOperation[] {
    return userOps.map((userOp) => this.userOpToZeroDevUserOp(userOp));
  }

  private userOpToZeroDevUserOp(userOp: UserOperation): ZeroDevUserOperation {
    return {
      target: userOp.target,
      data: userOp.data,
      value: userOp.value ? BigInt(userOp.value) : undefined,
    };
  }

  private userOperationLog = (
    actionId: ObjectId,
    userOperationHash: string,
    isoDate: string,
  ) => {
    const log: IUserOperationLog = {
      actionId,
      userOperationHash,
      isoDate,
    };
    this.emitAsync(`userOperationLog`, log);
  };
}
interface ZeroDevUserOperation {
  /* the target of the call */
  target: Address;
  /* the data passed to the target */
  data: Hex;
  /* the amount of native token to send to the target (default: 0) */
  value?: bigint;
}
