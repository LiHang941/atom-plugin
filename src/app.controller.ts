import {Body, Controller, HttpCode, Param, Post, Res} from '@nestjs/common';
import {AppService} from './app.service';

@Controller('atom')
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @HttpCode(200)
    @Post('sign')
    createSignedTransaction(
        @Body('toAddress') toAddress,
        @Body('amount')amount,
        @Body('memo')memo,
        @Body('privateKey')privateKey,
        @Body('fromAddress')fromAddress,
        @Body('publicKey')publicKey,
        @Body('accountNumber')accountNumber,
        @Body('sequence')sequence): string {
        return this.appService.createSignedTransaction(toAddress, amount, memo, privateKey, fromAddress, publicKey, accountNumber, sequence);
    }

}
