# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.8.0](https://www.github.com/aeternity/tipping-community-backend/compare/v1.7.1...v1.8.0) (2021-02-05)


### Features

* **mq:** adds chain subscriber ([950d542](https://www.github.com/aeternity/tipping-community-backend/commit/950d542d2de08ad14d21572d0a25479a97cac2f2))
* **mq:** elevates mq logs to info ([de94471](https://www.github.com/aeternity/tipping-community-backend/commit/de94471cf6c5de62fae06535c6595b68ab3b0ea8))
* **mq:** realtime message queues ([105d71c](https://www.github.com/aeternity/tipping-community-backend/commit/105d71c3ef466a0c207a29a5158dcba247d81be8))
* **pricehistory:** add endpoint, mdw fetching logic fixes ([9a2b760](https://www.github.com/aeternity/tipping-community-backend/commit/9a2b7609bc492f80c4fc935b0c11b30418e63a63))
* **pricehistory:** refactor response format ([2006c59](https://www.github.com/aeternity/tipping-community-backend/commit/2006c5966fe9516f174c71d0b98e1d44f39e6bb4))
* **words:** add pagination, move params to route ([9ea7d9c](https://www.github.com/aeternity/tipping-community-backend/commit/9ea7d9c0666fcaf8612ba774ea055050bb74ea08))


### Bug Fixes

* **mq:** re-subscribe on restart even if queue still exists ([ae86dbe](https://www.github.com/aeternity/tipping-community-backend/commit/ae86dbea3c8488e1d6e91f591f87494387cc66d5))
* **mq:** retrieves all messages on notification ([be93b2d](https://www.github.com/aeternity/tipping-community-backend/commit/be93b2d72fe9c9a35f0f9605c163430874b98c92))
* **mq:** unsubscribe on reset ([59d8e95](https://www.github.com/aeternity/tipping-community-backend/commit/59d8e959df354a01f5a70d8cf72f200cb9c72aa1))
* **preview:** removes not consumed link preview event ([1c9e999](https://www.github.com/aeternity/tipping-community-backend/commit/1c9e99995fa04d67ed1d46ada9a9ebf4e5259b42))
* **rejectionhandler:** move promise rejection handler ([3648f1b](https://www.github.com/aeternity/tipping-community-backend/commit/3648f1b48d09b2e067232cc4dd0142ef47a93e28))


### Miscellaneous

* **www:** move dependencies ([89dff6d](https://www.github.com/aeternity/tipping-community-backend/commit/89dff6d5e57f243cb7ec5951eb048b6f9f3946b6))


### Testing

* **mq:** adds tests to chain subscriber ([23911c3](https://www.github.com/aeternity/tipping-community-backend/commit/23911c34d8efc9cbc388fbfbbe0ded27323cf3c8))
* **pricehistory:** adds tests for two success cases ([14743cf](https://www.github.com/aeternity/tipping-community-backend/commit/14743cf2944060999ffdaad0751082f471984584))


### CI / CD

* adds missing commit lint config file ([baf30e9](https://www.github.com/aeternity/tipping-community-backend/commit/baf30e9bd8e2c79ab155d990adababe67947191a))
* adds more categories to changelog ([7f5c682](https://www.github.com/aeternity/tipping-community-backend/commit/7f5c68298c036bae3e10d6673a773179b89d02d5))
* upgrades release action to v2 ([764bc9e](https://www.github.com/aeternity/tipping-community-backend/commit/764bc9e34579fd8c399bf076b54ce99f692a5612))

### [1.7.1](https://www.github.com/aeternity/tipping-community-backend/compare/v1.7.0...v1.7.1) (2021-02-02)


### Bug Fixes

* **trace:** fixes blockchain trace ([cafb8b8](https://www.github.com/aeternity/tipping-community-backend/commit/cafb8b8b0fa4b7ef969d57b79937c692774e38f4))

## [1.7.0](https://www.github.com/aeternity/tipping-community-backend/compare/v1.6.2...v1.7.0) (2021-02-01)


### Features

* **aeternity:** adds some resilience against unavailable compilers & nodes ([ee9b9e6](https://www.github.com/aeternity/tipping-community-backend/commit/ee9b9e6b819095628d822cc7206aab75cb37ec42))
* **cache:** links keephot refresh time to minimal cache time ([7531687](https://www.github.com/aeternity/tipping-community-backend/commit/7531687bcec34f063249ae3494e2c233dde3609d))
* **cache:** tests chain name messaging ([9c914b5](https://www.github.com/aeternity/tipping-community-backend/commit/9c914b5c4685acc07c3aab0025104a66eda4342a))
* **ci:** adds automatic version bumping for releases ([36a95a1](https://www.github.com/aeternity/tipping-community-backend/commit/36a95a1fa427f4c35652ae1a9ce768b3f350914e))
* **ci:** adds ci to build & verify swagger ([ae51ef0](https://www.github.com/aeternity/tipping-community-backend/commit/ae51ef02283e18add2dfe27f254a98592355a1bc))
* **ci:** adds new release workflow ([b69f8e7](https://www.github.com/aeternity/tipping-community-backend/commit/b69f8e76fe16bd502c86e66936708980204cef7e))
* **docker:** adds v3 contract address to environment ([9a8579a](https://www.github.com/aeternity/tipping-community-backend/commit/9a8579afc590bd03f8e277d6105a9f512366fbea))
* **docker:** use ready build image in docker-compose #patch ([c156c8e](https://www.github.com/aeternity/tipping-community-backend/commit/c156c8e5ce56a3dd85d76a3af9bfd8f99aa04829))
* **mdw:cache:profile:** changes some chainname logic & handling ([8d7284b](https://www.github.com/aeternity/tipping-community-backend/commit/8d7284b835ff0eff6e58dd4150ee2e09cca9e23b))
* **middleware:** adds v2 + v3 contract, also creates test coverage ([f647b6e](https://www.github.com/aeternity/tipping-community-backend/commit/f647b6e85a3afe548131f8f3993a8a5b0fca1aed))
* **notifications:** adds bulk update notification endpoint ([475bd2c](https://www.github.com/aeternity/tipping-community-backend/commit/475bd2ccb8dcdde3e185d2130e4ca77c646e2cdf))
* **notifications:** adds PEEKED as notification state ([0ed26a5](https://www.github.com/aeternity/tipping-community-backend/commit/0ed26a5a03fee5a68c146fd86d9de4d425f229fd))
* **notifications:** removes redundant code ([0604650](https://www.github.com/aeternity/tipping-community-backend/commit/0604650f36321f5cb43e7c8e10d0c53c3ac6547b))
* **payfortx:** adds successful preclaim result to logs ([76c0d46](https://www.github.com/aeternity/tipping-community-backend/commit/76c0d46ebe8af2683fefa2baf033f680d5034518))
* **payfortx:** signature verification on endpoint ([a8dbf7b](https://www.github.com/aeternity/tipping-community-backend/commit/a8dbf7bbd7ce237f31b77d9fd9b3ce6833c82471))
* **queue:** adds helper & defines more constants ([f502141](https://www.github.com/aeternity/tipping-community-backend/commit/f502141861236255bea92ca1c1e350058a73d18e))
* **queue:** incorporates PR feedback ([592e48f](https://www.github.com/aeternity/tipping-community-backend/commit/592e48f1fbfb8397fdad1b329544623144a8591b))
* **queue:** introduces queue usage ([2bc9363](https://www.github.com/aeternity/tipping-community-backend/commit/2bc9363d2d725ff2bc73d7346c8e6f40e584e024))
* **queue:profile:** moves chain name updates to message queue ([8dedff7](https://www.github.com/aeternity/tipping-community-backend/commit/8dedff70f1335623927a1ba1a6450f0d0ddb747b))
* **queues:** adds test coverage to queue and message broker ([e926d05](https://www.github.com/aeternity/tipping-community-backend/commit/e926d05d5c52f181cf2c0280ccf6b4464b923a47))
* **routes:** disables wordbazaar if no env is defined ([d89e947](https://www.github.com/aeternity/tipping-community-backend/commit/d89e947156c0a620e3b692b057cb228f62d26f38))
* **rsmq:** adds proper queue setup ([a68af0e](https://www.github.com/aeternity/tipping-community-backend/commit/a68af0e0833f6ddcb0b98c9dd8d73e369dbc6239))
* **rsmq:** initial setup ([5f9b7a3](https://www.github.com/aeternity/tipping-community-backend/commit/5f9b7a31584522d736567ec9675e76a8750c583d))
* **sentry:** captures exceptions from node & mdw fails ([e76aaf7](https://www.github.com/aeternity/tipping-community-backend/commit/e76aaf778c537651567c40fcd793ede94398ba9a))
* **sentry:** captures two more ([c60297a](https://www.github.com/aeternity/tipping-community-backend/commit/c60297ac42191358d4cae7d0ad203d575c382189))
* **server:** adds sentry integration for error & performance monitoring ([a16ed37](https://www.github.com/aeternity/tipping-community-backend/commit/a16ed37092418303e34b189050c8a850d97f83b3))
* **server:** forwards uncaptured errors to sentry ([1f4c4a8](https://www.github.com/aeternity/tipping-community-backend/commit/1f4c4a8b7c4363f5fb4bc7223bd42c58c55074c7))
* **server:** moves init to new file ([7c6f888](https://www.github.com/aeternity/tipping-community-backend/commit/7c6f8888ac46c50a8d3dd83f912c12dde2aa1adf))
* **swagger:** includes swagger lint in package json ([8c1d5d1](https://www.github.com/aeternity/tipping-community-backend/commit/8c1d5d17394bcebf89edf865c0187fdb8220104c))
* **tip:** removes redundant code ([ee3fbf2](https://www.github.com/aeternity/tipping-community-backend/commit/ee3fbf2e9e2de89c8284121070a7079a5c00cd2e))
* **wordbazaar:** adds tests ([606726a](https://www.github.com/aeternity/tipping-community-backend/commit/606726a06c22489d1d1d8390beb26475e235254c))
* **wordbazaar:** conditional activation of keephot ([bb520ba](https://www.github.com/aeternity/tipping-community-backend/commit/bb520ba1ef3622d752a91bc7b341a9262c6e925d))
* **wordbazaar:** updates tests for changed endpoint ([ec10974](https://www.github.com/aeternity/tipping-community-backend/commit/ec109741caf004eca59a3fe55483c326aefc78b8))
* **wordbazar:** moves logic to route files ([abf0ec7](https://www.github.com/aeternity/tipping-community-backend/commit/abf0ec7f3596e785c20d0699afbef3fabd01c18d))


### Bug Fixes

* fixes various tests related to queue changes ([db061e9](https://www.github.com/aeternity/tipping-community-backend/commit/db061e91424c6bad5ad0dd3f88bbe00072e752f0))
* **aeternity:** allow usage of v1 contract only #patch ([07bac48](https://www.github.com/aeternity/tipping-community-backend/commit/07bac48d82197218f2b44e6227edc11707e0493d))
* **blacklist:** reset tips cache on blacklist invalidation ([6fe41e4](https://www.github.com/aeternity/tipping-community-backend/commit/6fe41e43be3ab97a6751645856a81963ef483322))
* **broker:** incorporates PR feedback ([eb639b4](https://www.github.com/aeternity/tipping-community-backend/commit/eb639b4059a3b3fa58c7ca02cad07a9ef32df089))
* **cache:** extends test timeout as token contract gains some tx ([868cc9b](https://www.github.com/aeternity/tipping-community-backend/commit/868cc9b5b896285b2927ca1c2a859cc43fe01ce7))
* **cache:** increase first price cache test timeout ([5d5a190](https://www.github.com/aeternity/tipping-community-backend/commit/5d5a19085d56961883bd519abd4eeefce0d39891))
* **cache:** remove undefined function from keephot ([115860d](https://www.github.com/aeternity/tipping-community-backend/commit/115860dce6f0d564d4a786447efe261c0aaade6a))
* **ci:** removes legacy env variables ([0a5c0e8](https://www.github.com/aeternity/tipping-community-backend/commit/0a5c0e8356e7b9364afc46f9278f043acf39149b))
* **dep:** changes contract branch #patch ([371f2e6](https://www.github.com/aeternity/tipping-community-backend/commit/371f2e696e997ccd58e2cd7c0c85fa84fe89b8e5))
* **docker:** adds required env variables ([f932979](https://www.github.com/aeternity/tipping-community-backend/commit/f9329790f0e171cb7b4e204d8eac960ec7dfcc19))
* **docker:** sets postgres to v12 until upgrade path is defined #patch ([375e61b](https://www.github.com/aeternity/tipping-community-backend/commit/375e61b8bfcd9716b014287a2cbeb2e28a6d05d5))
* **linkpreview:** avoids duplicate preview generation #patch ([95ca777](https://www.github.com/aeternity/tipping-community-backend/commit/95ca7775a0c32d38658e0bb08de2057bdf08a2b5))
* **mdw:** introduces timeout to mdw requests and logs failing lock keys ([692f724](https://www.github.com/aeternity/tipping-community-backend/commit/692f7242ee551112ace5546c0b4bd8fe8b4e4be8))
* **mdw:** updates wrong variable names in test ([104a7f5](https://www.github.com/aeternity/tipping-community-backend/commit/104a7f55e7e4c05a95c3c104b27da4a5273f607b))
* **media:** creates image folder if it does not exist ([ea339a0](https://www.github.com/aeternity/tipping-community-backend/commit/ea339a0ad1efff27539d650b58105cf1f0443928))
* **notifications:** fixes docs to comply with linting ([3252d0b](https://www.github.com/aeternity/tipping-community-backend/commit/3252d0b814b4149d85db4b03fcd636b1a304a408))
* **notifications:** notification status enum migrations should work now ([3a81af2](https://www.github.com/aeternity/tipping-community-backend/commit/3a81af2b520b4e2557c02e4401054805b06fc2a9))
* **notifications:** removes future self-notifications ([d00557a](https://www.github.com/aeternity/tipping-community-backend/commit/d00557a8bd53c0dd31205d250fa72002897c1757))
* **notifications:** updates urls in docs (solves [#227](https://www.github.com/aeternity/tipping-community-backend/issues/227)) ([5561d9c](https://www.github.com/aeternity/tipping-community-backend/commit/5561d9c91b5c916d0417bdacd6196258fe251307))
* **payfortx:** clear interval before catching contract error ([c7cbec0](https://www.github.com/aeternity/tipping-community-backend/commit/c7cbec0d25fc17984237256d1f67c0c9f64bd7d4))
* **payfortx:** fixes invalid function and tests it ([efc14a0](https://www.github.com/aeternity/tipping-community-backend/commit/efc14a0f85dbbfd67f60fc1c049c0672b97835a5))
* **payfortx:** interval counter was not increased on error ([5d61e4d](https://www.github.com/aeternity/tipping-community-backend/commit/5d61e4de75cc8e2b4680b7b1f9236191e84b2b7c))
* **queue:** fixes test setup ([be304ae](https://www.github.com/aeternity/tipping-community-backend/commit/be304aee903d7fcec3efff60befc1d49dd429b47))
* **sentry:** updates sentry sample rate to three in 1k #patch ([46ae57b](https://www.github.com/aeternity/tipping-community-backend/commit/46ae57b3f3d7c79385dfe5c3a9427b927f5dcc8c))
* **swagger:** adjusts doc generation to new paths ([d4eb185](https://www.github.com/aeternity/tipping-community-backend/commit/d4eb18508d399d92f4242d69612c69adc82304a0))
* **swagger:** sets specific version to avoid broken RC ([1ad6346](https://www.github.com/aeternity/tipping-community-backend/commit/1ad634647a1bab3dc02760db07f0446981c1a2d5))
* **swagger:** swagger now runs against testnet server ([84dac7e](https://www.github.com/aeternity/tipping-community-backend/commit/84dac7e11c694675c19c6013b228b3fd645d23c7))
* **test:** fixes stats test failing due to timeout ([5c12f6a](https://www.github.com/aeternity/tipping-community-backend/commit/5c12f6a7b76b136986397c883cb954130e193293))
* **tests:** fixes rebase issues ([6e0f8f3](https://www.github.com/aeternity/tipping-community-backend/commit/6e0f8f3d44820d2dc9a24868dcc94e015ad31dfb))
* **wordbazaar:** adds correct contracts for cache invalidation tests ([02fbe86](https://www.github.com/aeternity/tipping-community-backend/commit/02fbe86f9e48a4284b97dab26156f9a6de9d043c))
* **wordbazaar:** adjusts path parameter ([8bf9431](https://www.github.com/aeternity/tipping-community-backend/commit/8bf943189855306bed4b7a97125734870665707d))
* **wordbazaar:** fixes search score in search result ([e766fff](https://www.github.com/aeternity/tipping-community-backend/commit/e766fffb20d273fccf7de600751d63c9d18a2018))

### [1.6.2](https://github.com/aeternity/tipping-community-backend/compare/v1.6.1...v1.6.2) (2021-02-01)


### Features

* **ci:** adds release script ([1ac44be](https://github.com/aeternity/tipping-community-backend/commit/1ac44be663e52716e29feb2100ac2c89ff6df165))
* **payfortx:** adds successful preclaim result to logs ([76c0d46](https://github.com/aeternity/tipping-community-backend/commit/76c0d46ebe8af2683fefa2baf033f680d5034518))


### Bug Fixes

* **ci:** removes legacy env variables ([0a5c0e8](https://github.com/aeternity/tipping-community-backend/commit/0a5c0e8356e7b9364afc46f9278f043acf39149b))
* **docker:** adds required env variables ([f932979](https://github.com/aeternity/tipping-community-backend/commit/f9329790f0e171cb7b4e204d8eac960ec7dfcc19))
* **payfortx:** fixes invalid function and tests it ([efc14a0](https://github.com/aeternity/tipping-community-backend/commit/efc14a0f85dbbfd67f60fc1c049c0672b97835a5))
