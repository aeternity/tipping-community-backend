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

_Note: Node v14 is recommended._

#### Install dependencies

```bash
npm i
```

#### Start a database & redis

```bash
docker run --rm --name ipfs -p 5001:5001 -d ipfs/go-ipfs
docker run --name superhero-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=superhero -p5432:5432 -d postgres
```

#### Copy Env

```bash
cp .env.example .env
```

#### Create Database

```bash
npm run db:create
```

#### Start server

```bash
npm start
```
