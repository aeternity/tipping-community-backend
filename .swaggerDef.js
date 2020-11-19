const packageJson = require('./package.json')
module.exports = {
  info: {
    title: 'Superhero Backend Docs',
    version: packageJson.version,
    description: 'The backend to superhero.com',
    license:     {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    { url: 'https://raendom-backend.z52da5wt.xyz' }
  ],
  components: {}, // REQUIRED
  openapi: '3.0.3'
};
