const DomLoader = require('./utils/domLoader.js');
const fs = require('fs');

class PerformanceLogic {

  static tests = [
    {
      url: 'https://www.weibo.com/ttarticle/p/show?id=2309404390785649869050',
      address: 'ak_7ULGBPWTPe9Hq3dkzcyffVdbHhuChfgtWzX1CemRTrmhx38Lk',
      repetitions: 10,
      timeout: 120 * 1000,
      batchSize: 5,
    },
  ];

  static async runAllTests () {
    const results = await Promise.all(
      PerformanceLogic.tests.map(async test => {
        const result = [];
        for (let i = 0; i < test.repetitions; i++) {
          result.push(await Promise.all(
            Array.from(
              { length: test.batchSize },
              async _ => await PerformanceLogic.runTestIteration(test))));
        }
        return result;
      }));

    const summary = results.map((testResults, index) => {
      const aggregatedResults = testResults
        .reduce((all, batch) => [...all, ...batch], [])
        .reduce((total, { duration, metrics }) => ({
          duration: total.duration + duration,
          completed: total.completed + (metrics.completed ? 1 : 0),
          gotHTML: total.gotHTML + (metrics.gotHTML ? 1 : 0),
          foundAddress: total.foundAddress + (metrics.foundAddress ? 1 : 0),
          reachedTargetUrl: total.reachedTargetUrl + (metrics.reachedTargetUrl ? 1 : 0),
        }), {
          duration: 0,
          completed: 0,
          gotHTML: 0,
          foundAddress: 0,
          reachedTargetUrl: 0,
        });
      const N = PerformanceLogic.tests[index].batchSize * PerformanceLogic.tests[index].repetitions;
      return {
        test: PerformanceLogic.tests[index],
        averageTime: aggregatedResults.duration / N,
        completed: aggregatedResults.completed / N,
        gotHTML: aggregatedResults.gotHTML / N,
        foundAddress: aggregatedResults.foundAddress / N,
        reachedTargetUrl: aggregatedResults.reachedTargetUrl / N,
      };
    });
    console.log({ _summary: summary, results });
    fs.writeFileSync(`./results-${(new Date()).toISOString().replace(/-/g, '')}.json`, JSON.stringify({ _summary: summary, results }));
  };

  static async runTestIteration (test) {
    return await
      Promise.race([
        new Promise(async (resolve, reject) => {
          console.log(`starting test +++ ${test.url}`);
          const start = Date.now();
          const { html, url, error } = await DomLoader.getHTMLfromURL(test.url);
          const end = Date.now();
          console.log(`Finished test +++ ${test.url} +++ ${(end - start) / 1000}s`);
          resolve({
            duration: end - start,
            metrics: {
              completed: true,
              gotHTML: !!html,
              foundAddress: !!html && html.includes(test.address),
              reachedTargetUrl: url === test.url,
            },
            debug: {
              resultUrl: url,
              error: error,
            },
          });
        }), new Promise((resolve) => {
            setTimeout(() => resolve({
              duration: test.timeout,
              metrics: {
                completed: false,
                gotHTML: false,
                foundAddress: false,
                reachedTargetUrl: false,
              },
            }), test.timeout);
          },
        ),
      ]);
  };
}

(async () => {
  await PerformanceLogic.runAllTests();
})();
