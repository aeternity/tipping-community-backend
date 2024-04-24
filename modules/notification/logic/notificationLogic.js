import sequelize from "sequelize";
import models from "../../../models/index.js";
import { NOTIFICATION_TYPES, ENTITY_TYPES, SOURCE_TYPES } from "../constants/notification.js";
import loggerFactory from "../../../utils/logger.js";
const { Op } = sequelize;
const { Notification, Comment, Retip, Tip, } = models;
const logger = loggerFactory(import.meta.url);
const NotificationLogic = {
    add: {
        [NOTIFICATION_TYPES.COMMENT_ON_TIP]: async (receiver, sender, commentId, tipId) => Notification.create({
            receiver,
            sender,
            type: NOTIFICATION_TYPES.COMMENT_ON_TIP,
            entityId: commentId,
            entityType: ENTITY_TYPES.COMMENT,
            sourceId: tipId,
            sourceType: SOURCE_TYPES.TIP,
        }),
        [NOTIFICATION_TYPES.COMMENT_ON_COMMENT]: async (receiver, sender, commentId, parentCommentId) => Notification.create({
            receiver,
            sender,
            type: NOTIFICATION_TYPES.COMMENT_ON_COMMENT,
            entityId: commentId,
            entityType: ENTITY_TYPES.COMMENT,
            sourceId: parentCommentId,
            sourceType: SOURCE_TYPES.COMMENT,
        }),
        [NOTIFICATION_TYPES.TIP_ON_COMMENT]: async (receiver, sender, tipId, commentId) => Notification.create({
            receiver,
            sender,
            type: NOTIFICATION_TYPES.TIP_ON_COMMENT,
            entityId: tipId,
            entityType: ENTITY_TYPES.TIP,
            sourceId: commentId,
            sourceType: SOURCE_TYPES.COMMENT,
        }),
        [NOTIFICATION_TYPES.RETIP_ON_TIP]: async (receiver, sender, tipId, retipId) => Notification.create({
            receiver,
            sender,
            type: NOTIFICATION_TYPES.RETIP_ON_TIP,
            entityId: tipId,
            entityType: ENTITY_TYPES.TIP,
            sourceId: retipId,
            sourceType: SOURCE_TYPES.RETIP,
        }),
        [NOTIFICATION_TYPES.CLAIM_OF_TIP]: async (receiver, tipId) => Notification.create({
            receiver,
            type: NOTIFICATION_TYPES.CLAIM_OF_TIP,
            entityId: tipId,
            entityType: ENTITY_TYPES.TIP,
        }),
        [NOTIFICATION_TYPES.CLAIM_OF_RETIP]: async (receiver, tipId, retipId) => Notification.create({
            receiver,
            type: NOTIFICATION_TYPES.CLAIM_OF_RETIP,
            entityId: tipId,
            entityType: ENTITY_TYPES.TIP,
            sourceId: retipId,
            sourceType: SOURCE_TYPES.RETIP,
        }),
    },
    async handleDuplicateNotification(asyncInsertCall) {
        try {
            return await asyncInsertCall;
        }
        catch (e) {
            if (!e.name || !e.name.includes('SequelizeUniqueConstraintError')) {
                logger.error(e);
                return Promise.reject(e);
            }
            logger.debug('Duplicate notification');
            return Promise.resolve({});
        }
    },
    async getForUser(receiver) {
        return Notification.findAll({ where: { receiver }, raw: true });
    },
    async updateNotificationState(notificationId, status) {
        await Notification.update({ status }, { where: { id: notificationId } });
        return (await Notification.findOne({ where: { id: notificationId } })).toJSON();
    },
    async bulkUpdateNotificationStatus(ids, status) {
        const results = await Notification.findAll({ where: { id: ids } });
        return Notification.bulkCreate(results.map(notification => ({ ...notification.toJSON(), status })), { updateOnDuplicate: ['status'] });
    },
    async handleNewTip(tip) {
        // TIP ON COMMENT
        const commentMatch = tip.url && tip.url.match(/https:\/\/superhero\.com\/tip\/(\d+(?:_v\d+)?)\/comment\/(\d+)/);
        if (commentMatch) {
            const commentId = commentMatch[2];
            const comment = await Comment.findOne({ where: { id: commentId }, raw: true });
            if (!comment) {
                logger.warn(`Could not find comment with id ${commentId} locally`);
                return;
            }
            // Do not create notifications if the tip creator comments on his/her own tip
            if (comment.author === tip.sender)
                return;
            await NotificationLogic.handleDuplicateNotification(NotificationLogic.add[NOTIFICATION_TYPES.TIP_ON_COMMENT](comment.author, tip.sender, tip.id, commentId));
        }
    },
    async handleNewRetip(retip) {
        // RETIP ON TIP
        const parentTip = await Tip.findOne({
            where: { id: retip.tipId },
        });
        if (parentTip.sender !== retip.sender) {
            await NotificationLogic.handleDuplicateNotification(NotificationLogic.add[NOTIFICATION_TYPES.RETIP_ON_TIP](parentTip.sender, retip.sender, retip.tipId, retip.id));
        }
        else {
            logger.info(`Skipping notification for RETIP_ON_TIP the retip ${retip.id} to tip ${parentTip.id} due to self retip`);
        }
    },
    async handleClaim(claim) {
        if (claim.claimGen === 0) {
            return;
        }
        const relevantTips = await Tip.findAll({
            where: {
                url: claim.url,
                contractId: claim.contractId,
                claimGen: {
                    [Op.lt]: claim.claimGen,
                },
            },
        });
        const relevantRetips = await Retip.findAll({
            where: {
                tipId: {
                    [Op.in]: relevantTips.map(({ id }) => id),
                },
                claimGen: {
                    [Op.lt]: claim.claimGen,
                },
            },
        });
        await Promise.all(relevantTips.map(async tip => {
            await NotificationLogic.handleDuplicateNotification(NotificationLogic.add[NOTIFICATION_TYPES.CLAIM_OF_TIP](tip.sender, tip.id));
        }));
        await Promise.all(relevantRetips.map(async retip => {
            await NotificationLogic.handleDuplicateNotification(NotificationLogic.add[NOTIFICATION_TYPES.CLAIM_OF_RETIP](retip.sender, retip.tipId, retip.id));
        }));
    },
};
export default NotificationLogic;
