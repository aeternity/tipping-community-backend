# Signature Authentication

The basic steps by the backend to verify a request with a signature are as follows:
1. Get the whole body and verify the existence of the field author
    - not required for most /profile routes as the public key is already in the url
1. Store the request in memory for 5 minutes and issue a challenge
1. The requester has to sign the challenge with the private key attributed to the public key in the request
1. The signature gets verified and the request is then forwarded to the server

Here is a code sample of how to sign a request using the aepp-sdk-js:
```javascript
// Import dependencies
const { signPersonalMessage, generateKeyPair } = require('@aeternity/aepp-sdk').Crypto;

// Obtain random keypair
const { publicKey, secretKey } = generateKeyPair();
// Define minimal test object
const testData = {
  author: publicKey,
  text: 'new comment',
  tipId: 'https://aeternity.com,1'
};

fetch(
  '/comment/api', // url
  {
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(testData)
  })
  .then(result => {
    const data = result.json();
    // sign challenge
    const signatureBuffer = signPersonalMessage(
      data.challenge,
      Buffer.from(secretKey, 'hex'),
    );
    fetch(
      '/comment/api', // url
      {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: "POST",
          body: JSON.stringify({
            signature: Buffer.from(signatureBuffer).toString('hex'),
            challenge: data.challenge
          })
      })
  });
```
