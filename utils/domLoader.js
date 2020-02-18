// load dom from url
const puppeteer = require('puppeteer');

module.exports = class DomLoader {

  static async getHTMLfromURL(url) {
    const browser = await puppeteer.launch(process.env.NODE_ENV === 'test' ? {} : {
      executablePath: '/usr/bin/chromium-browser',
      args: ['--disable-dev-shm-usage'],
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
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 40000 });
      }

      const html = await page.content();
      await browser.close();
      return html;
    } catch (e) {
      await browser.close();
      return null;
    }
  }
};
