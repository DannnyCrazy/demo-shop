<template>
  <div class="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">Create your account</h1>
          <p class="mt-2 text-sm text-gray-600">
            Already have an account?
            <NuxtLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </template>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700">First name</label>
            <UInput
              id="firstName"
              v-model="firstName"
              type="text"
              placeholder="John"
              required
              size="lg"
              class="mt-1"
            />
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700">Last name</label>
            <UInput
              id="lastName"
              v-model="lastName"
              type="text"
              placeholder="Doe"
              required
              size="lg"
              class="mt-1"
            />
          </div>
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
            placeholder="Create a password (min 6 characters)"
            required
            size="lg"
            class="mt-1"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm password</label>
          <UInput
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
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
          Create account
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
  title: 'Register - Demo Shop'
});

const { register } = useAuth();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  error.value = '';

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  loading.value = true;

  try {
    await register(email.value, password.value, firstName.value, lastName.value);
  } catch (err: any) {
    error.value = err.message || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
