// load dom from url
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const imageLogic = require('../../media/logic/imageLogic');
const logger = require('../../../utils/logger')(module);

module.exports = class DomLoader {
  static async getHTMLfromURL(url) {
    let result = await DomLoader.runBrowser(url);
    if (result.error) result = await DomLoader.runBrowser(url);
    return result;
  }

  static async getScreenshot(url) {
    return DomLoader.runBrowser(url, true);
  }

  static async runBrowser(url, screenshot = false) {
    const options = {
      args: ['--lang=en-US,en', '--disable-dev-shm-usage'],
      ...process.env.NODE_ENV === 'production' ? { executablePath: '/usr/bin/chromium-browser' } : {},
    };
    const browser = await puppeteer.launch(options);

    try {
      const page = await browser.newPage();
      let response = await page.goto(url, {
        waitUntil: 'networkidle2',
      });
      // Weibo hack
      if (
        (new URL(url)).hostname === 'www.weibo.com'
        && (new URL(page.url())).hostname === 'passport.weibo.com'
      ) {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45 * 1000 });
      }

      // Cloudflare / Redirect hack
      if (
        // code should be 301 or 503
        response.status() === 301 || response.status() === 503
      ) {
        response = await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15 * 1000 });
      }

      if (
        (new URL(url)).hostname === 'www.weibo.com'
        && page.url().includes('login.php')
      ) {
        throw new Error('Got caught on login.php');
      }

      if (
        // proper response
        (response.status() >= 200 && response.status() < 300)
        // superhero responds with 404 for everything :(
        || (response.status() === 404 && (new URL(page.url())).hostname === 'superhero.com')) {
        const filename = `preview-${uuidv4()}.jpg`;
        if (screenshot) await page.screenshot({ path: imageLogic.getImagePath(filename) });
        const html = await page.content();
        await browser.close();
        return { html, url: page.url(), screenshot: screenshot ? filename : null };
      }
      throw Error(`Website responded with ${response.status()}`);
    } catch (e) {
      logger.error(`Error while crawling ${url}: ${e.message}`);
      await browser.close();
      return {
        html: null,
        url: null,
        error: e.message,
      };
    }
  }
};
