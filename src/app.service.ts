import { Injectable } from '@nestjs/common';
import { ContractFactory, ethers } from 'ethers';
import { abi, bytecode } from './assets/MyToken.json';

const ERC20VOTES_TOKEN_ADDRESS = '0x324c938062235e86dBF068AC2ede9211fE5f842f'; // TODO get from ENV file?? not sure

export class CreatePaymentDTO {
  value: number;
  secret: string;
}

export class RequestPaymentDTO {
  id: number;
  secret: string;
  receiver: string;
}

export class PaymentOrder {
  value: number;
  id: number;
  secret: string;
}

@Injectable()
export class AppService {
  provider: ethers.providers.BaseProvider;
  erc20ContractFactory: ethers.ContractFactory;
  erc20Contract: ethers.Contract;
  paymentOrder: PaymentOrder[];

  constructor() {
    this.provider = ethers.getDefaultProvider('goerli');
    this.erc20ContractFactory = new ContractFactory(abi, bytecode); // TODO unfinished tokenized ballot proj
    this.paymentOrder = [];
    this.erc20Contract = this.erc20ContractFactory.attach(
      ERC20VOTES_TOKEN_ADDRESS,
    );
    // const signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC); // TODO get MNEMONIC
  }

  getBlock(
    blockNumberOrTag: string = 'latest',
  ): Promise<ethers.providers.Block> {
    return this.provider.getBlock(blockNumberOrTag);
  }

  async getTotalSupply(address: string): Promise<number> {
    const contractInstance = this.erc20ContractFactory
      .attach(address)
      .connect(this.provider);
    const totalSupply = await contractInstance.totalSupply();
    return parseFloat(ethers.utils.formatEther(totalSupply));
  }

  async getAllowance(
    address: string,
    from: string,
    to: string,
  ): Promise<number> {
    const contractInstance = this.erc20ContractFactory
      .attach(address)
      .connect(this.provider);

    const allowance = await contractInstance.allowance(from, to);
    return parseFloat(ethers.utils.formatEther(allowance));
  }

  getPaymentOrder(id: number) {
    return { id: this.paymentOrder[id].id, value: this.paymentOrder[id].value };
  }

  createPaymentOrder(value: number, secret: string) {
    const newPaymentOrder = new PaymentOrder();
    newPaymentOrder.id = this.paymentOrder.length;
    newPaymentOrder.secret = secret;
    newPaymentOrder.value = value;
    this.paymentOrder.push(newPaymentOrder);
    return newPaymentOrder.id;
  }

  async requestPaymentOrder(
    id: number,
    secret: string,
    receiver: string,
  ): Promise<any> {
    const paymentOrder = this.paymentOrder[id];
    const invalidSecret = paymentOrder.secret !== secret;

    if (invalidSecret) throw new Error(`Invalid Secret for account ${id}`);

    const signer = ethers.Wallet.createRandom();
    // this should be an address from your .env
    // you should put a key or seed in your .env that is minter at that contract
    // for using .env in nest look here: https://docs.nestjs.com/techniques/configuration
    const contractInstance = this.erc20ContractFactory
      .attach('address-in-.env')
      .connect(signer);
    const tx = await contractInstance.mint(receiver, paymentOrder.value);
    return tx.wait();
  }

  requestTokens() {
    // do the minting
    // this should be an address from your .env
    // you should put a key or seed in your .env that is minter at that contract
    // for using .env in nest look here: https://docs.nestjs.com/techniques/configuration
    return true;
  }
  getTokenAddress() {
    return ERC20VOTES_TOKEN_ADDRESS;
  }
}
