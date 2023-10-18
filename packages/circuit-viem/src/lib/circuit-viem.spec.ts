import {
  ViemContractCondition,
  ViemTransactionAction,
} from '@lit-listener-sdk//types';
import { CircuitViem } from './circuit-viem';
import { CONTROLLER_AUTHSIG, PKP_PUBKEY } from 'lit.config.json';
import { defineChain, parseAbi } from 'viem';
import { http } from 'viem';

jest.setTimeout(30000);

describe('CircuitViem', () => {
  it('circuit start', async () => {
    // Mock the event callback to see that:
    const callback = jest.fn();

    const chronicle = defineChain({
      id: 175177,
      name: 'Chronicle',
      network: 'chronicle',
      nativeCurrency: {
        decimals: 18,
        name: 'LIT',
        symbol: 'LIT',
      },
      rpcUrls: {
        default: {
          http: ['https://chain-rpc.litprotocol.com/http'],
        },
        public: {
          http: ['https://chain-rpc.litprotocol.com/http'],
        },
      },
    });
    const transactionAction: ViemTransactionAction = {
      type: 'viem',
      chain: chronicle,
      transport: http(),
      to: '0x016013f36abb93F6304eC0aBAbe5b0F3b6636579',
      value: 0n,
    };

    // This is a factory function
    const circuit = new CircuitViem({
      errorHandlingModeStrict: false,
      litNetwork: 'serrano',
      pkpPubKey: PKP_PUBKEY,
      conditions: [],
      conditionalLogic: { type: 'EVERY' },
      options: { maxLitActionCompletions: 1 },
      actions: [transactionAction],
      authSig: CONTROLLER_AUTHSIG,
    });
    circuit.start();
    circuit.on('log', (log) => {
      callback(log);
    });
    await new Promise((r) => setTimeout(r, 10000));

    //Did callback get called?
    expect(callback).toBeCalled();
    // transactionHash should be in the log message
    // eg {\"message\":\"transactionHash\",\"response\":\"0xbf937a25378614de52d2ead9fbf500f54babcf8911718d03f3a1cc18f719ca15\",\"isoDate\":\"2023-10-18T05:50:19.837Z\"}
    expect(
      callback.mock.calls.map((calls) => {
        return calls[0].includes('transactionHash');
      }),
    ).toContain(true);
  });

  // it('circuit with contract condition', async () => {
  //   // Mock the event callback to see that:
  //   const callback = jest.fn();

  //   const chronicle = defineChain({
  //     id: 175177,
  //     name: 'Chronicle',
  //     network: 'chronicle',
  //     nativeCurrency: {
  //       decimals: 18,
  //       name: 'LIT',
  //       symbol: 'LIT',
  //     },
  //     rpcUrls: {
  //       default: {
  //         http: ['https://chain-rpc.litprotocol.com/http'],
  //       },
  //       public: {
  //         http: ['https://chain-rpc.litprotocol.com/http'],
  //       },
  //     },
  //   });
  //   const transactionAction: ViemTransactionAction = {
  //     type: 'viem',
  //     chain: chronicle,
  //     transport: http(),
  //     to: '0x016013f36abb93F6304eC0aBAbe5b0F3b6636579',
  //     value: 0n,
  //   };
  //   const abi = parseAbi([
  //     'event Transfer(address indexed from, address indexed to, uint256 amount)',
  //   ]);
  //   const contractCondition: ViemContractCondition = new ViemContractCondition({
  //     abi,
  //     transport: http('https://polygon-testnet.public.blastapi.io'),
  //     expectedValue: ,
  //     matchOperator: '===',
  //     contractAddress: '',
  //     eventName: 'Transfer',
  //     eventArgs: { from: '' },
  //   });

  //   // This is a factory function
  //   const circuit = new CircuitViem({
  //     errorHandlingModeStrict: false,
  //     litNetwork: 'serrano',
  //     pkpPubKey: PKP_PUBKEY,
  //     conditions: [contractCondition],
  //     conditionalLogic: { type: 'EVERY' },
  //     options: { maxLitActionCompletions: 1 },
  //     actions: [transactionAction],
  //     authSig: CONTROLLER_AUTHSIG,
  //   });
  //   circuit.start();
  //   circuit.on('log', (log) => {
  //     callback(log);
  //   });
  //   // 10 seconds
  //   // await new Promise((r) => setTimeout(r, 10000));

  //   //Did callback get called?
  //   expect(callback).toBeCalled();
  //   // transactionHash should be in the log message
  //   // eg {\"message\":\"transactionHash\",\"response\":\"0xbf937a25378614de52d2ead9fbf500f54babcf8911718d03f3a1cc18f719ca15\",\"isoDate\":\"2023-10-18T05:50:19.837Z\"}
  //   expect(
  //     callback.mock.calls.map((calls) => {
  //       return calls[0]
  //       // return calls[0].includes('transactionHash');
  //     }),
  //   ).toContain(true);
  // });
});
