export const useProducts = () => {
  const products = ref<any[]>([]);
  const loading = ref(false);
  const pagination = ref({ page: 1, limit: 20, total: 0, pages: 1 });

  const fetchProducts = async (params: { search?: string; category?: number; page?: number } = {}) => {
    loading.value = true;
    try {
      const response = await $fetch('/products', {
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        query: params
      });

      products.value = response.products || [];
      pagination.value = response.pagination || pagination.value;
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchProduct = async (id: number) => {
    loading.value = true;
    try {
      const response = await $fetch(`/products/${id}`, {
        baseURL: useRuntimeConfig().public.apiBaseUrl
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    loading,
    pagination,
    fetchProducts,
    fetchProduct
  };
};
