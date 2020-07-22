/*
process.env = {
  ...process.env,
  NODE_URL: 'https://testnet.aeternity.io',
  COMPILER_URL: 'https://latest.compiler.aepps.com',
  MIDDLEWARE_URL: 'https://testnet.aeternity.io',

  OLD_CONTRACT_ADDRESS: 'ct_2siQwATqx7TFPr6D7nj4SqAGmkurVSBvRvL8xUfRPS5VZD4y4Y',
  CONTRACT_ADDRESS: 'ct_27MiRFPEvT4Ep7Go2P1KL3Gxo3TSDb9s6WjCkc6bkDuy74zqJt',
  ORACLE_CONTRACT_ADDRESS: 'ct_2PbBVGroJ2G618tHbWEWRrrxxf1BAn7Qt7BoNcLh3LqsSck8Lu',
  TOKEN_REGISTRY_ADDRESS: 'ct_2Ga3mNT8er2zYjGKx7tJggn9nVnYt5UzmH9x9irRV4ayg4sfLL',

  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
  NODE_ENV: 'test',
  REDIS_URL: 'redis://localhost:6379',
  IPFS_URL: 'http://localhost:5001'
};
*/
process.env = {
  ...process.env,
  NODE_URL: 'https://testnet.aeternity.io',
  COMPILER_URL: 'https://compiler.aepps.com',
  CONTRACT_ADDRESS: 'ct_2siQwATqx7TFPr6D7nj4SqAGmkurVSBvRvL8xUfRPS5VZD4y4Y',
  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
  NODE_ENV: 'test',
  REDIS_URL: 'redis://localhost:6379',
  IPFS_URL: 'http://localhost:5001',
  ORACLE_CONTRACT_ADDRESS: 'ct_2PbBVGroJ2G618tHbWEWRrrxxf1BAn7Qt7BoNcLh3LqsSck8Lu',
  MIDDLEWARE_URL: 'https://testnet.aeternity.io',
  CONTRACT_FILE: 'NewTippingInterface',
}

const Crypto = require('@aeternity/aepp-sdk').Crypto;
const { secretKey, publicKey } = Crypto.generateKeyPair();

process.env = {
  ...process.env,
  PRIVATE_KEY: secretKey,
  PUBLIC_KEY: publicKey,
};
