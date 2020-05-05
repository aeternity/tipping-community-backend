// load dom from url
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

module.exports = class DomLoader {

  static async getHTMLfromURL (url) {
    let result = await DomLoader.runBrowser(url);
    if (result.error) result = await DomLoader.runBrowser(url);
    return result;
  }

  static async getScreenshot (url) {
    return DomLoader.runBrowser(url, true);
  }

  static async runBrowser (url, screenshot = false) {
    const args = ['--lang=en-US,en'];
    if(process.env.NODE_ENV === 'test') args.push('--disable-dev-shm-usage')
    const browser = await puppeteer.launch(process.env.NODE_ENV === 'test' ? {} : {
      executablePath: '/usr/bin/chromium-browser',
      args
    });
    try {
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle2',
      });
      if (
        (new URL(url)).hostname === 'www.weibo.com' &&
        (new URL(page.url())).hostname === 'passport.weibo.com'
      ) {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45 * 1000 });
      }

      if(
        (new URL(url)).hostname === 'www.weibo.com' &&
        page.url().includes('login.php')
      ) {
        throw new Error('Got caught on login.php')
      }
      const filename = `preview-${uuidv4()}.jpg`;
      if(screenshot) await page.screenshot({path: path.resolve(__dirname, '../images', filename)});
      const html = await page.content();
      await browser.close();
      return { html, url: page.url(), screenshot: screenshot ? filename : null};
    } catch (e) {
      console.error(`Error while crawling ${url}: ${e.message}`);
      await browser.close();
      return {
        html: null,
        url: null,
        error: e.message,
      };
    }
  }
};
