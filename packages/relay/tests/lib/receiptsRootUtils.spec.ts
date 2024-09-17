/*-
 *
 * Hedera JSON RPC Relay
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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
import { expect } from 'chai';
import { ReceiptsRootUtils } from '../../src/receiptsRootUtils';

describe('ReceiptsRootUtils', () => {
  describe('getRootHash', () => {
    const TEST_SUITES = JSON.parse(`
      {
        "no receipts":{
          "receipts":[],
          "expectedReceiptsRootHash":"0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "one transaction in block without emitted events":{
          "receipts":[
            {
              "blockHash":"0x00ac553985caf2dd9fd4dfc8cee9ad21d7b111f5cf940f9fa6ae18866cbfc54f",
              "blockNumber":"0x748aa4",
              "from":"0x625064686b30ea2d7126a3761b472604f221be0b",
              "to":"0xb35b3176f6097c76ee25e36dfcbc57a571e4e0e8",
              "cumulativeGasUsed":"0x17170",
              "gasUsed":"0x17170",
              "contractAddress":"0xb35b3176f6097c76ee25e36dfcbc57a571e4e0e8",
              "logs":[],
              "logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
              "transactionHash":"0x119278ad28bb26737e42cd1f9f6bd5fc7ee5e55786ab463421ca45d71adeeab0",
              "transactionIndex":"0x2",
              "effectiveGasPrice":"0x15896dfd000",
              "status":"0x1",
              "type":"0x2"
            }
          ],
          "expectedReceiptsRootHash":"0xa4553654eb0c5c6b8d740fc4600cf73f19b72bbb510c8fb3587376486798c645"
        },
        "one transaction in block with three emitted events":{
          "receipts":[
            {
              "blockHash":"0xa4d40030da652512fe78bbbaaa1d1063a07ecbe8217282f22414e1dae0e9d05f",
              "blockNumber":"0x748bef",
              "from":"0x8b6b417d086d0346963cf794416ac7946c1c44ef",
              "to":"0xadde966a9ad21ce44ba2c5ab4ff38c2da0127a6b",
              "cumulativeGasUsed":"0x61a80",
              "gasUsed":"0x61a80",
              "contractAddress":"0xadde966a9ad21ce44ba2c5ab4ff38c2da0127a6b",
              "logs":[
                {
                  "address":"0xadde966a9ad21ce44ba2c5ab4ff38c2da0127a6b",
                  "blockHash":"0xa4d40030da652512fe78bbbaaa1d1063a07ecbe8217282f22414e1dae0e9d05f",
                  "blockNumber":"0x748bef",
                  "data":"0x000000000000000000000000000000000000000000000000000000000000008f0000000000000000000000008b6b417d086d0346963cf794416ac7946c1c44ef0000000000000000000000000000000000000000000000000000000066b5fde9000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000050001d45d2e8cf5861b3197526cb5d1c95deddf5b1e55a3892eac310a3dee077900000000000000000000000000000000000000000000000000000000000bbd010000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000008f000000000000000000000000000000000000000000000000000000000000008f000000000000000000000000000000000000000000000000000000000000008f000000000000000000000000000000000000000000000000000000000000008f000000000000000000000000000000000000000000000000000000000000008f00000000000000000000000000000000000000000000000000000000000000050001020304000000000000000000000000000000000000000000000000000000",
                  "logIndex":"0x0",
                  "removed":false,
                  "topics":[
                    "0xc797025feeeaf2cd924c99e9205acb8ec04d5cad21c41ce637a38fb6dee6016a",
                    "0x000000000000000000000000000000000000000000000000000000000000025b"
                  ],
                  "transactionHash":"0x826a2d230af4e2497ded7be5584c63922cd487d36cf2e22d3be666965c7e3e82",
                  "transactionIndex":"0x0"
                },
                {
                  "address":"0xadde966a9ad21ce44ba2c5ab4ff38c2da0127a6b",
                  "blockHash":"0xa4d40030da652512fe78bbbaaa1d1063a07ecbe8217282f22414e1dae0e9d05f",
                  "blockNumber":"0x748bef",
                  "data":"0x0000000000000000000000000000000000000000000000000000000066b5fde9",
                  "logIndex":"0x1",
                  "removed":false,
                  "topics":[
                    "0x0109fc6f55cf40689f02fbaad7af7fe7bbac8a3d2186600afc7d3e10cac60271",
                    "0x000000000000000000000000000000000000000000000000000000000000025b",
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                  ],
                  "transactionHash":"0x826a2d230af4e2497ded7be5584c63922cd487d36cf2e22d3be666965c7e3e82",
                  "transactionIndex":"0x0"
                },
                {
                  "address":"0xadde966a9ad21ce44ba2c5ab4ff38c2da0127a6b",
                  "blockHash":"0xa4d40030da652512fe78bbbaaa1d1063a07ecbe8217282f22414e1dae0e9d05f",
                  "blockNumber":"0x748bef",
                  "data":"0x0000000000000000000000000000000000000000000000000000000066b5fdfe",
                  "logIndex":"0x2",
                  "removed":false,
                  "topics":[
                    "0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f",
                    "0x000000000000000000000000000000000000000000000000000000000000008f",
                    "0x000000000000000000000000000000000000000000000000000000000000025b"
                  ],
                  "transactionHash":"0x826a2d230af4e2497ded7be5584c63922cd487d36cf2e22d3be666965c7e3e82",
                  "transactionIndex":"0x0"
                }
              ],
              "logsBloom":"0x00000000000000000000000004000000000000000000000000004000000000000000000000000000001000000000000000000000000200000000000000000000000000000000000000000000002000000000000001000000000000000000000000000000020000000000000000000800000000000000000000000000000000000000000000000000000000000000000080000481000000000000000400000000000000001000000000000000000000000001000000000000000000000000000100000000000000000000000000000000000000000000000000000000000820000000000020000000000000000000000000000000000800000000080000000000",
              "transactionHash":"0x826a2d230af4e2497ded7be5584c63922cd487d36cf2e22d3be666965c7e3e82",
              "transactionIndex":"0x0",
              "effectiveGasPrice":"0x15896dfd000",
              "status":"0x1",
              "type":"0x0"
            }
          ],
          "expectedReceiptsRootHash":"0x26e8daebf7e0e683dfbc170c04005652ca0b0da3af1aecb2bc99236240aff6c8"
        },
        "two transactions in block with three emitted events":{
          "receipts":[
            {
              "blockHash":"0xe7c61dee307cdec97c2ce610be4ba864b87bb30a73bd40a40d02628132adf3c7",
              "blockNumber":"0x6ecde7",
              "from":"0x2ed4df6ec66f55a5765def0a24bfa3bac29e795e",
              "to":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "cumulativeGasUsed":"0x16a0a",
              "gasUsed":"0x5a27",
              "contractAddress":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "logs":[
                {
                  "address":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
                  "blockHash":"0xe7c61dee307cdec97c2ce610be4ba864b87bb30a73bd40a40d02628132adf3c7",
                  "blockNumber":"0x6ecde7",
                  "data":"0x",
                  "logIndex":"0x0",
                  "removed":false,
                  "topics":[
                    "0xebabb8070f229c27fa01b2aa03d2d4924a5527adcc8ad312d3341e1cf67ba0bc",
                    "0x0000000000000000000000002ed4df6ec66f55a5765def0a24bfa3bac29e795e"
                  ],
                  "transactionHash":"0xe55b38639d21a0324dc25d787e9a89df2eee3f1ceec4e00b0ce8722f81d5ffe8",
                  "transactionIndex":"0x1"
                }
              ],
              "logsBloom":"0x00000000000000000100000000000000000000000100000040000000000000000000000000000000000000000000000000000000000000000800000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000002000000000000000000000000000000000000000000000000000000000000200",
              "transactionHash":"0xe55b38639d21a0324dc25d787e9a89df2eee3f1ceec4e00b0ce8722f81d5ffe8",
              "transactionIndex":"0x1",
              "effectiveGasPrice":"0x15896dfd000",
              "status":"0x1",
              "type":"0x2"
            },
            {
              "blockHash":"0xe7c61dee307cdec97c2ce610be4ba864b87bb30a73bd40a40d02628132adf3c7",
              "blockNumber":"0x6ecde7",
              "from":"0x2ed4df6ec66f55a5765def0a24bfa3bac29e795e",
              "to":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "cumulativeGasUsed":"0x16a0a",
              "gasUsed":"0x10fe3",
              "contractAddress":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "logs":[
                {
                  "address":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
                  "blockHash":"0xe7c61dee307cdec97c2ce610be4ba864b87bb30a73bd40a40d02628132adf3c7",
                  "blockNumber":"0x6ecde7",
                  "data":"0x",
                  "logIndex":"0x0",
                  "removed":false,
                  "topics":[
                    "0xebabb8070f229c27fa01b2aa03d2d4924a5527adcc8ad312d3341e1cf67ba0bc",
                    "0x0000000000000000000000002ed4df6ec66f55a5765def0a24bfa3bac29e795e"
                  ],
                  "transactionHash":"0x2b468ad98aa8011641e6edba542e03e5c1d7b304016450425865b4bdbfeccdca",
                  "transactionIndex":"0x2"
                },
                {
                  "address":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
                  "blockHash":"0xe7c61dee307cdec97c2ce610be4ba864b87bb30a73bd40a40d02628132adf3c7",
                  "blockNumber":"0x6ecde7",
                  "data":"0x00000000000000000000000000000000000000000000000000000000000003e8",
                  "logIndex":"0x1",
                  "removed":false,
                  "topics":[
                    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000002ed4df6ec66f55a5765def0a24bfa3bac29e795e"
                  ],
                  "transactionHash":"0x2b468ad98aa8011641e6edba542e03e5c1d7b304016450425865b4bdbfeccdca",
                  "transactionIndex":"0x2"
                }
              ],
              "logsBloom":"0x00000000000000000100000000000000000000000100000040000000000000000000000000000000000000000000000000000000000000000800000000000000000000100000000000000008000000000000000000000000000000000000000000000000020000000000000000000800000000000000000000000010000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000040000000000000000000000020002000000000000000000000000000000000000000000000000000000000000200",
              "transactionHash":"0x2b468ad98aa8011641e6edba542e03e5c1d7b304016450425865b4bdbfeccdca",
              "transactionIndex":"0x2",
              "effectiveGasPrice":"0x15896dfd000",
              "status":"0x1",
              "type":"0x2"
            }
          ],
          "expectedReceiptsRootHash":"0x5ffe7faca7daf7aa50d75cd01c131447936e2e746309dc36eb9152d67766c427"
        },
        "three transactions in block with four emitted events":{
          "receipts":[
            {
              "blockHash":"0xad7644f17633d222dad2e3ebfcde07f43f06251941942db5e3b43a77bc6a8ef4",
              "blockNumber":"0x76fc4d",
              "from":"0x2ed4df6ec66f55a5765def0a24bfa3bac29e795e",
              "to":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "cumulativeGasUsed":"0xe45a",
              "gasUsed":"0x5a1b",
              "contractAddress":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "logs":[
                {
                  "address":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
                  "blockHash":"0xad7644f17633d222dad2e3ebfcde07f43f06251941942db5e3b43a77bc6a8ef4",
                  "blockNumber":"0x76fc4d",
                  "data":"0x",
                  "logIndex":"0x0",
                  "removed":false,
                  "topics":[
                    "0xebabb8070f229c27fa01b2aa03d2d4924a5527adcc8ad312d3341e1cf67ba0bc",
                    "0x0000000000000000000000002ed4df6ec66f55a5765def0a24bfa3bac29e795e"
                  ],
                  "transactionHash":"0xd6f0f31a16b68aa8f70f8a99e72eec8c4bdfe8bde9241444109d2bbbc009a574",
                  "transactionIndex":"0x3"
                }
              ],
              "logsBloom":"0x00000000000000000100000000000000000000000100000040000000000000000000000000000000000000000000000000000000000000000800000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000002000000000000000000000000000000000000000000000000000000000000200",
              "transactionHash":"0xd6f0f31a16b68aa8f70f8a99e72eec8c4bdfe8bde9241444109d2bbbc009a574",
              "transactionIndex":"0x3",
              "effectiveGasPrice":"0x1792f864800",
              "status":"0x1",
              "type":"0x2"
            },
            {
              "blockHash":"0xad7644f17633d222dad2e3ebfcde07f43f06251941942db5e3b43a77bc6a8ef4",
              "blockNumber":"0x76fc4d",
              "from":"0x2ed4df6ec66f55a5765def0a24bfa3bac29e795e",
              "to":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "cumulativeGasUsed":"0xe45a",
              "gasUsed":"0x8a3f",
              "contractAddress":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
              "logs":[
                {
                  "address":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
                  "blockHash":"0xad7644f17633d222dad2e3ebfcde07f43f06251941942db5e3b43a77bc6a8ef4",
                  "blockNumber":"0x76fc4d",
                  "data":"0x",
                  "logIndex":"0x0",
                  "removed":false,
                  "topics":[
                    "0xebabb8070f229c27fa01b2aa03d2d4924a5527adcc8ad312d3341e1cf67ba0bc",
                    "0x0000000000000000000000002ed4df6ec66f55a5765def0a24bfa3bac29e795e"
                  ],
                  "transactionHash":"0xaeb18f24dd9e4c4ac105bdec11b767a820aa34390c00275e8c87a2a338048535",
                  "transactionIndex":"0x4"
                },
                {
                  "address":"0x77da15d10856a86a8017f833873abb7f1f1cb9f3",
                  "blockHash":"0xad7644f17633d222dad2e3ebfcde07f43f06251941942db5e3b43a77bc6a8ef4",
                  "blockNumber":"0x76fc4d",
                  "data":"0x0000000000000000000000000000000000000000000000000000000000000001",
                  "logIndex":"0x1",
                  "removed":false,
                  "topics":[
                    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000002ed4df6ec66f55a5765def0a24bfa3bac29e795e"
                  ],
                  "transactionHash":"0xaeb18f24dd9e4c4ac105bdec11b767a820aa34390c00275e8c87a2a338048535",
                  "transactionIndex":"0x4"
                }
              ],
              "logsBloom":"0x00000000000000000100000000000000000000000100000040000000000000000000000000000000000000000000000000000000000000000800000000000000000000100000000000000008000000000000000000000000000000000000000000000000020000000000000000000800000000000000000000000010000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000040000000000000000000000020002000000000000000000000000000000000000000000000000000000000000200",
              "transactionHash":"0xaeb18f24dd9e4c4ac105bdec11b767a820aa34390c00275e8c87a2a338048535",
              "transactionIndex":"0x4",
              "effectiveGasPrice":"0x1792f864800",
              "status":"0x1",
              "type":"0x2"
            },
            {
              "blockHash":"0xad7644f17633d222dad2e3ebfcde07f43f06251941942db5e3b43a77bc6a8ef4",
              "blockNumber":"0x76fc4d",
              "contractAddress":"0x0000000000000000000000000000000000475aa0",
              "cumulativeGasUsed":"0x0",
              "effectiveGasPrice":"0x17b83922c00",
              "from":"0x0000000000000000000000000000000000000000",
              "gasUsed":"0x0",
              "logs":[
                {
                  "address":"0x0000000000000000000000000000000000475aa0",
                  "blockHash":"0xad7644f17633d222dad2e3ebfcde07f43f06251941942db5e3b43a77bc6a8ef4",
                  "blockNumber":"0x76fc4d",
                  "data":"0x0000000000000000000000000000000000000000000000000000000000000001",
                  "logIndex":"0x0",
                  "removed":false,
                  "topics":[
                    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                    "0x0000000000000000000000000000000000000000000000000000000000000552",
                    "0x000000000000000000000000000000000000000000000000000000000046e50a"
                  ],
                  "transactionHash":"0x7629295205d3879a65762f1c83f14346b756929b7343de358284ba162f785142",
                  "transactionIndex":"0x1"
                }
              ],
              "logsBloom":"0x00000000000000000000000000000000000000000000000000000000002002000000000000000000000000002000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000001000001000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000100000000000000000000000000002000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000800",
              "root":"0x0000000000000000000000000000000000000000000000000000000000000000",
              "status":"0x1",
              "to":"0x0000000000000000000000000000000000475aa0",
              "transactionHash":"0x7629295205d3879a65762f1c83f14346b756929b7343de358284ba162f785142",
              "transactionIndex":"0x1",
              "type":null
            }
          ],
          "expectedReceiptsRootHash":"0x17b85b1d8bde193ffa21f9b6601fa0c7bc4337d62461b0059485ca39a2f37802"
        }
      }
    `);

    for (const TEST_NAME in TEST_SUITES) {
      it(TEST_NAME, async () => {
        const res = await ReceiptsRootUtils.getRootHash(TEST_SUITES[TEST_NAME].receipts);
        expect(res).to.equal(TEST_SUITES[TEST_NAME].expectedReceiptsRootHash);
      });
    }
  });
});
