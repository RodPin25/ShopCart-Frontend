import { apiClient, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type { Address, AddressPayload } from '../types';

/**
 * Servicio modular de Direcciones de Entrega del Cliente (RF-01 & RF-06).
 */
export const addressesService = {
  /**
   * GET /api/addresses
   * Lista las direcciones activas del usuario autenticado (SP_Direcciones_ListarPorUsuario).
   */
  async listMyAddresses(): Promise<Address[]> {
    const { data } = await apiClient.get<ApiResponse<Address[]>>(
      API_ENDPOINTS.ADDRESSES.BASE
    );
    return data.data;
  },

  /**
   * POST /api/addresses
   * Registra una nueva dirección de entrega propia (SP_Direcciones_Crear).
   */
  async createAddress(payload: AddressPayload): Promise<Address> {
    const { data } = await apiClient.post<ApiResponse<Address>>(
      API_ENDPOINTS.ADDRESSES.BASE,
      payload
    );
    return data.data;
  },

  /**
   * PUT /api/addresses/{idDireccion}
   * Actualiza una dirección propia (SP_Direcciones_Actualizar).
   */
  async updateAddress(
    idDireccion: number,
    payload: AddressPayload
  ): Promise<Address> {
    const { data } = await apiClient.put<ApiResponse<Address>>(
      API_ENDPOINTS.ADDRESSES.BY_ID(idDireccion),
      payload
    );
    return data.data;
  },

  /**
   * DELETE /api/addresses/{idDireccion}
   * Desactiva una dirección propia (borrado lógico - SP_Direcciones_Desactivar).
   */
  async deleteAddress(idDireccion: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADDRESSES.BY_ID(idDireccion));
  },

  /**
   * PATCH /api/addresses/{idDireccion}/principal
   * Establece una dirección como principal para entregas (SP_Direcciones_EstablecerPrincipal).
   */
  async setPrincipalAddress(idDireccion: number): Promise<Address> {
    const { data } = await apiClient.patch<ApiResponse<Address>>(
      API_ENDPOINTS.ADDRESSES.SET_PRINCIPAL(idDireccion)
    );
    return data.data;
  },
};

export default addressesService;
