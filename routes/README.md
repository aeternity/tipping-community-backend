# API Documentation

The API is on a code basis divided into several route files. This structure will be used here too.

- [Blacklist](#Blacklist)
- [Cache](#Cache)
- [Comments](#Comments)
- [Language](#Language)
- [Link Preview](#Link-Preview)
- [Logs](#Logs)
- [Pay for Transaction](#Pay-for-Transaction)
- [Static](#Static)
- [Tip ordering](#Tip-ordering)

## Signature Authentication

The basic steps by the backend to verify a reequest with a singature are as follows:
1. Get the whole body and verify the existence of the signature, the public key and the request timestamp.
1. Alphabetically sort the request body object by keys
1. Remove the signature from the request body
1. Hash the remaining request body using the `256bits Blake2b hash` provided by the aepp-sdk-js
1. Verifies the hash against the signature and the public key

Here is a code sample of how to sign a request using the aepp-sdk-js:
```javascript
// Import dependencies
const { hash, signPersonalMessage, generateKeyPair } = require('@aeternity/aepp-sdk').Crypto;
// Create object sorting function
const deterministicStringify = obj => JSON.stringify(obj, Object.keys(obj).sort()); 


// Obtain random keypair
const { publicKey, secretKey } = generateKeyPair(); 
// Define minimal test object
const testData = {
    author: publicKey,
    requestTimestamp: Date.now()
};

// Sort and hash the object
const message = hash(deterministicStringify(testData));

// Sign the message
const signatureBuffer = signPersonalMessage(
  message,
  Buffer.from(secretKey, 'hex'),
);

// Append the signature (in hex) to the body
testData.signature = Buffer.from(signatureBuffer).toString('hex');

// Return the signed body
return testData;
```

## Blacklist

#### Get all blacklist entries
```
GET /blacklist/api

Returns: 
[
  {
    "id": Integer, // 1
    "tipId": String(url,nonce), // "https://aeternity.com,1"
    "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
    "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
  },
  ...
]
```

#### Get specific blacklist entry
 
```
GET /blacklist/api/:URIEncodedString(url,nonce)

Returns: 

{
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

```

#### View Admin Panel
```
GET /blacklist/

Authorization: HTTP Basic Authorization

Returns:  HTML VIEW

```

#### Add item to blacklist
```
POST /blacklist/api/

Authorization: HTTP Basic Authorization

Request Body: 
{
  url: String(url,nonce) // "https://aeternity.com,1"
}

Returns: 

{
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

```

#### Remove item from blacklist
```
DELETE /blacklist/api/:URIEncodedString(url,nonce)

Authorization: HTTP Basic Authorization

Returns: 
200 OK

```

## Cache

#### Get all items from cache
```
GET /cache/

Returns: 
[
  {
    "id": Integer, // 1
    "tipId": String(url,nonce), // "https://aeternity.com,1"
    "url": String(url), // "https://aeternity.com"
    "nonce: Int, // 1
    "sender": String(address), // ak_a4eg....
    "received_at": String(Timestamp), // "15346767434834"
    "repaid": Int(Boolean), // 0 or 1
    "amount": String(Int), // Amount in aetos
    "note": String, // "hello world"
    "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
    "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
  },
  ...
]
```

#### View Cache Status
```
GET /cache/status

Authorization: HTTP Basic Authorization

Returns:  HTML VIEW

```

## Comments

#### Get all comments

```
GET /comment/api/

Returns: 

[
  {
    "hidden": Boolean, // false
    "id": Integer, // 1
    "tipId": String(url,nonce), // "https://aeternity.com,1"
    "text": String, // "hello world"
    "sender": String(address), // ak_a4eg....
    "signature": String(hash), // "af3eg..."
    "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
    "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
  },
  ...
]
```

#### Get single comment

```
GET /comment/api/:Int(id)

Returns: 

{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "text": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

```

#### Get all comments for a single tip

```
GET /comment/api/tip/:URIEncodedString(url,nonce)

Returns: 

[
  {
    "hidden": Boolean, // false
    "id": Integer, // 1
    "tipId": String(url,nonce), // "https://aeternity.com,1"
    "text": String, // "hello world"
    "author": String(address), // ak_a4eg....
    "signature": String(hash), // "af3eg..."
    "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
    "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
  },
  ...
]
```

#### Update comment
```
PUT /comment/api/:Int(id)

Authorization: Signature Authentication

Request Body:
{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "text": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

Returns: 
{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "text": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

```

#### Create new comment
```
POST /comment/api/

Authorization: Signature Authentication

Request Body:
{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "text": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
}

Returns: 
{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "text": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

```

#### Delete comment
```
POST /comment/api/:Int(id)

Authorization: Signature Authentication

Request Body:
{
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
}

Returns: 
200 OK

```

## Language

#### Get all Chinese posts

```
GET /language/zh

Returns: 

[
  String(url), // "https://aeternity.com"
  ...
]
```

#### Get all English posts

```
GET /language/en

Returns: 

[
  String(url), // "https://aeternity.com"
  ...
]
```

## Link Preview

#### Get all cached linkpreviews
```
GET /linkpreview/

Returns:
[
  {
    "id": Integer, // 1
    "requestUrl": String(url), // "https://aeternity.com/"
    "title": String, // "æternity"
    "description": String, // "æternity"
    "image": String(url), // "https://aeternity.com/img/og-aeternity.jpg"
    "responseUrl": String(url), // "https://aeternity.com"
    "lang": String(2 Letter ISO-Language-Code), // "en"
    "querySucceeded": Int(Boolean), // 1
    "failReason": String || null,
    "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
    "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
  },
  ...
]

```

#### Get single cached linkpreviews
```
GET /linkpreview/:URIEncodedString(url)

Returns:
{
  "id": Integer, // 1
  "requestUrl": String(url), // "https://aeternity.com/"
  "title": String, // "æternity"
  "description": String, // "æternity"
  "image": String(url), // "https://aeternity.com/img/og-aeternity.jpg"
  "responseUrl": String(url), // "https://aeternity.com"
  "lang": String(2 Letter ISO-Language-Code), // "en"
  "querySucceeded": Int(Boolean), // 1
  "failReason": String || null,
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}


```

## Logs

#### Get all system logs
```
GET /logs/all

Authorization: HTTP Basic Authorization

Returns:
[
  {
    "message": String, // "Server started"
    "date": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
    "service": String // "main"
    ... // Can have more optional fields
  },
  ...
]

```

## Pay for Transaction

#### Try to claim a url
```
POST /claim/submit

Request Body:
{
  url: String(url), // "https://aeternity.com"
  address: String(address), // "ak_a4eg..."
}

Returns:
200 OK

```

#### Crawl HTML and parse all addresses
```
POST /claim/submit

Request Body:
{
  url: String(url), // "https://aeternity.com"
}

Returns:
[
  String(address), // "ak_a4eg..."
  ...
]

```

## Static

#### Get contract address and file
```
GET /static/contract

Returns:
{
  contractFile: String, // "TippingCorona"
  contractAddress: String(address) // "ct_..."
}

```

## Tip ordering

#### Get scored and not blacklisted tip ids
```
GET /tiporder/

Returns:
{
  id: String(url,nonce), // "https://aeternity.com,1"
  score: Float, // 1.2
}
```

## Verified

#### Get scored and not blacklisted tip ids
```
GET /verified/

Returns:
[
  String(hostname) // "aeternity.com"
]
```
