<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { TezosToolkit } from "@taquito/taquito";
  import { BeaconWallet } from "@taquito/beacon-wallet";
  import { NetworkType } from "@airgap/beacon-sdk";
  import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";

  let Tezos: TezosToolkit;
  let wallet: BeaconWallet;
  let subscription: HubConnection;
  let blockHead: { protocol: string; level: number; lastUpdate: string };

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
    } catch (err) {
      console.error(err);
    }
  };

  const disconnect = () => {
    wallet.client.destroy();
    wallet = undefined;
  };

  let success = false;
  let loading = false;
  let op_hash = "";
  let compoundKeyInput = 10;
  let compoundValueInput = 10;
  let simpleValueInput = 10;

  const compoundKey = async () => {
    loading = true;
    success = false;
    try {
      const contract = await Tezos.contract.at(
        "KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym"
      );
      const op = await contract.methods.compoundKey(compoundKeyInput).send();
      await op.confirmation();
      op_hash = op.hash;
    } catch (error) {
      console.log(error);
    }
    success = true;
    loading = false;
  };

  const compoundValue = async () => {
    loading = true;
    success = false;
    try {
      const contract = await Tezos.contract.at(
        "KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym"
      );
      const op = await contract.methods
        .compoundValue(compoundValueInput)
        .send();
      await op.confirmation();
      op_hash = op.hash;
    } catch (error) {
      console.log(error);
    }
    success = true;
    loading = false;
  };

  const singleValue = async () => {
    loading = true;
    success = false;
    try {
    const contract = await Tezos.contract.at(
      "KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym"
    );
    const op = await contract.methods.singleValue(simpleValueInput).send();
    await op.confirmation();
    op_hash = op.hash;
    } catch (error) {
      console.log(error);
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
    <!-- <div class="subtitle">
      <li>Compound Key bigMap: fetch and put here</li>
      <li>Compound Value bigMap: here</li>
      <li>Simple Value bigMap: here</li>
    </div> -->

    <br />
    <div>
       
      <div class="note">Update a Compound Key BigMap</div>
      <input
        type="text"
        bind:value={compoundKeyInput}
      />
      <button on:click={compoundKey}>Go!</button>
    </div>
    <br />
    <div>
      <div class="note">Update a Compound Value BigMap</div>
      <input
        type="text"
        class="amount"
        bind:value={compoundValueInput}
      />
      <button on:click={compoundValue}>Go!</button>
    </div>
    <br />
    <div>
      <div class="note">Update a Simple Value BigMap</div>
       <input
        type="text"
        class="amount"
        bind:value={simpleValueInput}
      />
      <button on:click={singleValue}>Go!</button>
    </div>
      <br /><br />
      {#if loading}
      <div class="note">... loading ...</div>        
      {:else if success}
        <br />
        <div class="note">
          The app thinks the op succeeded
        </div>
      {/if}
      <div>
        {#if wallet}
          <button on:click={disconnect}>Disconnect</button>
        {:else}
          <button on:click={connect}>Connect now!</button>
        {/if}
      </div>
      <br />
      <div class="note">
        The contract is <a
          href="https://better-call.dev/granadanet/KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym/operations"
          >here</a
        >
        <br />
        The project code is
        <a href="https://github.com/michaelkernaghan/bigmaptester">here</a>
      </div>
    </div>
</main>

<style lang="scss">
  $tezos-blue: #1b800e;

  .container {
    font-size: 20px;
    max-width: 50%;

    .title {
      color: $tezos-blue;
      font-size: 80px;
      margin: 10px;
    }

    // .subtitle {
    //   font-size: 23px;
    //   color: rgb(14, 160, 38);
    //   margin: 10px;
    // }

    .note {
      font-size: 18px;
      color: rgb(14, 160, 38);
      margin: 10px;
    }

    button {
      appearance: none;
      border: solid 2px $tezos-blue;
      border-radius: 5px;
      background-color: white;
      padding: 4px;
      font-size: 11px;
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
