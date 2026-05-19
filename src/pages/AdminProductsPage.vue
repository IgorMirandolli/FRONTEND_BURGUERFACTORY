<template>
  <q-page class="bf-admin-products-page">
    <div class="bf-admin-products-shell">
      <header class="bf-admin-head">
        <nav class="bf-admin-nav">
          <button type="button" class="bf-admin-nav-btn" @click="goOrdersAdmin">Pedidos</button>
          <button type="button" class="bf-admin-nav-btn is-active" @click="goProductsAdmin">Produtos</button>
        </nav>

        <h1>Produtos</h1>
        <p>Gerencie os produtos do seu cardapio.</p>
      </header>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
        {{ errorMessage }}
      </q-banner>
      <q-banner v-if="successMessage" class="bg-green-1 text-green-9 q-mb-md rounded-borders">
        {{ successMessage }}
      </q-banner>

      <section class="bf-summary-grid">
        <article v-for="card in summaryCards" :key="card.key" class="bf-summary-card">
          <div class="bf-summary-icon" :class="`is-${card.tone}`">
            <q-icon :name="card.icon" />
          </div>
          <div>
            <p>{{ card.label }}</p>
            <strong>{{ card.value }}</strong>
          </div>
        </article>
      </section>

      <div class="bf-admin-main-grid">
        <section class="bf-admin-list-card">
          <div class="bf-tab-strip">
            <button
              v-for="tab in quickTabs"
              :key="tab.value"
              type="button"
              class="bf-tab-item"
              :class="{ 'is-active': activeQuickTab === tab.value }"
              @click="applyQuickTab(tab.value)"
            >
              <span>{{ tab.label }}</span>
              <small>{{ tab.count }}</small>
            </button>
          </div>

          <div class="bf-filters">
            <q-input
              v-model="searchTerm"
              outlined
              dense
              clearable
              label="Buscar produto..."
              class="bf-filter-search"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-select
              v-model="categoryFilter"
              :options="categoryFilterOptions"
              emit-value
              map-options
              outlined
              dense
              label="Categoria"
              class="bf-filter-select"
            />

            <q-select
              v-model="statusFilter"
              :options="statusFilterOptions"
              emit-value
              map-options
              outlined
              dense
              label="Status"
              class="bf-filter-select"
            />

            <q-btn
              no-caps
              unelevated
              color="deep-orange-8"
              icon="add"
              label="Novo produto"
              class="bf-new-btn"
              @click="startCreateProduct"
            />
          </div>

          <div v-if="loadingProducts" class="row justify-center q-py-xl">
            <q-spinner color="deep-orange-8" size="36px" />
          </div>

          <div v-else-if="products.length === 0" class="bf-empty-list">
            Nenhum produto encontrado com esses filtros.
          </div>

          <template v-else-if="!isMobile">
            <div class="bf-table-wrap">
              <table class="bf-products-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preco</th>
                    <th>Status</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in products" :key="product.id">
                    <td>
                      <div class="bf-product-cell">
                        <q-avatar rounded size="44px" class="bf-product-thumb">
                          <img
                            v-if="product.imageUrl"
                            :src="resolveImageUrl(product.imageUrl)"
                            :alt="product.name"
                          />
                          <q-icon v-else name="fastfood" size="22px" />
                        </q-avatar>

                        <div>
                          <strong>{{ product.name }}</strong>
                          <small>{{ product.description || 'Sem descricao cadastrada.' }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="bf-category-chip">{{ product.category_name }}</span>
                    </td>
                    <td>
                      <strong>R$ {{ formatPrice(product.price) }}</strong>
                    </td>
                    <td>
                      <div class="bf-status-cell">
                        <span
                          class="bf-status-pill"
                          :class="product.is_available ? 'is-active' : 'is-inactive'"
                        >
                          {{ product.is_available ? 'Ativo' : 'Inativo' }}
                        </span>
                        <q-toggle
                          :model-value="product.is_available"
                          color="deep-orange-8"
                          :disable="isToggleLoading(product.id)"
                          @update:model-value="(value) => updateProductAvailability(product, value)"
                        />
                      </div>
                    </td>
                    <td>
                      <q-btn
                        flat
                        dense
                        round
                        color="grey-8"
                        icon="edit"
                        @click="startEditProduct(product)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <footer class="bf-table-footer">
              <p>Mostrando {{ showingRangeText }} de {{ totalProducts }} produtos</p>
              <div class="bf-table-footer-actions">
                <q-pagination
                  v-model="currentPage"
                  :max="totalPages"
                  :max-pages="6"
                  direction-links
                  boundary-links
                  color="deep-orange-8"
                  active-color="deep-orange-8"
                  active-design="unelevated"
                  unelevated
                  @update:model-value="loadProducts"
                />

                <q-select
                  v-model="pageSize"
                  :options="pageSizeOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="bf-page-size"
                  @update:model-value="handlePageSizeChange"
                />
              </div>
            </footer>
          </template>

          <template v-else>
            <div class="bf-mobile-product-list">
              <article v-for="product in products" :key="product.id" class="bf-mobile-product-card">
                <div class="bf-mobile-product-head">
                  <div class="bf-mobile-product-main">
                    <q-avatar rounded size="52px" class="bf-product-thumb">
                      <img
                        v-if="product.imageUrl"
                        :src="resolveImageUrl(product.imageUrl)"
                        :alt="product.name"
                      />
                      <q-icon v-else name="fastfood" size="22px" />
                    </q-avatar>

                    <div>
                      <strong>{{ product.name }}</strong>
                      <small>{{ product.description || 'Sem descricao cadastrada.' }}</small>
                    </div>
                  </div>

                  <q-btn
                    flat
                    dense
                    round
                    color="grey-8"
                    icon="edit"
                    @click="startEditProduct(product)"
                  />
                </div>

                <div class="bf-mobile-product-grid">
                  <span class="bf-category-chip">{{ product.category_name }}</span>
                  <strong class="bf-mobile-product-price">R$ {{ formatPrice(product.price) }}</strong>
                </div>

                <div class="bf-mobile-product-status">
                  <span
                    class="bf-status-pill"
                    :class="product.is_available ? 'is-active' : 'is-inactive'"
                  >
                    {{ product.is_available ? 'Ativo' : 'Inativo' }}
                  </span>
                  <q-toggle
                    :model-value="product.is_available"
                    color="deep-orange-8"
                    :disable="isToggleLoading(product.id)"
                    @update:model-value="(value) => updateProductAvailability(product, value)"
                  />
                </div>
              </article>
            </div>

            <footer class="bf-table-footer">
              <p>Mostrando {{ showingRangeText }} de {{ totalProducts }} produtos</p>
              <div class="bf-table-footer-actions">
                <q-pagination
                  v-model="currentPage"
                  :max="totalPages"
                  :max-pages="6"
                  direction-links
                  boundary-links
                  color="deep-orange-8"
                  active-color="deep-orange-8"
                  active-design="unelevated"
                  unelevated
                  @update:model-value="loadProducts"
                />

                <q-select
                  v-model="pageSize"
                  :options="pageSizeOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="bf-page-size"
                  @update:model-value="handlePageSizeChange"
                />
              </div>
            </footer>
          </template>
        </section>

        <aside class="bf-admin-form-card">
          <header class="bf-form-head">
            <h2>{{ formMode === 'edit' ? 'Editar produto' : 'Novo produto' }}</h2>
            <p>{{ formMode === 'edit' ? 'Atualize as informacoes do produto.' : 'Preencha os dados do produto.' }}</p>
          </header>

          <q-form class="bf-form-body bf-form-frame" @submit.prevent="saveProduct">
            <div class="bf-form-section-label">Dados principais</div>

            <div class="bf-field-wrap">
              <label>Nome do produto *</label>
              <q-input v-model="productForm.name" outlined dense placeholder="Ex.: Smash Bacon" maxlength="150" />
            </div>

            <div class="bf-field-wrap">
              <label>Categoria *</label>
              <q-select
                v-model="productForm.category_id"
                :options="categorySelectOptions"
                emit-value
                map-options
                outlined
                dense
                placeholder="Selecione a categoria"
              />
            </div>

            <div class="bf-field-wrap">
              <label>Descricao</label>
              <q-input
                v-model="productForm.description"
                type="textarea"
                autogrow
                outlined
                dense
                maxlength="1800"
                counter
                placeholder="Descreva o produto..."
              />
            </div>

            <div class="bf-field-wrap">
              <label>Preco (R$) *</label>
              <q-input
                :model-value="productForm.price"
                outlined
                dense
                type="text"
                inputmode="numeric"
                maxlength="12"
                placeholder="Ex.: 29,90"
                @update:model-value="handlePriceInput"
                @keydown="blockInvalidPriceKey"
                @paste="handlePricePaste"
                @blur="handlePriceBlur"
              />
            </div>

            <div class="bf-field-wrap">
              <label>Imagem do produto</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="bf-file-input"
                @change="handleProductImageFileChange"
              />
              <small class="bf-file-help">PNG, JPG ou WEBP ate 5MB.</small>
              <small v-if="selectedImageFileName" class="bf-file-name">
                Arquivo: {{ selectedImageFileName }}
              </small>
              <div v-if="productImagePreviewUrl" class="bf-image-preview-wrap">
                <img :src="productImagePreviewUrl" alt="Preview do produto" class="bf-image-preview" />
              </div>
            </div>

            <div class="bf-form-section-label">Configuracoes</div>

            <div class="bf-form-inline">
              <div class="bf-field-wrap">
                <label>Status</label>
                <q-select
                  v-model="productForm.is_available"
                  :options="availabilityOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                />
              </div>

              <div class="bf-field-wrap">
                <label>Ordem</label>
                <q-input
                  v-model="productForm.display_order"
                  outlined
                  dense
                  type="number"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div class="bf-form-actions">
              <q-btn flat no-caps label="Cancelar" color="grey-8" @click="resetForm" />
              <q-btn
                type="submit"
                no-caps
                unelevated
                color="deep-orange-8"
                :loading="savingProduct"
                :label="formMode === 'edit' ? 'Salvar alteracoes' : 'Salvar produto'"
              />
            </div>
          </q-form>

          <footer class="bf-form-tip">
            <q-icon name="tips_and_updates" />
            <span>Dica: mantenha os produtos ativos e com imagem para melhorar as vendas.</span>
          </footer>
        </aside>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const REFRESH_INTERVAL_MS = 8000
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024

const $q = useQuasar()
const router = useRouter()
const isMobile = computed(() => $q.screen.lt.md)

const loadingProducts = ref(false)
const loadingCategories = ref(false)
const savingProduct = ref(false)
const requestInFlight = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const products = ref([])
const categories = ref([])
const totalProducts = ref(0)
const productsSummary = ref({
  total_products: 0,
  active_products: 0,
  inactive_products: 0,
})
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(10)

const searchTerm = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')
const activeQuickTab = ref('all')

const formMode = ref('create')
const editingProductId = ref(null)
const toggleLoadingByProductId = ref({})
const selectedImageFileName = ref('')
let searchDebounceId = null
let refreshTimerId = null

const productForm = ref(createEmptyForm())

function createEmptyForm() {
  return {
    name: '',
    category_id: null,
    description: '',
    price: '',
    image_url: '',
    image_data: '',
    image_preview: '',
    is_available: true,
    display_order: 0,
  }
}

const pageSizeOptions = [
  { label: '10 por pagina', value: 10 },
  { label: '20 por pagina', value: 20 },
  { label: '50 por pagina', value: 50 },
]

const statusFilterOptions = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
]

