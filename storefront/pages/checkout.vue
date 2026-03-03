<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UBreadcrumb
      :links="[
        { label: 'Home', to: '/' },
        { label: 'Cart', to: '/cart' },
        { label: 'Checkout' }
      ]"
      class="mb-6"
    />

    <h1 class="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

    <!-- Not Authenticated -->
    <div v-if="!isAuthenticated" class="text-center py-16">
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Please sign in</h2>
      <p class="text-gray-500 mb-4">You need to be signed in to checkout.</p>
      <UButton to="/login" size="lg">Sign in</UButton>
    </div>

    <!-- Empty Cart -->
    <div v-else-if="cart.items.length === 0 && !orderPlaced" class="text-center py-16">
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
      <p class="text-gray-500 mb-4">Add some products before checking out.</p>
      <UButton to="/" size="lg">Browse Products</UButton>
    </div>

    <!-- Order Placed Success -->
    <div v-else-if="orderPlaced" class="text-center py-16">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold text-green-700 mb-2">Order Placed Successfully!</h2>
      <p class="text-gray-600 mb-2">
        Your order <strong>{{ orderNumber }}</strong> has been created.
      </p>
      <p class="text-gray-500 mb-6">
        Please complete the payment to confirm your order.
      </p>
      <div class="flex gap-4 justify-center">
        <UButton to="/orders" size="lg">View My Orders</UButton>
        <UButton variant="outline" to="/" size="lg">Continue Shopping</UButton>
      </div>
    </div>

    <!-- Checkout Form -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <!-- Shipping Address -->
        <UCard class="mb-6">
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900">Shipping Address</h2>
          </template>

          <form class="space-y-4" @submit.prevent>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <UInput v-model="shippingAddress.firstName" required placeholder="John" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <UInput v-model="shippingAddress.lastName" required placeholder="Doe" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <UInput v-model="shippingAddress.street" required placeholder="123 Main St" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc. (optional)</label>
              <UInput v-model="shippingAddress.apartment" placeholder="Apt 4B" />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <UInput v-model="shippingAddress.city" required placeholder="New York" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
                <UInput v-model="shippingAddress.state" required placeholder="NY" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <UInput v-model="shippingAddress.zipCode" required placeholder="10001" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <UInput v-model="shippingAddress.country" required placeholder="United States" />
            </div>
          </form>
        </UCard>

        <!-- Payment Section -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900">Payment</h2>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Payment will be processed securely through Stripe. You'll be prompted to enter your card details after placing the order.
            </p>

            <!-- Stripe Card Element will be mounted here -->
            <div id="stripe-card-element" class="border rounded-lg p-4 bg-gray-50 min-h-[44px]">
              <p v-if="!stripeLoaded" class="text-sm text-gray-500">Loading payment form...</p>
            </div>

            <div v-if="stripeError" class="rounded-md bg-red-50 p-3">
              <p class="text-sm text-red-700">{{ stripeError }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <UCard class="sticky top-4">
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900">Order Summary</h2>
          </template>

          <div class="space-y-3 mb-4">
            <div
              v-for="item in cart.items"
              :key="item.id"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-600 line-clamp-1 flex-1">
                {{ item.product?.name }} x {{ item.quantity }}
              </span>
              <span class="font-medium ml-2">
                ${{ (Number(item.product?.price || 0) * item.quantity).toFixed(2) }}
              </span>
            </div>
          </div>

          <div class="border-t pt-3 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-medium">${{ cart.total.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax (10%)</span>
              <span class="font-medium">${{ (cart.total * 0.1).toFixed(2) }}</span>
            </div>
            <div class="border-t pt-2 flex justify-between">
              <span class="text-lg font-semibold">Total</span>
              <span class="text-lg font-bold text-indigo-600">${{ (cart.total * 1.1).toFixed(2) }}</span>
            </div>
          </div>

          <template #footer>
            <div class="space-y-3">
              <div v-if="checkoutError" class="rounded-md bg-red-50 p-3">
                <p class="text-sm text-red-700">{{ checkoutError }}</p>
              </div>

              <UButton
                block
                size="lg"
                :loading="processing"
                :disabled="processing || !isFormValid"
                @click="handleCheckout"
              >
                {{ processing ? 'Processing...' : `Pay $${(cart.total * 1.1).toFixed(2)}` }}
              </UButton>

              <p class="text-xs text-gray-500 text-center">
                Your payment is processed securely through Stripe.
              </p>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});

useHead({
  title: 'Checkout - Demo Shop'
});

const config = useRuntimeConfig();
const cart = useCartStore();
const authStore = useAuthStore();
const { isAuthenticated, user } = useAuth();

const processing = ref(false);
const checkoutError = ref('');
const orderPlaced = ref(false);
const orderNumber = ref('');
const stripeLoaded = ref(false);
const stripeError = ref('');

let stripe: any = null;
let cardElement: any = null;

const shippingAddress = reactive({
  firstName: '',
  lastName: '',
  street: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States'
});

const isFormValid = computed(() => {
  return (
    shippingAddress.firstName.trim() !== '' &&
    shippingAddress.lastName.trim() !== '' &&
    shippingAddress.street.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    shippingAddress.state.trim() !== '' &&
    shippingAddress.zipCode.trim() !== '' &&
    shippingAddress.country.trim() !== ''
  );
});

const initStripe = async () => {
  try {
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripeKey = config.public.stripePublishableKey;

    if (!stripeKey) {
      stripeError.value = 'Stripe is not configured. Please contact support.';
      return;
    }

    stripe = await loadStripe(stripeKey);
    if (!stripe) {
      stripeError.value = 'Failed to load Stripe. Please refresh the page.';
      return;
    }

    const elements = stripe.elements();
    cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#374151',
          '::placeholder': { color: '#9CA3AF' }
        }
      }
    });
    cardElement.mount('#stripe-card-element');
    stripeLoaded.value = true;

    cardElement.on('change', (event: any) => {
      stripeError.value = event.error ? event.error.message : '';
    });
  } catch {
    stripeError.value = 'Failed to initialize payment system.';
  }
};

