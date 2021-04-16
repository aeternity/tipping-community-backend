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
  IPFS_URL: 'http://localhost:5001',
  MIDDLEWARE_URL: 'https://mainnet.aeternity.io/mdw/'
};
*/

process.env = {
  ...process.env,
  NODE_URL: 'https://testnet.aeternity.io',
  COMPILER_URL: 'https://latest.compiler.aepps.com',
  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
  NODE_ENV: 'test',
  REDIS_PORT: '6379',
  REDIS_HOST: 'localhost',
  IPFS_URL: 'http://localhost:5001',
  ORACLE_CONTRACT_ADDRESS: 'ct_2PbBVGroJ2G618tHbWEWRrrxxf1BAn7Qt7BoNcLh3LqsSck8Lu',
  MIDDLEWARE_URL: 'https://testnet.aeternity.io/mdw',
  TOKEN_REGISTRY_ADDRESS: 'ct_2Ga3mNT8er2zYjGKx7tJggn9nVnYt5UzmH9x9irRV4ayg4sfLL',
  CONTRACT_V1_ADDRESS: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
  CONTRACT_V2_ADDRESS: 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu',
  CONTRACT_V3_ADDRESS: 'ct_WscpdLQf6ZZxoVqrsEwUwmuAEdzEkJii5W5TzG84rVgHeK6BW',
  WORD_REGISTRY_CONTRACT: 'ct_2vznPSL1yzceQLnqbHC476BoHZipR3jFaK74KnPzgtkCr7beLN',
  WEBSOCKET_URL: 'wss://testnet.aeternity.io/mdw/websocket',
  ORACLE_GETTER_ADDRESS: 'ct_XabcJUxaZc1w5X4WxD2WUVTLPkZX97HFYzhuwkhQXc4ZzDqDF',
}

// GENERATE KEYPAIR
const Crypto = require('@aeternity/aepp-sdk').Crypto;
const { secretKey, publicKey } = Crypto.generateKeyPair();

process.env = {
  ...process.env,
  PRIVATE_KEY: secretKey,
  PUBLIC_KEY: publicKey,
};

// RESET ALL QUEUES
const queueLogic = require('./modules/queue/logic/queueLogic')
queueLogic.clearRedisQueues().then(() => queueLogic.init())
