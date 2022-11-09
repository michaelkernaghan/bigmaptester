(* Write a contract in CameLigo that demonstrates updating big maps and getting balance *)

(* initial storage *)
(* Big_map.literal[(("tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx":address), 100tez)] *)

type storage = (address, tez) big_map

type action =
  Update
| GetBalance

let update (s : storage) :  storage =
  Big_map.update (Tezos.get_sender ()) (Some (Tezos.get_amount ())) s 

let get_balance (s : storage) : storage =
  let _value = match Big_map.find_opt (Tezos.get_sender ()) s with
    Some _value -> _value
    | None -> 0tez
  in s

let main (action, storage : action * storage) : operation list * storage =  
 ([]: operation list),
 (match action with
 | Update -> update (storage)
 | GetBalance -> get_balance (storage)
 )