const availabilityOptions = [
  { label: 'Ativo', value: true },
  { label: 'Inativo', value: false },
]

const categoryFilterOptions = computed(() => [
  { label: 'Todas as categorias', value: 'all' },
  ...categories.value.map((category) => ({
    label: category.name,
    value: Number(category.id),
  })),
])

const categorySelectOptions = computed(() =>
  categories.value
    .filter((category) => category.is_active)
    .map((category) => ({
      label: category.name,
      value: Number(category.id),
    }))
)

const summaryCards = computed(() => [
  {
    key: 'total',
    label: 'Total de produtos',
    value: Number(productsSummary.value.total_products || 0),
    icon: 'inventory_2',
    tone: 'total',
  },
  {
    key: 'active',
    label: 'Ativos',
    value: Number(productsSummary.value.active_products || 0),
    icon: 'check_circle',
    tone: 'active',
  },
  {
    key: 'inactive',
    label: 'Inativos',
    value: Number(productsSummary.value.inactive_products || 0),
    icon: 'pause_circle',
    tone: 'inactive',
  },
])

const quickTabs = computed(() => {
  const tabs = [
    {
      label: 'Todos',
      value: 'all',
      count: Number(productsSummary.value.total_products || 0),
    },
  ]

  for (const category of categories.value) {
    tabs.push({
      label: category.name,
      value: `category:${category.id}`,
      count: Number(category.products_count || 0),
    })
  }

  tabs.push({
    label: 'Inativos',
    value: 'inactive',
    count: Number(productsSummary.value.inactive_products || 0),
  })

  return tabs
})

