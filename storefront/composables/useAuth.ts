export const useAuth = () => {
  const authStore = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/auth/login', {
        method: 'POST',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        body: { email, password }
      });

      authStore.setUser(response.user, response.token);
      navigateTo('/');
      return response;
    } catch (error: any) {
      throw new Error(error.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await $fetch('/auth/register', {
        method: 'POST',
        baseURL: useRuntimeConfig().public.apiBaseUrl,
        body: { email, password, firstName, lastName }
      });

      authStore.setUser(response.user, response.token);
      navigateTo('/');
      return response;
    } catch (error: any) {
      throw new Error(error.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    authStore.logout();
    navigateTo('/login');
  };

  return {
    login,
    register,
    logout,
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    token: computed(() => authStore.token)
  };
};
