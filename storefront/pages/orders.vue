<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UBreadcrumb :links="[{ label: 'Home', to: '/' }, { label: 'My Orders' }]" class="mb-6" />

    <h1 class="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

    <!-- Not Authenticated -->
    <div v-if="!isAuthenticated" class="text-center py-16">
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Please sign in</h2>
      <p class="text-gray-500 mb-4">You need to be signed in to view your orders.</p>
      <UButton to="/login" size="lg">Sign in</UButton>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="space-y-4">
      <UCard v-for="n in 3" :key="n" class="animate-pulse">
        <div class="flex justify-between">
          <div class="space-y-2">
            <div class="bg-gray-200 h-4 rounded w-32" />
            <div class="bg-gray-200 h-4 rounded w-48" />
          </div>
          <div class="bg-gray-200 h-6 rounded w-20" />
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="text-center py-16">
      <div class="text-6xl mb-4">📦</div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
      <p class="text-gray-500 mb-4">Start shopping to see your orders here.</p>
      <UButton to="/" size="lg">Browse Products</UButton>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <UCard v-for="order in orders" :key="order.id">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="font-semibold text-gray-900">{{ order.orderNumber }}</h3>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClasses(order.status)"
              >
                {{ formatStatus(order.status) }}
              </span>
            </div>

            <div class="text-sm text-gray-600 space-y-1">
              <p>
                <span class="font-medium">Date:</span>
                {{ formatDate(order.createdAt) }}
              </p>
              <p v-if="order.shippingAddress">
                <span class="font-medium">Ship to:</span>
                {{ order.shippingAddress }}
              </p>
            </div>
          </div>

          <div class="text-right">
            <p class="text-2xl font-bold text-indigo-600">${{ Number(order.total).toFixed(2) }}</p>
            <div class="text-xs text-gray-500 mt-1">
              <p>Subtotal: ${{ Number(order.subtotal).toFixed(2) }}</p>
              <p>Tax: ${{ Number(order.tax).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Order Status Timeline -->
        <div class="mt-4 pt-4 border-t">
          <div class="flex items-center gap-1 overflow-x-auto">
            <div
              v-for="(step, index) in orderTimeline"
              :key="step.key"
              class="flex items-center"
            >
              <div class="flex flex-col items-center min-w-[80px]">
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                  :class="getTimelineStepClass(order.status, step.key)"
                >
                  <span v-if="isStepCompleted(order.status, step.key)">✓</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="text-xs text-gray-500 mt-1">{{ step.label }}</span>
              </div>
              <div
                v-if="index < orderTimeline.length - 1"
                class="h-0.5 w-8 mx-1"
                :class="isStepCompleted(order.status, step.key) ? 'bg-green-500' : 'bg-gray-200'"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});

useHead({
  title: 'My Orders - Demo Shop'
});

const config = useRuntimeConfig();
const authStore = useAuthStore();
const { isAuthenticated } = useAuth();

const orders = ref<any[]>([]);
const loading = ref(false);

const orderTimeline = [
  { key: 'created', label: 'Created' },
  { key: 'paid', label: 'Paid' },
  { key: 'allocated', label: 'Allocated' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
];

const statusOrder = ['created', 'paid', 'allocated', 'picking', 'shipped', 'delivered', 'completed'];

const getStatusClasses = (status: string): string => {
  const map: Record<string, string> = {
    created: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    allocated: 'bg-cyan-100 text-cyan-800',
    picking: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    returned: 'bg-orange-100 text-orange-800',
    partial_shipped: 'bg-indigo-100 text-indigo-800'
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isStepCompleted = (currentStatus: string, stepKey: string): boolean => {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepIndex = statusOrder.indexOf(stepKey);

  if (currentIndex === -1) return false;
  return currentIndex >= stepIndex;
};

const getTimelineStepClass = (currentStatus: string, stepKey: string): string => {
  if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
    return 'bg-gray-200 text-gray-500';
  }
  if (isStepCompleted(currentStatus, stepKey)) {
    return 'bg-green-500 text-white';
  }
  return 'bg-gray-200 text-gray-500';
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const response = await $fetch<{ orders: any[] }>('/orders', {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    orders.value = response.orders || [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (isAuthenticated.value) {
    fetchOrders();
  }
});
</script>
