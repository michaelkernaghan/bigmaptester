
/** The code used in the replit : https://replit.com/@MichaelKernagha/GetCompoundKeyBigMapValue#index.ts */

import { TezosToolkit } from "@taquito/taquito";

import { InMemorySigner } from "@taquito/signer";
import { MichelsonMap, Schema } from '@taquito/michelson-encoder';
import { Parser } from '@taquito/michel-codec'

let user_address = "tz1cDS63XNguugZvyYYYxX8mHLNP6NBSVNbT";
let contractAddress = "KT1Sze6kE3veYrx9ep4ThdKvAa2KS1peAuym";
let op_hash = '';

(async () => {
  try {
    const Tezos = new TezosToolkit("https://api.tez.ie/rpc/granadanet");
    
    const signer = new InMemorySigner("edskRzSh12r8guDFUwB2gHW9VkDdn6dUyL4cxrVzGCFX8Tp8PGDpQnzfLcMFqhExbJnXd7TGiAH7uiSBk1ktjzkLZVC2VvD82H");
    Tezos.setSignerProvider(signer);   

    //  const example_storage_in_michelson = `(big_map (pair address nat) nat)`
    //  const p = new Parser()
    //  const parsed_storage = p.parseMichelineExpression(example_storage_in_michelson )
    //  console.log(JSON.stringify(parsed_storage ))  

    const contract = await Tezos.contract.at(contractAddress);
   
    //compound_keys
         const result1 = await Tezos.contract.getBigMapKeyByID(
              "32001", user_address,
              new Schema({"prim":"big_map","args":[{"prim":"pair","args":[{"prim":"address"},{"prim":"nat"}]},{"prim":"nat"}]})
         );
     
    //  //compound_values
    //    const result2 = await Tezos.contract.getBigMapKeyByID(
    //        "32002", user_address,
    //        new Schema({
    //          prim: "big_map",
    //         args: [	{  prim: "address" },
		//  							{ prim: "pair", args: [{ prim: "int" }, { prim: "address" }] } ],
    //        })
    //   );

    //  //simples
    //    const result3 = await Tezos.contract.getBigMapKeyByID(
    //        "32003", user_address,
    //       new Schema({
    //          prim: "big_map",
    //          args: [{ prim: "address" }, { prim: "mutez" }],
    //        })
    //   );
    //await op.confirmation();
    // op_hash = op.opHash;
    console.log(result1);
    //console.log(result2);
    //console.log(result3);
  } catch (error){
    console.log(error)
  }
})()