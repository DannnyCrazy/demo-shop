<template>
  <div class="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p class="mt-2 text-sm text-gray-600">
            Or
            <NuxtLink to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </NuxtLink>
          </p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
          <UInput
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
            size="lg"
            class="mt-1"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <UInput
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
            size="lg"
            class="mt-1"
          />
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="loading"
        >
          Sign in
        </UButton>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});

useHead({
  title: 'Login - Demo Shop'
});

const { login } = useAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    await login(email.value, password.value);
  } catch (err: any) {
    error.value = err.message || 'Login failed. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};
</script>
