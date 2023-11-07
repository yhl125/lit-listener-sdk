import {
  FetchActionZeroDevUserOperation,
  ZeroDevUserOperationAction,
} from '@lit-listener-sdk/types';
import { CONTROLLER_AUTHSIG, PKP_PUBKEY } from 'lit.config.json';

import { CircuitZeroDev } from './circuit-zerodev';

jest.setTimeout(100000);

describe('circuitZerodev', () => {
  it('circuit without condition', async () => {
    // Mock the event callback to see that:
    const callback = jest.fn();

    const userOperationAction = new ZeroDevUserOperationAction({
      projectId: '',
      userOp: {
        target: '0xAa0335b77B7a7c0D4B8c1f359155265CB9769d7e',
        data: '0x',
        value: 0n,
      },
    });

    const fetchAction = new FetchActionZeroDevUserOperation({
      projectId: '',
      url: 'https://goerli.api.0x.org/swap/v1/quote?buyToken=WETH&sellToken=ETH&buyAmount=100',
      init: {
        headers: { '0x-api-key': '' },
      },
      responsePath: '',
    });

    // This is a factory function
    const circuit = new CircuitZeroDev({
      litNetwork: 'cayenne',
      pkpPubKey: PKP_PUBKEY,
      conditions: [],
      conditionalLogic: { type: 'EVERY' },
      options: { maxLitActionCompletions: 1 },
      actions: [userOperationAction, fetchAction],
      authSig: CONTROLLER_AUTHSIG,
    });
    circuit.start();
    circuit.on('log', (log) => {
      callback(log);
    });
    await new Promise((r) => setTimeout(r, 80000));

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
});
