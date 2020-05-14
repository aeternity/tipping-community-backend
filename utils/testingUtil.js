const { signPersonalMessage, generateKeyPair, hash } = require('@aeternity/aepp-sdk').Crypto;

 const { publicKey, secretKey } = generateKeyPair();

const signChallenge = (challenge, privateKey = null) => {
  if (!privateKey) privateKey = secretKey;
  const signatureBuffer = signPersonalMessage(
    challenge,
    Buffer.from(privateKey, 'hex'),
  );
  return Buffer.from(signatureBuffer).toString('hex');
};

module.exports = {
  publicKey,
  signChallenge
}
