import {Injectable} from '@nestjs/common';
import {createSignedTransaction, signWithPrivateKey} from './cosmos-keys';

@Injectable()
export class AppService {

    createSignedTransaction(
        toAddress,
        amount,
        memo,
        privateKey,
        fromAddress,
        publicKey,
        accountNumber,
        sequence,
    ): string {
        const sendMsg = {
            'type': 'cosmos-sdk/MsgSend',
            'value': {
                'from_address': fromAddress,
                'to_address': toAddress,
                'amount': [
                    {
                        'denom': 'uatom',
                        'amount': amount
                    }
                ]
            }
        };
        const signMessage = createSignedTransaction({
            gas: '200000',
            gasPrices: [{amount: '0.025', denom: 'uatom'}],
            memo: memo
        }, [sendMsg], privateKey, publicKey, 'cosmoshub-2', accountNumber, sequence);
        return JSON.stringify(signMessage);
    }

}
