const packageJson = require("./package.json");
module.exports = {
  info: {
    title: "Superhero Backend Docs",
    version: packageJson.version,
    description: "The backend to superhero.com",
    license: {
      name: "ISC",
      url: "https://opensource.org/licenses/ISC",
    },
  },
  servers: [{ description: "Testnet Server", url: "https://testnet.superhero.aeternity.art" }],
  components: {}, // REQUIRED
  openapi: "3.0.3",
};
