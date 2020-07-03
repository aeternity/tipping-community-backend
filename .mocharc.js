process.env = {
  ...process.env,
  NODE_URL: 'https://testnet.aeternity.io',
  COMPILER_URL: 'https://latest.compiler.aepps.com',
  MIDDLEWARE_URL: 'https://testnet.aeternity.io',

  OLD_CONTRACT_ADDRESS: 'ct_2siQwATqx7TFPr6D7nj4SqAGmkurVSBvRvL8xUfRPS5VZD4y4Y',
  CONTRACT_ADDRESS: 'ct_27MiRFPEvT4Ep7Go2P1KL3Gxo3TSDb9s6WjCkc6bkDuy74zqJt',
  ORACLE_CONTRACT_ADDRESS: 'ct_2X9ThTUvPX6uSrCUFinsELW4K2G25eZjUXCScaGihfezuvigxn',

  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
  NODE_ENV: 'test',
  REDIS_URL: 'redis://localhost:6379',
  IPFS_URL: 'http://localhost:5001'
};

const Crypto = require('@aeternity/aepp-sdk').Crypto;
const { secretKey, publicKey } = Crypto.generateKeyPair();
//During the test the env variable is set to test
process.env = {
  ...process.env,
  PRIVATE_KEY: secretKey,
  PUBLIC_KEY: publicKey,
};
