import models from "../../../models/index.js";
import { PINNED_CONTENT_TYPES } from "../constants/contentTypes.js";
import TipLogic from "../../tip/logic/tipLogic.js";

const { Pin } = models;
const PinLogic = {
  async addItem({ entryId, type, signature, challenge, author }) {
    return Pin.create({
      entryId,
      type,
      author,
      signature,
      challenge,
    });
  },
  async removeItem(entryId, author, type) {
    return Pin.destroy({
      where: {
        entryId,
        author,
        type,
      },
    });
  },
  async getAllItemsPerUser(author) {
    const tips = await TipLogic.fetchAllLocalTips();
    const pins = (await Pin.findAll({ where: { author }, raw: true })).filter((pin) => pin.type === PINNED_CONTENT_TYPES.TIP).map((pin) => pin.entryId);
    return tips.filter(({ id }) => pins.includes(String(id)));
  },
};
export default PinLogic;
