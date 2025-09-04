# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.1.11](https://github.com/aeternity/tipping-community-backend/compare/v3.1.10...v3.1.11) (2025-09-04)


### CI / CD

* update gh actions versions ([23b1fa2](https://github.com/aeternity/tipping-community-backend/commit/23b1fa23763a0c6336af34815996524cedda0faa))

## [3.1.10](https://github.com/aeternity/tipping-community-backend/compare/v3.1.9...v3.1.10) (2025-09-04)


### Bug Fixes

* check backend health correctly ([76cab13](https://github.com/aeternity/tipping-community-backend/commit/76cab130d91669a047e87b394626e847e6891aeb))
* do not set preffered name to null incorrectly ([3aaf3eb](https://github.com/aeternity/tipping-community-backend/commit/3aaf3eba6dd9ef1a7dc4dba938312e26aa788527))

## [3.1.9](https://github.com/aeternity/tipping-community-backend/compare/v3.1.8...v3.1.9) (2024-08-20)


### Bug Fixes

* **health:** logs error messages ([60bd947](https://github.com/aeternity/tipping-community-backend/commit/60bd947d116cda581cd16f11d10610d8a575212e))
* oracle urls out of gas ([f0b4f93](https://github.com/aeternity/tipping-community-backend/commit/f0b4f93a84a559aead85e45431ee567989b3c37c))

## [3.1.8](https://github.com/aeternity/tipping-community-backend/compare/v3.1.7...v3.1.8) (2024-07-12)


### Bug Fixes

* **notifications:** adds index to also deduplicate notifications without source ([3694a23](https://github.com/aeternity/tipping-community-backend/commit/3694a234593455acab4c53fe6021d3acac85be86))


### Testing

* **notifications:** adjusts testing data to not conflict in db anymore ([dc5fc6c](https://github.com/aeternity/tipping-community-backend/commit/dc5fc6c6d6c009e622d339d935ed9c5c9854eebe))

## [3.1.7](https://github.com/aeternity/tipping-community-backend/compare/v3.1.6...v3.1.7) (2024-05-08)


### Bug Fixes

* disables messages on startup to avoid doing everything at once ([9f5cfe6](https://github.com/aeternity/tipping-community-backend/commit/9f5cfe6138ea5e5ae9e914a26ae3a13dc4ab3300))

## [3.1.6](https://github.com/aeternity/tipping-community-backend/compare/v3.1.5...v3.1.6) (2024-05-07)


### CI / CD

* update prod pipeline ([a6bf24c](https://github.com/aeternity/tipping-community-backend/commit/a6bf24cf456198bf42109728e8a654821860cbe1))

## [3.1.5](https://github.com/aeternity/tipping-community-backend/compare/v3.1.4...v3.1.5) (2024-05-07)


### Bug Fixes

* adjusts health check after sdk upgrade ([de61ccd](https://github.com/aeternity/tipping-community-backend/commit/de61ccd590379874a8f2ced5cd536055a04bf0bf))
* allows local env to be used for dev ([a5a9370](https://github.com/aeternity/tipping-community-backend/commit/a5a937080d8188a4365d8b899caedb207e72a42b))
* wordbazaar usage ([a903cc1](https://github.com/aeternity/tipping-community-backend/commit/a903cc11dfd4d86c29fb7a48d6d877d6ab3f00f1))


### Refactorings

* upgrades sdk ([736cfb3](https://github.com/aeternity/tipping-community-backend/commit/736cfb3d69eb00c9bff7f12026531e346591a885))
* upgrades wordbazaar ([8ccbb74](https://github.com/aeternity/tipping-community-backend/commit/8ccbb74901f12a919bdc04f1e30ab9126380015b))


### Miscellaneous

* bigint/number conversion ([7b9c5a0](https://github.com/aeternity/tipping-community-backend/commit/7b9c5a0800238e1f50a9ebb6afe08a5996638304))
* bumps node version ([389192b](https://github.com/aeternity/tipping-community-backend/commit/389192b3470eec47d87af1453e74e6a422dd8a9c))
* fix bigint conversions ([6e27fbc](https://github.com/aeternity/tipping-community-backend/commit/6e27fbcd66bd485accd570b59fb00a991f16b187))
* fix gas limit, compiler url, redis readme ([ba58815](https://github.com/aeternity/tipping-community-backend/commit/ba588151b9bba33e26cf06485572530e962b39bb))
* fix/update pipelines ([58eb05d](https://github.com/aeternity/tipping-community-backend/commit/58eb05d26a74ac68cecb9f419dc73672e8189d9e))
* removes useless code ([9d171da](https://github.com/aeternity/tipping-community-backend/commit/9d171da24bcbe711da4cf1a5ee4b7e1cdc82a84b))

## [3.1.4](https://github.com/aeternity/tipping-community-backend/compare/v3.1.3...v3.1.4) (2023-03-23)


### CI / CD

* adds checkout for production release setp ([255fbca](https://github.com/aeternity/tipping-community-backend/commit/255fbcac0d9be2379b6270c03a51ba7791c9cfd1))

## [3.1.3](https://github.com/aeternity/tipping-community-backend/compare/v3.1.2...v3.1.3) (2023-03-23)


### CI / CD

* change events for prod pipeline ([785decf](https://github.com/aeternity/tipping-community-backend/commit/785decfe81634828c018c39e497ba4f9cad2fdf9))
* fixed outputs nesting ([f91a0e6](https://github.com/aeternity/tipping-community-backend/commit/f91a0e6ae9b23eca752367889eb75d6cf98c15f8))
* splits actions in two ([0e52d18](https://github.com/aeternity/tipping-community-backend/commit/0e52d18b122c435e61a0a2966d4f912498c4dee2))

## [3.1.2](https://github.com/aeternity/tipping-community-backend/compare/v3.1.1...v3.1.2) (2023-03-22)


### CI / CD

* change the bot token ([dfde12a](https://github.com/aeternity/tipping-community-backend/commit/dfde12aa1f17709a3b53e21dd49004ca6b9172e3))
* change the bot token for apps repo ([9a41a75](https://github.com/aeternity/tipping-community-backend/commit/9a41a757b4a817003e715c24818b9db1fd1a5c34))

## [3.1.1](https://github.com/aeternity/tipping-community-backend/compare/v3.1.0...v3.1.1) (2023-03-22)


### Bug Fixes

* only return valid address names ([fa88567](https://github.com/aeternity/tipping-community-backend/commit/fa8856761df7a292da107e17a85ff2c751b85e28))


### CI / CD

* **docker:** initial version of docker build and push with tags ([#394](https://github.com/aeternity/tipping-community-backend/issues/394)) ([0ca372b](https://github.com/aeternity/tipping-community-backend/commit/0ca372ba9e9fd03b409ee1e5c785c860943e6f2b))
* fix pipeline ([#427](https://github.com/aeternity/tipping-community-backend/issues/427)) ([908a36a](https://github.com/aeternity/tipping-community-backend/commit/908a36a83ecc77158a0f8ba6b23ac492d9649c27))
* update node vesion in tests ([91ee728](https://github.com/aeternity/tipping-community-backend/commit/91ee728246508530e86e9baec1c05fd71fcdeab1))

## [3.1.0](https://www.github.com/aeternity/tipping-community-backend/compare/v3.0.4...v3.1.0) (2023-01-27)


### Features

* **db:** adds option to enable postgres ssl ([6201b5c](https://www.github.com/aeternity/tipping-community-backend/commit/6201b5ce86fc826e816df41290ec253bcf010ff8))
* **docker:** fix node version at 12 ([e29ba7e](https://www.github.com/aeternity/tipping-community-backend/commit/e29ba7ed032f827ce4f17e0462aae2fc2030c815))


### Bug Fixes

* **health:** adjusted ipfs to newest version without major refactorings ([2715e46](https://www.github.com/aeternity/tipping-community-backend/commit/2715e4686e3d9464dd86b9404af2d3a2f1546fe2))


### Miscellaneous

* **deps:** update nodejs, mdw v2 ([65e371a](https://www.github.com/aeternity/tipping-community-backend/commit/65e371a2f00fb8726f3ed01322202d5fbd2d7f5d))
* fix docker install, upgrade sharp, lint fix ([25dce97](https://www.github.com/aeternity/tipping-community-backend/commit/25dce97c9bc64333a9fddbd482fbd4c4590ad6bc))
* fix tests ([10a2658](https://www.github.com/aeternity/tipping-community-backend/commit/10a2658a4de4392c8a9dc89ca025ad657bca2f41))

### [3.0.4](https://www.github.com/aeternity/tipping-community-backend/compare/v3.0.3...v3.0.4) (2021-10-05)


### Miscellaneous

* **deps:** upgrade ([477a5e6](https://www.github.com/aeternity/tipping-community-backend/commit/477a5e6c73397f05ab8401714f6d1677b22416b0))

### [3.0.3](https://www.github.com/aeternity/tipping-community-backend/compare/v3.0.2...v3.0.3) (2021-10-01)


### Miscellaneous

* **deps:** upgrade major versions & tiny ipfs fix ([b5e5ad5](https://www.github.com/aeternity/tipping-community-backend/commit/b5e5ad59b5cb525a7c05c3f6609f5f7372cbaeff))

### [3.0.2](https://www.github.com/aeternity/tipping-community-backend/compare/v3.0.1...v3.0.2) (2021-09-28)


### Bug Fixes

* allows + in search query params, fixes [#368](https://www.github.com/aeternity/tipping-community-backend/issues/368) ([015ac9e](https://www.github.com/aeternity/tipping-community-backend/commit/015ac9e781d09b18d12b6acff5de62fc5688c317))
* **linkpreviews:** removes /images/undefined and fixes [#370](https://www.github.com/aeternity/tipping-community-backend/issues/370) ([11e1610](https://www.github.com/aeternity/tipping-community-backend/commit/11e1610297c34e92a4ccbdc1098cfaf9a8a36279))


### Miscellaneous

* **deps:** upgrade & audit fix ([8eab881](https://www.github.com/aeternity/tipping-community-backend/commit/8eab8818ab2d8ff16846bba5677f94585bb12eea))

### [3.0.1](https://www.github.com/aeternity/tipping-community-backend/compare/v3.0.0...v3.0.1) (2021-07-29)


### Bug Fixes

* **server:** modifies error handler to have correct function signature ([5ff45b9](https://www.github.com/aeternity/tipping-community-backend/commit/5ff45b92df8f155f942daa9c8f0a5bc9f37a2abe))

## [3.0.0](https://www.github.com/aeternity/tipping-community-backend/compare/v2.2.0...v3.0.0) (2021-07-26)


### ⚠ BREAKING CHANGES

* **profile:** removes deprecated POST,DELETE /profile/image route
* **profile:** removes deprecated /profile route
* **stats:** drop unused stats endpoint

### Features

* **blacklist:** save signature to user generated blacklist items ([479e85f](https://www.github.com/aeternity/tipping-community-backend/commit/479e85f0886886de6488d83f94ad2d606a66b9e6))
* **server:** adds global async error handling ([ee5e001](https://www.github.com/aeternity/tipping-community-backend/commit/ee5e0015a5ca88d2e56f9b05cfbe851d8e6823fe))
* **stats:** add stats endpoint for marketing ([bf66ab1](https://www.github.com/aeternity/tipping-community-backend/commit/bf66ab12f104aac0f7701937f5b6f66a75899003))
* **stats:** drop unused stats endpoint ([e679e4f](https://www.github.com/aeternity/tipping-community-backend/commit/e679e4f3d74d6efc21f8dfe50b5c92662daf64d8))


### Bug Fixes

* **cache:** properly passes on query params ([73834ff](https://www.github.com/aeternity/tipping-community-backend/commit/73834ff8765dc7378b585972e7a220219cbf575e))
* **consent:** fixes route openapi issue ([72fd991](https://www.github.com/aeternity/tipping-community-backend/commit/72fd991e6e1c9522f680f33337ccdc1bd4bc2552))
* **payfortx:** requires body ([04ddd35](https://www.github.com/aeternity/tipping-community-backend/commit/04ddd35327df724058b335e0be6ff56bd96bb106))
* **payfortx:** returns proper status on error ([0d1d557](https://www.github.com/aeternity/tipping-community-backend/commit/0d1d55787b881ce6a5aa21cf5d78a8f8d7c06d09))
* **static:** function should not return a promise ([b2d41f9](https://www.github.com/aeternity/tipping-community-backend/commit/b2d41f98ec292257a20a8e64f16e656969e4d7b4))


### Miscellaneous

* **event:** renames addresses param to singular ([b42ef9d](https://www.github.com/aeternity/tipping-community-backend/commit/b42ef9d41b65270490ed4b6210ba2643ed824d5c))
* **stats:** add tests for marketing stats ([b216f26](https://www.github.com/aeternity/tipping-community-backend/commit/b216f26c1b4364c500be7add8b37b15ee8eb07dd))
* **v2:** update v2 to single contract ([4b7347b](https://www.github.com/aeternity/tipping-community-backend/commit/4b7347b807bda8e37a28522d9d9e6ca2084e1acc))


### Refactorings

* **blacklist:** remove unnecessary field checks ([79f7b46](https://www.github.com/aeternity/tipping-community-backend/commit/79f7b46b257c292fa2abcffd371391d70bbd4b8e))
* **broker:** class to module ([b5dba5f](https://www.github.com/aeternity/tipping-community-backend/commit/b5dba5f47226b464cf2738e438050db232e90907))
* **cache:** deprecates tip invalidation endpoint ([f4d4faf](https://www.github.com/aeternity/tipping-community-backend/commit/f4d4fafa750148c2df75cc62d254a1e213b41a35))
* **comments:** removes error handling from single route ([3537b7b](https://www.github.com/aeternity/tipping-community-backend/commit/3537b7b67bdb59a4b8bbeff489f6ceb9c884758e))
* **comments:** send errors that are not 500 ([564af95](https://www.github.com/aeternity/tipping-community-backend/commit/564af95d9acdf18dd862c69dac9ec3757a022ab4))
* **consent:** moves request handling to routes ([6870c02](https://www.github.com/aeternity/tipping-community-backend/commit/6870c02a62336f59794e86e56d4e5e9e00a4e163))
* **domains:** moves from class to module ([fe17626](https://www.github.com/aeternity/tipping-community-backend/commit/fe17626b7cf390d40226432a62a31308c1c5ca02))
* **domains:** moves request handling to routes ([aa580a5](https://www.github.com/aeternity/tipping-community-backend/commit/aa580a58d2ec78fd19484bfcf5bbab930ed795d2))
* **errorreport:** moves request handling to routes ([1bbbd24](https://www.github.com/aeternity/tipping-community-backend/commit/1bbbd24a9afe43e7864a511f505fb0f6d320011d))
* **events:** moves event endpoint from cache ([951fab7](https://www.github.com/aeternity/tipping-community-backend/commit/951fab70695d8cbae966ffb76a8871ec35e4b574))
* **health:** class to module ([14675b1](https://www.github.com/aeternity/tipping-community-backend/commit/14675b1624e63b667b3f061e8deecedb08813f27))
* **health:** moves request handling to route ([5903621](https://www.github.com/aeternity/tipping-community-backend/commit/590362195ccce5f3805fa508b447d5fb0927682c))
* **media:** class to module ([37727be](https://www.github.com/aeternity/tipping-community-backend/commit/37727be2a7616e17198b20ec055768fc4c9e2500))
* **notifications:** class to module ([c60f25d](https://www.github.com/aeternity/tipping-community-backend/commit/c60f25d14759f67026ba7b63d3636fdfb28f8e85))
* **notifications:** moves request handling to routes ([e60379f](https://www.github.com/aeternity/tipping-community-backend/commit/e60379fc4c57a6201307218ac4544a8d5952eb79))
* **payfortx:** class to module & request handling to routes ([bac4759](https://www.github.com/aeternity/tipping-community-backend/commit/bac47591fed2b0c77745506e644f777186d1f6c5))
* **pin:** class to module ([67bf003](https://www.github.com/aeternity/tipping-community-backend/commit/67bf00388dc773dc6e684c953f26bbcbd6b72a65))
* **pin:** moves request handling to routes ([8b37a99](https://www.github.com/aeternity/tipping-community-backend/commit/8b37a9926b234cfc69208e8d5e47eebdf54b2e8d))
* **profile:** moves request handling to routes ([df4e688](https://www.github.com/aeternity/tipping-community-backend/commit/df4e688a3bba5b78d3ec7e0d9df6ae54027a37cf))
* **profile:** removes deprecated /profile route ([92131f6](https://www.github.com/aeternity/tipping-community-backend/commit/92131f673accd671967f5d267e72765565e7a559))
* **profile:** removes deprecated POST,DELETE /profile/image route ([3f7789e](https://www.github.com/aeternity/tipping-community-backend/commit/3f7789efc1c7ffb3f25f7602ace221485e80b4b2))

## [2.2.0](https://www.github.com/aeternity/tipping-community-backend/compare/v2.1.3...v2.2.0) (2021-06-28)


### Features

* **v4-contract:** fixes for v4 contract integration ([920f58f](https://www.github.com/aeternity/tipping-community-backend/commit/920f58f40d77394cb12537318b5422938a358893))
* **v4-contract:** integrate v4 contract support ([40c5eb7](https://www.github.com/aeternity/tipping-community-backend/commit/40c5eb7e2b9a32b1b5b34bc0696bd6269dcbe57b))


### Bug Fixes

* **event:** uses constant for event switch ([6f9571f](https://www.github.com/aeternity/tipping-community-backend/commit/6f9571f6c1c959714385d34c9a223412bb540cbc))
* **event:** uses constants to distinguish events ([df29412](https://www.github.com/aeternity/tipping-community-backend/commit/df294123fd1ca6936a4a7cfb7deb3b0b8869d6ce))

### [2.1.3](https://www.github.com/aeternity/tipping-community-backend/compare/v2.1.2...v2.1.3) (2021-06-23)


### Bug Fixes

* **ci:** adjusts imports to fit ci ([df747c3](https://www.github.com/aeternity/tipping-community-backend/commit/df747c379922c202d8cd65caf707797207cb449a))


### Miscellaneous

* adjusts imports to new lint rules ([132951d](https://www.github.com/aeternity/tipping-community-backend/commit/132951d41312f5f2b878bb558a90d928863dcae7))
* **ci:** uses proper package command for migrations ([7940c16](https://www.github.com/aeternity/tipping-community-backend/commit/7940c162d46cc07b430ad8c29b4b05ef1439fdc9))
* **deps:** update deps ([c6f3e5f](https://www.github.com/aeternity/tipping-community-backend/commit/c6f3e5f1e8f83dfd61f3be859393cbb784e02537))
* **deps:** upgrade sdk to 8.2.1 ([9c4c7e7](https://www.github.com/aeternity/tipping-community-backend/commit/9c4c7e7288c24220a0f490bcab57f416e6b3526d))

### [2.1.2](https://www.github.com/aeternity/tipping-community-backend/compare/v2.1.1...v2.1.2) (2021-06-21)


### Bug Fixes

* **docker:** installs packages from lock ([eee93a8](https://www.github.com/aeternity/tipping-community-backend/commit/eee93a82184bafd5c64d9a2f6ba3abda20a3e05b))

### [2.1.1](https://www.github.com/aeternity/tipping-community-backend/compare/v2.1.0...v2.1.1) (2021-06-21)


### Bug Fixes

* **db:** fix functions search path for backups ([8fbf4e0](https://www.github.com/aeternity/tipping-community-backend/commit/8fbf4e0b04918c11433d821660d5e07aafc5ba15))
* **db:** fix functions search path for backups ([acbb843](https://www.github.com/aeternity/tipping-community-backend/commit/acbb843252db145312ca933b231ef294107140f0))
* **mdw:** runs init function to listen for messages ([868fd66](https://www.github.com/aeternity/tipping-community-backend/commit/868fd6631bfc7df6b3cecd0d248554c8b1d650f5))
* **topics:** adjust topic scoring to remove 0 amount topics ([1679445](https://www.github.com/aeternity/tipping-community-backend/commit/1679445aa8c2321498aced3ba4001abaacb87827))

## [2.1.0](https://www.github.com/aeternity/tipping-community-backend/compare/v2.0.0...v2.1.0) (2021-06-17)


### Features

* **linkpreview:** async-lock linkpreview generation ([268f484](https://www.github.com/aeternity/tipping-community-backend/commit/268f4843e6188900927eca08c652654626196c7b))


### Bug Fixes

* **docker:** adds getter contracts ([e6a2a7f](https://www.github.com/aeternity/tipping-community-backend/commit/e6a2a7f6b1dd2cd2e221f8e6e8b00b4a7a3c07b6))

## [2.0.0](https://www.github.com/aeternity/tipping-community-backend/compare/v1.10.5...v2.0.0) (2021-06-17)


### ⚠ BREAKING CHANGES

* releasing tips to db

### Features

* **backlist:** adds new backlist ui ([#332](https://www.github.com/aeternity/tipping-community-backend/issues/332)) ([f43d0f1](https://www.github.com/aeternity/tipping-community-backend/commit/f43d0f10ee0ec3f181da9e1420405359ffa6d5b9))
* **comments:** addresses pr feedback ([301f4fa](https://www.github.com/aeternity/tipping-community-backend/commit/301f4faac040341063afda0a1bfae4a576465ad0))
* **comments:** verifies commenter holds at least one required token ([f629a03](https://www.github.com/aeternity/tipping-community-backend/commit/f629a03e581e729e3c54f694e2cfc5de5fe4d3e1))
* **contractutil:** fixes after rebase ([f282c8f](https://www.github.com/aeternity/tipping-community-backend/commit/f282c8f80624e58fd9cf5bdfa1a58912f20a5a4a))
* **db:** updates materialized views ([0dab590](https://www.github.com/aeternity/tipping-community-backend/commit/0dab590f674885a5f5865fb1ad8d56b47f5562f6))
* **db:** updates materialized views jsonb generation ([5db6d43](https://www.github.com/aeternity/tipping-community-backend/commit/5db6d4326104839c95b9c83a47b641a3413aff72))
* **linkpreview:** schedule update trigger ([62386f4](https://www.github.com/aeternity/tipping-community-backend/commit/62386f4ccccb6bef5c32ee81275fb6d0deed534f))
* **tests:** avoids deadlocks by chaining db truncates ([8eb3222](https://www.github.com/aeternity/tipping-community-backend/commit/8eb3222194f874ed94f253b44e33d5c32fde0a4d))
* **tipdb:** add basic tips from db route ([10e2e4c](https://www.github.com/aeternity/tipping-community-backend/commit/10e2e4cf1d8417da58f5afe33d7095b52afa9dd0))
* **tipdb:** add claims table trigger views update ([468a0fc](https://www.github.com/aeternity/tipping-community-backend/commit/468a0fced2f37e85fd233e71340bfd195ed2697b))
* **tipdb:** add indexes, ordering ([cd0a069](https://www.github.com/aeternity/tipping-community-backend/commit/cd0a069174b4441dde6bdeca233a8bb88f65ccda))
* **tipdb:** add scheduler logic for queue ([d77810c](https://www.github.com/aeternity/tipping-community-backend/commit/d77810c092a84db46b9db58eb9113c92617da935))
* **tipdb:** add stats materialized view ([d432a59](https://www.github.com/aeternity/tipping-community-backend/commit/d432a59b69331fc7ddfefc016d8e9225a611f64e))
* **tipdb:** add timestamp and sample score aggregation ([96df899](https://www.github.com/aeternity/tipping-community-backend/commit/96df899608036561433c28ad264a9da394a10f13))
* **tipdb:** added getter contract addresses ([69db06b](https://www.github.com/aeternity/tipping-community-backend/commit/69db06bd2a64bcadda21fa244756a53ea0261b98))
* **tipdb:** added url stats to stats endpoint ([7a221e2](https://www.github.com/aeternity/tipping-community-backend/commit/7a221e2fa776ec8469e517969e6abb06f60ced9c))
* **tipdb:** address and blacklist filter ([435005b](https://www.github.com/aeternity/tipping-community-backend/commit/435005bb6c435cfd7dac946accff8bd7941e0677))
* **tipdb:** adjust tip transformation ([a288047](https://www.github.com/aeternity/tipping-community-backend/commit/a2880471e8e8a681780916c7123613b2b8779549))
* **tipdb:** adjust token aggregation ([f780835](https://www.github.com/aeternity/tipping-community-backend/commit/f78083528dc05240ec9605d992572b3228bba179))
* **tipdb:** adjust total url amount aggregation ([2bd438a](https://www.github.com/aeternity/tipping-community-backend/commit/2bd438a1d4000257f6de37df09babda0b7a6a849))
* **tipdb:** adjusted migrations ([94a72ca](https://www.github.com/aeternity/tipping-community-backend/commit/94a72cadd3c7d0486f9f5f0da6570a41f5c98d78))
* **tipdb:** adjusted startup scheduler and keephot logic ([3556220](https://www.github.com/aeternity/tipping-community-backend/commit/3556220b9bb35750b03250fd02a82d7ab80628b8))
* **tipdb:** aggregate token total amount ([fa232f3](https://www.github.com/aeternity/tipping-community-backend/commit/fa232f349669bb9047d7c02c7e16c56326b03653))
* **tipdb:** aggregation with materialized view ([baf47ec](https://www.github.com/aeternity/tipping-community-backend/commit/baf47ec9ae3683f20044b67ca581c856a0fcfd22))
* **tipdb:** await based on id ([a697b88](https://www.github.com/aeternity/tipping-community-backend/commit/a697b88e2e3b77fc733408c376522911d309f03d))
* **tipdb:** await check if already exists ([296b2d0](https://www.github.com/aeternity/tipping-community-backend/commit/296b2d06f9fe948552e0224412a7d9104b3c06cc))
* **tipdb:** await tips ([2983f8f](https://www.github.com/aeternity/tipping-community-backend/commit/2983f8ff5c1ccb4480c1ded203adc6d204d0b326))
* **tipdb:** await tips for v3 ([5a0c740](https://www.github.com/aeternity/tipping-community-backend/commit/5a0c740354c9a912bb5599f310ac8408386c7f39))
* **tipdb:** comments relation and commentCount ([1dce41f](https://www.github.com/aeternity/tipping-community-backend/commit/1dce41f41012c194dd570cde458392352f21252b))
* **tipdb:** dependency update ([b30f3fb](https://www.github.com/aeternity/tipping-community-backend/commit/b30f3fb3276c4197acdbd3c73d3ce5bbaf4976f0))
* **tipdb:** deterministic odering ([8d6c83f](https://www.github.com/aeternity/tipping-community-backend/commit/8d6c83f81901594f7ead1da8d4003459aa415bc8))
* **tipdb:** expose view sender stats ([651cd15](https://www.github.com/aeternity/tipping-community-backend/commit/651cd1595e1284ce3f9bc8387ee7437dc07d6ee1))
* **tipdb:** fetch all tips/retips if no payload in event ([fd73ffa](https://www.github.com/aeternity/tipping-community-backend/commit/fd73ffa5ca86a6bd409e800c4c7fdd05459e1919))
* **tipdb:** filter contract version and language ([d9d3e49](https://www.github.com/aeternity/tipping-community-backend/commit/d9d3e4917be55136e6172a2bcc2252c6b0852842))
* **tipdb:** fix await v1 ([6b06fc0](https://www.github.com/aeternity/tipping-community-backend/commit/6b06fc09c0cd829e48790150d15017ea574a879f))
* **tipdb:** fix caseing ([428d410](https://www.github.com/aeternity/tipping-community-backend/commit/428d41043dfb913016cd0ccda69645faa2b071ca))
* **tipdb:** fix link preview generation ([0312056](https://www.github.com/aeternity/tipping-community-backend/commit/03120560d3c3812593f234644e8e49306e8e6a5b))
* **tipdb:** fix linkpreview relation ([979f598](https://www.github.com/aeternity/tipping-community-backend/commit/979f598df213ebab288d76af03632c5deccf0110))
* **tipdb:** fix materialized views ([5ff9513](https://www.github.com/aeternity/tipping-community-backend/commit/5ff9513ca758d48c39ce265835d0a73e940e8f09))
* **tipdb:** fix materialized views usage ([dcfe4ce](https://www.github.com/aeternity/tipping-community-backend/commit/dcfe4ce7f599538e5cd64511b1bf487a89c65ac7))
* **tipdb:** fix migration ([03aded3](https://www.github.com/aeternity/tipping-community-backend/commit/03aded364c14cb77533d3dbf78b97a52ab584079))
* **tipdb:** fix migrations for existing db upgrades ([4b151c4](https://www.github.com/aeternity/tipping-community-backend/commit/4b151c4182ffb5734891e13ce412f7e3a1c74c61))
* **tipdb:** fix model relations and join ([6f9079a](https://www.github.com/aeternity/tipping-community-backend/commit/6f9079a11c8e2327b0f96614222d64255c241679))
* **tipdb:** fix oracle use for claimed urls ([8d0b4ee](https://www.github.com/aeternity/tipping-community-backend/commit/8d0b4ee47e91c83a15d683e3d9c4cbd799b34809))
* **tipdb:** fix relations ([8da8b27](https://www.github.com/aeternity/tipping-community-backend/commit/8da8b27f0f8328afc9291d2ff167a7c3400a18db))
* **tipdb:** fix text fields ([f07e4f9](https://www.github.com/aeternity/tipping-community-backend/commit/f07e4f94309b6bbf468b92a6943486ba6a55c3cd))
* **tipdb:** fix tip contract util ([b3f7da9](https://www.github.com/aeternity/tipping-community-backend/commit/b3f7da934169e00f6d4f837c22822c07c442bfe5))
* **tipdb:** fix title in tips db ([0effac7](https://www.github.com/aeternity/tipping-community-backend/commit/0effac79a10ebabfbd22f1b912f370b7e424d710))
* **tipdb:** fix token amount util transformation ([6f2386c](https://www.github.com/aeternity/tipping-community-backend/commit/6f2386c59662c2b367aacbca226b2408d757647d))
* **tipdb:** fix user stats ([dd9102b](https://www.github.com/aeternity/tipping-community-backend/commit/dd9102bd1981dcb7e42a7a821aac49720d22145c))
* **tipdb:** fixed tracing ([9b37950](https://www.github.com/aeternity/tipping-community-backend/commit/9b3795080c863b8a64124723a2bbd2f9cd91ae51))
* **tipdb:** fixes after rebase ([4079856](https://www.github.com/aeternity/tipping-community-backend/commit/4079856847ac0e6ded53d5c39e8f174425e4cd55))
* **tipdb:** fixes after rebase ([9f834c5](https://www.github.com/aeternity/tipping-community-backend/commit/9f834c58bb3f40fca1d3195fc0b60ac49f6ed28f))
* **tipdb:** fixes after rebase ([9f122c6](https://www.github.com/aeternity/tipping-community-backend/commit/9f122c69497d238fece3ea73e6ad0d41b93502b4))
* **tipdb:** fixes after rebase ([4658297](https://www.github.com/aeternity/tipping-community-backend/commit/465829700893801c09945509bfb82d8480870a06))
* **tipdb:** include chain names in tips route ([73982f1](https://www.github.com/aeternity/tipping-community-backend/commit/73982f1d804b8f0d3b001ad15389d3a054e6ec5c))
* **tipdb:** insert chain names to db ([5ece7fa](https://www.github.com/aeternity/tipping-community-backend/commit/5ece7fa323ac227b0e9ef75c9ad232c4d3c5486e))
* **tipdb:** insert claims, contract util casing ([2033f11](https://www.github.com/aeternity/tipping-community-backend/commit/2033f110ce60e8e1f525ce95818a3a9a5eb692a0))
* **tipdb:** insert retips from events ([33b3b63](https://www.github.com/aeternity/tipping-community-backend/commit/33b3b63924cf9526d5a6d87bcec5bfa7498e3099))
* **tipdb:** insert single claims from event ([9d4e7c0](https://www.github.com/aeternity/tipping-community-backend/commit/9d4e7c06042760c90d8360c319b3b7242c3ef28c))
* **tipdb:** insert tips from chain listener ([2f31a73](https://www.github.com/aeternity/tipping-community-backend/commit/2f31a7389d5ec1664951e5d501f4e97d6937fad7))
* **tipdb:** link preview and description search ([40e07ed](https://www.github.com/aeternity/tipping-community-backend/commit/40e07ed2f33b6cc3706a4488a7de8ad15df36e97))
* **tipdb:** linkpreview relation ([4a3970f](https://www.github.com/aeternity/tipping-community-backend/commit/4a3970f83f53795d13b67c6da400880f8c8b7ce9))
* **tipdb:** optimize claimed url fetch ([7ab3f5d](https://www.github.com/aeternity/tipping-community-backend/commit/7ab3f5d7de73ff1b509c770875e9e87565c82863))
* **tipdb:** optimize index for search ([ffe86bc](https://www.github.com/aeternity/tipping-community-backend/commit/ffe86bcbbed74f77680be7750bb89ece6272dc54))
* **tipdb:** optimize tip topics fetch ([1a23d53](https://www.github.com/aeternity/tipping-community-backend/commit/1a23d53d75e34433e89b2d032a000e1d990704dd))
* **tipdb:** order by total amount ([2b5c55d](https://www.github.com/aeternity/tipping-community-backend/commit/2b5c55d9b2c68e99c50fd8f93b1f2c8ab33b3eee))
* **tipdb:** persist additional tip fields in db ([ad1720f](https://www.github.com/aeternity/tipping-community-backend/commit/ad1720fae437532830af0fcfc2b7e7f614b79ac8))
* **tipdb:** remove chainname from tips, added missing receiver ([f0ed881](https://www.github.com/aeternity/tipping-community-backend/commit/f0ed8812a358ecd02f538a935ee2be5f24b98212))
* **tipdb:** removed unused route ([8623d4e](https://www.github.com/aeternity/tipping-community-backend/commit/8623d4e75f84c721a8b8dd2378ae65fc40bdb07c))
* **tipdb:** replace get all tips from cache ([e3459ad](https://www.github.com/aeternity/tipping-community-backend/commit/e3459ad0f47f97e49f533270308821b7412ea286))
* **tipdb:** rework scheduler for update tips, retips, claims ([ceab6a7](https://www.github.com/aeternity/tipping-community-backend/commit/ceab6a77f1002918f1aaeb2ff237fdde1f3f59c5))
* **tipdb:** sample full text search ([a5ab0c4](https://www.github.com/aeternity/tipping-community-backend/commit/a5ab0c40d8af0663dc8bc5a9b27ab0c4c004879a))
* **tipdb:** satisfy linter ([f7a6dec](https://www.github.com/aeternity/tipping-community-backend/commit/f7a6dec0a31c536e5b90cae9fea1fb079dcf2e07))
* **tipdb:** satisfy linter ([e77a143](https://www.github.com/aeternity/tipping-community-backend/commit/e77a14377272236e4fb4894b91769564eab183b7))
* **tipdb:** scheduler to update tips, retips and claims ([de14435](https://www.github.com/aeternity/tipping-community-backend/commit/de1443524d7981080d7eb3f2d3ffe08b8131440a))
* **tipdb:** search for topics ([c8a67e3](https://www.github.com/aeternity/tipping-community-backend/commit/c8a67e327e55b51d37bd7ac64d4b2068c17356f7))
* **tipdb:** single tip route ([5a51915](https://www.github.com/aeternity/tipping-community-backend/commit/5a51915f16ff5e671321b831d08d1f8b3eec42a3))
* **tipdb:** stats aggregation adjustment ([fc49674](https://www.github.com/aeternity/tipping-community-backend/commit/fc49674080b78a3435310b9b2279c50f20b193b5))
* **tipdb:** stats route ([d50f19f](https://www.github.com/aeternity/tipping-community-backend/commit/d50f19f728d1a7e841a4d3b6bbd60e1a1c67fb5a))
* **tipdb:** test db aggregation ([982020f](https://www.github.com/aeternity/tipping-community-backend/commit/982020f5e59e878e5abe24464279e3c6f7557b93))
* **tipdb:** tip topics and title to db ([b705605](https://www.github.com/aeternity/tipping-community-backend/commit/b705605d0378c70983dfa0c0fe9ffab9d91343e1))
* **tipdb:** tip url text, linkpreview url unique ([1864695](https://www.github.com/aeternity/tipping-community-backend/commit/186469561c3de02b3c341714544dddf71c3eb632))
* **tipdb:** tips endpoint openapi validation fix ([94c23a1](https://www.github.com/aeternity/tipping-community-backend/commit/94c23a1e16544fabd99e6cc29ae4b41155612013))
* **tipdb:** total amount aggregation ([33623dd](https://www.github.com/aeternity/tipping-community-backend/commit/33623dd4f9caade7590d681b00d45fa5fb09b359))
* **tipdb:** total amount for score ([d7eafcc](https://www.github.com/aeternity/tipping-community-backend/commit/d7eafcc922563da3732421b9b527d21a0fb824a2))
* **tipdb:** total amount functions ([24135e7](https://www.github.com/aeternity/tipping-community-backend/commit/24135e76b535f84a18e69e252f0198381a63074f))
* **tipdb:** unclaimed amount aggregation ([231f960](https://www.github.com/aeternity/tipping-community-backend/commit/231f960003819e91b557f1209c020304f2279d97))
* **tipdb:** update retips db model ([22d9212](https://www.github.com/aeternity/tipping-community-backend/commit/22d9212b25189e8ff41a10b32e6f5fd42e7c10d9))
* **tipdb:** update userstats ([7b6ff69](https://www.github.com/aeternity/tipping-community-backend/commit/7b6ff69f24500925597cb1d673540c06c94730d4))
* **tipdb:** use basic tip topic util for static aggregation ([4a27baa](https://www.github.com/aeternity/tipping-community-backend/commit/4a27baa1d0b050041d7f004314650238d878a8a9))
* **tipdb:** use sequelize import directly ([d4adfc7](https://www.github.com/aeternity/tipping-community-backend/commit/d4adfc724d51c85232320356e5fe30c02cb29138))
* **tipdb:** views for url and sender stats ([16db21e](https://www.github.com/aeternity/tipping-community-backend/commit/16db21eae622eb01d873c0bc91ed28f490dd4224))
* **tipdb:** wip casing ([7b3d5ee](https://www.github.com/aeternity/tipping-community-backend/commit/7b3d5ee9bee84dfe14313cd1736dc9561993dc12))
* **tips:** reworks await with generations for v1 ([2bab3b0](https://www.github.com/aeternity/tipping-community-backend/commit/2bab3b04b81c86bda471210a99cceac1ee5af8cc))
* **tips:** start of community filter ([23b1e4d](https://www.github.com/aeternity/tipping-community-backend/commit/23b1e4dd9e65d8cc3fc4340032e36903354be9ec))
* **token:** fixes materialized view for easier filtering ([0c6fbc3](https://www.github.com/aeternity/tipping-community-backend/commit/0c6fbc338e6466a1fed42c40070f7250bba6b76c))


### Bug Fixes

* **aeternity:** adds tempCallOptions to more calls ([cb7a381](https://www.github.com/aeternity/tipping-community-backend/commit/cb7a38162aed4aecbe8f245168514dc671a872b2))
* **tip:** await routes for v1 now ignore previous state ([542a945](https://www.github.com/aeternity/tipping-community-backend/commit/542a945d087a9f156aefe482889ea8d098fcb762))
* **tip:** claims are now properly handled ([2d7958f](https://www.github.com/aeternity/tipping-community-backend/commit/2d7958f4544de7c4778d9501c4f15ce8375ccbf5))
* **tips:** adjusts model to fit db ([9c85e91](https://www.github.com/aeternity/tipping-community-backend/commit/9c85e91594127d5d92aeca37cb81c1d183fbebe1))
* **tip:** waits for inserts before sending notifications ([821f18d](https://www.github.com/aeternity/tipping-community-backend/commit/821f18d713594119cf11176a9b9509af64ec5233))


### CI / CD

* **lint:** adds lint ignore lint rule ([62e96f3](https://www.github.com/aeternity/tipping-community-backend/commit/62e96f33d796652dbb6a6a96826397357bfb6135))


### Refactorings

* **comments:** adjusts comment verification to be more functional ([9b70382](https://www.github.com/aeternity/tipping-community-backend/commit/9b70382d8f8f921e9bfb391a8d7c8d21bbb2d72b))
* rename seed factory ([61a6927](https://www.github.com/aeternity/tipping-community-backend/commit/61a69277633ec6978f935b9e6dd30a59ea0c65b1))
* **stats:** moves from class to module ([647ff3e](https://www.github.com/aeternity/tipping-community-backend/commit/647ff3eccac9ea3f9d2a9154627c6876312dc620))
* **tips:** moves notification handling to insert function ([ef9fcae](https://www.github.com/aeternity/tipping-community-backend/commit/ef9fcae7516b42b4aa07f12c18749d02d3910c18))
* **tips:** moves notification handling to insert function ([f425df6](https://www.github.com/aeternity/tipping-community-backend/commit/f425df675e0361bea6c7d8f4f00165492dec5053))
* **util:** move asyncMap to server.js ([e75fac9](https://www.github.com/aeternity/tipping-community-backend/commit/e75fac957451334f7a13b0aa82827d35adede83e))


### Miscellaneous

* adjust db migration revisions ([921bb5e](https://www.github.com/aeternity/tipping-community-backend/commit/921bb5e33946731325222c55111f192c6db47637))
* **aeternity:** adds comment to re-enable v1 getter when dep is fixed ([01e76bd](https://www.github.com/aeternity/tipping-community-backend/commit/01e76bdee7d81d7ef070b3ba4a1d147c63b3b7f9))
* **cache:** remove unused stats from cache ([0847962](https://www.github.com/aeternity/tipping-community-backend/commit/0847962867680b37b2c7361e20246588f59f5a2e))
* **deps:** fixes package lock ([6e10492](https://www.github.com/aeternity/tipping-community-backend/commit/6e104929fed7c19a66cb386692d375ff92da0727))
* releasing tips to db ([f20c4a3](https://www.github.com/aeternity/tipping-community-backend/commit/f20c4a35c482dece6e6f046dca6fef1bc924cdc5))
* **tip:** satisfies linter ([70e7d2d](https://www.github.com/aeternity/tipping-community-backend/commit/70e7d2d040418c360d5be53438b330cffa80f914))
* **token:** removes console error ([1fc5210](https://www.github.com/aeternity/tipping-community-backend/commit/1fc521021f1c063ef41f249beb287a283b078353))

### [1.10.5](https://www.github.com/aeternity/tipping-community-backend/compare/v1.10.4...v1.10.5) (2021-06-10)


### Miscellaneous

* **contracts:** fix for new compiler ([3f1dcba](https://www.github.com/aeternity/tipping-community-backend/commit/3f1dcbac75b99f4bde134616c9fb2c90353d1bd8))
* **deps:** bump glob-parent from 5.1.1 to 5.1.2 ([b6c380e](https://www.github.com/aeternity/tipping-community-backend/commit/b6c380ed501d52c4be4ccc1c729c63c7ec70f0db))
* **deps:** bump normalize-url from 5.3.0 to 5.3.1 ([39afb99](https://www.github.com/aeternity/tipping-community-backend/commit/39afb993206d25d13f9f94a725ec8359bab2f75b))
* **deps:** bump trim-newlines from 3.0.0 to 3.0.1 ([d65b145](https://www.github.com/aeternity/tipping-community-backend/commit/d65b14516ba21f833022903ec3da38ea21f8d5d0))

### [1.10.4](https://www.github.com/aeternity/tipping-community-backend/compare/v1.10.3...v1.10.4) (2021-06-04)


### Bug Fixes

* **aeternity:** force old dry run endpoints to be used ([799cf43](https://www.github.com/aeternity/tipping-community-backend/commit/799cf4369d6246570e1a56b85d85f007b3ccca24))
* **auth:** bypasses broken basic auth verification ([a9d08c2](https://www.github.com/aeternity/tipping-community-backend/commit/a9d08c2b771fe43c43fb59ae75196e7cdfe28094))
* **health:** adds limit one to health db queries ([ecc7f0a](https://www.github.com/aeternity/tipping-community-backend/commit/ecc7f0ab26f234e78e010200b88a1d94975e36fd))
* **linkpreview:** allow superhero previews to be crawled ([a03d235](https://www.github.com/aeternity/tipping-community-backend/commit/a03d2354bb579f193abafed1eea02ed4e5c2301b))


### Miscellaneous

* **deps:** bump ws from 7.4.3 to 7.4.6 ([200f172](https://www.github.com/aeternity/tipping-community-backend/commit/200f1727206164c03bb005b7c676dc099fe497ec))

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
