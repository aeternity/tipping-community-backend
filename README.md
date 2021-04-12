# Superhero tipping-community-backend

## Docs

The deployed version of the swagger documentation can be found here: [https://raendom-backend.z52da5wt.xyz/docs/](https://raendom-backend.z52da5wt.xyz/docs/) or if you are running it locally here: [http://localhost:3000/docs/](http://localhost:3000/docs/)

## Docker Image

The automatically updated docker images can be found here: https://hub.docker.com/r/aeternity/superhero-backend

## How to build and run on mainnet

### Hosted setup

Build the setup
```
docker-compose up -d
```

### Local Setup

*Note: Node v14 is recommended.*

#### Install dependencies
```bash
npm i
```

#### Create Database

```bash
npm run db:makemigrations
```
#### Start server

In order to run the server, an **ipfs, redis & the above mentioned env** are required

```bash
node bin/www.js
```