const showingRangeText = computed(() => {
  if (totalProducts.value === 0) return '0 a 0'
  const from = (currentPage.value - 1) * pageSize.value + 1
  const to = Math.min(currentPage.value * pageSize.value, totalProducts.value)
  return `${from} a ${to}`
})

const productImagePreviewUrl = computed(() => {
  const localPreview = String(productForm.value.image_preview || '').trim()
  if (localPreview) return localPreview

  const persistedImage = String(productForm.value.image_url || '').trim()
  if (!persistedImage) return ''
  return resolveImageUrl(persistedImage)
})

watch(
  () => [categoryFilter.value, statusFilter.value],
  () => {
    currentPage.value = 1
    loadProducts()
  }
)

watch(
  () => searchTerm.value,
  () => {
    if (searchDebounceId) {
      clearTimeout(searchDebounceId)
      searchDebounceId = null
    }

    searchDebounceId = setTimeout(() => {
      currentPage.value = 1
      loadProducts()
    }, 280)
  }
)

function getSession() {
  return JSON.parse(localStorage.getItem('bf_session') || '{}')
}

function getAuthHeaders() {
  const session = getSession()
  const token = session.token || null
  const isAuth = session.mode === 'auth' && Boolean(token)
  const isAdmin = String(session?.user?.role || '').toLowerCase() === 'admin'

  if (!isAuth || !isAdmin) return null
  return { Authorization: `Bearer ${token}` }
}

