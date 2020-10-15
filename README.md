# Superhero tipping-community-backend

## How to build and run on mainnet

### Hosted setup

Build the setup
```
docker-compose up -d
```

### Local Setup

*Note: Node v12 is recommended.*

#### Install dependencies
```bash
npm i
```


#### Create Database
(note that you need ipfs & redis & the above mentioned env)

```bash
npm run db:makemigrations
```
#### Start server
```bash
node server.js
```
