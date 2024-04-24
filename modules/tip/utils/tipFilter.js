import sequelize$0 from "sequelize";
import models from "../../../models/index.js";

const { Op } = sequelize$0;
const { sequelize } = models;
export const FILTER_BLACKLIST = {
  [Op.notIn]: sequelize.literal('(SELECT "BlacklistEntries"."tipId" FROM "BlacklistEntries" WHERE "BlacklistEntries"."tipId" = "Tip"."id")'),
};
export const FILTER_TOKEN = (token) => ({
  [Op.in]: sequelize.literal(`(SELECT id FROM TipsAggregation WHERE ("totalTokenAmount" @> ${sequelize.escape(`[{"token": "${token}"}]`)}))`),
});
export const FILTER_SIMILARITY_SUM = (search) => sequelize.fn("sum_array", sequelize.fn("ARRAY_PREPEND", sequelize.fn("SIMILARITY", sequelize.col("Tip.title"), search), sequelize.fn("ARRAY_PREPEND", sequelize.fn("SIMILARITY", sequelize.col("Tip.sender"), search), sequelize.fn("ARRAY_PREPEND", sequelize.fn("SIMILARITY", sequelize.col("Tip.url"), search), sequelize.fn("ARRAY_PREPEND", sequelize.fn("SIMILARITY", sequelize.literal('(SELECT ("LinkPreviews"."description" || "LinkPreviews"."title") FROM "LinkPreviews" WHERE "LinkPreviews"."requestUrl" = "Tip"."url")'), search), sequelize.literal("ARRAY[0::REAL]"))))));
export default {
  FILTER_BLACKLIST,
  FILTER_TOKEN,
  FILTER_SIMILARITY_SUM,
};
