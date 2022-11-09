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
  let contractAddress = "KT1VYzA14jcsMZn1cotwQEofhrvjgiUuymG1";
  let create_remove_contractAddress = "KT1WNsLE1Xgv8xtZqadQQHq9XDTmZdsmYkJA";

  const rpcUrl = "https://ghostnet.ecadinfra.com";

  const connect = async () => {
    try {
      wallet = new BeaconWallet({
        name: "BigMapTesting",
        preferredNetwork: NetworkType.GHOSTNET
      });
      await wallet.requestPermissions({
        network: {
          type: NetworkType.GHOSTNET,
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
  let simpleValueInput = 6;
  let compoundValueInput = 3141;
  let compoundKeyInput = 117;
  let compoundKeyCompoundValueInput = 934;
  let simpleValueStorage = "";
  let compoundValueStorage = "";
  let compoundKeyStorage = "";
  let compoundKeyCompoundValueStorage = "";
  let createBigMapStorage = "";
  let removeBigMapStorage = "";
  let beforeRemovalBigMapStorage = "";
  let afterRemovalBigMapStorage = "";

  const compoundKeyCompoundValue = async () => {
    errors = {};
    op_hash = "";
    success = false;
    loading = true;
    try {
      const contract = await Tezos.wallet.at(contractAddress);
      const op = await contract.methods
        .compoundKeyCompoundValue(compoundKeyCompoundValueInput)
        .send();
      await op.confirmation();
      op_hash = op.opHash;
      const storage: any = await contract.storage();
      compoundKeyCompoundValueStorage =
        await storage.compound_keys_compound_values.get({
          0: userAddress,
          1: compoundKeyCompoundValueInput,
        });
      console.log(
        "result is: " + JSON.stringify(compoundKeyCompoundValueStorage)
      );
    } catch (error) {
      errors = JSON.stringify(error.message);
    }

    success = true;
    loading = false;
  };

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
      const storage: any = await contract.storage();
      compoundKeyStorage = await storage.compound_keys.get({
        0: "tz1cDS63XNguugZvyYYYxX8mHLNP6NBSVNbT",
        1: compoundKeyInput,
      });
      console.log("result is: " + compoundKeyStorage);
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
        "36361",
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
        "36362",
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

  const createBigMap = async () => {
    errors = {};
    op_hash = "";
    loading = true;
    success = false;
    try {
      const contract = await Tezos.wallet.at(create_remove_contractAddress);
      const op = await contract.methods.createBigMap("unit").send();
      await op.confirmation();
      op_hash = op.opHash;
      createBigMapStorage = await contract.storage();
      console.log("BigMap Id is: " + createBigMapStorage);
    } catch (error) {
      errors = JSON.stringify(error.message);
    }
    success = true;
    loading = false;
  };

  const removeBigMap = async () => {
    errors = {};
    op_hash = "";
    loading = true;
    success = false;
    try {
      const contract = await Tezos.wallet.at(create_remove_contractAddress);
      beforeRemovalBigMapStorage = await contract.storage();
      console.log("Before removal result is: " + beforeRemovalBigMapStorage);
      const op = await contract.methods.removeBigMap("unit").send();
      await op.confirmation();
      op_hash = op.opHash;
      afterRemovalBigMapStorage = await contract.storage();
      //afterRemovalBigMapStorage = await storage.removeBigMap.get('tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN', { 0: 1, 1: 2 });
      console.log("After removal result is: " + afterRemovalBigMapStorage);
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
      preferredNetwork: NetworkType.GHOSTNET
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
    <div class="title">Tezos BigMaps CRUD!</div>
    <div>
      {#if userAddress}
        <div class="welcome">Welcome {userAddress}!</div>
        <br />
        <div class="columns">
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
          <Box>
            <div>
              <div class="note">Update a Compound Value BigMap!</div>
              <input
                type="text"
                class="amount"
                bind:value={compoundValueInput}
              />
              <button on:click={compoundValue}>Go!</button>
              <div class="storage">
                New Compound Value Storage: {JSON.stringify(
                  compoundValueStorage
                )}
              </div>
            </div>
          </Box>
          <Box>
            <div>
              <div class="note">Create a BigMap!</div>
              <button on:click={createBigMap}>Go!</button>
              <div class="storage">
                New Big Map Id: {JSON.stringify(createBigMapStorage)}!
              </div>
            </div>
          </Box>
          <Box>
            <div>
              <div class="note">Update a Compound Key BigMap!</div>
              <input type="text" class="amount" bind:value={compoundKeyInput} />
              <button on:click={compoundKey}>Go!</button>
              <div class="storage">
                New Compound Key Storage: {compoundKeyStorage}
              </div>
            </div>
          </Box>
          <Box>
            <div>
              <div class="note">
                Update a Compound Key Compound Value BigMap!
              </div>
              <input
                type="text"
                class="amount"
                bind:value={compoundKeyCompoundValueInput}
              />
              <button on:click={compoundKeyCompoundValue}>Go!</button>
              <div class="storage">
                New Compound Key Compound Value Storage: {JSON.stringify(
                  compoundKeyCompoundValueStorage
                )}
              </div>
            </div>
          </Box>
          <Box>
            <div>
              <div class="note">Remove a BigMap!</div>
              <button on:click={removeBigMap}>Go!</button>
              <div class="storage">
                Before Storage: {JSON.stringify(beforeRemovalBigMapStorage)}!  After Storage: {JSON.stringify(afterRemovalBigMapStorage)}!   
              </div>
            </div>
          </Box>
        </div>
        <div class="footer">
          See the operations <a
            href="https://better-call.dev/ghostnet/KT1VYzA14jcsMZn1cotwQEofhrvjgiUuymG1/operations"
            >here</a
          >
          and
          <a
            href="https://better-call.dev/ghostnet/KT1WNsLE1Xgv8xtZqadQQHq9XDTmZdsmYkJA/operations"
            >here</a
          >!
        </div>
        <div>
          <button on:click={disconnect}>Disconnect wallet!</button>
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
            <div class="success">Request sent! op.hash is {op_hash}!</div>
          {/if}
        {/if}
      {:else}
        <button on:click={connect}>Connect a wallet!</button>
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
        <a href="https://github.com/michaelkernaghan/bigmaptester">V.1.1</a>
        created with
        <a
          href="https://tezostaquito.io/"
          target="_blank"
          rel="noopener noreferrer nofollow">Taquito</a
        >!
      </div>
    </div>
  </div>
</main>

<style lang="scss">
  $tezos-blue: rgb(85, 5, 85);
  $tezos-red: #ec1010;
  @import url("https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Permanent+Marker&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Racing+Sans+One&family=Yanone+Kaffeesatz&display=swap");

  :global(body) {
    background-color: #ecec8f;
  }

  .errormessage {
    color: red;
    font-size: 18px;
    font-family: "Racing Sans One", cursive;
  }

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
      font-size: 16px;
      font-family: "Racing Sans One", cursive;
      color: $tezos-blue;
      margin: 5px;
    }

    .storage {
      font-size: 14px;
      font-family: "Racing Sans One", cursive;
      color: brown;
      margin: 5px;
    }

    .welcome {
      font-size: 18px;
      font-family: "Racing Sans One", cursive;
      color: brown;
      margin: 8px;
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
  .columns {
    columns: 100px 2;
  }
</style>
