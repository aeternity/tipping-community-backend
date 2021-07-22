module.exports = class StaticLogic {
  static async getGrayList(req, res) {
    res.send([
      'facebook.com',
      'weibo.com',
      'pinterest.com',
      'vk.com',
      'quora.com',
      'spotify.com',
      'linkedin.com',
    ]);
  }
};
