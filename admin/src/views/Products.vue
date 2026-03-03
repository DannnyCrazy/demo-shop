<template>
  <div class="products-page">
    <!-- Header -->
    <div class="page-header">
      <h2>Product Management</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Add Product
      </el-button>
    </div>

    <!-- Search & Filters -->
    <el-card shadow="hover" class="filter-card">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Search by name or model..."
            prefix-icon="Search"
            clearable
            @clear="fetchProducts"
            @keyup.enter="fetchProducts"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" :icon="Search" @click="fetchProducts">
            Search
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Products Table -->
    <el-card shadow="hover" class="table-card">
      <el-table
        :data="products"
        v-loading="loading"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="70" sortable />
        <el-table-column prop="imageUrl" label="Image" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              style="width: 40px; height: 40px;"
              fit="cover"
            />
            <el-icon v-else :size="24" color="#c0c4cc"><Picture /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="Name" min-width="180" sortable show-overflow-tooltip />
        <el-table-column prop="model" label="Model" width="140" show-overflow-tooltip />
        <el-table-column prop="price" label="Price" width="120" sortable>
          <template #default="{ row }">
            ${{ formatCurrency(row.price) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="Stock" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="row.stock > 10 ? 'success' : row.stock > 0 ? 'warning' : 'danger'" effect="plain">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Created" width="140">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text :icon="Edit" @click="openEditDialog(row)">
              Edit
            </el-button>
            <el-button type="danger" text :icon="Delete" @click="confirmDelete(row)">
              Delete
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
          @size-change="fetchProducts"
          @current-change="fetchProducts"
        />
      </div>
    </el-card>

    <!-- Add/Edit Product Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? 'Edit Product' : 'Add Product'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="productForm"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Name" prop="name">
              <el-input v-model="productForm.name" placeholder="Product name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Model" prop="model">
              <el-input v-model="productForm.model" placeholder="Model number" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Description" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="Product description"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Price" prop="price">
              <el-input v-model="productForm.price" type="number" placeholder="0.00">
                <template #prepend>$</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Stock" prop="stock">
              <el-input v-model.number="productForm.stock" type="number" placeholder="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Category ID" prop="categoryId">
              <el-input v-model.number="productForm.categoryId" type="number" placeholder="Optional" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Image URL" prop="imageUrl">
          <el-input v-model="productForm.imageUrl" placeholder="https://..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="saveProduct">
          {{ isEditing ? 'Update' : 'Create' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Search, Edit, Delete, Picture } from '@element-plus/icons-vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Product {
  id: number
  name: string
  model: string
  description?: string
  price: string | number
  categoryId?: number
  stock: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

// State
const loading = ref(false)
const saving = ref(false)
const products = ref<Product[]>([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const productForm = reactive({
  name: '',
  model: '',
  description: '',
  price: '',
  stock: 0,
  categoryId: undefined as number | undefined,
  imageUrl: ''
})

const formRules: FormRules = {
  name: [{ required: true, message: 'Product name is required', trigger: 'blur' }],
  model: [{ required: true, message: 'Model number is required', trigger: 'blur' }],
  price: [{ required: true, message: 'Price is required', trigger: 'blur' }]
}

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
    day: 'numeric'
  })
}

function handleSortChange() {
  // Client-side sorting handled by el-table
}

async function fetchProducts() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/products`, {
      headers: getAuthHeaders(),
      params: {
        search: searchQuery.value || undefined,
        page: pagination.page,
        limit: pagination.limit
      }
    })
    products.value = data.products || []
    pagination.total = data.pagination?.total || 0
  } catch (error: any) {
    ElMessage.error('Failed to load products')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  productForm.name = ''
  productForm.model = ''
  productForm.description = ''
  productForm.price = ''
  productForm.stock = 0
  productForm.categoryId = undefined
  productForm.imageUrl = ''
  formRef.value?.clearValidate()
}

function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(product: Product) {
  isEditing.value = true
  editingId.value = product.id
  productForm.name = product.name
  productForm.model = product.model
  productForm.description = product.description || ''
  productForm.price = String(product.price)
  productForm.stock = product.stock
  productForm.categoryId = product.categoryId
  productForm.imageUrl = product.imageUrl || ''
  dialogVisible.value = true
}

async function saveProduct() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const payload = {
        name: productForm.name,
        model: productForm.model,
        description: productForm.description || undefined,
        price: Number(productForm.price),
        stock: productForm.stock,
        categoryId: productForm.categoryId || undefined,
        imageUrl: productForm.imageUrl || undefined
      }

      if (isEditing.value && editingId.value) {
        await axios.put(`${API_BASE}/products/${editingId.value}`, payload, {
          headers: getAuthHeaders()
        })
        ElMessage.success('Product updated successfully')
      } else {
        await axios.post(`${API_BASE}/products`, payload, {
          headers: getAuthHeaders()
        })
        ElMessage.success('Product created successfully')
      }

      dialogVisible.value = false
      fetchProducts()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save product'
      ElMessage.error(message)
    } finally {
      saving.value = false
    }
  })
}

async function confirmDelete(product: Product) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      'Delete Product',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    await axios.delete(`${API_BASE}/products/${product.id}`, {
      headers: getAuthHeaders()
    })
    ElMessage.success('Product deleted successfully')
    fetchProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      const message = error.response?.data?.error || 'Failed to delete product'
      ElMessage.error(message)
    }
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.products-page {
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
</style>
