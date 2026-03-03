<template>
  <div class="users-page">
    <!-- Header -->
    <div class="page-header">
      <h2>User Management</h2>
    </div>

    <!-- Filters -->
    <el-card shadow="hover" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Search by name or email..."
            prefix-icon="Search"
            clearable
            @clear="fetchUsers"
            @keyup.enter="fetchUsers"
          />
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="roleFilter"
            placeholder="Filter by role"
            clearable
            @change="fetchUsers"
            style="width: 100%"
          >
            <el-option label="Admin" value="admin" />
            <el-option label="Customer" value="customer" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" :icon="Search" @click="fetchUsers">Search</el-button>
          <el-button :icon="Refresh" @click="resetFilters">Reset</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Users Table -->
    <el-card shadow="hover" class="table-card">
      <el-table
        :data="filteredUsers"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" sortable />
        <el-table-column label="Name" min-width="180" sortable>
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :icon="UserFilled" />
              <span>{{ row.firstName }} {{ row.lastName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" min-width="220" show-overflow-tooltip />
        <el-table-column prop="role" label="Role" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" effect="plain">
              {{ row.role === 'admin' ? 'Admin' : 'Customer' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Registered" width="160" sortable>
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text :icon="View" @click="viewUserDetails(row)">
              Details
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- User Details Dialog -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="User Details"
      width="550px"
    >
      <div v-if="selectedUser">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="ID">
            {{ selectedUser.id }}
          </el-descriptions-item>
          <el-descriptions-item label="Name">
            {{ selectedUser.firstName }} {{ selectedUser.lastName }}
          </el-descriptions-item>
          <el-descriptions-item label="Email">
            {{ selectedUser.email }}
          </el-descriptions-item>
          <el-descriptions-item label="Role">
            <el-tag :type="selectedUser.role === 'admin' ? 'danger' : 'info'" effect="plain">
              {{ selectedUser.role === 'admin' ? 'Admin' : 'Customer' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Registered">
            {{ formatDate(selectedUser.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedUser.updatedAt" label="Last Updated">
            {{ formatDate(selectedUser.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- User Orders Summary -->
        <div v-if="userOrders.length > 0" class="user-orders-section">
          <h4>Recent Orders</h4>
          <el-table :data="userOrders" stripe border size="small">
            <el-table-column prop="orderNumber" label="Order #" width="200" />
            <el-table-column prop="total" label="Total" width="100">
              <template #default="{ row }">
                ${{ formatCurrency(row.total) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" width="130">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" effect="plain" size="small">
                  {{ formatStatus(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="Date">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailsDialogVisible = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View, Search, Refresh, UserFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
  updatedAt?: string
}

interface Order {
  id: number
  orderNumber: string
  total: string | number
  status: string
  createdAt: string
}

// State
const loading = ref(false)
const users = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const userOrders = ref<Order[]>([])
const searchQuery = ref('')
const roleFilter = ref('')
const detailsDialogVisible = ref(false)

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const filteredUsers = computed(() => {
  let result = users.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (u) =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    )
  }

  if (roleFilter.value) {
    result = result.filter((u) => u.role === roleFilter.value)
  }

  pagination.total = result.length

  const start = (pagination.page - 1) * pagination.limit
  return result.slice(start, start + pagination.limit)
})

function getAuthHeaders() {
  return { Authorization: `Bearer ${authStore.token}` }
}

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getStatusType(status: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    created: 'info',
    paid: '',
    allocated: '',
    picking: 'warning',
    shipped: 'success',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'danger',
    returned: 'danger',
    partial_shipped: 'warning'
  }
  return map[status] || 'info'
}

function resetFilters() {
  searchQuery.value = ''
  roleFilter.value = ''
  pagination.page = 1
  fetchUsers()
}

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
      params: {
        search: searchQuery.value || undefined,
        role: roleFilter.value || undefined,
        page: pagination.page,
        limit: pagination.limit
      }
    })
    users.value = data.users || []
    pagination.total = data.pagination?.total || users.value.length
  } catch (error: any) {
    ElMessage.error('Failed to load users')
  } finally {
    loading.value = false
  }
}

async function viewUserDetails(user: User) {
  selectedUser.value = user
  userOrders.value = []
  detailsDialogVisible.value = true

  // Try to fetch user's orders
  try {
    const { data } = await axios.get(`${API_BASE}/admin/users/${user.id}/orders`, {
      headers: getAuthHeaders()
    })
    userOrders.value = data.orders || []
  } catch {
    // Endpoint may not exist yet — silently ignore
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-orders-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.user-orders-section h4 {
  margin: 0 0 12px;
  color: #303133;
}
</style>
