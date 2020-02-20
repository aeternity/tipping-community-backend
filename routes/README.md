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
    "note": String, // "hello world"
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
  "note": String, // "hello world"
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
    "note": String, // "hello world"
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

Authorization: HTTP Basic Authorization

Request Body:
{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "note": String, // "hello world"
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
  "note": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

```

#### Create new comment
```
POST /comment/api/

Authorization: Signature in body

Request Body:
{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "note": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
}

Returns: 
{
  "hidden": Boolean, // false
  "id": Integer, // 1
  "tipId": String(url,nonce), // "https://aeternity.com,1"
  "note": String, // "hello world"
  "author": String(address), // ak_a4eg....
  "signature": String(hash), // "af3eg..."
  "createdAt": String(Date.toISOString), // "2020-02-14 16:13:43.264 +00:00"
  "updatedAt": String(Date.toISOString) // "2020-02-14 16:13:43.264 +00:00"
}

```

#### Delete comment
```
POST /comment/api/:Int(id)

Authorization: HTTP Basic Authorization

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

#### Get all Ehinese posts

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
