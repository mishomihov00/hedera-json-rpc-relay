/*-
 *
 * Hedera JSON RPC Relay
 *
 * Copyright (C) 2022-2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { EnvProviderService } from '@hashgraph/env-provider/dist/services';
EnvProviderService.hotReload();
import { assert, expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import { EthImpl } from '../../../src/lib/eth';
import { SDKClient } from '../../../src/lib/clients';
import {
  ACCOUNT_ADDRESS_1,
  CONTRACT_ADDRESS_1,
  CONTRACT_ADDRESS_2,
  CONTRACT_CALL_DATA,
  CONTRACT_ID_2,
  DEFAULT_CONTRACT,
  DEFAULT_CONTRACT_2,
  DEFAULT_CONTRACT_3_EMPTY_BYTECODE,
  DEFAULT_NETWORK_FEES,
  MAX_GAS_LIMIT,
  MAX_GAS_LIMIT_HEX,
  NO_TRANSACTIONS,
  NON_EXISTENT_CONTRACT_ADDRESS,
  WRONG_CONTRACT_ADDRESS,
  ONE_TINYBAR_IN_WEI_HEX,
  EXAMPLE_CONTRACT_BYTECODE,
} from './eth-config';
import { JsonRpcError, predefined } from '../../../src/lib/errors/JsonRpcError';
import RelayAssertions from '../../assertions';
import constants from '../../../src/lib/constants';
import {
  defaultCallData,
  defaultContractResults,
  defaultErrorMessageHex,
  defaultErrorMessageText,
  ethCallFailing,
  mockData,
} from '../../helpers';
import { generateEthTestEnv } from './eth-helpers';
import { IContractCallRequest, IContractCallResponse } from '../../../src/lib/types/IMirrorNode';

use(chaiAsPromised);

let sdkClientStub;
let getSdkClientStub;
let currentMaxBlockRange: number;

describe('@ethCall Eth Call spec', async function () {
  this.timeout(10000);
  let { restMock, web3Mock, hapiServiceInstance, ethImpl, cacheService } = generateEthTestEnv();

  const ETH_CALL_REQ_ARGS = {
    from: ACCOUNT_ADDRESS_1,
    to: CONTRACT_ADDRESS_2,
    data: CONTRACT_CALL_DATA,
    gas: MAX_GAS_LIMIT_HEX,
  };

  this.beforeEach(() => {
    // reset cache and restMock
    cacheService.clear();
    restMock.reset();

    sdkClientStub = sinon.createStubInstance(SDKClient);
    getSdkClientStub = sinon.stub(hapiServiceInstance, 'getSDKClient').returns(sdkClientStub);
    restMock.onGet('network/fees').reply(200, DEFAULT_NETWORK_FEES);
    currentMaxBlockRange = Number(EnvProviderService.getInstance().get('ETH_GET_TRANSACTION_COUNT_MAX_BLOCK_RANGE'));
    EnvProviderService.getInstance().dynamicOverride('ETH_GET_TRANSACTION_COUNT_MAX_BLOCK_RANGE', '1');
    restMock.onGet(`accounts/${ACCOUNT_ADDRESS_1}${NO_TRANSACTIONS}`).reply(200, {
      account: '0.0.1723',
      evm_address: ACCOUNT_ADDRESS_1,
    });
  });

  this.afterEach(() => {
    getSdkClientStub.restore();
    restMock.resetHandlers();
    EnvProviderService.getInstance().dynamicOverride(
      'ETH_GET_TRANSACTION_COUNT_MAX_BLOCK_RANGE',
      currentMaxBlockRange.toString(),
    );
  });

  describe('eth_call precheck failures', async function () {
    let callConsensusNodeSpy: sinon.SinonSpy;
    let callMirrorNodeSpy: sinon.SinonSpy;
    let sandbox: sinon.SinonSandbox;

    this.beforeAll(() => {
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', 'false');
    });

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      callConsensusNodeSpy = sandbox.spy(ethImpl, 'callConsensusNode');
      callMirrorNodeSpy = sandbox.spy(ethImpl, 'callMirrorNode');
    });

    afterEach(() => {
      sandbox.restore();
    });

    this.afterAll(() => {
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', 'true');
    });

    it('eth_call with incorrect `to` field length', async function () {
      await ethCallFailing(
        ethImpl,
        {
          from: CONTRACT_ADDRESS_1,
          to: EthImpl.zeroHex,
          data: CONTRACT_CALL_DATA,
          gas: MAX_GAS_LIMIT_HEX,
        },
        'latest',
        (error) => {
          expect(error.message).to.equal(
            `Invalid Contract Address: ${EthImpl.zeroHex}. Expected length of 42 chars but was 3.`,
          );
        },
      );
    });

    it('should execute "eth_call" against mirror node with a false ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', async function () {
      web3Mock.onPost('contracts/call').reply(200);
      const initialEthCallConesneusFF = EnvProviderService.getInstance().get('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE');

      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', 'false');
      restMock.onGet(`contracts/${defaultCallData.from}`).reply(404);
      restMock.onGet(`accounts/${defaultCallData.from}${NO_TRANSACTIONS}`).reply(200, {
        account: '0.0.1723',
        evm_address: defaultCallData.from,
      });
      restMock.onGet(`contracts/${defaultCallData.to}`).reply(200, DEFAULT_CONTRACT);
      await ethImpl.call({ ...defaultCallData, gas: `0x${defaultCallData.gas.toString(16)}` }, 'latest');

      assert(callMirrorNodeSpy.calledOnce);
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', initialEthCallConesneusFF);
    });

    it('should execute "eth_call" against mirror node with an undefined ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', async function () {
      web3Mock.onPost('contracts/call').reply(200);
      const initialEthCallConesneusFF = EnvProviderService.getInstance().get('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE');

      EnvProviderService.getInstance().remove('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE');
      restMock.onGet(`contracts/${defaultCallData.from}`).reply(404);
      restMock.onGet(`accounts/${defaultCallData.from}${NO_TRANSACTIONS}`).reply(200, {
        account: '0.0.1723',
        evm_address: defaultCallData.from,
      });
      restMock.onGet(`contracts/${defaultCallData.to}`).reply(200, DEFAULT_CONTRACT);
      await ethImpl.call({ ...defaultCallData, gas: `0x${defaultCallData.gas.toString(16)}` }, 'latest');

      assert(callMirrorNodeSpy.calledOnce);
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', initialEthCallConesneusFF);
    });

    it('should execute "eth_call" against mirror node with a ETH_CALL_DEFAULT_TO_CONSENSUS_NODE set to true', async function () {
      const initialEthCallConesneusFF = EnvProviderService.getInstance().get('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE');

      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', 'true');
      restMock.onGet(`contracts/${defaultCallData.from}`).reply(404);
      restMock.onGet(`accounts/${defaultCallData.from}${NO_TRANSACTIONS}`).reply(200, {
        account: '0.0.1723',
        evm_address: defaultCallData.from,
      });
      restMock.onGet(`contracts/${defaultCallData.to}`).reply(200, DEFAULT_CONTRACT);
      await ethImpl.call({ ...defaultCallData, gas: `0x${defaultCallData.gas.toString(16)}` }, 'latest');

      assert(callConsensusNodeSpy.calledOnce);
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', initialEthCallConesneusFF);
    });

    it('to field is not a contract or token', async function () {
      restMock.onGet(`contracts/${ACCOUNT_ADDRESS_1}`).reply(404);
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(404);
      restMock.onGet(`tokens/${CONTRACT_ID_2}`).reply(404);
      web3Mock.onPost(`contracts/call`).reply(200, { result: '0x1' });

      await expect(
        ethImpl.call(
          {
            from: ACCOUNT_ADDRESS_1,
            to: CONTRACT_ADDRESS_2,
            data: CONTRACT_CALL_DATA,
            gas: MAX_GAS_LIMIT_HEX,
          },
          'latest',
        ),
      ).to.eventually.be.fulfilled.and.equal('0x1');
    });

    // support for web3js.
    it('the input is set with the encoded data for the data field', async function () {
      restMock.onGet(`contracts/${ACCOUNT_ADDRESS_1}`).reply(200);
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200);
      restMock.onGet(`tokens/${CONTRACT_ID_2}`).reply(200);
      web3Mock.onPost(`contracts/call`).reply(200, { result: '0x1' });

      await expect(
        ethImpl.call(
          {
            from: ACCOUNT_ADDRESS_1,
            to: CONTRACT_ADDRESS_2,
            input: CONTRACT_CALL_DATA,
            gas: MAX_GAS_LIMIT_HEX,
          },
          'latest',
        ),
      ).to.eventually.be.fulfilled.and.equal('0x1');
    });
  });

  describe('eth_call using consensus node', async function () {
    let initialEthCallConesneusFF;

    before(() => {
      initialEthCallConesneusFF = EnvProviderService.getInstance().get('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE');
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', 'true');
    });

    after(() => {
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', initialEthCallConesneusFF);
    });

    it('eth_call with no gas', async function () {
      restMock.onGet(`contracts/${ACCOUNT_ADDRESS_1}`).reply(404);
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);

      sdkClientStub.submitContractCallQueryWithRetry.returns({
        asBytes: function () {
          return Uint8Array.of(0);
        },
      });

      const result = await ethImpl.call(
        {
          from: ACCOUNT_ADDRESS_1,
          to: CONTRACT_ADDRESS_2,
          data: CONTRACT_CALL_DATA,
        },
        'latest',
      );

      sinon.assert.calledWith(
        sdkClientStub.submitContractCallQueryWithRetry,
        CONTRACT_ADDRESS_2,
        CONTRACT_CALL_DATA,
        400_000,
        ACCOUNT_ADDRESS_1,
        'eth_call',
      );
      expect(result).to.equal('0x00');
    });

    it('eth_call with no data', async function () {
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      sdkClientStub.submitContractCallQueryWithRetry.returns({
        asBytes: function () {
          return Uint8Array.of(0);
        },
      });

      const result = await ethImpl.call(
        {
          from: ACCOUNT_ADDRESS_1,
          to: CONTRACT_ADDRESS_2,
          gas: MAX_GAS_LIMIT_HEX,
        },
        'latest',
      );

      sinon.assert.calledWith(
        sdkClientStub.submitContractCallQueryWithRetry,
        CONTRACT_ADDRESS_2,
        undefined,
        MAX_GAS_LIMIT,
        ACCOUNT_ADDRESS_1,
        'eth_call',
      );
      expect(result).to.equal('0x00');
    });

    it('eth_call with no "from" address', async function () {
      const callData = {
        ...defaultCallData,
        from: undefined,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };

      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      sdkClientStub.submitContractCallQueryWithRetry.returns({
        asBytes: function () {
          return Uint8Array.of(0);
        },
      });

      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.equal('0x00');
    });

    it('eth_call with a bad "from" address', async function () {
      const callData = {
        ...defaultCallData,
        from: '0x00000000000000000000000000000000000000',
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };

      const result = await ethImpl.call(callData, 'latest');

      expect((result as JsonRpcError).code).to.equal(-32014);
      expect((result as JsonRpcError).message).to.equal(
        `Non Existing Account Address: ${callData.from}. Expected an Account Address.`,
      );
    });

    it('eth_call with all fields', async function () {
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      sdkClientStub.submitContractCallQueryWithRetry.returns({
        asBytes: function () {
          return Uint8Array.of(0);
        },
      });

      const result = await ethImpl.call(ETH_CALL_REQ_ARGS, 'latest');

      sinon.assert.calledWith(
        sdkClientStub.submitContractCallQueryWithRetry,
        CONTRACT_ADDRESS_2,
        CONTRACT_CALL_DATA,
        MAX_GAS_LIMIT,
        ACCOUNT_ADDRESS_1,
        'eth_call',
      );
      expect(result).to.equal('0x00');
    });

    //Return once the value, then it's being fetched from cache. After the loop we reset the sdkClientStub, so that it returns nothing, if we get an error in the next request that means that the cache was cleared.
    it('eth_call should cache the response for 200ms', async function () {
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      sdkClientStub.submitContractCallQueryWithRetry.returns({
        asBytes: function () {
          return Uint8Array.of(0);
        },
      });

      for (let index = 0; index < 3; index++) {
        const result = await ethImpl.call(
          {
            from: ACCOUNT_ADDRESS_1,
            to: CONTRACT_ADDRESS_2,
            data: CONTRACT_CALL_DATA,
            gas: MAX_GAS_LIMIT_HEX,
          },
          'latest',
        );
        expect(result).to.equal('0x00');
        await new Promise((r) => setTimeout(r, 50));
      }

      await new Promise((r) => setTimeout(r, 200));

      const expectedError = predefined.INVALID_CONTRACT_ADDRESS(CONTRACT_ADDRESS_2);
      sdkClientStub.submitContractCallQueryWithRetry.throws(expectedError);
      const call: string | JsonRpcError = await ethImpl.call(ETH_CALL_REQ_ARGS, 'latest');

      expect((call as JsonRpcError).code).to.equal(expectedError.code);
      expect((call as JsonRpcError).message).to.equal(expectedError.message);
    });

    it('SDK returns a precheck error', async function () {
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      sdkClientStub.submitContractCallQueryWithRetry.throws(
        predefined.CONTRACT_REVERT(defaultErrorMessageText, defaultErrorMessageHex),
      );

      const result = await ethImpl.call(ETH_CALL_REQ_ARGS, 'latest');

      expect(result).to.exist;
      expect((result as JsonRpcError).code).to.equal(3);
      expect((result as JsonRpcError).message).to.equal(`execution reverted: ${defaultErrorMessageText}`);
      expect((result as JsonRpcError).data).to.equal(defaultErrorMessageHex);
    });

    it('eth_call with wrong `to` field', async function () {
      const args = [
        {
          from: CONTRACT_ADDRESS_1,
          to: WRONG_CONTRACT_ADDRESS,
          data: CONTRACT_CALL_DATA,
          gas: MAX_GAS_LIMIT_HEX,
        },
        'latest',
      ];

      await RelayAssertions.assertRejection(
        predefined.INVALID_CONTRACT_ADDRESS(WRONG_CONTRACT_ADDRESS),
        ethImpl.call,
        false,
        ethImpl,
        args,
      );
    });

    it('eth_call throws internal error when consensus node times out and submitContractCallQueryWithRetry returns undefined', async function () {
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);

      sdkClientStub.submitContractCallQueryWithRetry.returns(undefined);

      const result = await ethImpl.call(
        {
          to: CONTRACT_ADDRESS_2,
          data: CONTRACT_CALL_DATA,
          gas: 5_000_000,
        },
        'latest',
      );

      expect(result).to.exist;
      expect((result as JsonRpcError).code).to.equal(-32603);
      expect((result as JsonRpcError).message).to.equal(
        'Error invoking RPC: Invalid contractCallResponse from consensus-node: undefined',
      );
    });
  });

  describe('eth_call using mirror node', async function () {
    const defaultCallData = {
      gas: 400000,
      value: null,
    };
    let initialEthCallConesneusFF;

    before(() => {
      initialEthCallConesneusFF = EnvProviderService.getInstance().get('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE');
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', 'false');
    });

    after(() => {
      EnvProviderService.getInstance().dynamicOverride('ETH_CALL_DEFAULT_TO_CONSENSUS_NODE', initialEthCallConesneusFF);
    });

    //temporary workaround until precompiles are implemented in Mirror node evm module
    beforeEach(() => {
      restMock.onGet(`tokens/${defaultContractResults.results[1].contract_id}`).reply(404, null);
      web3Mock.reset();
    });

    it('eth_call with all fields, but mirror-node returns empty response', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_3_EMPTY_BYTECODE);
      web3Mock.onPost(`contracts/call`).replyOnce(200, {});

      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.equal('0x');
    });

    it('eth_call with no gas', async function () {
      const callData = {
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
      };

      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      await mockContractCall({ ...callData, block: 'latest' }, false, 200, { result: '0x00' });

      web3Mock.history.post = [];

      const result = await ethImpl.call(callData, 'latest');

      expect(web3Mock.history.post.length).to.gte(1);
      expect(web3Mock.history.post[0].data).to.equal(JSON.stringify({ ...callData, estimate: false, block: 'latest' }));

      expect(result).to.equal('0x00');
    });

    it('eth_call with no data', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        gas: MAX_GAS_LIMIT,
      };
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      await mockContractCall({ ...callData, block: 'latest' }, false, 200, { result: '0x00' });

      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.equal('0x00');
    });

    it('eth_call with no from address', async function () {
      const callData = {
        ...defaultCallData,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };
      await mockContractCall({ ...callData, block: 'latest' }, false, 200, { result: '0x00' });
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.equal('0x00');
    });

    it('eth_call with all fields', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };
      await mockContractCall({ ...callData, block: 'latest' }, false, 200, { result: '0x00' });
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.equal('0x00');
    });

    it('eth_call with gas capping', async function () {
      const callData = {
        ...defaultCallData,
        gas: 25_000_000,
      };
      await mockContractCall({ ...callData, gas: constants.MAX_GAS_PER_SEC, block: 'latest' }, false, 200, {
        result: '0x00',
      });
      const res = await ethImpl.call(callData, 'latest');
      expect(res).to.equal('0x00');
    });

    it('eth_call with all fields and value', async function () {
      const callData = {
        ...defaultCallData,
        gas: MAX_GAS_LIMIT,
        data: CONTRACT_CALL_DATA,
        to: CONTRACT_ADDRESS_2,
        from: ACCOUNT_ADDRESS_1,
        value: 1, // Mirror node is called with value in Tinybars
        block: 'latest',
      };

      await mockContractCall({ ...callData, block: 'latest' }, false, 200, { result: '0x00' });
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);

      // Relay is called with value in Weibars
      const result = await ethImpl.call({ ...callData, value: ONE_TINYBAR_IN_WEI_HEX }, 'latest');
      expect(result).to.equal('0x00');
    });

    it('eth_call with all fields but mirrorNode throws 429', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };
      await mockContractCall({ ...callData, block: 'latest' }, false, 429, mockData.tooManyRequests);
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.be.not.null;
      expect((result as JsonRpcError).code).to.eq(-32605);
    });

    it('eth_call with all fields but mirrorNode throws 400', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };
      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      await mockContractCall({ ...callData, block: 'latest' }, false, 400, mockData.contractReverted);
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.be.not.null;
      expect((result as JsonRpcError).code).to.eq(3);
      expect((result as JsonRpcError).message).to.contain(mockData.contractReverted._status.messages[0].message);
    });

    it('eth_call with all fields, but mirror node throws NOT_SUPPORTED', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };

      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      await mockContractCall({ ...callData, block: 'latest' }, false, 501, mockData.notSuported);

      sdkClientStub.submitContractCallQueryWithRetry.returns({
        asBytes: function () {
          return Uint8Array.of(0);
        },
      });

      const result = await ethImpl.call(callData, 'latest');

      sinon.assert.calledWith(
        sdkClientStub.submitContractCallQueryWithRetry,
        CONTRACT_ADDRESS_2,
        CONTRACT_CALL_DATA,
        MAX_GAS_LIMIT,
        ACCOUNT_ADDRESS_1,
        'eth_call',
      );
      expect(result).to.equal('0x00');
    });

    it('eth_call with all fields, but mirror node throws CONTRACT_REVERTED', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };

      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      await mockContractCall({ ...callData, block: 'latest' }, false, 400, mockData.contractReverted);
      sinon.reset();
      const result = await ethImpl.call(callData, 'latest');
      sinon.assert.notCalled(sdkClientStub.submitContractCallQueryWithRetry);
      expect(result).to.not.be.null;
      expect((result as JsonRpcError).code).to.eq(3);
      expect((result as JsonRpcError).message).to.contain(mockData.contractReverted._status.messages[0].message);
    });

    it('SDK returns a precheck error', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: CONTRACT_ADDRESS_2,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };

      restMock.onGet(`contracts/${CONTRACT_ADDRESS_2}`).reply(200, DEFAULT_CONTRACT_2);
      await mockContractCall({ ...callData, block: 'latest' }, false, 400, {
        _status: {
          messages: [
            {
              message: '',
              detail: defaultErrorMessageText,
              data: defaultErrorMessageHex,
            },
          ],
        },
      });

      const result = await ethImpl.call(callData, 'latest');

      expect(result).to.exist;
      expect((result as JsonRpcError).code).to.eq(3);
      expect((result as JsonRpcError).message).to.equal(`execution reverted: ${defaultErrorMessageText}`);
      expect((result as JsonRpcError).data).to.equal(defaultErrorMessageHex);
    });

    it('eth_call with wrong `to` field', async function () {
      const args = [
        {
          ...defaultCallData,
          from: CONTRACT_ADDRESS_1,
          to: WRONG_CONTRACT_ADDRESS,
          data: CONTRACT_CALL_DATA,
          gas: MAX_GAS_LIMIT,
        },
        'latest',
      ];

      await RelayAssertions.assertRejection(
        predefined.INVALID_CONTRACT_ADDRESS(WRONG_CONTRACT_ADDRESS),
        ethImpl.call,
        false,
        ethImpl,
        args,
      );
    });

    it('eth_call with all fields but mirrorNode throws 400 due to non-existent `to` address (INVALID_TRANSACTION)', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: NON_EXISTENT_CONTRACT_ADDRESS,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };

      await mockContractCall({ ...callData, block: 'latest' }, false, 400, mockData.invalidTransaction);
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.be.not.null;
      expect(result).to.equal('0x');
    });

    it('eth_call with all fields but mirrorNode throws 400 due to non-existent `to` address (FAIL_INVALID)', async function () {
      const callData = {
        ...defaultCallData,
        from: ACCOUNT_ADDRESS_1,
        to: NON_EXISTENT_CONTRACT_ADDRESS,
        data: CONTRACT_CALL_DATA,
        gas: MAX_GAS_LIMIT,
      };

      await mockContractCall({ ...callData, block: 'latest' }, false, 400, mockData.failInvalid);
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.be.not.null;
      expect(result).to.equal('0x');
    });

    it('eth_call to simulate deploying a smart contract with `to` field being null', async function () {
      const callData = {
        data: EXAMPLE_CONTRACT_BYTECODE,
        to: null,
        from: ACCOUNT_ADDRESS_1,
      };

      await mockContractCall({ ...callData, block: 'latest' }, false, 200, { result: EXAMPLE_CONTRACT_BYTECODE });
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.eq(EXAMPLE_CONTRACT_BYTECODE);
    });

    it('eth_call to simulate deploying a smart contract with `to` field being empty/undefined', async function () {
      const callData = {
        data: EXAMPLE_CONTRACT_BYTECODE,
        from: ACCOUNT_ADDRESS_1,
      };

      await mockContractCall({ ...callData, block: 'latest' }, false, 200, { result: EXAMPLE_CONTRACT_BYTECODE });
      const result = await ethImpl.call(callData, 'latest');
      expect(result).to.eq(EXAMPLE_CONTRACT_BYTECODE);
    });

    async function mockContractCall(
      callData: IContractCallRequest,
      estimate: boolean,
      statusCode: number,
      result: IContractCallResponse,
    ) {
      const formattedCallData = { ...callData, estimate };
      await ethImpl.contractCallFormat(formattedCallData);
      return web3Mock.onPost('contracts/call', formattedCallData).reply(statusCode, result);
    }
  });

  describe('contractCallFormat', () => {
    const operatorId = hapiServiceInstance.getMainClientInstance().operatorAccountId;
    const operatorEvmAddress = ACCOUNT_ADDRESS_1;

    beforeEach(() => {
      restMock.onGet(`accounts/${operatorId!.toString()}?transactions=false`).reply(200, {
        account: operatorId!.toString(),
        evm_address: operatorEvmAddress,
      });
    });

    it('should format transaction value to tiny bar integer', async () => {
      const transaction = {
        value: '0x2540BE400',
      };

      await ethImpl.contractCallFormat(transaction);
      expect(transaction.value).to.equal(1);
    });

    it('should parse gasPrice to integer', async () => {
      const transaction = {
        gasPrice: '1000000000',
      };

      await ethImpl.contractCallFormat(transaction);

      expect(transaction.gasPrice).to.equal(1000000000);
    });

    it('should parse gas to integer', async () => {
      const transaction = {
        gas: '50000',
      };

      await ethImpl.contractCallFormat(transaction);

      expect(transaction.gas).to.equal(50000);
    });

    it('should accepts both input and data fields but copy value of input field to data field', async () => {
      const inputValue = 'input value';
      const dataValue = 'data value';
      const transaction = {
        input: inputValue,
        data: dataValue,
      };
      await ethImpl.contractCallFormat(transaction);
      expect(transaction.data).to.eq(inputValue);
      expect(transaction.data).to.not.eq(dataValue);
      expect(transaction.input).to.be.undefined;
    });

    it('should not modify transaction if only data field is present', async () => {
      const dataValue = 'data value';
      const transaction = {
        data: dataValue,
      };
      await ethImpl.contractCallFormat(transaction);
      expect(transaction.data).to.eq(dataValue);
    });

    it('should copy input to data if input is provided but data is not', async () => {
      const transaction = {
        input: 'input data',
      };

      await ethImpl.contractCallFormat(transaction);

      // @ts-ignore
      expect(transaction.data).to.equal('input data');
      expect(transaction.input).to.be.undefined;
    });

    it('should not modify transaction if input and data fields are not provided', async () => {
      const transaction = {
        value: '0x2540BE400',
        gasPrice: '1000000000',
        gas: '50000',
      };

      await ethImpl.contractCallFormat(transaction);

      expect(transaction.value).to.equal(1);
      expect(transaction.gasPrice).to.equal(1000000000);
      expect(transaction.gas).to.equal(50000);
    });

    it('should populate gas price if not provided', async () => {
      const transaction = {
        value: '0x2540BE400',
        gasPrice: undefined,
      };

      await ethImpl.contractCallFormat(transaction);

      const expectedGasPrice = await ethImpl.gasPrice();
      expect(transaction.gasPrice).to.equal(parseInt(expectedGasPrice));
    });

    it('should populate the from field if the from field is not provided and value is provided', async () => {
      const transaction = {
        value: '0x2540BE400',
        to: CONTRACT_ADDRESS_2,
        from: undefined,
      };

      await ethImpl.contractCallFormat(transaction);

      expect(transaction.from).to.equal(operatorEvmAddress);
    });
  });

  describe('eth_call using consensus node because of redirect by selector', async function () {
    let initialEthCallConesneusFF: any, initialEthCallSelectorsAlwaysToConsensus: any;
    const REDIRECTED_SELECTOR = '0x4d8fdd6d';
    const NON_REDIRECTED_SELECTOR = '0xaaaaaaaa';
    let callConsensusNodeSpy: sinon.SinonSpy;
    let callMirrorNodeSpy: sinon.SinonSpy;
    let sandbox: sinon.SinonSandbox;

    before(() => {
      initialEthCallConesneusFF = process.env.ETH_CALL_DEFAULT_TO_CONSENSUS_NODE;
      initialEthCallSelectorsAlwaysToConsensus = process.env.ETH_CALL_CONSENSUS_SELECTORS;
      process.env.ETH_CALL_DEFAULT_TO_CONSENSUS_NODE = 'false';
    });

    after(() => {
      process.env.ETH_CALL_DEFAULT_TO_CONSENSUS_NODE = initialEthCallConesneusFF;
      process.env.ETH_CALL_CONSENSUS_SELECTORS = initialEthCallSelectorsAlwaysToConsensus;
    });

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      callConsensusNodeSpy = sandbox.spy(ethImpl, 'callConsensusNode');
      callMirrorNodeSpy = sandbox.spy(ethImpl, 'callMirrorNode');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('eth_call with matched selector redirects to consensus', async function () {
      process.env.ETH_CALL_CONSENSUS_SELECTORS = JSON.stringify([REDIRECTED_SELECTOR.slice(2)]);

      await ethImpl.call(
        {
          to: ACCOUNT_ADDRESS_1,
          data: REDIRECTED_SELECTOR,
        },
        'latest',
      );

      assert(callConsensusNodeSpy.calledOnce);
      assert(callMirrorNodeSpy.notCalled);
    });

    it('eth_call with non-matched selector redirects to consensus', async function () {
      await ethImpl.call(
        {
          to: ACCOUNT_ADDRESS_1,
          data: NON_REDIRECTED_SELECTOR,
        },
        'latest',
      );

      assert(callConsensusNodeSpy.notCalled);
      assert(callMirrorNodeSpy.calledOnce);
    });
  });
});
