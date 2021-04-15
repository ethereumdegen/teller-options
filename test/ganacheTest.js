 
import fs from 'fs'
import path from 'path'

import ganache from 'ganache-cli' 
import  Web3 from 'web3' 
import { expect } from 'chai';

import TestHelper from './test-helper.js'

let testAccount = {
  publicAddress: '0x95eDA452256C1190947f9ba1fD19422f0120858a',
  secretKey: "0x31c354f57fc542eba2c56699286723e94f7bd02a4891a0a7f68566c2a2df6795",
  balance: "1000000000000000000000000000000000"

}

const ganacheOptions = { gasLimit: 8000000, accounts:[testAccount] };

const provider = ganache.provider( ganacheOptions )
const OPTIONS = {
  defaultBlock: "latest",
  transactionConfirmationBlocks: 1,
  transactionBlockTimeout: 5 
};

 
 
const web3 = new Web3(provider, null, OPTIONS);
 

let tokenContractJSON = fs.readFileSync(path.join('generated/built/MintableToken.json'));
let tokenContractData = JSON.parse(tokenContractJSON)


let guildContractJSON = fs.readFileSync(path.join('generated/built/MinersGuild.json'));
let guildContractData = JSON.parse(guildContractJSON)
 
let primaryAccountAddress = testAccount.publicAddress


var contractInstances  = {} 

describe("EIP712 Contract Testing", function() {
    it("deploys contract", async function() {
 
     
     // let primaryAccountAddress = testAccount.publicAddress


     contractInstances['stakeabletoken'] = await TestHelper.deployContract(tokenContractData ,primaryAccountAddress, web3, [8])
     contractInstances['reservetoken'] = await TestHelper.deployContract(tokenContractData ,primaryAccountAddress, web3, [8])

     contractInstances['guild'] = await TestHelper.deployContract(guildContractData ,primaryAccountAddress, web3, [contractInstances['stakeabletoken'].options.address, contractInstances['reservetoken'].options.address])

     
   
      //console.log("deployed contract at ", contractInstances['guild'].options.address)
      expect( contractInstances['guild'].options.address ).to.exist;
    });

    it("calls methods ", async function() {



      await contractInstances['reservetoken'].methods.transferOwnership(contractInstances['guild'].options.address).send({from: primaryAccountAddress})
      
      let newOwner = await contractInstances['reservetoken'].methods.owner().call()
      expect( newOwner ).to.equal( contractInstances['guild'].options.address );
 
      await contractInstances['stakeabletoken'].methods.mint(primaryAccountAddress, 9000).send({from: primaryAccountAddress})
       
      let myBalance = await TestHelper.getERC20Balance( contractInstances['stakeabletoken'] , primaryAccountAddress   )

      expect( parseInt(myBalance) ).to.equal( 9000 );



      await contractInstances['stakeabletoken'].methods.transfer(contractInstances['guild'].options.address, 1000).send({from: primaryAccountAddress})
     

      await contractInstances['stakeabletoken'].methods.approveAndCall(contractInstances['guild'].options.address, 1000, '0x0').send({from: primaryAccountAddress,  gasLimit: 8000000 })

      myBalance = await TestHelper.getERC20Balance( contractInstances['stakeabletoken'] , primaryAccountAddress   )

       expect( parseInt(myBalance) ).to.equal( 7000 );
     
    });
 

    /*
    This is what you would do in your frontend to make metamask pop up 
    This would output the signature value 


     let signResult = await  EIP712Helper.signTypedData( web3, from, JSON.stringify(typedDatahash)  )
         
  
     For this test only, the signature will be calculated from the pkey
    */


/*
   
    var privateKey = testAccount.secretKey;
    var privKey = Buffer.from(privateKey.substring(2), 'hex')
 
     


    const sig = ethUtil.ecsign( typedDatahash   , privKey );
 
    var signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
    


    let recoveredSigner = EIP712Utils.recoverPacketSigner(typedData, signature)
    console.log('recoveredSigner', recoveredSigner )
      

      let args = Object.values(dataValues)
      args.push(signature)

      console.log('args', args )

      let result = await myEIP712Contract.methods.verifyOffchainSignatureAndDoStuff(...args).send({from:  primaryAccountAddress })

      console.log("result of method call: ", result)
    });*/
  });