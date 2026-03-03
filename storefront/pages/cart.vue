<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UBreadcrumb :links="[{ label: 'Home', to: '/' }, { label: 'Cart' }]" class="mb-6" />

    <h1 class="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

    <!-- Not Authenticated -->
    <div v-if="!isAuthenticated" class="text-center py-16">
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Please sign in</h2>
      <p class="text-gray-500 mb-4">You need to be signed in to view your cart.</p>
      <UButton to="/login" size="lg">Sign in</UButton>
    </div>

    <!-- Loading State -->
    <div v-else-if="cart.loading" class="space-y-4">
      <UCard v-for="n in 3" :key="n" class="animate-pulse">
        <div class="flex gap-4">
          <div class="bg-gray-200 w-24 h-24 rounded-lg" />
          <div class="flex-1 space-y-2">
            <div class="bg-gray-200 h-4 rounded w-1/2" />
            <div class="bg-gray-200 h-4 rounded w-1/4" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty Cart -->
    <div v-else-if="cart.items.length === 0" class="text-center py-16">
      <div class="text-6xl mb-4">🛒</div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
      <p class="text-gray-500 mb-4">Browse our products and add something to your cart.</p>
      <UButton to="/" size="lg">Continue Shopping</UButton>
    </div>

    <!-- Cart Items -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-4">
        <UCard v-for="item in cart.items" :key="item.id">
          <div class="flex gap-4">
            <!-- Product Image -->
            <NuxtLink :to="`/products/${item.productId}`" class="shrink-0">
              <div class="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  v-if="item.product?.imageUrl"
                  :src="item.product.imageUrl"
                  :alt="item.product?.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                  📦
                </div>
              </div>
            </NuxtLink>

            <!-- Product Info -->
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="`/products/${item.productId}`"
                class="font-semibold text-gray-900 hover:text-indigo-600 line-clamp-1"
              >
                {{ item.product?.name || 'Unknown Product' }}
              </NuxtLink>
              <p v-if="item.product?.model" class="text-sm text-gray-500">{{ item.product.model }}</p>
              <p class="text-indigo-600 font-medium mt-1">${{ Number(item.product?.price || 0).toFixed(2) }}</p>

              <!-- Quantity Controls -->
              <div class="flex items-center gap-3 mt-2">
                <div class="flex items-center gap-2">
                  <UButton
                    variant="outline"
                    size="xs"
                    :disabled="item.quantity <= 1 || updatingItem === item.id"
                    @click="updateQuantity(item.id, item.quantity - 1)"
                  >
                    -
                  </UButton>
                  <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                  <UButton
                    variant="outline"
                    size="xs"
                    :disabled="updatingItem === item.id"
                    @click="updateQuantity(item.id, item.quantity + 1)"
                  >
                    +
                  </UButton>
                </div>

                <UButton
                  variant="ghost"
                  color="red"
                  size="xs"
                  :loading="removingItem === item.id"
                  @click="confirmRemove(item)"
                >
                  Remove
                </UButton>
              </div>
            </div>

            <!-- Item Total -->
            <div class="text-right shrink-0">
              <p class="font-bold text-gray-900">
                ${{ (Number(item.product?.price || 0) * item.quantity).toFixed(2) }}
              </p>
            </div>
          </div>
        </UCard>

        <div class="flex justify-between items-center pt-4">
          <UButton variant="outline" to="/">Continue Shopping</UButton>
          <UButton variant="ghost" color="red" @click="confirmClear">Clear Cart</UButton>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900">Order Summary</h2>
          </template>

          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal ({{ cart.itemCount }} items)</span>
              <span class="font-medium">${{ cart.total.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax (10%)</span>
              <span class="font-medium">${{ (cart.total * 0.1).toFixed(2) }}</span>
            </div>
            <div class="border-t pt-3 flex justify-between">
              <span class="text-lg font-semibold">Total</span>
              <span class="text-lg font-bold text-indigo-600">${{ (cart.total * 1.1).toFixed(2) }}</span>
            </div>
          </div>

          <template #footer>
            <UButton
              block
              size="lg"
              to="/checkout"
              :disabled="cart.items.length === 0"
            >
              Proceed to Checkout
            </UButton>
          </template>
        </UCard>
      </div>
    </div>

    <!-- Remove Confirmation Modal -->
    <UModal v-model="showRemoveModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Remove Item</h3>
        </template>

        <p class="text-gray-600">
          Are you sure you want to remove
          <strong>{{ itemToRemove?.product?.name }}</strong>
          from your cart?
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" @click="showRemoveModal = false">Cancel</UButton>
            <UButton color="red" :loading="removingItem !== null" @click="removeItem">Remove</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Clear Cart Confirmation Modal -->
    <UModal v-model="showClearModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Clear Cart</h3>
        </template>

        <p class="text-gray-600">Are you sure you want to remove all items from your cart?</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" @click="showClearModal = false">Cancel</UButton>
            <UButton color="red" @click="clearCart">Clear All</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '~/stores/cart';

definePageMeta({
  layout: 'default'
});

useHead({
  title: 'Cart - Demo Shop'
});

const cart = useCartStore();
const { isAuthenticated } = useAuth();

const updatingItem = ref<number | null>(null);
const removingItem = ref<number | null>(null);
const showRemoveModal = ref(false);
const showClearModal = ref(false);
const itemToRemove = ref<CartItem | null>(null);

const updateQuantity = async (cartItemId: number, quantity: number) => {
  updatingItem.value = cartItemId;
  try {
    await cart.updateQuantity(cartItemId, quantity);
  } finally {
    updatingItem.value = null;
  }
};

const confirmRemove = (item: CartItem) => {
  itemToRemove.value = item;
  showRemoveModal.value = true;
};

const removeItem = async () => {
  if (!itemToRemove.value) return;
  removingItem.value = itemToRemove.value.id;
  try {
    await cart.removeFromCart(itemToRemove.value.id);
    showRemoveModal.value = false;
  } finally {
    removingItem.value = null;
    itemToRemove.value = null;
  }
};

const confirmClear = () => {
  showClearModal.value = true;
};

const clearCart = async () => {
  await cart.clearCart();
  showClearModal.value = false;
};

onMounted(() => {
  if (isAuthenticated.value) {
    cart.fetchCart();
  }
});
</script>
