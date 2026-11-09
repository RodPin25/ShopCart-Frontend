import { apiClient, getOrCreateGuestToken, type ApiResponse } from './api.client';
import { API_ENDPOINTS } from './endpoints';
import type { CartData, UpsertCartItemPayload } from '../types';

/**
 * Servicio modular de Carrito de Compras reactivo (RF-04).
 * Soporta carrito de visitante invitado (`tokenInvitado` / `x-guest-token`) y fusión automática al autenticarse.
 */
export const cartService = {
  /**
   * GET /api/cart
   * Obtiene el carrito activo con subtotal, descuento, IVA 12% y total (SP_Carrito_ObtenerDetalle).
   */
  async getCart(codigoCupon?: string): Promise<CartData> {
    const tokenInvitado = getOrCreateGuestToken();
    const { data } = await apiClient.get<ApiResponse<CartData>>(
      API_ENDPOINTS.CART.BASE,
      {
        params: {
          tokenInvitado,
          ...(codigoCupon ? { codigoCupon } : {}),
        },
      }
    );
    return data.data;
  },

  /**
   * POST /api/cart/items
   * Agrega o modifica la cantidad de una variante en el carrito validando StockDisponible (SP_Carrito_AgregarOModificarItem).
   */
  async addOrUpdateItem(payload: UpsertCartItemPayload): Promise<CartData> {
    const tokenInvitado = payload.tokenInvitado ?? getOrCreateGuestToken();
    const { data } = await apiClient.post<ApiResponse<CartData>>(
      API_ENDPOINTS.CART.ITEMS,
      {
        idVariante: payload.idVariante,
        cantidad: payload.cantidad,
        modoOperacion: payload.modoOperacion ?? 'SUMAR',
        tokenInvitado,
      }
    );
    return data.data;
  },

  /**
   * PUT /api/cart/items/{idVariante}
   * Fija la cantidad exacta de una variante en el carrito (SP_Carrito_AgregarOModificarItem).
   */
  async setItemQuantity(idVariante: number, cantidad: number): Promise<CartData> {
    const tokenInvitado = getOrCreateGuestToken();
    const { data } = await apiClient.put<ApiResponse<CartData>>(
      API_ENDPOINTS.CART.ITEM_BY_VARIANT(idVariante),
      {
        cantidad,
        tokenInvitado,
      }
    );
    return data.data;
  },

  /**
   * DELETE /api/cart/items/{idVariante}
   * Elimina una variante del carrito activo (SP_Carrito_EliminarItem).
   */
  async removeItem(idVariante: number): Promise<CartData> {
    const tokenInvitado = getOrCreateGuestToken();
    const { data } = await apiClient.delete<ApiResponse<CartData>>(
      API_ENDPOINTS.CART.ITEM_BY_VARIANT(idVariante),
      { params: { tokenInvitado } }
    );
    return data.data;
  },

  /**
   * DELETE /api/cart
   * Vacía por completo el carrito activo (SP_Carrito_Vaciar).
   */
  async clearCart(): Promise<void> {
    const tokenInvitado = getOrCreateGuestToken();
    await apiClient.delete(API_ENDPOINTS.CART.BASE, {
      params: { tokenInvitado },
    });
  },

  /**
   * POST /api/cart/merge
   * Fusiona el carrito de invitado hacia el carrito del usuario autenticado (SP_Carrito_FusionarInvitadoAUsuario).
   */
  async mergeGuestCart(tokenInvitado?: string): Promise<CartData> {
    const guestToken = tokenInvitado ?? getOrCreateGuestToken();
    const { data } = await apiClient.post<ApiResponse<CartData>>(
      API_ENDPOINTS.CART.MERGE,
      { tokenInvitado: guestToken }
    );
    return data.data;
  },
};

export default cartService;
