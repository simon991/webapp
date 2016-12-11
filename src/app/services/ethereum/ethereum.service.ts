import {Injectable} from '@angular/core';
import Web3 from "web3";


@Injectable()
export class EthereumService {

  // The web3 connection to ethereum
  private _web3: any = null;
  // A test contract (if deployed)
  private testContract: any;

  constructor() {
  }

  get web3(): any {
    return this._web3;
  }

  /**
   * Initializes the web3 connection to the given ethereum provider.
   * @returns {Promise<TResult>|Promise<U>}
   */
  initWeb3(provider: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      if (this._web3 == null) {
        let httpProvider = new (<any>Web3).providers.HttpProvider(provider);
        this._web3 = new Web3(httpProvider);
        this._web3.eth.defaultAccount = this._web3.eth.accounts[0];
        resolve(this._web3);
      } else {
        resolve(this._web3);
      }
    });
    return promise;
  }

  /**
   * Creates and deploys an ethereum contract to the blockchain. To use this method, you need to have the
   * solidity compiler (solc) installed and in your systems path variable.
   * @param contractSource The solidity source code as a string.
   * @returns {Promise<T>} Returns a promise that resolves the contract as soon as it is mined.
   */
  createContract(contractSource: string): Promise<any> {

    let promise = new Promise((resolve, reject) => {
      if (this._web3 != null) {
        let compiled = this._web3.eth.compile.solidity(contractSource);
        let code = compiled.test.code;
        // contract json abi, this is autogenerated using solc CLI
        let abi = compiled.test.info.abiDefinition;
        let myContract;

        // let's assume that coinbase is our account
        this._web3.eth.defaultAccount = this._web3.eth.coinbase;
        // create contract
        console.log("Contract status: " + "transaction sent, waiting for confirmation");
        this._web3.eth.contract(abi).new({data: code}, (err, contract) => {
          if (err) {
            reject(err);
            return;
            // callback fires twice, we only want the second call when the contract is deployed
          } else if (contract.address) {
            myContract = contract;
            console.log("Contract status: " + "Mined");
            console.log('Contract address: ' + myContract.address);
            this.testContract = myContract;
            resolve(myContract);
          }
        });
      } else {
        reject(new Error("You have to connect to your ethereum client first!"));
      }
    });
    return promise;
  }

  /**
   * Creates and deploys a test contract to the blockchain. To use this method, you need to have the
   * solidity compiler (solc) installed and in your systems path variable.
   * @returns {Promise<T>} Returns a promise that resolves the contract as soon as it is mined.
   */
  createTestContract(): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      if (this._web3 != null) {
        // If no contract source set, we create a test contract
        let contractSource = "" +
          "contract test {\n" +
          "   function multiply(uint a) constant returns(uint d) {\n" +
          "       return a * 7;\n" +
          "   }\n" +
          "}\n";

        this.createContract(contractSource).then(res => {
          resolve(res);
        }).catch(err => {
          reject(err);
        });
      } else {
        reject(new Error("You have to connect to your ethereum client first!"));
      }
    });
    return promise;
  }

  /**
   * Calls the test contract that you can deploy with the createTestContract() above
   * @param param Number to multiply
   * @returns {Promise<T>} The contract multipies the number by 7 and returns the value as promise.
   */
  callTestContract(param: number): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      if (this._web3 != null && this.testContract != null) {
        // call the contract
        let res = this.testContract.multiply(param);
        resolve(res.toString(10));
      } else {
        reject(new Error("You have to connect to your ethereum client first!"));
      }
    });
    return promise;
  }
}