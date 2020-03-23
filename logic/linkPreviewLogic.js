const { LinkPreview } = require('../models');
const DomLoader = require('../utils/domLoader.js');
const axios = require('axios');
const lngDetector = new (require('languagedetect'));
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
lngDetector.setLanguageType('iso2');

const metascraper = require('metascraper')([
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-lang')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
]);

module.exports = class LinkPreviewLogic {

  static async fetchLinkPreview() {
    return LinkPreview.findAll({ raw: true });
  }

  // API Functions
  static async getLinkPreview (req, res) {
    const url = req.params.url ? req.params.url : (req.query.url ? req.query.url : null);
    if (url) {
      const result = await LinkPreview.findOne({ where: { requestUrl: url }, raw: true });
      return result ? res.send(result) : res.sendStatus(404);
    }
    res.send(await LinkPreviewLogic.fetchLinkPreview());
  }

  static async getImage (req, res) {
    if (!req.params.filename) return res.sendStatus(404);
    const filepath = path.resolve(__dirname, '../images', req.params.filename.replace('/linkpreview/image', ''));
    if (!fs.existsSync(filepath)) return res.sendStatus(404);
    res.sendFile(filepath);
  }

  // General Functions
  static async generatePreview (url) {
    // Try easy version first
    let queryResult = await LinkPreviewLogic.createPreviewForUrl(url, LinkPreviewLogic.querySimpleCustomCrawler);
    // if it fails try more costly version
    if (!queryResult.querySucceeded)
      queryResult = LinkPreviewLogic.createPreviewForUrl(url, LinkPreviewLogic.queryCostlyCustomCrawler);
    return queryResult;
  }

  static async createPreviewForUrl (url, crawler) {
    try {
      // VERIFY URL
      await metascraper({ url });
      const html = await crawler(url);
      const result = await metascraper({ url, html });
      const data = {
        ...result,
        responseUrl: result.url,
        requestUrl: url,
        querySucceeded: (!!result.title && (!!result.description || !!result.image)),
      };

      if (data.querySucceeded && data.lang === null) {
        const probability = data.description ? lngDetector.detect(data.description, 1) : lngDetector.detect(data.title, 1);
        if (probability && probability.length > 0 && probability[0][1] > 0.1) data.lang = probability[0][0];
      }

      if (data.image) {
        try {
          const filename = `preview-${uuidv4()}${path.extname(data.image.includes('?') ? data.image.split('?')[0] : data.image)}`;
          const response = await axios.get(data.image, { responseType: 'stream' });
          const writer = response.data.pipe(fs.createWriteStream(path.resolve(__dirname, '../images', filename)));
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          data.image = `/linkpreview/image/${filename}`;
        } catch (e) {
          console.error('Could not fetch image');
          data.image = null;
        }
      }

      const existingEntry = await LinkPreview.findOne({ where: { requestUrl: url } });

      if (existingEntry) {
        return await LinkPreview.update({ ...data, failReason: null }, { where: { requestUrl: url }, raw: true });
      } else {
        return await LinkPreview.create(data, { raw: true });
      }
    } catch (err) {
      console.error(`Crawling ${url} failed with "${err.message}"`);

      return LinkPreview.create({
        requestUrl: url,
        querySucceeded: false,
        failReason: err.message ? err.message : err,
      }, { raw: true });
    }
  }

  static async querySimpleCustomCrawler (url) {
    return (await axios.get(url)).data;
  };

  static async queryCostlyCustomCrawler (url) {
    return (await DomLoader.getHTMLfromURL(url) || {}).html;
  }
};
