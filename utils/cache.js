const redis = require("redis");
const {promisify} = require('util');

if (!process.env.REDIS_URL) throw "REDIS_URL is not set";

const client = redis.createClient(process.env.REDIS_URL);
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);
const del = promisify(client.del).bind(client);
const keys = promisify(client.keys).bind(client);
var AsyncLock = require('async-lock');
var lock = new AsyncLock({timeout: 30 * 1000});

const cache = {};
cache.wsconnection = null;

cache.shortCacheTime = process.env.SHORT_CACHE_TIME || 5 * 60;
cache.longCacheTime = process.env.LONG_CACHE_TIME || 60 * 60;
cache.keepHotInterval = process.env.KEEP_HOT_INTERVAL || 20 * 1000;
cache.networkKey = "";

cache.init = async (aeternity, keepHotFunction) => {
    aeternity.setCache(cache);
    cache.networkKey = await aeternity.networkId();
    console.log("cache networkKey", cache.networkKey);
    cache.keepHot(aeternity, keepHotFunction);
};

const buildKey = (keys) => [cache.networkKey, ...keys].join(":");

cache.getOrSet = async (keys, asyncFetchData, expire = null) => {
    const key = buildKey(keys);
    const value = await get(key);
    if (value) return JSON.parse(value);

    const startLock = new Date().getTime();
    return lock.acquire(key, async () => {
        const lockedValue = await get(key);
        if (lockedValue) {
            console.log("\n   lock.acquire", key, new Date().getTime() - startLock, "ms");
            return JSON.parse(lockedValue);
        }

        const start = new Date().getTime();
        const data = await asyncFetchData();
        cache.set(keys, data, expire);
        (new Date().getTime() - start > 50) ? console.log("\n   cache", key, new Date().getTime() - start, "ms") : process.stdout.write("'");

        return data;
    }).catch(e => {
        console.error(e);
        return asyncFetchData();
    });
};

cache.set = async (keys, data, expire = null) => {
    const key = buildKey(keys);

    if (expire) {
        await set(key, JSON.stringify(data), "EX", expire);
    } else {
        await set(key, JSON.stringify(data));
    }
};

cache.delByPrefix = async (prefixes) => {
    const prefix = buildKey(prefixes);
    console.log("      cache keys", prefix + "*");
    const rows = await keys(prefix + "*");
    if (rows.length) console.log("      cache delByPrefix", rows);
    await Promise.all(rows.map(key => del(key)));
};

cache.del = async (keys) => {
    const key = buildKey(keys);
    await del(key);
};

cache.keepHot = (aeternity, keepHotFunction) => {
    const keepHotLogic = async () => {
        const start = new Date().getTime();
        await keepHotFunction();
        console.log("\n  cache keepHot", new Date().getTime() - start, "ms");
    };

    keepHotLogic();
    setInterval(keepHotLogic, cache.keepHotInterval);
};

module.exports = cache;