function goOrdersAdmin() {
  router.push('/admin/pedidos')
}

function goProductsAdmin() {
  router.push('/admin/produtos')
}

function applyQuickTab(tabValue) {
  activeQuickTab.value = tabValue

  if (tabValue === 'all') {
    categoryFilter.value = 'all'
    statusFilter.value = 'all'
    return
  }

  if (tabValue === 'inactive') {
    categoryFilter.value = 'all'
    statusFilter.value = 'inactive'
    return
  }

  if (tabValue.startsWith('category:')) {
    const categoryId = Number(tabValue.replace('category:', ''))
    categoryFilter.value = Number.isInteger(categoryId) && categoryId > 0 ? categoryId : 'all'
    statusFilter.value = 'all'
  }
}

function resolveImageUrl(rawUrl) {
  const value = String(rawUrl || '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const normalized = value.startsWith('/') ? value : `/${value}`
  if (normalized.startsWith('/uploads/') || normalized.startsWith('/menu/')) {
    return `${API_BASE_URL}${normalized}`
  }
  return normalized
}

function handleProductImageFileChange(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  const mimeType = String(file.type || '').toLowerCase()
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(mimeType)) {
    errorMessage.value = 'Formato invalido. Use JPG, PNG ou WEBP.'
    event.target.value = ''
    return
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    errorMessage.value = 'Imagem muito grande. O limite e 5MB.'
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = typeof reader.result === 'string' ? reader.result : ''
    if (!dataUrl) {
      errorMessage.value = 'Nao foi possivel ler a imagem selecionada.'
      return
    }

    selectedImageFileName.value = file.name
    productForm.value = {
      ...productForm.value,
      image_data: dataUrl,
      image_preview: dataUrl,
      image_url: '',
    }
    errorMessage.value = ''
  }
  reader.onerror = () => {
    errorMessage.value = 'Nao foi possivel ler a imagem selecionada.'
  }
  reader.readAsDataURL(file)
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

const MAX_PRICE_DIGITS = 9

function formatCurrencyFromDigits(rawDigits) {
  const digitsOnly = String(rawDigits || '')
    .replace(/\D/g, '')
    .slice(0, MAX_PRICE_DIGITS)

  if (!digitsOnly) return ''

  const normalizedDigits = digitsOnly.replace(/^0+(?=\d)/, '')
  const safeDigits = normalizedDigits || '0'

  if (safeDigits.length === 1) return `0,0${safeDigits}`
  if (safeDigits.length === 2) return `0,${safeDigits}`

  const integerPart = safeDigits.slice(0, -2)
  const decimalPart = safeDigits.slice(-2)
  return `${integerPart},${decimalPart}`
}

function setFormattedPriceFromDigits(rawDigits) {
  productForm.value = {
    ...productForm.value,
    price: formatCurrencyFromDigits(rawDigits),
  }
}

function blockInvalidPriceKey(event) {
  const key = String(event?.key || '')
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab']
  if (allowedKeys.includes(key)) return
  if (event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(key)) {
    event.preventDefault()
  }
}

function handlePricePaste(event) {
  const pastedText = event?.clipboardData?.getData('text') || ''
  const digitsOnly = String(pastedText).replace(/\D/g, '')
  event.preventDefault()
  setFormattedPriceFromDigits(digitsOnly)
}

function handlePriceInput(value) {
  const digitsOnly = String(value || '').replace(/\D/g, '')
  setFormattedPriceFromDigits(digitsOnly)
}

function handlePriceBlur() {
  const digitsOnly = String(productForm.value.price || '').replace(/\D/g, '')
  setFormattedPriceFromDigits(digitsOnly)
}

function isToggleLoading(productId) {
  return Boolean(toggleLoadingByProductId.value[String(productId)])
}

function setToggleLoading(productId, loading) {
  const key = String(productId)
  toggleLoadingByProductId.value = {
    ...toggleLoadingByProductId.value,
    [key]: loading,
  }
}

async function loadCategories() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  loadingCategories.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/categories`, { headers })
    const data = await response.json()

    if (response.status === 401) {
      localStorage.removeItem('bf_session')
      router.push('/login')
      return
    }

    if (response.status === 403) {
      router.push('/lanches')
      return
    }

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel carregar categorias.'
      return
    }

    categories.value = data.items || []
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar categorias.'
  } finally {
    loadingCategories.value = false
  }
}

async function loadProducts(options = {}) {
  const { silent = false } = options
  if (requestInFlight.value) return

  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  requestInFlight.value = true
  errorMessage.value = ''

  if (!silent) {
    loadingProducts.value = true
  }

  try {
    const params = new URLSearchParams()
    params.set('page', String(currentPage.value))
    params.set('page_size', String(pageSize.value))
    params.set('status', statusFilter.value)

    const search = String(searchTerm.value || '').trim()
    if (search) params.set('q', search)
    if (categoryFilter.value !== 'all') params.set('category_id', String(categoryFilter.value))

    const response = await fetch(`${API_BASE_URL}/api/admin/products?${params.toString()}`, { headers })
    const data = await response.json()

    if (response.status === 401) {
      localStorage.removeItem('bf_session')
      router.push('/login')
      return
    }

    if (response.status === 403) {
      router.push('/lanches')
      return
    }

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel carregar produtos.'
      return
    }

    products.value = data.items || []
    productsSummary.value = {
      total_products: Number(data?.summary?.total_products || 0),
      active_products: Number(data?.summary?.active_products || 0),
      inactive_products: Number(data?.summary?.inactive_products || 0),
    }
    const pagination = data.pagination || {}
    totalProducts.value = Number(pagination.total || 0)
    totalPages.value = Math.max(1, Number(pagination.total_pages || 1))

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar produtos.'
  } finally {
    requestInFlight.value = false
    if (!silent) {
      loadingProducts.value = false
    }
  }
}

function startCreateProduct() {
  formMode.value = 'create'
  editingProductId.value = null
  productForm.value = createEmptyForm()
  selectedImageFileName.value = ''
  successMessage.value = ''
  errorMessage.value = ''
}

function startEditProduct(product) {
  formMode.value = 'edit'
  editingProductId.value = Number(product.id)
  productForm.value = {
    name: product.name || '',
    category_id: Number(product.category_id),
    description: product.description || '',
    price: formatPrice(product.price),
    image_url: product.image_url || '',
    image_data: '',
    image_preview: '',
    is_available: Boolean(product.is_available),
    display_order: Number(product.display_order || 0),
  }
  selectedImageFileName.value = ''
  successMessage.value = ''
  errorMessage.value = ''
}

function resetForm() {
  startCreateProduct()
}

function normalizePriceForPayload(value) {
  const parsed = Number(String(value || '').replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Number(parsed.toFixed(2))
}

function buildProductPayload() {
  return {
    name: String(productForm.value.name || '').trim(),
    category_id: Number(productForm.value.category_id || 0),
    description: String(productForm.value.description || '').trim(),
    price: normalizePriceForPayload(productForm.value.price),
    image_url: String(productForm.value.image_url || '').trim(),
    image_data: String(productForm.value.image_data || '').trim(),
    is_available: Boolean(productForm.value.is_available),
    is_featured: false,
    display_order: Number.isInteger(Number(productForm.value.display_order))
      ? Number(productForm.value.display_order)
      : 0,
  }
}

async function saveProduct() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  const payload = buildProductPayload()

  if (!payload.name || payload.name.length < 2) {
    errorMessage.value = 'Informe um nome valido para o produto.'
    return
  }

  if (!payload.category_id) {
    errorMessage.value = 'Selecione uma categoria.'
    return
  }

  if (payload.price === null) {
    errorMessage.value = 'Informe um preco valido.'
    return
  }

  savingProduct.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const isEdit = formMode.value === 'edit' && editingProductId.value
    const url = isEdit
      ? `${API_BASE_URL}/api/admin/products/${editingProductId.value}`
      : `${API_BASE_URL}/api/admin/products`

    const response = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await response.json()

    if (response.status === 401) {
      localStorage.removeItem('bf_session')
      router.push('/login')
      return
    }

    if (response.status === 403) {
      router.push('/lanches')
      return
    }

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel salvar produto.'
      return
    }

    successMessage.value = data.message || 'Produto salvo com sucesso.'
    if (isEdit && data?.product) {
      startEditProduct(data.product)
    } else if (!isEdit) {
      startCreateProduct()
    }

    await Promise.all([loadProducts(), loadCategories()])
  } catch {
    errorMessage.value = 'Erro de conexao ao salvar produto.'
  } finally {
    savingProduct.value = false
  }
}

async function updateProductAvailability(product, nextValue) {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  setToggleLoading(product.id, true)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/products/${product.id}/status`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_available: Boolean(nextValue) }),
    })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel atualizar status do produto.'
      return
    }

    successMessage.value = data.message || 'Status atualizado.'
    await Promise.all([loadProducts({ silent: true }), loadCategories()])
  } catch {
    errorMessage.value = 'Erro de conexao ao atualizar status do produto.'
  } finally {
    setToggleLoading(product.id, false)
  }
}

