const fs = require('fs');

const { sequelize } = require('../models');

const { models } = sequelize;
const result = Object.keys(models).map(model => {
  const attributes = models[model].attributes || models[model].rawAttributes;
  return {
    model,
    fields: Object.keys(attributes).map(column => ({
      column,
      type: attributes[column].type.constructor.key,
      // eslint-disable-next-line no-underscore-dangle
      allowNull: attributes[column].allowNull || attributes[column]._autoGenerated,
      defaultValue: attributes[column].defaultValue,
      values: attributes[column].values,
    })),
  };
});

const typeMapping = type => {
  switch (type) {
    case 'enum':
    case 'date':
    case 'text':
    case 'uuid':
    case 'decimal':
      return 'string';
    case 'bigint':
      return 'number';
    case 'jsonb':
      return 'object';
    default:
      return type;
  }
};

const formatMapping = type => {
  switch (type) {
    case 'date':
      return 'date-time';
    case 'uuid':
      return 'uuid';
    default:
      return undefined;
  }
};

const rawSwagger = fs.readFileSync('./swagger.json', 'utf-8');
const swagger = JSON.parse(rawSwagger);
// const fieldsNotInRequest = ['signature', 'challenge', 'imageSignature', 'imageChallenge', 'createdAt', 'updatedAt', 'hierarchyLevel'];
const allRefs = [...rawSwagger.matchAll(/"\$ref": "#\/components\/schemas\/([A-z0-9-]+)"/g)];
const allModels = [...(new Set(allRefs.map(match => match[1])))];
const openAPIJSON = {
  components: {
    schemas: result.map(model => {
      const newModel = {
        // prep the model with required and properties fields
        ...model,
        required: model.fields
          .filter(field => !field.allowNull && field.defaultValue === undefined)
          .map(field => field.column)
          .filter(field => ['signature', 'challenge'].indexOf(field) === -1),
        properties: model.fields.reduce((allProperties, curr) => ({
          ...allProperties,
          [curr.column]: {
            type: typeMapping(curr.type.toLowerCase()),
            ...(curr.allowNull) && { nullable: true },
            format: formatMapping(curr.type.toLowerCase()),
            ...(curr.type === 'ENUM') && { enum: curr.values },
            ...(curr.type === 'ARRAY') && { items: { type: 'string' } },
          },
        }), {}),
      };

      // extract all variations
      const modelVariations = allModels.filter(modelString => modelString.includes(newModel.model) && modelString !== newModel.model);
      // prep variations
      return [newModel, ...modelVariations.map(modelVariation => {
        // eslint-disable-next-line no-console
        console.log(`Creating Model Variation: ${modelVariation}`);
        const modelCopy = JSON.parse(JSON.stringify(newModel));
        const [, ...fieldsToRemove] = modelVariation.split('-');
        modelCopy.model = modelVariation;
        fieldsToRemove.forEach(field => {
          modelCopy.required = modelCopy.required.filter(requiredField => requiredField !== field);
          if (!modelCopy.properties[field]) throw new Error(`Removing field ${field} from model ${modelCopy.model} failed.`);
          modelCopy.properties[field] = undefined;
        });
        if (modelCopy.required.length === 0) modelCopy.required = undefined;
        return modelCopy;
      })];
    }).flatMap(model => model)
      .reduce((acc, model) => ({
        ...acc,
        [model.model]: {
          type: 'object',
          required: model.required,
          properties: model.properties,
          additionalProperties: false,
        },
      }), {}),
  },
};

const merged = {
  ...swagger,
  components: {
    ...swagger.components,
    schemas: {
      ...swagger.components.schemas,
      ...openAPIJSON.components.schemas,
    },
  },
};
fs.writeFileSync('./swagger.json', JSON.stringify(merged));
