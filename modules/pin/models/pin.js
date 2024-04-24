import { PINNED_CONTENT_TYPES } from "../constants/contentTypes.js";

export default (sequelize, DataTypes) =>
  sequelize.define(
    "Pin",
    {
      // attributes
      entryId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM({
          values: Object.values(PINNED_CONTENT_TYPES),
        }),
        allowNull: false,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      challenge: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["entryId", "type", "author"],
        },
      ],
      timestamps: true,
    },
  );
