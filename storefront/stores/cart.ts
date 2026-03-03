import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    model: string;
    price: number;
    imageUrl?: string;
  };
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const loading = ref(false);

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));
  const total = computed(() => items.value.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0));

  async function fetchCart() {
    loading.value = true;
    try {
      const response = await $fetch('/cart', {
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${useAuthStore().token}`
        }
      });
      items.value = response.items || [];
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      loading.value = false;
    }
  }

  async function addToCart(productId: number, quantity: number = 1) {
    loading.value = true;
    try {
      const response = await $fetch('/cart', {
        method: 'POST',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${useAuthStore().token}`
        },
        body: { productId, quantity }
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateQuantity(cartItemId: number, quantity: number) {
    if (quantity < 1) return;
    loading.value = true;
    try {
      await $fetch(`/cart/${cartItemId}`, {
        method: 'PUT',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${useAuthStore().token}`
        },
        body: { quantity }
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart item:', error);
    } finally {
      loading.value = false;
    }
  }

  async function removeFromCart(cartItemId: number) {
    loading.value = true;
    try {
      await $fetch(`/cart/${cartItemId}`, {
        method: 'DELETE',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${useAuthStore().token}`
        }
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    } finally {
      loading.value = false;
    }
  }

  async function clearCart() {
    loading.value = true;
    try {
      await $fetch('/cart', {
        method: 'DELETE',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${useAuthStore().token}`
        }
      });
      items.value = [];
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    loading,
    itemCount,
    total,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
});
