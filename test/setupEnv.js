import aeSdk from "@aeternity/aepp-sdk";

export default async function () {
  process.env = {
    ...process.env,
    NODE_URL: "https://testnet.aeternity.io",
    COMPILER_URL: "https://latest.compiler.aepps.com",
    AUTHENTICATION_USER: "admin",
    AUTHENTICATION_PASSWORD: "pass",
    NODE_ENV: "test",
    REDIS_PORT: "6379",
    REDIS_HOST: "localhost",
    IPFS_URL: "http://localhost:5001",
    ORACLE_CONTRACT_ADDRESS: "ct_2PbBVGroJ2G618tHbWEWRrrxxf1BAn7Qt7BoNcLh3LqsSck8Lu",
    MIDDLEWARE_URL: "https://testnet.aeternity.io/mdw",
    TOKEN_REGISTRY_ADDRESS: "ct_2Ga3mNT8er2zYjGKx7tJggn9nVnYt5UzmH9x9irRV4ayg4sfLL",
    CONTRACT_V1_ADDRESS: "ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd",
    CONTRACT_V2_ADDRESS: "ct_2bvoxQ6cwwzoFASuddUxzsYVBZUet9KGHRAp7i25xsMXEWvSvx",
    CONTRACT_V3_ADDRESS: "ct_WscpdLQf6ZZxoVqrsEwUwmuAEdzEkJii5W5TzG84rVgHeK6BW",
    WORD_REGISTRY_CONTRACT: "ct_2vznPSL1yzceQLnqbHC476BoHZipR3jFaK74KnPzgtkCr7beLN",
    WEBSOCKET_URL: "wss://testnet.aeternity.io/mdw/websocket",
    ORACLE_GETTER_ADDRESS: "ct_XabcJUxaZc1w5X4WxD2WUVTLPkZX97HFYzhuwkhQXc4ZzDqDF",
    CONTRACT_V1_GETTER_ADDRESS: "ct_2ixHY4bADzDY6ZYThGixnjYa6w5dtYoSoxtCThWvZ7SGgMGFWL",
    CONTRACT_V3_GETTER_ADDRESS: "ct_414KdQa9is3wiq6AKV7LLk6z2UN3Sy3odmAZtenyYSv35h7fv",
  };

  // GENERATE KEYPAIR
  const { secretKey, publicKey } = aeSdk.Crypto.generateKeyPair();

  process.env = {
    ...process.env,
    PRIVATE_KEY: secretKey,
    PUBLIC_KEY: publicKey,
  };
}