function handlePageSizeChange() {
  currentPage.value = 1
  loadProducts()
}

function startAutoRefresh() {
  refreshTimerId = window.setInterval(() => {
    loadProducts({ silent: true })
  }, REFRESH_INTERVAL_MS)
}

function stopAutoRefresh() {
  if (refreshTimerId) {
    window.clearInterval(refreshTimerId)
    refreshTimerId = null
  }
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts()])
  startAutoRefresh()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
  if (searchDebounceId) {
    clearTimeout(searchDebounceId)
    searchDebounceId = null
  }
})
</script>

<style scoped>
.bf-admin-products-page {
  background:
    radial-gradient(circle at 12% 8%, rgba(255, 255, 255, 0.84) 0%, rgba(244, 241, 236, 0.94) 35%),
    #f2eeea;
  min-height: 100vh;
  padding: 22px 0 34px;
}

.bf-admin-products-shell {
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 16px;
}

.bf-admin-head {
  margin-bottom: 12px;
}

.bf-summary-grid {
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.bf-summary-card {
  background: #fff;
  border: 1px solid #eadfce;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 11px;
  align-items: center;
}

.bf-summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.bf-summary-icon.is-total {
  background: #fff0e4;
  color: #ea6f15;
}

.bf-summary-icon.is-active {
  background: #e4f8ea;
  color: #1e8a39;
}

.bf-summary-icon.is-inactive {
  background: #ffe8e9;
  color: #c84f53;
}

.bf-summary-card p {
  margin: 0;
  color: #796d62;
  font-size: 0.82rem;
}

.bf-summary-card strong {
  display: block;
  margin-top: 2px;
  color: #322821;
  font-size: 1.35rem;
  line-height: 1;
}

.bf-admin-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.bf-admin-nav-btn {
  border: 1px solid #e4d7c9;
  background: #fff;
  color: #433930;
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
}

.bf-admin-nav-btn.is-active {
  border-color: #e26d1d;
  color: #e26d1d;
}

.bf-admin-head h1 {
  margin: 0;
  color: #25201c;
  font-size: 2.15rem;
  line-height: 1.1;
  font-weight: 700;
}

.bf-admin-head p {
  margin: 6px 0 0;
  color: #706860;
  font-size: 1rem;
}

.bf-admin-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 352px;
  gap: 14px;
  align-items: start;
}

