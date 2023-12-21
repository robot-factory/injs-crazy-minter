"use client";

import React, { useCallback, useRef, useState } from "react";
import { getQueryClient } from "@sei-js/core";
// import { HdPath, stringToPath } from "@cosmjs/crypto";
import { getNetworkInfo, Network } from "@injectivelabs/networks";

import {
  MsgSend,
  PrivateKey,
  TxClient,
  TxGrpcClient,
  // DEFAULT_STD_FEE,
  ChainRestAuthApi,
  createTransaction,
} from "@injectivelabs/sdk-ts";
import { BigNumberInBase } from "@injectivelabs/utils";
// import { BigNumber } from "bignumber.js";
import Link from "next/link";

const network = getNetworkInfo(Network.Mainnet);

const Minter: React.FC = () => {
  const [mnemonic, setMnemonic] = useState<string>("");
  const [isEnd, setIsEnd] = useState<boolean>(false);
  const isEndRef = useRef<boolean>(false);
  isEndRef.current = isEnd;
  const [logs, setLogs] = useState<string[]>([]);
  const [count, setCount] = useState<number>(0);

  const mintFn = useCallback(async (privateKey: PrivateKey) => {
    try {
      const injectiveAddress = privateKey.toBech32();

      const amount = {
        amount: new BigNumberInBase(0.000001).toWei().toFixed(),
        denom: "inj",
      };

      const publicKey = privateKey.toPublicKey().toBase64();

      const accountDetails = await new ChainRestAuthApi(
        network.rest
      ).fetchAccount(injectiveAddress);

      const msg = MsgSend.fromJSON({
        amount,
        srcInjectiveAddress: injectiveAddress,
        dstInjectiveAddress: injectiveAddress,
      });

      const { signBytes, txRaw } = createTransaction({
        message: msg,
        memo: btoa(
          `data:,{"p":"injrc-20","op":"mint","tick":"INJS","amt":"1000"}`
        ), //data:,{"p":"injrc-20","op":"mint","tick":"INJS","amt":"2000"}
        fee: {
          amount: [
            {
              amount: "2000000000000000",
              denom: "inj",
            },
          ],
          gas: "400000",
        },
        pubKey: publicKey,
        sequence: parseInt(accountDetails.account.base_account.sequence, 10),
        accountNumber: parseInt(
          accountDetails.account.base_account.account_number,
          10
        ),
        chainId: network.chainId,
      });

      const signature = await privateKey.sign(Buffer.from(signBytes));

      /** Append Signatures */
      txRaw.signatures = [signature];

      /** Calculate hash of the transaction */
      console.log(`Transaction Hash: ${TxClient.hash(txRaw)}`);

      const txService = new TxGrpcClient(network.grpc);

      /** Simulate transaction */
      const simulationResponse = await txService.simulate(txRaw);
      console.log(
        `Transaction simulation response: ${JSON.stringify(
          simulationResponse.gasInfo
        )}`
      );

      /** Broadcast transaction */
      const txResponse = await txService.broadcast(txRaw);
      console.log(txResponse);
      setCount((prev) => prev + 1);
      setLogs((pre) => [...pre, `铸造完成, txhash: ${TxClient.hash(txRaw)}`]);
    } catch (e) {
      // sleep 1s
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, []);

  const walletMint = useCallback(
    async (m: string) => {
      // const wallet = await generateWalletFromMnemonic(m);
      const denom = "inj";

      const priv = PrivateKey.fromMnemonic(m);
      const address = priv.toAddress();
      console.log(Buffer.from(priv.toPrivateKeyHex().slice(2)).length);
      // const wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(priv.toPrivateKeyHex().slice(2)), chain);
      setLogs((pre) => [...pre, `成功导入钱包: ${address.address}`]);

      const queryClient = await getQueryClient(
        "https://sentry.lcd.injective.network:443"
      );
      const result = await queryClient.cosmos.bank.v1beta1.balance({
        address: address.address,
        denom,
      });
      const balance = result.balance;
      setLogs((pre) => [...pre, `账户余额为:${balance.amount}`]);

      if (Number(balance.amount) === 0) {
        setLogs((pre) => [...pre, `账户余额不足`]);
        // return;
      }

      while (true) {
        if (isEndRef.current) {
          setLogs((pre) => [...pre, `暂停铸造`]);
          break;
        }
        await mintFn(priv);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    },
    [mintFn]
  );

  const handleMint = async () => {
    setIsEnd(false);
    setLogs((pre) => [...pre, `开始铸造`]);

    // 验证助记词
    if (!mnemonic) {
      setLogs((pre) => [...pre, `请输入助记词`]);
      return;
    }
    const walletMnemonics = mnemonic.split(",");

    for (let i = 0; i < walletMnemonics.length; i++) {
      walletMint(walletMnemonics[i]);
    }
  };

  const handleEnd = () => {
    setIsEnd(true);
    isEndRef.current = true;
  };

  return (
    <div className="flex flex-col items-center">
      <h1>injs疯狂铸造脚本</h1>
      <p className="text-xs mt-2 text-gray-400">打到账户没钱为止</p>
      <div className="text-xs w-[400px] mt-6">
        <span>injs项目地址：</span>
        <Link className="underline" target="_blank" href="https://injs.ink/">
          https://injs.ink/
        </Link>
      </div>
      <div className="text-xs w-[400px] mt-2">
        <span>injs项目文档：</span>
        <Link
          className="underline"
          target="_blank"
          href="https://docs.injs.ink/mint-injs"
        >
          https://docs.injs.ink/mint-injs
        </Link>
      </div>
      <div className="text-xs w-[400px] mt-2">
        <span>injs项目推特：</span>
        <Link
          className="underline"
          target="_blank"
          href="https://twitter.com/inj_inscription"
        >
          https://twitter.com/inj_inscription
        </Link>
      </div>
      <div>
        <textarea
          className="mt-2 border border-black rounded-xl w-[400px] px-4 py-6 resize-none h-[220px]"
          placeholder="请输入助记词，比如：jazz bench loan chronic ready pelican travel charge lunar pear detect couch。当有多的账号的时候，用,分割，比如:jazz bench loan chronic ready pelican travel charge lunar pear detect couch,black clay figure average spoil insane hire typical surge still brown object"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
        />
      </div>
      <div className="flex w-[400px] justify-center space-x-6 mt-4">
        <button
          className="border border-black px-4 py-2 rounded-full"
          onClick={handleMint}
        >
          开始铸造
        </button>
        <button
          className="border border-black px-4 py-2 rounded-full"
          onClick={handleEnd}
        >
          暂停
        </button>
      </div>

      <span className="mt-6 w-[400px] text-left">{`日志(本次已铸造+${count})`}</span>
      <div className="px-4 py-2 whitespace-pre border border-black w-[400px] h-[400px] overflow-auto">
        {logs.join("\n")}
      </div>
    </div>
  );
};

export default Minter;
