import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BigNumber, ethers, Wallet } from 'ethers';
import {
  AppService,
  CreatePaymentDTO,
  PaymentOrder,
  RequestPaymentDTO,
} from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('last-block')
  getLastBlock(): Promise<ethers.providers.Block> {
    return this.appService.getBlock();
  }

  @Get('block/:hash')
  getBlock(@Param('hash') hash: string): Promise<ethers.providers.Block> {
    return this.appService.getBlock(hash);
  }

  @Get('total-supply/:address')
  getTotalSupply(@Param('address') address: string): Promise<number> {
    return this.appService.getTotalSupply(address);
  }

  @Get('allowance')
  getAllowance(
    @Query('address') address: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<number> {
    return this.appService.getAllowance(address, from, to);
  }

  @Get('payment-order/:id')
  getPaymentOrder(@Param('id') id: number): { id: number; value: number } {
    return this.appService.getPaymentOrder(id);
  }

  @Post('create-payment')
  createPaymentOrder(@Body() { value, secret }: CreatePaymentDTO): number {
    return this.appService.createPaymentOrder(value, secret);
  }

  @Post('request-payment')
  // requestPayment(@Body() { id, secret, receiver }: RequestPaymentDTO): Promise<any> {
  requestPayment(@Body() { id }: RequestPaymentDTO): Promise<any> {
    // return this.appService.requestPaymentOrder(id, secret, receiver);
    return this.appService.requestPaymentOrder(id);
  }

  @Get('token-addresses')
  getTokenAddress() {
    return { result: this.appService.getTokenAddress() };
  }

  @Post('request-tokens')
  async requestTokens(
    @Body() { address, tokens }: { address: string; tokens: BigNumber },
  ) {
    return { result: await this.appService.requestTokens(address, tokens) };
  }
}
