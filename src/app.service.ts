import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumber, ContractFactory, ethers, Signer, Wallet } from 'ethers';
import { stringify } from 'querystring';
import { abi, bytecode } from './assets/MyToken.json';

interface EnvironmentVariables {
  MNEMONIC: string;
  ERC20VOTES_TOKEN_ADDRESS: string;
  TOKENIZED_BALLOT_ADDRESS: string;
  ALCHEMY_API_KEY: string;
}

export class CreatePaymentDTO {
  value: number;
  secret: string;
}

export class RequestPaymentDTO {
  id: number;
  // secret: string;
  // receiver: string;
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
  signer: any;
  wallet: Wallet;
  paymentOrder: PaymentOrder[];
  #mnemonic: string;
  #TOKENIZED_BALLOT_ADDRESS: string;
  #ERC20VOTES_TOKEN_ADDRESS: string;
  #ALCHEMY_API_KEY: string;

  constructor(private configService: ConfigService<EnvironmentVariables>) {
    this.#mnemonic = this.configService.get('MNEMONIC', '', { infer: true });
    this.#TOKENIZED_BALLOT_ADDRESS = this.configService.get(
      'TOKENIZED_BALLOT_ADDRESS',
      '',
      { infer: true },
    );
    this.#ERC20VOTES_TOKEN_ADDRESS = this.configService.get(
      'ERC20VOTES_TOKEN_ADDRESS',
      '',
      { infer: true },
    );
    this.#ALCHEMY_API_KEY = this.configService.get('ALCHEMY_API_KEY', '', {
      infer: true,
    });
    this.provider = new ethers.providers.AlchemyProvider("goerli", this.#ALCHEMY_API_KEY);
    this.wallet = ethers.Wallet.fromMnemonic(this.#mnemonic);
    this.signer = this.wallet.connect(this.provider);
    console.log(`maybe my metamask? idk: ${this.signer.address}`)
    this.erc20ContractFactory = new ContractFactory(abi, bytecode, this.signer);
    this.erc20Contract = this.erc20ContractFactory.attach(
      this.#ERC20VOTES_TOKEN_ADDRESS,
    );
    this.paymentOrder = [];
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
    // secret: string,
    // receiver: string,
  ): Promise<any> {
    const paymentOrder = this.paymentOrder[id];
    const invalidSecret = paymentOrder.secret !== this.#mnemonic;

    if (invalidSecret) throw new Error(`Invalid Secret for account ${id}`);
    return {
      id: paymentOrder.id,
      value: paymentOrder.value,
      secret: this.#mnemonic,
    };
    // const signer = ethers.Wallet.createRandom();
    // // this should be an address from your .env
    // // you should put a key or seed in your .env that is minter at that contract
    // // for using .env in nest look here: https://docs.nestjs.com/techniques/configuration
    // const contractInstance = this.erc20ContractFactory
    //   .attach('address-in-.env')
    //   .connect(signer);
    // const tx = await contractInstance.mint(receiver, paymentOrder.value);
    // return tx.wait();
  }

  async requestTokens(address: string, tokens: BigNumber): Promise<number> {
    const mintTx = await this.erc20Contract.mint(address, tokens);
    await mintTx.wait();

    const newBalance = await this.erc20Contract.balanceOf(address);
    return parseFloat(ethers.utils.formatEther(newBalance));
  }

  getTokenAddress(): string {
    return this.#ERC20VOTES_TOKEN_ADDRESS;
  }

  async delegateVoter(wallet: any, signer: any): Promise<number> {
    try {
      const delegateTx = await this.erc20Contract.delegate(wallet.address);
      await delegateTx.wait();
    } catch (error) {
      console.error(error)
    }
    const votePower = await this.erc20Contract.getVotes(wallet.address);
    console.log(`getting vote power ${votePower}`);
    return parseFloat(ethers.utils.formatEther(votePower));
  }
}
