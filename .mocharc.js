process.env = {
  ...process.env,
  NODE_URL: 'https://mainnet.aeternity.io',
  COMPILER_URL: 'https://compiler.aepps.com',
  CONTRACT_ADDRESS: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
  ORACLE_CONTRACT_ADDRESS: 'ct_2VpQ1QGXy7KA2rsQmC4QraFKwQam3Ksqq3cAK8KHUNwhoiQkL',
  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
  CONTRACT_FILE: 'NewTippingInterface',
  NODE_ENV: 'test',
  REDIS_URL: 'redis://localhost:6379',
  IPFS_URL: 'http://localhost:5001',
  //IPFS_URL: 'http://3.124.114.189:5001',
  MIDDLEWARE_URL: 'https://mainnet.aeternity.io'
};

const Crypto = require('@aeternity/aepp-sdk').Crypto;
const { secretKey, publicKey } = Crypto.generateKeyPair();
//During the test the env variable is set to test
process.env = {
  ...process.env,
  PRIVATE_KEY: secretKey,
  PUBLIC_KEY: publicKey,
};
