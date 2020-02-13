const { LinkPreview } = require('../utils/database.js');
const DomLoader = require('../utils/domLoader.js');
const axios = require('axios');
const lngDetector = new (require('languagedetect'));
lngDetector.setLanguageType('iso2');

const metascraper = require('metascraper')([
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-lang')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
]);

module.exports = class LinkPreviewLogic {

  // API Functions
  static async getLinkPreview (req, res) {
    if (req.query.url) return res.send(await LinkPreview.findOne({ where: { requestUrl: req.query.url }, raw: true }));
    res.send(await LinkPreview.findAll({ raw: true }));
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
        if (probability && probability[0][1] > 0.1) data.lang = probability[0][0];
      }

      const existingEntry = await LinkPreview.findOne({ where: { requestUrl: url } });

      if (existingEntry) {
        return await existingEntry.update(data, { raw: true });
      } else {
        return await LinkPreview.create(data, { raw: true });
      }
    } catch (err) {
      console.error(err);

      return LinkPreview.create({
        requestUrl: url,
        querySucceeded: false,
        failReason: err.message ? err.message : err,
      }, { raw: true });
    }
  }

  static async queryLinkPreview (url) {
    return (await axios.get(`http://api.linkpreview.net/?key=${process.env.LINKPREVIEWNET_KEY}&q=${url}`)).data;
  }

  static async querySimpleCustomCrawler (url) {
    return (await axios.get(url)).data;
  };

  static async queryCostlyCustomCrawler (url) {
    return await DomLoader.getHTMLfromURL(url);
  }
};
