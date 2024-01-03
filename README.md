# LitListenerSdk
lit-listener-sdk is sdk for automate transaction with Lit Protocol PKP inspired by [DIGITALAX/LitListenerSDK](https://github.com/DIGITALAX/LitListenerSDK)

Developed with the goal of a more scalable architecture

## Installation
server:
```bash
yarn add @lit-listener-sdk/types @lit-listener-sdk/circuit-base @lit-listener-sdk/circuit-viem @lit-listener-sdk/circuit-zerodev
```
frontend:
```bash
yarn add @lit-listener-sdk/types
```

## Server-SDK Integration
[lit-listener-server](https://github.com/yhl125/lit-listener-server) is a server using this sdk and NestJs

swagger: https://lit-listener-server-demo.iampocket.com/api#/

[frontend example](https://demo-app.iampocket.com/lit-listener) using this server to run a simple automated transaction

[frontend source code](https://github.com/yhl125/iampocket-wallet/blob/develop/src/components/lit-listener/CreateCircuit.tsx)

## Quick Start
```typescript
    const transactionAction = new ViemTransactionAction({
      chain: chronicle,
      transport: { type: 'http' },
      to: '0x016013f36abb93F6304eC0aBAbe5b0F3b6636579',
      value: 0n,
      type: 'viem',
    });
    const abi = parseAbi([
      'event Transfer(address indexed from, address indexed to, uint256 amount)',
    ]);
    const contractCondition: ViemContractCondition = new ViemContractCondition({
      type: 'viem-contract',
      abi,
      transport: {
        type: 'http',
        url: 'https://ethereum-goerli.publicnode.com',
      },
      expectedValue: 0n,
      matchOperator: '===',
      // goerli weth
      contractAddress: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
      eventName: 'Transfer',
      // add your address here, and send 0 weth to it on goerli after running this test
      eventArgs: { from: '' },
    });

    // This is a factory function
    const circuit = new CircuitViem({
      litNetwork: 'cayenne',
      pkpPubKey: PKP_PUBKEY,
      conditions: [contractCondition],
      conditionalLogic: { type: 'EVERY' },
      options: { maxLitActionCompletions: 1 },
      actions: [transactionAction],
      authSig: CONTROLLER_AUTHSIG,
    });
    circuit.start();
    circuit.on('circuitLog', (log) => {
      console.log(log);
    });
```