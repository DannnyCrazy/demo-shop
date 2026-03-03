<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Total Orders</p>
              <h2 class="stat-value">{{ stats.totalOrders }}</h2>
            </div>
            <el-icon :size="48" class="stat-icon" color="#409EFF"><List /></el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Total Products</p>
              <h2 class="stat-value">{{ stats.totalProducts }}</h2>
            </div>
            <el-icon :size="48" class="stat-icon" color="#67C23A"><Goods /></el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Total Revenue</p>
              <h2 class="stat-value">${{ formatCurrency(stats.totalRevenue) }}</h2>
            </div>
            <el-icon :size="48" class="stat-icon" color="#E6A23C"><Money /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Orders -->
    <el-card shadow="hover" class="recent-orders">
      <template #header>
        <div class="card-header">
          <span>Recent Orders</span>
          <el-button type="primary" text @click="$router.push('/orders')">
            View All
          </el-button>
        </div>
      </template>

      <el-table :data="recentOrders" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="orderNumber" label="Order #" width="200" />
        <el-table-column prop="total" label="Total" width="120">
          <template #default="{ row }">
            ${{ formatCurrency(row.total) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="plain">
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { List, Goods, Money } from '@element-plus/icons-vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const stats = reactive({
  totalOrders: 0,
  totalProducts: 0,
  totalRevenue: 0
})

interface Order {
  id: number
  orderNumber: string
  total: string | number
  status: string
  createdAt: string
}

const recentOrders = ref<Order[]>([])

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

async function fetchDashboardData() {
  loading.value = true
  try {
    const [ordersRes, productsRes] = await Promise.all([
      axios.get(`${API_BASE}/admin/orders`, {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 5 }
      }),
      axios.get(`${API_BASE}/products`, {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 1 }
      })
    ])

    const ordersData = ordersRes.data
    const productsData = productsRes.data

    stats.totalOrders = ordersData.pagination?.total || 0
    stats.totalProducts = productsData.pagination?.total || 0

    recentOrders.value = ordersData.orders || []

    // Calculate total revenue from all orders
    stats.totalRevenue = (ordersData.orders || []).reduce(
      (sum: number, order: Order) => sum + Number(order.total),
      0
    )
  } catch (error: any) {
    ElMessage.error('Failed to load dashboard data')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  flex: 1;
}

.stat-label {
  margin: 0 0 8px;
  color: #909399;
  font-size: 14px;
}

.stat-value {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-icon {
  opacity: 0.8;
}

.recent-orders {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
