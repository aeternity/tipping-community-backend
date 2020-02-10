const { LinkPreview } = require('../utils/database.js');
const axios = require('axios');

module.exports = class LinkPreviewLogic {

  // API Functions
  static async getAllLinkPreviews (req, res) {
    if (req.query.url) return res.send(await LinkPreview.findOne({ where: { requestUrl: req.query.url }, raw: true }));
    res.send(await LinkPreview.findAll({ raw: true }));
  }

  static async forceRequery (req, res) {
    if (!req.body.url) return res.sendStatus(400);
    const result = await LinkPreview.destroy({ where: { requestUrl: req.body.url }, raw: true });
    if(result !== 1) return res.sendStatus(404);
    res.send(await LinkPreviewLogic.getPreview(req.body.url, !!req.body.custom));
  }

  // General Functions
  static async getPreview (url, forceCustomQuery = false) {
    const result = await LinkPreview.findOne({ where: { requestUrl: url }, raw: true });
    // Check for previous previews
    if (forceCustomQuery) {
      return await LinkPreviewLogic.createPreviewForUrl(url, LinkPreviewLogic.queryCustomCrawler);
    }

    if (result) {
      // Check for previous result
      if (!result.querySucceeded)
        return await LinkPreviewLogic.createPreviewForUrl(url, LinkPreviewLogic.queryCustomCrawler);
      return result;
    } else {
      return await LinkPreviewLogic.createPreviewForUrl(url, LinkPreviewLogic.queryLinkPreview);
    }
  }

  static async createPreviewForUrl (url, crawler) {
    try {
      const { title, description, image, url: responseUrl } = await crawler(url);
      const existingEntry = await LinkPreview.findOne({ where: { requestUrl: url } });

      if (existingEntry) {
        return await existingEntry.update({
          requestUrl: url,
          title, description, image,
          responseUrl,
          querySucceeded: true,
        }, { raw: true });
      } else {
        return await LinkPreview.create({
          requestUrl: url,
          title, description, image,
          responseUrl,
          querySucceeded: true,
        }, { raw: true });
      }
    } catch (err) {
      return LinkPreview.create({
        requestUrl: url,
        querySucceeded: false,
        failReason: err.message,
      }, { raw: true });
    }
  }

  static async queryLinkPreview (url) {
    return (await axios.get(`http://api.linkpreview.net/?key=${process.env.LINKPREVIEWNET_KEY}&q=${url}`)).data;
  }

  static async queryCustomCrawler (url) {
    // TODO implement
  }
};
