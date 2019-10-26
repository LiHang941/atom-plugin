import * as secp256k1 from 'secp256k1';
import * as CryptoJS from 'crypto-js';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import * as bech32 from 'bech32';
import {KeyPair, StdSignMsg, Wallet} from './types';

const DEFAULT_GAS_PRICE = [{amount: (2.5e-8).toFixed(9), denom: `uatom`}];
const hdPathAtom = `m/44'/118'/0'/0/0`;

export function getNewWalletFromSeed(mnemonic: string): Wallet {
    const masterKey = deriveMasterKey(mnemonic);
    const {privateKey, publicKey} = deriveKeypair(masterKey);
    const cosmosAddress = getCosmosAddress(publicKey);
    return {
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
        cosmosAddress
    };
}

function deriveMasterKey(mnemonic: string): bip32.BIP32 {
    // throws if mnemonic is invalid
    bip39.validateMnemonic(mnemonic);

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const masterKey = bip32.fromSeed(seed);
    return masterKey;
}

function deriveKeypair(masterKey: bip32.BIP32): KeyPair {
    const cosmosHD = masterKey.derivePath(hdPathAtom);
    const privateKey = cosmosHD.privateKey;
    const publicKey = secp256k1.publicKeyCreate(privateKey, true);

    return {
        privateKey,
        publicKey
    };
}

export function getCosmosAddress(publicKey: Buffer): string {
    const message = CryptoJS.enc.Hex.parse(publicKey.toString('hex'));
    const address = CryptoJS.RIPEMD160(CryptoJS.SHA256(message) as any).toString();
    const cosmosAddress = bech32ify(address, `cosmos`);

    return cosmosAddress;
}

function bech32ify(address: string, prefix: string) {
    const words = bech32.toWords(Buffer.from(address, 'hex'));
    return bech32.encode(prefix, words);
}

// produces the signature for a message (returns Buffer)
export function signWithPrivateKey(signMessage: StdSignMsg | string, privateKey: Buffer): Buffer {
    const signMessageString: string =
        typeof signMessage === 'string' ? signMessage : JSON.stringify(signMessage);
    const signHash = Buffer.from(CryptoJS.SHA256(signMessageString).toString(), `hex`);
    const {signature} = secp256k1.sign(signHash, privateKey);

    return signature;
}

export function createSignMessage(jsonTx, {sequence, accountNumber, chainId}) {
    // sign bytes need amount to be an array
    const fee = {
        amount: jsonTx.fee.amount || [],
        gas: jsonTx.fee.gas
    };

    return JSON.stringify(
        removeEmptyProperties({
            fee,
            memo: jsonTx.memo,
            msgs: jsonTx.msg, // weird msg vs. msgs
            sequence,
            account_number: accountNumber,
            chain_id: chainId
        })
    );
}

export function createSignature(
    signature,
    sequence,
    accountNumber,
    publicKey
) {
    return {
        signature: signature.toString(`base64`),
        account_number: accountNumber,
        sequence,
        pub_key: {
            type: `tendermint/PubKeySecp256k1`, // TODO: allow other keytypes
            value: publicKey.toString(`base64`)
        }
    };
}

export function removeEmptyProperties(jsonTx) {
    if (Array.isArray(jsonTx)) {
        return jsonTx.map(removeEmptyProperties);
    }

    // string or number
    if (typeof jsonTx !== `object`) {
        return jsonTx;
    }

    const sorted = {};
    Object.keys(jsonTx)
        .sort()
        .forEach(key => {
            if (jsonTx[key] === undefined || jsonTx[key] === null) {
                return;
            }

            sorted[key] = removeEmptyProperties(jsonTx[key]);
        });
    return sorted;
}

export function createSignedTransaction({gas, gasPrices = DEFAULT_GAS_PRICE, memo = ``}, messages, privateKey, publicKey, chainId, accountNumber, sequence) {
    // sign transaction
    const stdTx = createStdTx({gas, gasPrices, memo}, messages);
    const signMessage = createSignMessage(stdTx, {sequence, accountNumber, chainId});
    const signature = signWithPrivateKey(signMessage, Buffer.from(privateKey, 'hex'));
    const signatureObject = createSignature(signature, sequence, accountNumber, Buffer.from(publicKey, 'hex'));
    const signedTx = createSignedTransactionObject(stdTx, signatureObject);
    return signedTx;
}

export function createStdTx({gas, gasPrices, memo}, messages) {
    const fees = gasPrices.map(({amount, denom}) => ({amount: String(Math.round(amount * gas)), denom}))
        .filter(({amount}) => amount > 0);
    return {
        msg: Array.isArray(messages) ? messages : [messages],
        fee: {
            amount: fees.length > 0 ? fees : null,
            gas
        },
        signatures: null,
        memo
    };
}

function createSignedTransactionObject(tx, signature) {
    return Object.assign({}, tx, {
        signatures: [signature]
    });
}
