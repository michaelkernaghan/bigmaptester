<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { TezosToolkit } from "@taquito/taquito";
  import { BeaconWallet } from "@taquito/beacon-wallet";
  import { NetworkType } from "@airgap/beacon-sdk";
  import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
  import { Schema } from "@taquito/michelson-encoder";

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
    wallet = undefined;
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
    <br />
    <div>
      {#if userAddress}
        <div class="welcome">Welcome {userAddress}!</div>
        <br />
        <div>
          <div class="note">Update a Compound Key BigMap</div>
          <input type="text" bind:value={compoundKeyInput} />
          <button on:click={compoundKey}>Go!</button>
          <div class="storage">
            New Compound Key Storage: {compoundKeyStorage}
          </div>
        </div>
        <br />
        <div>
          <div class="note">Update a Compound Value BigMap</div>
          <input type="text" class="amount" bind:value={compoundValueInput} />
          <button on:click={compoundValue}>Go!</button>
          <div class="storage">
            New Compound Value Storage: {compoundValueStorage[0]}
          </div>
        </div>
        <br />
        <div>
          <div class="note">Update a Simple Value BigMap</div>
          <input type="text" class="amount" bind:value={simpleValueInput} />
          <button on:click={singleValue}>Go!</button>
          <div class="storage">
            New Simple Value Storage: {simpleValueStorage}
          </div>
        </div>
        <!-- <p /> -->
        {#if loading}
          <br />
          <br />
          <img src={"images/spinning_arrows.gif"} alt="loading..." />
        {:else if success}
          {#if errors > {} }
            <div class="errormessage">
              {errors}
            </div>
            <br />
          {:else}
            <div class="success">Success! Operation Hash is {op_hash}</div>
          {/if}
        {/if}
      {:else}
        <button on:click={connect}>Open a wallet!</button>
        <br /><br />
        <br />
      {/if}
    </div>
    <br />
    <div>
      <div class="note">
        See the operations <a
          href="https://better-call.dev/granadanet/KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym/operations"
          >here</a
        >
        <br /><br />
        The project code is
        <a href="https://github.com/michaelkernaghan/bigmaptester">here</a>
      </div>
      <br />
      {#if blockHead}
        <div class="chain-info">
          <p>Protocol: {blockHead.protocol}</p>
          <p>Level: {blockHead.level}</p>
          <p>Block timestamp: {blockHead.lastUpdate}</p>
        </div>
      {/if}
      <br />
      <!-- <button on:click={disconnect}>Close wallet!</button> -->
    </div>
    <br />
  </div>
</main>

<style lang="scss">
  $tezos-blue: #178309;
  $tezos-red: #ec1010;
  @import url("https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Permanent+Marker&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Racing+Sans+One&family=Yanone+Kaffeesatz&display=swap");

  :global(body) {
    background-color: rgb(245, 245, 206);
    //   //  background-image: url("https://www.uni-due.de/IERC/Ortelius_(1592).jpg?height=1200&width=1600");
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
      margin: 10px;
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
      font-size: 24px;
      font-family: "Racing Sans One", cursive;
      color: rgb(28, 134, 221);
      margin: 10px;
    }

    .success {
      font-size: 18px;
      font-family: "Racing Sans One", cursive;
      color: $tezos-red;
      margin: 10px;
    }

    button {
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
