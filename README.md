# Superhero tipping-community-backend

## How to build and run on mainnet

### Hosted setup

Build the image
```
docker build .
```

Set your environment variables
```
# TESTNET
NODE_URL=https://testnet.aeternity.io
MIDDLWARE_URL=https://testnet.aeternity.io
COMPILER_URL=https://compiler.aepps.com
REDIS_URL=redis://localhost:6379
IPFS_URL=http://localhost:5001
CONTRACT_ADDRESS=ct_2siQwATqx7TFPr6D7nj4SqAGmkurVSBvRvL8xUfRPS5VZD4y4Y
ORACLE_CONTRACT_ADDRESS=ct_2X9ThTUvPX6uSrCUFinsELW4K2G25eZjUXCScaGihfezuvigxn
CONTRACT_FILE=NewTippingInterface
PUBLIC_KEY=ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk
PRIVATE_KEY=....
AUTHENTICATION_USER=admin
AUTHENTICATION_PASSWORD=pass

# MAINNET
NODE_URL=https://mainnet.aeternity.io
MIDDLWARE_URL=https://mainnet.aeternity.io
COMPILER_URL=https://compiler.aepps.com
REDIS_URL=redis://localhost:6379
IPFS_URL=http://localhost:5001
CONTRACT_ADDRESS=ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z
ORACLE_CONTRACT_ADDRESS=ct_7wqP18AHzyoqymwGaqQp8G2UpzBCggYiq7CZdJiB71VUsLpR4
CONTRACT_FILE=NewTippingInterface
PUBLIC_KEY=ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk
PRIVATE_KEY=....
AUTHENTICATION_USER=admin
AUTHENTICATION_PASSWORD=pass
```

### Local Setup

*Note: Node v12 is recommended.*

Install dependencies
```bash
npm i
```

Create Database
```bash
npm run db:makemigrations
```
Start server (note that you need ipfs & redis & the above mentioned env)
```bash
node server.js
```
