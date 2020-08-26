/* eslint-disable no-console */
/* eslint-disable promise/param-names */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-async-promise-executor */
import forge from 'node-forge';
import Crypto from './crypto';

const crypto = new Crypto();

export const process = (payload: any, privateKeyString: string) =>
  new Promise(async (resolve, reject) => {
    const privateKey = (await crypto.importEncryptDecryptKey(
      privateKeyString
    )) as forge.pki.rsa.PrivateKey;
    const { signature } = payload;
    const { iv } = payload;
    const payloadBuffer = payload.payload;

    let sessionAESKeyUnencrypted = '';
    let signingHMACKey = '';

    await new Promise((resolvePayload) => {
      payload.keys.forEach(async (key: any) => {
        try {
          sessionAESKeyUnencrypted = await crypto.unwrapKey(
            privateKey,
            key.sessionKey
          );
          signingHMACKey = await crypto.unwrapKey(privateKey, key.signingKey);
          resolvePayload();
        } catch (e) {
          console.error(e);
        }
      });
    });

    const verified = await crypto.verifyPayload(
      signature,
      payloadBuffer,
      signingHMACKey
    );

    if (!verified) {
      console.error("recreated signature doesn't match with payload.signature");
      reject();
      return;
    }

    const decryptedPayload = await crypto.decryptMessage(
      payloadBuffer,
      sessionAESKeyUnencrypted,
      iv
    );

    const payloadJson = JSON.parse(decryptedPayload);
    resolve(payloadJson);
  });

export const prepare = (payload: any, user: any, partner: any) =>
  new Promise(async (resolve) => {
    const myUsername = user.username;
    const myId = user.id;
    const members = [partner];
    const jsonToSend = {
      ...payload,
      payload: {
        ...payload.payload,
        sender: myId,
        username: myUsername,
        text: encodeURI(payload.payload.text),
      },
    };
    const payloadBuffer = JSON.stringify(jsonToSend);

    const secretKeyRandomAES = forge.random.getBytesSync(16);
    const iv = forge.random.getBytesSync(16);
    const encryptedPayloadString = await crypto.encryptMessage(
      payloadBuffer,
      secretKeyRandomAES,
      iv
    );

    const secretKeyRandomHMAC = forge.random.getBytesSync(32);
    const signatureString = await crypto.signMessage(
      encryptedPayloadString,
      secretKeyRandomHMAC
    );

    const encryptedKeys = await Promise.all(
      members.map(async (member) => {
        const memberPublicKey = (await crypto.importEncryptDecryptKey(
          member.publicKey
        )) as forge.pki.rsa.PublicKey;
        const enc = await Promise.all([
          crypto.wrapKeyWithForge(secretKeyRandomAES, memberPublicKey),
          crypto.wrapKeyWithForge(secretKeyRandomHMAC, memberPublicKey),
        ]);

        return {
          sessionKey: enc[0],
          signingKey: enc[1],
        };
      })
    );

    resolve({
      toSend: {
        payload: encryptedPayloadString,
        signature: signatureString,
        iv,
        keys: encryptedKeys,
      },
      original: jsonToSend,
    });
  });
