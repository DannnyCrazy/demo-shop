<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UBreadcrumb :links="[{ label: 'Home', to: '/' }, { label: 'Products' }]" class="mb-6" />

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Products</h1>

      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="searchQuery"
          placeholder="Search products..."
          size="lg"
          class="flex-1"
          @keyup.enter="handleSearch"
        >
          <template #trailing>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-magnifying-glass"
              @click="handleSearch"
            />
          </template>
        </UInput>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <UCard v-for="n in 8" :key="n" class="animate-pulse">
        <div class="bg-gray-200 h-48 rounded-lg mb-4" />
        <div class="bg-gray-200 h-4 rounded w-3/4 mb-2" />
        <div class="bg-gray-200 h-4 rounded w-1/2" />
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="text-center py-16">
      <div class="text-gray-400 text-6xl mb-4">
        <span class="i-heroicons-shopping-bag text-6xl" />
      </div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">No products found</h2>
      <p class="text-gray-500 mb-4">Try adjusting your search to find what you're looking for.</p>
      <UButton v-if="searchQuery" @click="clearSearch">Clear search</UButton>
    </div>

    <!-- Product Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <NuxtLink
        v-for="product in products"
        :key="product.id"
        :to="`/products/${product.id}`"
        class="group"
      >
        <UCard class="h-full transition-shadow hover:shadow-lg">
          <div class="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              <span class="text-4xl">📦</span>
            </div>
          </div>

          <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {{ product.name }}
          </h3>
          <p v-if="product.model" class="text-sm text-gray-500 mt-1">{{ product.model }}</p>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-lg font-bold text-indigo-600">${{ Number(product.price).toFixed(2) }}</span>
            <span
              v-if="product.stock > 0"
              class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"
            >
              In Stock
            </span>
            <span
              v-else
              class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full"
            >
              Out of Stock
            </span>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="mt-8 flex justify-center items-center gap-2">
      <UButton
        variant="outline"
        :disabled="pagination.page <= 1"
        @click="goToPage(pagination.page - 1)"
      >
        Previous
      </UButton>

      <div class="flex gap-1">
        <UButton
          v-for="page in visiblePages"
          :key="page"
          :variant="page === pagination.page ? 'solid' : 'outline'"
          size="sm"
          @click="goToPage(page)"
        >
          {{ page }}
        </UButton>
      </div>

      <UButton
        variant="outline"
        :disabled="pagination.page >= pagination.pages"
        @click="goToPage(pagination.page + 1)"
      >
        Next
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});

useHead({
  title: 'Products - Demo Shop'
});

const { products, loading, pagination, fetchProducts } = useProducts();

const searchQuery = ref('');

const visiblePages = computed(() => {
  const current = pagination.value.page;
  const total = pagination.value.pages;
  const pages: number[] = [];

  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);

  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4);
    } else {
      start = Math.max(1, end - 4);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const handleSearch = () => {
  fetchProducts({ search: searchQuery.value, page: 1 });
};

const clearSearch = () => {
  searchQuery.value = '';
  fetchProducts({ page: 1 });
};

const goToPage = (page: number) => {
  fetchProducts({ search: searchQuery.value, page });
};

onMounted(() => {
  fetchProducts();
});
</script>
