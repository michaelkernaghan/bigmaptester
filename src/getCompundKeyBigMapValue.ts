/** Call a big map testing contract and use GetBigMapKeyBYID to get 
 * values from the storage for the compound key endpoint */

import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { Schema } from '@taquito/michelson-encoder';
import { Parser } from '@taquito/michel-codec'

let user_address = "tz1cDS63XNguugZvyYYYxX8mHLNP6NBSVNbT";
let contractAddress = "KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym";

(async () => {
  try {
    const Tezos = new TezosToolkit("https://api.tez.ie/rpc/granadanet");
    const signer = new InMemorySigner("edskRzSh12r8guDFUwB2gHW9VkDdn6dUyL4cxrVzGCFX8Tp8PGDpQnzfLcMFqhExbJnXd7TGiAH7uiSBk1ktjzkLZVC2VvD82H");
    Tezos.setSignerProvider(signer);   

    // Get the schema for the storage
    const example_storage_in_michelson = `(big_map (pair address nat) nat)`
    const p = new Parser()
    const parsed_storage = p.parseMichelineExpression(example_storage_in_michelson )
    console.log("Use this schema: "+JSON.stringify( parsed_storage ))  

    const contract = await Tezos.contract.at(contractAddress);
   
    const nat_value = await Tezos.contract.getBigMapKeyByID(
        "32001", user_address,
        new Schema({"prim":"big_map","args":[{"prim":"pair","args":[{"prim":"address"},{"prim":"nat"}]},{"prim":"nat"}]})
    );

    console.log("The value in the compound key storage is: "+nat_value);
    console.log("Contract entrypoints are: "+contract.entrypoints);
    
  } catch (error){
    console.log(error)
  }
})()