const handleCheckout = async () => {
  if (!isFormValid.value) {
    checkoutError.value = 'Please fill in all required shipping address fields.';
    return;
  }

  processing.value = true;
  checkoutError.value = '';

  try {
    const formattedAddress = `${shippingAddress.firstName} ${shippingAddress.lastName}, ${shippingAddress.street}${shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`;

    // Create the order on the backend
    const response = await $fetch<{ order: any; clientSecret: string }>('/orders', {
      method: 'POST',
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: {
        shippingAddress: formattedAddress
      }
    });

    // Confirm payment with Stripe
    if (stripe && cardElement && response.clientSecret) {
      const { error: stripeConfirmError } = await stripe.confirmCardPayment(
        response.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              email: user.value?.email
            }
          }
        }
      );

      if (stripeConfirmError) {
        checkoutError.value = stripeConfirmError.message || 'Payment failed. Please try again.';
        return;
      }
    }

    orderNumber.value = response.order?.orderNumber || '';
    orderPlaced.value = true;

    // Refresh cart (should be empty now)
    await cart.fetchCart();
  } catch (err: any) {
    checkoutError.value = err.data?.error || err.message || 'Checkout failed. Please try again.';
  } finally {
    processing.value = false;
  }
};

// Pre-fill name from user data
watch(() => user.value, (userData) => {
  if (userData) {
    shippingAddress.firstName = userData.firstName || '';
    shippingAddress.lastName = userData.lastName || '';
  }
}, { immediate: true });

onMounted(() => {
  if (isAuthenticated.value) {
    cart.fetchCart();
    nextTick(() => {
      initStripe();
    });
  }
});
</script>
