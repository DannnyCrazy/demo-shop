<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/" class="flex items-center">
            <span class="text-2xl font-bold text-indigo-600">DemoShop</span>
          </NuxtLink>
          
          <nav class="flex space-x-4">
            <NuxtLink to="/" class="text-gray-700 hover:text-indigo-600">Products</NuxtLink>
            <NuxtLink to="/cart" class="text-gray-700 hover:text-indigo-600">
              Cart
              <span v-if="cart.itemCount > 0" class="bg-indigo-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                {{ cart.itemCount }}
              </span>
            </NuxtLink>
            <template v-if="auth.isAuthenticated">
              <NuxtLink to="/orders" class="text-gray-700 hover:text-indigo-600">My Orders</NuxtLink>
              <button @click="auth.logout" class="text-gray-700 hover:text-indigo-600">Logout</button>
            </template>
            <template v-else>
              <NuxtLink to="/login" class="text-gray-700 hover:text-indigo-600">Login</NuxtLink>
              <NuxtLink to="/register" class="text-gray-700 hover:text-indigo-600">Register</NuxtLink>
            </template>
          </nav>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="bg-gray-800 text-white py-8 mt-auto">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <p>&copy; 2026 Demo Shop. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth();
const cart = useCartStore();
</script>
