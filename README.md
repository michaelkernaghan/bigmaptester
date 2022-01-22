# Tezos Big Map Testing Tool

The app allows users to change the values of various bigmaps on the blockchain.

The types of bigmap are:
- Single value,
- Compound value,
- Compound key,
- Compound key with compound value

For each type of big maps, the user can:
- Create, 
- Read, 
- Update,
- Delete. 

This app runs on the current Tezos Protocol testnet. Each time the protocol changes, we have to originate the contracts for the new protocol. The ~/scripts directory contains the scripts that can do this origination.

Built using the awesome Svelte Template by Claude Barde!
at https://github.com/claudebarde/svelte-tezos-template.git