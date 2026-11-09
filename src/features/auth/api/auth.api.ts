import { addressesService, authService, usersService } from '../../../services';

/**
 * Capa de API del módulo `auth` (RF-01), delegando en los servicios tipados de infraestructura.
 */
export const authFeatureApi = {
  ...authService,
  addresses: addressesService,
  users: usersService,
};

export { authService, addressesService, usersService };
