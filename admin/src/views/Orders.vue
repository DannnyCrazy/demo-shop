<template>
  <div class="orders-page">
    <!-- Header -->
    <div class="page-header">
      <h2>Order Management</h2>
    </div>

    <!-- Filters -->
    <el-card shadow="hover" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-select
            v-model="statusFilter"
            placeholder="Filter by status"
            clearable
            @change="fetchOrders"
            style="width: 100%"
          >
            <el-option
              v-for="status in orderStatuses"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button :icon="Refresh" @click="resetFilters">Reset</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Orders Table -->
    <el-card shadow="hover" class="table-card">
      <el-table
        :data="orders"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" sortable />
        <el-table-column prop="orderNumber" label="Order #" width="220" show-overflow-tooltip />
        <el-table-column prop="userId" label="User ID" width="90" />
        <el-table-column prop="total" label="Total" width="120" sortable>
          <template #default="{ row }">
            ${{ formatCurrency(row.total) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="160">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" :effect="getStatusEffect(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shippingAddress" label="Shipping Address" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="Created" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text :icon="View" @click="viewOrderDetails(row)">
              Details
            </el-button>
            <el-button
              v-if="canShip(row.status)"
              type="success"
              text
              :icon="Van"
              @click="shipOrder(row)"
            >
              Ship
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
          @size-change="fetchOrders"
          @current-change="fetchOrders"
        />
      </div>
    </el-card>

    <!-- Order Details Dialog -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="Order Details"
      width="700px"
    >
      <div v-if="selectedOrder" v-loading="detailsLoading">
        <!-- Order Info -->
        <el-descriptions :column="2" border class="order-info">
          <el-descriptions-item label="Order #">
            {{ selectedOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="getStatusType(selectedOrder.status)" :effect="getStatusEffect(selectedOrder.status)">
              {{ formatStatus(selectedOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="User ID">
            {{ selectedOrder.userId }}
          </el-descriptions-item>
          <el-descriptions-item label="Created">
            {{ formatDate(selectedOrder.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Subtotal">
            ${{ formatCurrency(selectedOrder.subtotal) }}
          </el-descriptions-item>
          <el-descriptions-item label="Tax">
            ${{ formatCurrency(selectedOrder.tax) }}
          </el-descriptions-item>
          <el-descriptions-item label="Total" :span="2">
            <strong style="font-size: 16px; color: #409EFF">
              ${{ formatCurrency(selectedOrder.total) }}
            </strong>
          </el-descriptions-item>
          <el-descriptions-item label="Shipping Address" :span="2">
            {{ selectedOrder.shippingAddress || 'N/A' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- Order Items -->
        <h4 style="margin: 20px 0 12px">Order Items</h4>
        <el-table :data="selectedOrder.items || []" stripe border size="small">
          <el-table-column prop="productName" label="Product" min-width="160" />
          <el-table-column prop="productModel" label="Model" width="120" />
          <el-table-column prop="quantity" label="Qty" width="70" />
          <el-table-column prop="price" label="Price" width="100">
            <template #default="{ row }">
              ${{ formatCurrency(row.price) }}
            </template>
          </el-table-column>
          <el-table-column label="Subtotal" width="100">
            <template #default="{ row }">
              ${{ formatCurrency(Number(row.price) * row.quantity) }}
            </template>
          </el-table-column>
        </el-table>

        <!-- Status Update -->
        <div v-if="allowedTransitions.length > 0" class="status-update-section">
          <h4>Update Status</h4>
          <el-row :gutter="12" align="middle">
            <el-col :span="10">
              <el-select v-model="newStatus" placeholder="Select new status" style="width: 100%">
                <el-option
                  v-for="status in allowedTransitions"
                  :key="status"
                  :label="formatStatus(status)"
                  :value="status"
                />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button
                type="primary"
                :loading="updating"
                :disabled="!newStatus"
                @click="updateOrderStatus"
              >
                Update Status
              </el-button>
            </el-col>
          </el-row>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Van, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface OrderItem {
  id: number
  productName: string
  productModel: string
  quantity: number
  price: string | number
}

interface Order {
  id: number
  orderNumber: string
  userId: number
  status: string
  subtotal: string | number
  tax: string | number
  total: string | number
  stripePaymentIntentId?: string
  shippingAddress?: string
  items?: OrderItem[]
  createdAt: string
  updatedAt: string
}

const validTransitions: Record<string, string[]> = {
  created: ['paid', 'cancelled'],
  paid: ['allocated', 'cancelled'],
  allocated: ['picking', 'cancelled'],
  picking: ['shipped', 'partial_shipped', 'cancelled'],
  shipped: ['delivered', 'partial_shipped'],
  delivered: ['completed'],
  partial_shipped: ['shipped', 'delivered', 'completed']
}

const orderStatuses = [
  { value: 'created', label: 'Created' },
  { value: 'paid', label: 'Paid' },
  { value: 'allocated', label: 'Allocated' },
  { value: 'picking', label: 'Picking' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'returned', label: 'Returned' },
  { value: 'partial_shipped', label: 'Partial Shipped' }
]

// State
const loading = ref(false)
const detailsLoading = ref(false)
const updating = ref(false)
const orders = ref<Order[]>([])
const selectedOrder = ref<Order | null>(null)
const statusFilter = ref('')
const detailsDialogVisible = ref(false)
const newStatus = ref('')

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const allowedTransitions = computed(() => {
  if (!selectedOrder.value) return []
  return validTransitions[selectedOrder.value.status] || []
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

function getStatusEffect(status: string): 'dark' | 'light' | 'plain' {
  if (['shipped', 'delivered', 'completed'].includes(status)) return 'dark'
  if (['cancelled', 'refunded', 'returned'].includes(status)) return 'dark'
  return 'plain'
}

function canShip(status: string): boolean {
  return status === 'picking'
}

function resetFilters() {
  statusFilter.value = ''
  pagination.page = 1
  fetchOrders()
}

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/admin/orders`, {
      headers: getAuthHeaders(),
      params: {
        status: statusFilter.value || undefined,
        page: pagination.page,
        limit: pagination.limit
      }
    })
    orders.value = data.orders || []
    pagination.total = data.pagination?.total || 0
  } catch (error: any) {
    ElMessage.error('Failed to load orders')
  } finally {
    loading.value = false
  }
}

async function viewOrderDetails(order: Order) {
  selectedOrder.value = order
  newStatus.value = ''
  detailsDialogVisible.value = true
  detailsLoading.value = true

  try {
    const { data } = await axios.get(`${API_BASE}/admin/orders/${order.id}`, {
      headers: getAuthHeaders()
    })
    selectedOrder.value = data
  } catch (error: any) {
    ElMessage.error('Failed to load order details')
  } finally {
    detailsLoading.value = false
  }
}

async function shipOrder(order: Order) {
  try {
    await ElMessageBox.confirm(
      `Ship order ${order.orderNumber}? This will update the status to "Shipped".`,
      'Ship Order',
      {
        confirmButtonText: 'Ship',
        cancelButtonText: 'Cancel',
        type: 'info'
      }
    )

    await axios.put(
      `${API_BASE}/admin/orders/${order.id}/status`,
      { status: 'shipped' },
      { headers: getAuthHeaders() }
    )
    ElMessage.success('Order marked as shipped')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      const message = error.response?.data?.error || 'Failed to ship order'
      ElMessage.error(message)
    }
  }
}

async function updateOrderStatus() {
  if (!selectedOrder.value || !newStatus.value) return

  updating.value = true
  try {
    const { data } = await axios.put(
      `${API_BASE}/admin/orders/${selectedOrder.value.id}/status`,
      { status: newStatus.value },
      { headers: getAuthHeaders() }
    )
    selectedOrder.value = { ...selectedOrder.value, status: data.status }
    newStatus.value = ''
    ElMessage.success('Order status updated')
    fetchOrders()
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to update status'
    ElMessage.error(message)
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-page {
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

.order-info {
  margin-bottom: 16px;
}

.status-update-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.status-update-section h4 {
  margin: 0 0 12px;
  color: #303133;
}
</style>
