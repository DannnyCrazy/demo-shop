import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export const useAuthStore = defineStore('adminAuth', () => {
  const token = ref<string | null>(localStorage.getItem('admin_token'));
  const user = ref<AdminUser | null>(
    localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')!) : null
  );

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function setUser(userData: AdminUser, authToken: string) {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('admin_token', authToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  function hasPermission(resource: string, action: string): boolean {
    if (!isAdmin.value) return false;
    return true;
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    setUser,
    logout,
    hasPermission
  };
});
