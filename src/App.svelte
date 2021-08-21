<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { TezosToolkit } from "@taquito/taquito";
  import { BeaconWallet } from "@taquito/beacon-wallet";
  import { NetworkType } from "@airgap/beacon-sdk";
  import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
  import { Schema } from "@taquito/michelson-encoder";

  import Box from "./Box.svelte";

  let Tezos: TezosToolkit;
  let wallet: BeaconWallet;
  let userAddress: string;
  let subscription: HubConnection;
  let blockHead: { protocol: string; level: number; lastUpdate: string };
  let errors = {};
  let op_hash = "";
  let contractAddress = "KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym";

  const rpcUrl = "https://api.tez.ie/rpc/granadanet";

  const connect = async () => {
    try {
      wallet = new BeaconWallet({
        name: "BigMapTesting",
        preferredNetwork: NetworkType.GRANADANET,
      });
      await wallet.requestPermissions({
        network: {
          type: NetworkType.GRANADANET,
          rpcUrl,
        },
      });
      Tezos.setWalletProvider(wallet);
      userAddress = await wallet.getPKH();
    } catch (err) {
      errors = err.message;
    }
  };

  const disconnect = () => {
    wallet.client.destroy();
    Tezos.setWalletProvider(undefined);
    wallet = undefined;
    userAddress = "";
  };

  let success = false;
  let loading = false;
  let compoundKeyInput = 10;
  let compoundValueInput = 10;
  let simpleValueInput = 10;
  let compoundKeyStorage = "";
  let compoundValueStorage = "";
  let simpleValueStorage = "";

  const compoundKey = async () => {
    errors = {};
    op_hash = "";
    success = false;
    loading = true;
    try {
      const contract = await Tezos.wallet.at(contractAddress);
      const op = await contract.methods.compoundKey(compoundKeyInput).send();
      await op.confirmation();
      op_hash = op.opHash;
      compoundKeyStorage = await Tezos.contract.getBigMapKeyByID(
        "32001",
        userAddress,
        new Schema({
          prim: "big_map",
          args: [
            { prim: "pair", args: [{ prim: "address" }, { prim: "nat" }] },
            { prim: "nat" },
          ],
        })
      );
    } catch (error) {
      errors = JSON.stringify(error.message);
    }
    success = true;
    loading = false;
  };

  const compoundValue = async () => {
    errors = {};
    op_hash = "";
    loading = true;
    success = false;
    try {
      const contract = await Tezos.wallet.at(contractAddress);
      const op = await contract.methods
        .compoundValue(compoundValueInput)
        .send();
      await op.confirmation();
      op_hash = op.opHash;
      compoundValueStorage = await Tezos.contract.getBigMapKeyByID(
        "32002",
        userAddress,
        new Schema({
          prim: "big_map",
          args: [
            { prim: "address" },
            { prim: "pair", args: [{ prim: "int" }, { prim: "address" }] },
          ],
        })
      );
    } catch (error) {
      errors = JSON.stringify(error.message);
    }
    success = true;
    loading = false;
  };

  const singleValue = async () => {
    errors = {};
    op_hash = "";
    loading = true;
    success = false;
    try {
      const contract = await Tezos.wallet.at(contractAddress);
      const op = await contract.methods.singleValue(simpleValueInput).send();
      await op.confirmation();
      op_hash = op.opHash;
      simpleValueStorage = await Tezos.contract.getBigMapKeyByID(
        "32003",
        userAddress,
        new Schema({
          prim: "big_map",
          args: [{ prim: "address" }, { prim: "mutez" }],
        })
      );
    } catch (error) {
      errors = JSON.stringify(error.message);
    }
    success = true;
    loading = false;
  };

  const subscribeToEvents = async () => {
    const connection = new HubConnectionBuilder()
      .withUrl("https://api.tzkt.io/v1/events")
      .build();

    // auto-reconnect
    connection.onclose(subscribeToEvents);

    connection.on("head", (msg) => {
      blockHead = {
        protocol: msg.data.protocol,
        level: msg.data.level,
        lastUpdate: msg.data.timestamp,
      };
    });

    // open connection
    await connection.start();
    // subscribe to head
    await connection.invoke("SubscribeToHead");
    // return connection instance
    return connection;
  };

  onMount(async () => {
    Tezos = new TezosToolkit(rpcUrl);
    wallet = new BeaconWallet({
      name: "BigMapTesting",
      preferredNetwork: NetworkType.GRANADANET,
    });
    const activeAccount = await wallet.client.getActiveAccount();
    if (activeAccount) {
      userAddress = activeAccount.address;
      Tezos.setWalletProvider(wallet);
    }
    const headerInfo = await Tezos.rpc.getBlockHeader();
    blockHead = {
      protocol: headerInfo.protocol,
      level: headerInfo.level,
      lastUpdate: headerInfo.timestamp,
    };
    subscription = await subscribeToEvents();
  });

  onDestroy(async () => {
    // closes subscription when component unmounts
    await subscription.stop();
  });