.bf-admin-list-card {
  background: #fff;
  border: 1px solid #e7ddd1;
  border-radius: 12px;
  padding: 14px;
}

.bf-tab-strip {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.bf-tab-item {
  border: 1px solid #eadfce;
  background: #fffdfb;
  border-radius: 10px;
  min-width: 92px;
  min-height: 56px;
  padding: 8px 10px;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  cursor: pointer;
}

.bf-tab-item span {
  color: #5a4e44;
  font-size: 0.84rem;
  font-weight: 700;
}

.bf-tab-item small {
  color: #8c7f72;
  font-size: 0.78rem;
  line-height: 1;
}

.bf-tab-item.is-active {
  border-color: #eb7a22;
  background: #fff4eb;
}

.bf-tab-item.is-active span,
.bf-tab-item.is-active small {
  color: #df6e19;
}

.bf-filters {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 196px 176px 170px;
  gap: 10px;
}

.bf-filter-search {
  min-width: 220px;
}

.bf-filter-select {
  min-width: 140px;
}

.bf-new-btn {
  width: 100%;
  min-height: 40px;
  border-radius: 10px;
  padding-inline: 12px;
}

.bf-new-btn :deep(.q-btn__content) {
  display: inline-flex;
  flex-direction: row !important;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  gap: 6px;
  font-weight: 700;
}

.bf-new-btn :deep(.q-btn__label) {
  white-space: nowrap;
  line-height: 1;
}

.bf-empty-list {
  color: #7b7168;
  padding: 24px 6px;
  font-size: 0.95rem;
}

.bf-mobile-product-list {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.bf-mobile-product-card {
  border: 1px solid #ebdfd1;
  border-radius: 12px;
  background: #fffefc;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.bf-mobile-product-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.bf-mobile-product-main {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 8px;
  min-width: 0;
}

.bf-mobile-product-main strong {
  display: block;
  color: #322921;
  font-size: 0.92rem;
  line-height: 1.2;
}

.bf-mobile-product-main small {
  display: block;
  margin-top: 2px;
  color: #8a7e72;
  font-size: 0.78rem;
  line-height: 1.3;
}

.bf-mobile-product-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bf-mobile-product-price {
  color: #2d2621;
  font-size: 0.96rem;
}

.bf-mobile-product-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bf-table-wrap {
  margin-top: 10px;
  overflow-x: auto;
}

.bf-products-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 880px;
}

.bf-products-table th {
  text-align: left;
  font-size: 0.84rem;
  color: #64594f;
  font-weight: 700;
  padding: 12px 10px;
  border-bottom: 1px solid #ece5db;
  background: #faf7f2;
}

.bf-products-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #f1ece4;
  vertical-align: top;
}

