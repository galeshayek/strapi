import { isObject } from 'lodash/fp';
import { errors } from '@strapi/utils';
import type { Internal, Core, Utils, Public } from '@strapi/types';

import { parseBody } from './transform';

interface Options {
  contentType: Internal.Struct.SingleTypeSchema;
}

/**
 * Returns a single type controller to handle default core-api actions
 */
const createSingleTypeController = ({
  contentType,
}: Options): Utils.PartialWithThis<Core.CoreAPI.Controller.SingleType> => {
  const uid = contentType.uid as Public.UID.Service;

  return {
    /**
     * Retrieve single type content
     *
     */
    async find(ctx) {
      await this.validateQuery(ctx);
      const sanitizedQuery = await this.sanitizeQuery(ctx);

      const entity = await strapi.service(uid).find(sanitizedQuery);

      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

      return this.transformResponse(sanitizedEntity);
    },

    /**
     * create or update single type content.
     *
     * @return {Object}
     */
    async update(ctx) {
      const { query } = ctx.request;
      const body = parseBody(ctx);

      if (!isObject(body.data)) {
        throw new errors.ValidationError('Missing "data" payload in the request body');
      }

      const sanitizedInputData = await this.sanitizeInput(body.data, ctx);

      const entity = await strapi.service(uid).createOrUpdate({
        ...query,
        data: sanitizedInputData,
        files: 'files' in body ? body.files : undefined,
      });

      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

      return this.transformResponse(sanitizedEntity);
    },

    async delete(ctx) {
      const { query } = ctx;

      const entity = await strapi.service(uid).delete(query);
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

      return this.transformResponse(sanitizedEntity);
    },
  };
};

export default createSingleTypeController;