</script>

<main>
  <div class="container">
    <div class="title">Test BigMaps!</div>
    <div>
      {#if userAddress}
        <div class="welcome">Welcome {userAddress}!</div>
        <Box>
          <div>
            <div class="note">Update a Compound Key BigMap!</div>
            <input type="text" bind:value={compoundKeyInput} />
            <button on:click={compoundKey}>Go!</button>
            <div class="storage">
              New Compound Key Storage: {compoundKeyStorage[1]}
            </div>
          </div>
        </Box>
        <Box>
          <div>
            <div class="note">Update a Compound Value BigMap!</div>
            <input type="text" class="amount" bind:value={compoundValueInput} />
            <button on:click={compoundValue}>Go!</button>
            <div class="storage">
              New Compound Value Storage: {compoundValueStorage[0]}
            </div>
          </div>
        </Box>
        <Box>
          <div>
            <div class="note">Update a Simple Value BigMap!</div>
            <input type="text" class="amount" bind:value={simpleValueInput} />
            <button on:click={singleValue}>Go!</button>
            <div class="storage">
              New Simple Value Storage: {simpleValueStorage}
            </div>
          </div></Box
        >
        <div class="footer">
          See the operations <a
            href="https://better-call.dev/granadanet/KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym/operations"
            >here</a
          >!
        </div>
        <div>
          <button on:click={disconnect}>Close wallet!</button>
        </div>
        {#if loading}
          <br />
          <img src={"images/CatlickingPaw.gif"} alt="loading..." />
        {:else if success}
          {#if errors > {}}
            <div class="errormessage">
              {errors}
            </div>
            <br />
          {:else}
            <div class="success">Success! op.hash is {op_hash}!</div>
          {/if}
        {/if}
      {:else}
        <button on:click={connect}>Open a wallet!</button>
      {/if}
    </div>
    <div>
      {#if blockHead}
        <div class="chain-info">
          <p>Protocol: {blockHead.protocol}</p>
          <p>Level: {blockHead.level}</p>
          <p>Block timestamp: {blockHead.lastUpdate}</p>
        </div>
      {/if}
      <div class="footer">
        <p />
        Created with
        <a
          href="https://tezostaquito.io/"
          target="_blank"
          rel="noopener noreferrer nofollow">Taquito</a
        >! The project code is
        <a href="https://github.com/michaelkernaghan/bigmaptester">here</a>!
      </div>
    </div>
  </div>
</main>

<style lang="scss">
  $tezos-blue: #178309;
  $tezos-red: #ec1010;
  @import url("https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Permanent+Marker&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Racing+Sans+One&family=Yanone+Kaffeesatz&display=swap");

  :global(body) {
    background-color: rgb(245, 245, 146);
  }

  // .errormessage {
  //   color: red;
  //   font-size: 18px;
  //   font-family: "Racing Sans One", cursive;
  // }

  .container {
    font-size: 20px;
    max-width: 100%;

    .title {
      color: $tezos-blue;
      font-family: "Racing Sans One", cursive;
      font-size: 80px;
      //margin: 10px;
    }

    .chain-info {
      font-size: 15px;
      font-family: "Racing Sans One", cursive;

      p {
        margin: 5px;
        font-style: italic;
        color: $tezos-blue;
      }
    }

    .note {
      font-size: 18px;
      font-family: "Racing Sans One", cursive;
      color: $tezos-blue;
      margin: 10px;
    }

    .storage {
      font-size: 16px;
      font-family: "Racing Sans One", cursive;
      color: rgb(28, 134, 221);
      margin: 10px;
    }

    .welcome {
      font-size: 20px;
      font-family: "Racing Sans One", cursive;
      color: rgb(28, 134, 221);
      margin: 10px;
    }

    .success {
      font-size: 16px;
      font-family: "Racing Sans One", cursive;
      color: $tezos-red;
      margin: 10px;
    }

    .footer {
      font-size: 0.7rem;
      text-align: center;
      align-items: center;
      font-family: "Racing Sans One", cursive;
      color: $tezos-blue;

      a {
        color: #f52d1b;
        text-decoration: none;
      }
    }

    button {
      margin: 10px;
      appearance: none;
      border: solid 2px $tezos-blue;
      border-radius: 5px;
      background-color: white;
      padding: 4px;
      font-size: 11px;
      font-family: "Racing Sans One", cursive;
      color: $tezos-blue;
      transition: 0.3s;
      cursor: pointer;
      outline: none;

      &:hover {
        color: white;
        background-color: $tezos-blue;
      }
    }
  }
</style>
