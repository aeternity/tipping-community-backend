import queueLogic from "../modules/queue/logic/queueLogic.js";

export default async function () {
  // RESET ALL QUEUES
  await queueLogic.clearRedisQueues();
  await queueLogic.init();
}
