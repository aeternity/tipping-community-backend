# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.10.3](https://www.github.com/aeternity/tipping-community-backend/compare/v1.10.2...v1.10.3) (2021-06-02)


### Miscellaneous

* **deps:** bump hosted-git-info from 2.8.8 to 2.8.9 ([4e026b4](https://www.github.com/aeternity/tipping-community-backend/commit/4e026b490dfb1f8a01baf87e19dc86abd277078c))
* **deps:** bump lodash from 4.17.20 to 4.17.21 ([605812c](https://www.github.com/aeternity/tipping-community-backend/commit/605812c7ead53b363de851458587668412518863))
* **deps:** bump underscore from 1.12.0 to 1.13.1 ([449e6ea](https://www.github.com/aeternity/tipping-community-backend/commit/449e6eaab53e281cc83cb3186ddb035a628f7ef8))
* **deps:** update sdk to final version ([dca8956](https://www.github.com/aeternity/tipping-community-backend/commit/dca8956f029e66714b1446f58434441b7ac26937))
* **deps:** upgrade sdk to 8.1.0 ([91fed3d](https://www.github.com/aeternity/tipping-community-backend/commit/91fed3d54b4a6628fce0a1a0f0221f585461a3ac))
* **sdk:** update sdk for iris, add dry-run workaround ([1c68cac](https://www.github.com/aeternity/tipping-community-backend/commit/1c68cace751abb54529063ffbd66f22eb23bf394))

### [1.10.2](https://www.github.com/aeternity/tipping-community-backend/compare/v1.10.1...v1.10.2) (2021-04-27)


### Miscellaneous

* **deps:** bump redis from 3.0.2 to 3.1.1 ([3d7fd2b](https://www.github.com/aeternity/tipping-community-backend/commit/3d7fd2bcfad0c456fa497a5724081ed30eae7dec))

### [1.10.1](https://www.github.com/aeternity/tipping-community-backend/compare/v1.10.0...v1.10.1) (2021-04-22)


### Miscellaneous

* **chainlistener:** elevates websocket connection logs to info level ([4f2bcc0](https://www.github.com/aeternity/tipping-community-backend/commit/4f2bcc0c2463252632eb00082aa6d04143bc1e25))


### CI / CD

* **husky:** fixes husky pre commit integration ([497efd3](https://www.github.com/aeternity/tipping-community-backend/commit/497efd3c15609af20aed93aaedd7bd77cc7df486))

## [1.10.0](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.7...v1.10.0) (2021-04-16)


### Features

* **profile:** fallback to empty profile and default chainname ([095a408](https://www.github.com/aeternity/tipping-community-backend/commit/095a4083dad77bbc6ba4de9cf7d0b8547093f1cb))
* **profile:** only return preferred chainname ([fd8f740](https://www.github.com/aeternity/tipping-community-backend/commit/fd8f740e3d7d4e6e6017e1f3780bd6354e7aaf4f))

### [1.9.7](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.6...v1.9.7) (2021-04-16)


### Bug Fixes

* **docker:** adds required env to compsoe ([73b1794](https://www.github.com/aeternity/tipping-community-backend/commit/73b179436a987d8190b932d3bf7db181b07dc9ee))


### Refactorings

* **oracle:** added missing tests for oracle getter ([a5a79bf](https://www.github.com/aeternity/tipping-community-backend/commit/a5a79bf45a12691e4468f2fe14095f39f08bea92))
* **oracle:** use oracle getter contract ([aac74d3](https://www.github.com/aeternity/tipping-community-backend/commit/aac74d38eaa99209bb19a86b57fcbce43ef9b010))
* **oracle:** use v2 getter contract to get claimed urls from oracle ([6595c5a](https://www.github.com/aeternity/tipping-community-backend/commit/6595c5ae862d87d948ec1dea866210f650329baa))

### [1.9.6](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.5...v1.9.6) (2021-04-15)


### Bug Fixes

* **cache:** increases timeouts on flaky tests ([09f7713](https://www.github.com/aeternity/tipping-community-backend/commit/09f77131dc9e0edc598d49ca42e8abe95ed6d346))


### Miscellaneous

* **claim:** fix claim success await ([bdf31bb](https://www.github.com/aeternity/tipping-community-backend/commit/bdf31bb019d15f34b8648a68f9bc46e795f22ce1))

### [1.9.5](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.4...v1.9.5) (2021-04-14)


### Miscellaneous

* **db:** adjust migration names ([c2eb932](https://www.github.com/aeternity/tipping-community-backend/commit/c2eb932ecd76afe2b80b62926214980c341c70af))

### [1.9.4](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.3...v1.9.4) (2021-04-14)


### Miscellaneous

* **db:** adjust migration names ([a4ca40d](https://www.github.com/aeternity/tipping-community-backend/commit/a4ca40dc2b3825d95ba636e3dff8290fa10ec8b8))

### [1.9.3](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.2...v1.9.3) (2021-04-14)


### Bug Fixes

* **errorreports:** migrates to jsonb ([067d611](https://www.github.com/aeternity/tipping-community-backend/commit/067d611a4cfff40e6a6e893f2627eaa55d7b113e))

### [1.9.2](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.1...v1.9.2) (2021-04-14)


### Bug Fixes

* **notifications:** allows peeked status to be set ([82e73cb](https://www.github.com/aeternity/tipping-community-backend/commit/82e73cbfc4e7c141c79c510f935c59ab8fbc92d0))
* **profile:** adds tests to legacy endpoint and updates docs ([0bd8cf5](https://www.github.com/aeternity/tipping-community-backend/commit/0bd8cf5829ab782b1993788f04f2243e7be9fb2f))

### [1.9.1](https://www.github.com/aeternity/tipping-community-backend/compare/v1.9.0...v1.9.1) (2021-04-12)


### Bug Fixes

* **cache:** events can now be filtered without errors ([4161350](https://www.github.com/aeternity/tipping-community-backend/commit/4161350dae14a33a79f1f31beb961a20bebf3c90))

## [1.9.0](https://www.github.com/aeternity/tipping-community-backend/compare/v1.8.1...v1.9.0) (2021-04-12)


### Features

* adds cacheBust query to image routes ([25dd764](https://www.github.com/aeternity/tipping-community-backend/commit/25dd764009dd1f59991cc6cfbc9757b45c3d24e6))
* **blacklist:** renames flagger to author ([b2d28c2](https://www.github.com/aeternity/tipping-community-backend/commit/b2d28c2756ff7c4a485bd53ec266a471d5f71c23))
* **contractutil:** update util for changed tip types ([9eb8f69](https://www.github.com/aeternity/tipping-community-backend/commit/9eb8f6980c7751a03fe4aaf4d1834eeff66515fe))
* **dependencies:** update dependencies ([a9cef7c](https://www.github.com/aeternity/tipping-community-backend/commit/a9cef7c09e636a50e99b05e0ff0aa77edc32b925))
* **events:** adds base implementation ([3e5bdca](https://www.github.com/aeternity/tipping-community-backend/commit/3e5bdcacd45d608e7abd6c360e2f029ba7ae583a))
* **events:** adds migration ([323e4ce](https://www.github.com/aeternity/tipping-community-backend/commit/323e4cec9004d306054481316fb4e38a957d3b77))
* **events:** new event logic with tests ([702f532](https://www.github.com/aeternity/tipping-community-backend/commit/702f532acb831d48b6d666c9b42094375dee75f5))
* **events:** updates db table to allow for easier sorting & filtering ([bc0298d](https://www.github.com/aeternity/tipping-community-backend/commit/bc0298d7de394865108c0b77c9002a46c75ed862))
* introduces api validation ([741f9ee](https://www.github.com/aeternity/tipping-community-backend/commit/741f9ee4b11e710d79b6e9c4e9f9f2dc0890c41f))
* **queue:** adds events queue & moves blockchain events ([fb95b5f](https://www.github.com/aeternity/tipping-community-backend/commit/fb95b5ff1c22c3d39bcbabf45a23fe174dd62ee0))
* **queue:** adds payload ([99db528](https://www.github.com/aeternity/tipping-community-backend/commit/99db52828d46da46fe9a567b1606dd6fd5ae9194))
* **wordbazaar:** support less confirmation contracts ([27ccbd4](https://www.github.com/aeternity/tipping-community-backend/commit/27ccbd4b637c8eea368dca2b58126642baeae720))


### Bug Fixes

* **aeternity:** adjusts timeout in tests ([fa5257d](https://www.github.com/aeternity/tipping-community-backend/commit/fa5257d32805e13921962a49514c75c3c9f705cb))
* **aeternity:** fixes crash on decoding empty event ([c50772a](https://www.github.com/aeternity/tipping-community-backend/commit/c50772a9da80c5d8f0e9fa45fed2ba259bd435c1))
* allows all non-required fields to be null ([365c488](https://www.github.com/aeternity/tipping-community-backend/commit/365c488a56aad407df2066e4877f420323edf54e))
* **auth:** openapi security schema ([16afd5c](https://www.github.com/aeternity/tipping-community-backend/commit/16afd5cef902da0da92176a77f81b287b5ea1eb9))
* **blacklist:** fixes json model representation ([7feec9d](https://www.github.com/aeternity/tipping-community-backend/commit/7feec9d4302d682f4b1a14be7f7a6387359d5083))
* **cache:** adjusts tests naming ([8903b81](https://www.github.com/aeternity/tipping-community-backend/commit/8903b81e3ed85b6ae881e7466495d2dcc1ea60a5))
* **chainlistener:** reconnects on closed connection ([bce29fa](https://www.github.com/aeternity/tipping-community-backend/commit/bce29fa67289c4480e3c96418335f2284e232522))
* **docs:** fixes doc type errors ([d898cb1](https://www.github.com/aeternity/tipping-community-backend/commit/d898cb14ebb558ebed443f196d7b54862a41c19f))
* **linkpreview:** uses status code to determine response success ([d6e9b29](https://www.github.com/aeternity/tipping-community-backend/commit/d6e9b29a470595ceb41c2988bd74cc395c36942e))
* **mq:** retips are now processed after tips ([541f65d](https://www.github.com/aeternity/tipping-community-backend/commit/541f65ddab08a8a7492cf001c142a85909246caf))
* **names:** filters empty names properly ([5922652](https://www.github.com/aeternity/tipping-community-backend/commit/5922652434fcc43d8c7e5ac2658207940248bc94))
* **profile:** image uploads no longer overwrite each other ([f410a05](https://www.github.com/aeternity/tipping-community-backend/commit/f410a050196c0464f2053ec77e03841ec17c3d0a))
* **swagger:** moves to nullable property to satisfy linter ([8082407](https://www.github.com/aeternity/tipping-community-backend/commit/80824079e0063df3d44cd070a7de8b2bba11c4d9))
* **wordbazaar:** increases timeout as registry gets bigger ([dd72d2c](https://www.github.com/aeternity/tipping-community-backend/commit/dd72d2c57dd827f773ae9b4e0e6e98431b09d80b))


### CI / CD

* adds package lock ([7f7fd55](https://www.github.com/aeternity/tipping-community-backend/commit/7f7fd55e892102cfa4057366f33209682a0583b0))
* **docs:** ensures swagger file is available ([41df0e3](https://www.github.com/aeternity/tipping-community-backend/commit/41df0e301bec6c05b17e4384e3fff0917a60a441))
* uses npm ci for ci ([1f14626](https://www.github.com/aeternity/tipping-community-backend/commit/1f146265c00f210fe5b333dc958c961510ad33e3))


### Refactorings

* **aeternity:** makes contract and client private & moves to module ([145d6a3](https://www.github.com/aeternity/tipping-community-backend/commit/145d6a3a7386923abea84bcedcf918c1fe2c9a1a))
* **aggregator:** moves from class to module ([91f0d85](https://www.github.com/aeternity/tipping-community-backend/commit/91f0d8543cc65fa05b4a3c4f07e6455e515cce04))
* **authentication:** creates singleton ([c2110b3](https://www.github.com/aeternity/tipping-community-backend/commit/c2110b3a59477ddb60d63f55af75f3430a2f2c76))
* **backup:** creates singleton ([02a7802](https://www.github.com/aeternity/tipping-community-backend/commit/02a78028e5d4f077c5e33cb3063c8b4fd9bac4b3))
* **blacklist:** creates singleton ([64574ad](https://www.github.com/aeternity/tipping-community-backend/commit/64574ad08b9b421a7f6d10fd63aef63259fb693e))
* **blacklist:** fixes tests ([060e377](https://www.github.com/aeternity/tipping-community-backend/commit/060e3772cb5f298f228962ae4d78506693517489))
* **blacklist:** moves from class to module ([f8fd89f](https://www.github.com/aeternity/tipping-community-backend/commit/f8fd89fd16d5207d334b3ee9c1b0ef57935b5861))
* **cache:** moves from class to module ([b8b2f48](https://www.github.com/aeternity/tipping-community-backend/commit/b8b2f48223b7eb9d95d0a302465b34c4f62d2149))
* **comment:** moves from class to module ([845068f](https://www.github.com/aeternity/tipping-community-backend/commit/845068f8f50a932e47d01038f9646bc626313db4))
* **comment:** removes express handlers from module ([e52d183](https://www.github.com/aeternity/tipping-community-backend/commit/e52d183f3d2c4d9d73c6093d809da4b38dd96be1))
* **ipfs:** fixes health test ([c1931bb](https://www.github.com/aeternity/tipping-community-backend/commit/c1931bbdf84d89db8ad1672acaeaad52a9eefa31))
* **ipfs:** moves from class to module ([c1644c4](https://www.github.com/aeternity/tipping-community-backend/commit/c1644c40a1d8fa4a3055b52a90a14a5656134ef4))
* **mdw:** moves from class to module ([77853e2](https://www.github.com/aeternity/tipping-community-backend/commit/77853e2364805b6f2a1015aead1137b9b107158a))
* moves from classes to modules ([021330c](https://www.github.com/aeternity/tipping-community-backend/commit/021330cf5d9198fb193b03ef82464414f8b63932))


### Miscellaneous

* **ci:** adds refactorings as separate category ([c4d34d5](https://www.github.com/aeternity/tipping-community-backend/commit/c4d34d52d1154675a1a6fe9750f7ebe5f1b69836))
* **comment:** removes unused function ([5c4a0ba](https://www.github.com/aeternity/tipping-community-backend/commit/5c4a0ba70991f12e936c87f19cc7fe3b6155cff8))
* **dependencies:** update dependencies ([13fd7bc](https://www.github.com/aeternity/tipping-community-backend/commit/13fd7bc5c8cd151baf33bac81c64202f7c38f55a))
* **docs:** updated local setup instructions ([def2e8c](https://www.github.com/aeternity/tipping-community-backend/commit/def2e8cfead122264b5a7115ecb84cd86ff6849d))
* **logger:** log full error in link preview ([fd5904c](https://www.github.com/aeternity/tipping-community-backend/commit/fd5904c3cf5d48c7a4b8649a5a0abe4063a69c27))

### [1.8.1](https://www.github.com/aeternity/tipping-community-backend/compare/v1.8.0...v1.8.1) (2021-02-05)


### Bug Fixes

* **docker:** adds websocket url to docker compose ([7b1cbdc](https://www.github.com/aeternity/tipping-community-backend/commit/7b1cbdced08e4e18c5d8ed9c41d44d44e8ad8401))
* **dom:** defaults to local chrome ([4e2e20a](https://www.github.com/aeternity/tipping-community-backend/commit/4e2e20a8ee42103e2700937f112963e76fa3bf64))
* **mq:** passes client correctly to rsmq ([e4e7ebe](https://www.github.com/aeternity/tipping-community-backend/commit/e4e7ebe6f4d29c6b159aade2d8331b6ede78c30b))


### CI / CD

* adds empty package name to avoid prefix ([e9f4eb7](https://www.github.com/aeternity/tipping-community-backend/commit/e9f4eb75ae38b34b80cb50d74ad0b17f1571ab16))

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
