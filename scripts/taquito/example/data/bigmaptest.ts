export const contractBigMapTester =  `{ parameter (or (or (nat %compoundKey) (nat %compoundKeyCompoundValue))
              (or (nat %compoundValue) (mutez %singleValue)));
storage (pair
          (pair (big_map %compound_keys (pair address nat) nat)
                (big_map %compound_keys_compound_values (pair address nat)
                                                        (pair (nat %score) (address %sender))))
          (pair (big_map %compound_values address (pair (nat %score) (address %sender)))
                (big_map %simple_values address mutez)));
code { UNPAIR ;
       IF_LEFT
         { IF_LEFT
             { DUP ; SENDER ; PAIR ; DUP 3 ; CDR ; DUP 4 ; CAR ; CDR ; DIG 4 ; CAR ; CAR ; DIG 4 ; SOME ; DIG 4 ; UPDATE ; PAIR ; PAIR }
             { SENDER ;
               SWAP ;
               DUP ;
               DUG 2 ;
               PAIR ;
               DUP 3 ;
               CDR ;
               DUP 4 ;
               CAR ;
               CDR ;
               DIG 2 ;
               SOME ;
               DIG 3 ;
               SENDER ;
               PAIR ;
               UPDATE ;
               DIG 2 ;
               CAR ;
               CAR ;
               PAIR ;
               PAIR } }
         { IF_LEFT
             { SENDER ; SWAP ; PAIR ; SWAP ; DUP ; DUG 2 ; CDR ; CDR ; DUP 3 ; CDR ; CAR ; DIG 2 ; SOME ; SENDER ; UPDATE ; PAIR ; SWAP ; CAR ; PAIR }
             { SWAP ; DUP ; DUG 2 ; CDR ; CDR ; SWAP ; SOME ; SENDER ; UPDATE ; SWAP ; DUP ; DUG 2 ; CDR ; CAR ; PAIR ; SWAP ; CAR ; PAIR } } ;
       NIL operation ;
       PAIR }}
       `