.bf-products-table tr:last-child td {
  border-bottom: 0;
}

.bf-product-cell {
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: start;
  gap: 8px;
}

.bf-product-thumb {
  background: #f8f1e8;
  color: #a58b72;
}

.bf-product-cell strong {
  display: block;
  color: #322921;
  font-size: 0.95rem;
  line-height: 1.2;
}

.bf-product-cell small {
  display: block;
  margin-top: 2px;
  color: #8a7e72;
  font-size: 0.8rem;
  line-height: 1.3;
}

.bf-category-chip {
  border: 1px solid #eadbcc;
  color: #574c43;
  border-radius: 999px;
  font-size: 0.8rem;
  padding: 4px 10px;
  background: #fffaf4;
}

.bf-status-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.bf-status-pill {
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 9px;
}

.bf-status-pill.is-active {
  background: #e3f6e6;
  color: #1f7e30;
}

.bf-status-pill.is-inactive {
  background: #ffe2e3;
  color: #c7464a;
}

.bf-table-footer {
  border-top: 1px solid #ece5db;
  margin-top: 10px;
  padding: 10px 2px 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.bf-table-footer p {
  margin: 0;
  color: #7f7266;
  font-size: 0.86rem;
}

.bf-table-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bf-page-size {
  min-width: 118px;
}

.bf-admin-form-card {
  background: linear-gradient(180deg, #fffdfb 0%, #fff 100%);
  border: 1px solid #e2d6c8;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(62, 43, 29, 0.08);
  position: sticky;
  top: 88px;
}

.bf-form-head {
  border-bottom: 1px solid #efe4d6;
  padding-bottom: 10px;
}

.bf-form-head h2 {
  margin: 0;
  color: #322821;
  font-size: 1.25rem;
}

.bf-form-head p {
  margin: 4px 0 0;
  color: #84786d;
  font-size: 0.9rem;
}

.bf-form-body {
  margin-top: 12px;
  display: grid;
  gap: 9px;
}

.bf-form-frame {
  border: 1px solid #efdfce;
  border-radius: 12px;
  background: #fffaf5;
  padding: 12px;
}

.bf-form-section-label {
  color: #876f59;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.bf-field-wrap {
  margin-bottom: 0;
  border: 1px solid #ecdece;
  border-radius: 10px;
  background: #fff;
  padding: 8px;
}

.bf-field-wrap label {
  display: inline-block;
  margin-bottom: 4px;
  color: #40362f;
  font-size: 0.86rem;
  font-weight: 700;
}

.bf-field-wrap :deep(.q-field__control) {
  border-radius: 8px;
}

.bf-file-input {
  width: 100%;
  border: 1px dashed #e7d3bf;
  border-radius: 8px;
  padding: 8px;
  background: #fffaf4;
  color: #4a3c31;
}

.bf-file-help {
  display: block;
  margin-top: 5px;
  color: #8b7a6a;
  font-size: 0.76rem;
}

.bf-file-name {
  display: block;
  margin-top: 4px;
  color: #5f4e40;
  font-size: 0.78rem;
  font-weight: 600;
}

.bf-image-preview-wrap {
  margin: 8px 0;
  border: 1px solid #ebdccd;
  border-radius: 10px;
  background: #fff;
  padding: 8px;
}

.bf-image-preview {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

.bf-form-inline {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 9px;
}

.bf-form-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.bf-form-tip {
  margin-top: 12px;
  border-top: 1px solid #f0e7dc;
  padding-top: 10px;
  color: #8b7e71;
  font-size: 0.84rem;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

@media (max-width: 1280px) {
  .bf-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bf-admin-main-grid {
    grid-template-columns: 1fr;
  }

  .bf-admin-form-card {
    position: static;
  }
}

@media (max-width: 900px) {
  .bf-filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .bf-summary-grid {
    grid-template-columns: 1fr;
  }

  .bf-filters {
    grid-template-columns: 1fr;
  }

  .bf-form-inline {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .bf-admin-products-page {
    padding-top: 14px;
  }

  .bf-admin-products-shell {
    padding: 0 10px;
  }

  .bf-admin-head h1 {
    font-size: 1.6rem;
  }

  .bf-admin-head p {
    font-size: 0.9rem;
  }

  .bf-admin-nav {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .bf-admin-nav-btn {
    width: 100%;
    text-align: center;
    padding: 8px 10px;
  }

  .bf-summary-card strong {
    font-size: 1.2rem;
  }

  .bf-tab-strip {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 3px;
  }

  .bf-tab-item {
    min-width: 82px;
    min-height: 48px;
    flex: 0 0 auto;
  }

  .bf-tab-item span {
    font-size: 0.78rem;
  }

  .bf-tab-item small {
    font-size: 0.72rem;
  }

  .bf-filters {
    margin-top: 10px;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .bf-filter-search,
  .bf-filter-select {
    min-width: 0;
  }

  .bf-admin-list-card {
    padding: 10px;
  }

  .bf-table-footer p {
    width: 100%;
    font-size: 0.8rem;
  }

  .bf-table-footer-actions {
    width: 100%;
    justify-content: space-between;
  }

  .bf-page-size {
    min-width: 104px;
  }

  .bf-admin-form-card {
    padding: 12px;
  }

  .bf-mobile-product-grid {
    flex-direction: column;
    align-items: flex-start;
  }

  .bf-mobile-product-status {
    border-top: 1px solid #f0e7dc;
    padding-top: 7px;
  }
}
</style>
