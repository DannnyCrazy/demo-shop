<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UBreadcrumb
      :links="[
        { label: 'Home', to: '/' },
        { label: 'Products', to: '/' },
        { label: product?.name || 'Loading...' }
      ]"
      class="mb-6"
    />

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
      <div class="bg-gray-200 aspect-square rounded-lg" />
      <div class="space-y-4">
        <div class="bg-gray-200 h-8 rounded w-3/4" />
        <div class="bg-gray-200 h-4 rounded w-1/2" />
        <div class="bg-gray-200 h-6 rounded w-1/4" />
        <div class="bg-gray-200 h-24 rounded" />
        <div class="bg-gray-200 h-12 rounded w-1/3" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-16">
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Product not found</h2>
      <p class="text-gray-500 mb-4">The product you're looking for doesn't exist or has been removed.</p>
      <UButton to="/">Back to Products</UButton>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Product Image -->
      <div class="bg-gray-100 rounded-lg overflow-hidden aspect-square">
        <img
          v-if="product.imageUrl"
          :src="product.imageUrl"
          :alt="product.name"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
          <span class="text-8xl">📦</span>
        </div>
      </div>

      <!-- Product Info -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ product.name }}</h1>
        <p v-if="product.model" class="text-lg text-gray-500 mt-1">{{ product.model }}</p>

        <div class="mt-4">
          <span class="text-3xl font-bold text-indigo-600">${{ Number(product.price).toFixed(2) }}</span>
        </div>

        <div class="mt-4">
          <span
            v-if="product.stock > 0"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
          >
            In Stock ({{ product.stock }} available)
          </span>
          <span
            v-else
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
          >
            Out of Stock
          </span>
        </div>

        <div v-if="product.description" class="mt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <p class="text-gray-600 leading-relaxed">{{ product.description }}</p>
        </div>

        <div class="mt-8 space-y-4">
          <!-- Quantity Selector -->
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700">Quantity:</label>
            <div class="flex items-center gap-2">
              <UButton
                variant="outline"
                size="sm"
                :disabled="quantity <= 1"
                @click="quantity--"
              >
                -
              </UButton>
              <span class="w-12 text-center font-medium">{{ quantity }}</span>
              <UButton
                variant="outline"
                size="sm"
                :disabled="quantity >= (product.stock || 0)"
                @click="quantity++"
              >
                +
              </UButton>
            </div>
          </div>

          <!-- Add to Cart -->
          <div class="flex gap-4">
            <UButton
              size="lg"
              :loading="addingToCart"
              :disabled="product.stock <= 0 || addingToCart"
              @click="handleAddToCart"
            >
              {{ product.stock <= 0 ? 'Out of Stock' : 'Add to Cart' }}
            </UButton>

            <UButton
              v-if="isAuthenticated"
              variant="outline"
              size="lg"
              to="/cart"
            >
              View Cart
            </UButton>
          </div>

          <div v-if="addToCartError" class="rounded-md bg-red-50 p-3">
            <p class="text-sm text-red-700">{{ addToCartError }}</p>
          </div>

          <div v-if="addedToCart" class="rounded-md bg-green-50 p-3">
            <p class="text-sm text-green-700">
              Added to cart!
              <NuxtLink to="/cart" class="font-medium underline">View cart</NuxtLink>
            </p>
          </div>

          <div v-if="!isAuthenticated" class="rounded-md bg-blue-50 p-3">
            <p class="text-sm text-blue-700">
              Please
              <NuxtLink to="/login" class="font-medium underline">sign in</NuxtLink>
              to add items to your cart.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});

const route = useRoute();
const { fetchProduct, loading } = useProducts();
const cart = useCartStore();
const { isAuthenticated } = useAuth();

const product = ref<any>(null);
const error = ref(false);
const quantity = ref(1);
const addingToCart = ref(false);
const addToCartError = ref('');
const addedToCart = ref(false);

useHead({
  title: computed(() => product.value ? `${product.value.name} - Demo Shop` : 'Product - Demo Shop')
});

const handleAddToCart = async () => {
  if (!isAuthenticated.value) {
    navigateTo('/login');
    return;
  }

  addToCartError.value = '';
  addedToCart.value = false;
  addingToCart.value = true;

  try {
    await cart.addToCart(product.value.id, quantity.value);
    addedToCart.value = true;
    quantity.value = 1;

    setTimeout(() => {
      addedToCart.value = false;
    }, 3000);
  } catch (err: any) {
    addToCartError.value = err.message || 'Failed to add to cart.';
  } finally {
    addingToCart.value = false;
  }
};

onMounted(async () => {
  try {
    const id = Number(route.params.id);
    product.value = await fetchProduct(id);
  } catch {
    error.value = true;
  }
});
</script>
