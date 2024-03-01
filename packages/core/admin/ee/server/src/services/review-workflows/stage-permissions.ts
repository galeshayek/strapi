import type { Core } from '@strapi/types';
import { prop } from 'lodash/fp';
import { mapAsync, errors } from '@strapi/utils';
import { getService } from '../../utils';
import { STAGE_TRANSITION_UID } from '../../constants/workflows';

const { ApplicationError } = errors;
const validActions = [STAGE_TRANSITION_UID];

export default ({ strapi }: { strapi: Core.LoadedStrapi }) => {
  const roleService = getService('role');
  const permissionService = getService('permission');

  return {
    async register({ roleId, action, fromStage }: any) {
      if (!validActions.includes(action)) {
        throw new ApplicationError(`Invalid action ${action}`);
      }
      const permissions = await roleService.addPermissions(roleId, [
        {
          action,
          actionParameters: {
            from: fromStage,
          },
        },
      ]);

      // TODO: Filter response
      return permissions;
    },
    async registerMany(permissions: any) {
      return mapAsync(permissions, this.register);
    },
    async unregister(permissions: any) {
      const permissionIds = permissions.map(prop('id'));
      await permissionService.deleteByIds(permissionIds);
    },
    can(action: any, fromStage: any) {
      const requestState = strapi.requestContext.get()?.state;

      if (!requestState) {
        return false;
      }

      // Override permissions for super admin
      const userRoles = requestState.user?.roles;
      if (userRoles?.some((role: any) => role.code === 'strapi-super-admin')) {
        return true;
      }

      return requestState.userAbility.can({
        name: action,
        params: { from: fromStage },
      });
    },
  };
};
