<template>
  <q-page class="bf-admin-page">
    <div class="bf-admin-shell">
      <header class="bf-admin-head">
        <nav class="bf-admin-nav">
          <button type="button" class="bf-admin-nav-btn is-active" @click="goOrdersAdmin">Pedidos</button>
          <button type="button" class="bf-admin-nav-btn" @click="goProductsAdmin">Produtos</button>
          <button type="button" class="bf-admin-nav-btn" @click="goReportsAdmin">Relatorios</button>
        </nav>

        <h1>Pedidos</h1>
        <p>Gerencie os status e informacoes dos pedidos.</p>
      </header>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
        {{ errorMessage }}
      </q-banner>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9 q-mb-md rounded-borders">
        {{ successMessage }}
      </q-banner>

      <section class="bf-metric-grid">
        <article class="bf-metric-card">
          <span class="bf-metric-icon is-orange">
            <q-icon name="receipt_long" />
          </span>
          <div>
            <p>Total de pedidos</p>
            <strong>{{ orders.length }}</strong>
          </div>
        </article>

        <article class="bf-metric-card">
          <span class="bf-metric-icon is-yellow">
            <q-icon name="schedule" />
          </span>
          <div>
            <p>Pendentes</p>
            <strong>{{ statusCounters.pending }}</strong>
          </div>
        </article>

        <article class="bf-metric-card">
          <span class="bf-metric-icon is-blue">
            <q-icon name="local_dining" />
          </span>
          <div>
            <p>Em preparo</p>
            <strong>{{ statusCounters.preparing }}</strong>
          </div>
        </article>

        <article class="bf-metric-card">
          <span class="bf-metric-icon is-green">
            <q-icon name="delivery_dining" />
          </span>
          <div>
            <p>Em entrega</p>
            <strong>{{ statusCounters.on_the_way }}</strong>
          </div>
        </article>

        <article class="bf-metric-card">
          <span class="bf-metric-icon is-violet">
            <q-icon name="done_all" />
          </span>
          <div>
            <p>Entregues</p>
            <strong>{{ statusCounters.delivered }}</strong>
          </div>
        </article>
      </section>

      <section class="bf-toolbar">
        <div class="bf-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            type="button"
            class="bf-tab-btn"
            :class="{ 'is-active': activeStatusTab === tab.value }"
            @click="activeStatusTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="bf-toolbar-right">
          <div class="bf-date-box">
            <input v-model="dateFrom" type="date" class="bf-date-input" />
            <span>-</span>
            <input v-model="dateTo" type="date" class="bf-date-input" />
          </div>

          <q-btn
            flat
            no-caps
            icon="refresh"
            label="Atualizar"
            class="bf-refresh-btn"
            :loading="loading"
            @click="loadOrders()"
          />
        </div>
      </section>

      <section class="bf-table-card">
        <div v-if="loading" class="row justify-center q-py-xl">
          <q-spinner color="deep-orange-8" size="36px" />
        </div>

        <div v-else-if="filteredOrders.length === 0" class="bf-empty">
          Nenhum pedido encontrado para esse filtro.
        </div>

        <template v-else-if="!isMobile">
          <div class="bf-table-wrap">
            <table class="bf-orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in paginatedOrders" :key="order.id">
                  <td>
                    <strong>#{{ order.id }}</strong>
                    <button type="button" class="bf-link" @click="openOrderPreview(order)">
                      Ver detalhes
                    </button>
                  </td>
                  <td>
                    <strong>{{ order.customer_name || '-' }}</strong>
                    <small>{{ order.customer_phone || '-' }}</small>
                  </td>
                  <td>
                    <strong>{{ formatDate(order.created_at) }}</strong>
                    <small>{{ formatTime(order.created_at) }}</small>
                  </td>
                  <td>
                    <strong>R$ {{ formatPrice(order.total_amount) }}</strong>
                  </td>
                  <td>
                    <span class="bf-payment">{{ paymentLabel(order.payment_method) }}</span>
                  </td>
                  <td>
                    <span
                      class="bf-status-pill"
                      :class="`is-${getOrderStatus(order)}`"
                    >
                      {{ statusLabel(getOrderStatus(order)) }}
                    </span>
                  </td>
                  <td>
                    <q-btn-dropdown
                      flat
                      no-caps
                      color="grey-8"
                      class="bf-action-dropdown"
                      :label="updatingOrderId === order.id ? 'Atualizando...' : 'Alterar status'"
                      :disable="updatingOrderId === order.id"
                    >
                      <q-list>
                        <q-item
                          v-for="statusOption in statusUpdateOptions"
                          :key="`${order.id}-${statusOption.value}`"
                          clickable
                          v-close-popup
                          :disable="!canTransitionUi(getOrderStatus(order), statusOption.value)"
                          @click="updateOrderStatus(order.id, statusOption.value)"
                        >
                          <q-item-section avatar>
                            <span class="bf-status-dot" :class="`is-${statusOption.value}`"></span>
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>{{ statusOption.label }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="bf-table-footer">
            <p>
              Mostrando {{ showingStart }} a {{ showingEnd }} de {{ filteredOrders.length }} pedidos
            </p>

            <div class="bf-footer-right">
              <q-pagination
                v-model="currentPage"
                :max="totalPages"
                :max-pages="isMobile ? 4 : 6"
                :direction-links="!isMobile"
                :boundary-links="!isMobile"
                color="deep-orange-8"
                active-color="deep-orange-8"
                active-design="unelevated"
                unelevated
              />

              <q-select
                v-model="pageSize"
                :options="pageSizeOptions"
                emit-value
                map-options
                dense
                outlined
                class="bf-page-size"
              />
            </div>
          </footer>
        </template>

        <template v-else>
          <div class="bf-mobile-order-list">
            <article v-for="order in paginatedOrders" :key="order.id" class="bf-mobile-order-card">
              <div class="bf-mobile-order-head">
                <div>
                  <strong>#{{ order.id }}</strong>
                  <small>{{ formatDate(order.created_at) }} {{ formatTime(order.created_at) }}</small>
                </div>
                <span class="bf-status-pill" :class="`is-${getOrderStatus(order)}`">
                  {{ statusLabel(getOrderStatus(order)) }}
                </span>
              </div>

              <div class="bf-mobile-order-grid">
                <div>
                  <p class="bf-mobile-order-label">Cliente</p>
                  <p class="bf-mobile-order-value">{{ order.customer_name || '-' }}</p>
                  <p class="bf-mobile-order-sub">{{ order.customer_phone || '-' }}</p>
                </div>

                <div>
                  <p class="bf-mobile-order-label">Pagamento</p>
                  <p class="bf-mobile-order-value">{{ paymentLabel(order.payment_method) }}</p>
                  <p class="bf-mobile-order-total">R$ {{ formatPrice(order.total_amount) }}</p>
                </div>
              </div>

              <div class="bf-mobile-order-actions">
                <q-btn
                  flat
                  no-caps
                  color="grey-8"
                  label="Ver detalhes"
                  class="bf-mobile-action-btn"
                  @click="openOrderPreview(order)"
                />

                <q-btn-dropdown
                  no-caps
                  unelevated
                  color="deep-orange-8"
                  class="bf-mobile-action-btn"
                  :label="updatingOrderId === order.id ? 'Atualizando...' : 'Alterar status'"
                  :disable="updatingOrderId === order.id"
                >
                  <q-list>
                    <q-item
                      v-for="statusOption in statusUpdateOptions"
                      :key="`${order.id}-${statusOption.value}`"
                      clickable
                      v-close-popup
                      :disable="!canTransitionUi(getOrderStatus(order), statusOption.value)"
                      @click="updateOrderStatus(order.id, statusOption.value)"
                    >
                      <q-item-section avatar>
                        <span class="bf-status-dot" :class="`is-${statusOption.value}`"></span>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ statusOption.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </article>
          </div>

          <footer class="bf-table-footer">
            <p>
              Mostrando {{ showingStart }} a {{ showingEnd }} de {{ filteredOrders.length }} pedidos
            </p>

            <div class="bf-footer-right">
              <q-pagination
                v-model="currentPage"
                :max="totalPages"
                :max-pages="isMobile ? 4 : 6"
                :direction-links="!isMobile"
                :boundary-links="!isMobile"
                color="deep-orange-8"
                active-color="deep-orange-8"
                active-design="unelevated"
                unelevated
              />

              <q-select
                v-model="pageSize"
                :options="pageSizeOptions"
                emit-value
                map-options
                dense
                outlined
                class="bf-page-size"
              />
            </div>
          </footer>
        </template>
      </section>
    </div>

    <q-dialog v-model="previewDialogOpen">
      <q-card class="bf-preview-card">
        <q-card-section class="row items-center justify-between q-pb-sm">
          <div class="text-h6">Pedido #{{ previewOrder?.id }}</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <p><strong>Cliente:</strong> {{ previewOrder?.customer_name || '-' }}</p>
          <p><strong>Telefone:</strong> {{ previewOrder?.customer_phone || '-' }}</p>
          <p><strong>Endereco:</strong> {{ previewOrder?.delivery_address || '-' }}</p>
          <p><strong>Pagamento:</strong> {{ paymentLabel(previewOrder?.payment_method) }}</p>
          <p><strong>Total:</strong> R$ {{ formatPrice(previewOrder?.total_amount) }}</p>
          <p v-if="previewOrder?.notes"><strong>Observacao:</strong> {{ previewOrder.notes }}</p>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deliveryConfirmDialogOpen" persistent>
      <q-card class="bf-delivery-confirm-card">
        <q-card-section class="bf-delivery-confirm-head">
          <div class="bf-delivery-confirm-icon">
            <q-icon name="local_shipping" />
          </div>
          <div>
            <h3>Confirmar entrega</h3>
            <p>Tem certeza que esse pedido ja foi entregue ao cliente?</p>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="bf-delivery-confirm-body">
          <p><strong>Pedido:</strong> #{{ deliveryConfirmOrder?.id || '-' }}</p>
          <p><strong>Cliente:</strong> {{ deliveryConfirmOrder?.customer_name || '-' }}</p>
          <p><strong>Total:</strong> R$ {{ formatPrice(deliveryConfirmOrder?.total_amount) }}</p>
        </q-card-section>

        <q-card-actions align="right" class="bf-delivery-confirm-actions">
          <q-btn
            flat
            no-caps
            label="Ainda nao"
            color="grey-8"
            @click="cancelDeliveryConfirmation"
          />
          <q-btn
            no-caps
            unelevated
            color="deep-orange-8"
            icon="check_circle"
            label="Confirmar entregue"
            @click="confirmDeliveryAndUpdateStatus"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const POLLING_INTERVAL_MS = 4000

const $q = useQuasar()
const NEXT_STATUS_BY_CURRENT = {
  pending: 'preparing',
  preparing: 'on_the_way',
  on_the_way: 'delivered',
}

const router = useRouter()
const isMobile = computed(() => $q.screen.lt.md)

const loading = ref(false)
const requestInFlight = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const orders = ref([])
const updatingOrderId = ref(null)
const pollingHandle = ref(null)
const activeStatusTab = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const previewDialogOpen = ref(false)
const previewOrder = ref(null)
const deliveryConfirmDialogOpen = ref(false)
const pendingDeliveryStatusUpdate = ref(null)

const pageSizeOptions = [
  { label: '10 por pagina', value: 10 },
  { label: '20 por pagina', value: 20 },
  { label: '50 por pagina', value: 50 },
]

const statusTabs = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Em preparo', value: 'preparing' },
  { label: 'Em entrega', value: 'on_the_way' },
  { label: 'Entregues', value: 'delivered' },
  { label: 'Cancelados', value: 'cancelled' },
]

const statusUpdateOptions = [
  { label: 'Pendente', value: 'pending' },
  { label: 'Em preparo', value: 'preparing' },
  { label: 'Em entrega', value: 'on_the_way' },
  { label: 'Entregue', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' },
]

const statusCounters = computed(() => {
  const counters = {
    pending: 0,
    preparing: 0,
    on_the_way: 0,
    delivered: 0,
    cancelled: 0,
  }

  for (const order of orders.value) {
    const status = getOrderStatus(order)
    if (Object.prototype.hasOwnProperty.call(counters, status)) {
      counters[status] += 1
    }
  }

  return counters
})

const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    const orderStatus = getOrderStatus(order)
    if (activeStatusTab.value !== 'all' && orderStatus !== activeStatusTab.value) {
      return false
    }

    const orderDate = toLocalDateInput(order.created_at)
    if (!orderDate) return true

    if (dateFrom.value && orderDate < dateFrom.value) {
      return false
    }

    if (dateTo.value && orderDate > dateTo.value) {
      return false
    }

    return true
  })
})

const totalPages = computed(() => {
  const pages = Math.ceil(filteredOrders.value.length / pageSize.value)
  return Math.max(1, pages)
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})

const showingStart = computed(() => {
  if (filteredOrders.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const showingEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, filteredOrders.value.length)
})

const deliveryConfirmOrder = computed(() => {
  const orderId = Number(pendingDeliveryStatusUpdate.value?.orderId || 0)
  if (!orderId) return null
  return orders.value.find((order) => Number(order.id) === orderId) || null
})

watch([filteredOrders, pageSize], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

watch([activeStatusTab, dateFrom, dateTo], () => {
  currentPage.value = 1
})

function getSession() {
  return JSON.parse(localStorage.getItem('bf_session') || '{}')
}

function getAuthHeaders() {
  const session = getSession()
  const token = session.token || null
  const isAuth = session.mode === 'auth' && Boolean(token)
  const isAdmin = String(session?.user?.role || '').toLowerCase() === 'admin'

  if (!isAuth || !isAdmin) {
    return null
  }

  return { Authorization: `Bearer ${token}` }
}

function goOrdersAdmin() {
  router.push('/admin/pedidos')
}

function goProductsAdmin() {
  router.push('/admin/produtos')
}

function goReportsAdmin() {
  router.push('/admin/relatorios')
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
}

function getOrderStatus(order) {
  const status = normalizeStatus(order?.computed_status || order?.status || 'pending')
  return status || 'pending'
}

function toLocalDateInput(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('pt-BR')
  } catch {
    return '-'
  }
}

function formatTime(value) {
  try {
    return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

function paymentLabel(rawPayment) {
  const value = String(rawPayment || '').toLowerCase()
  if (value.includes('pix')) return 'Pix'
  if (value.includes('card') || value.includes('cartao')) return 'Cartao de credito'
  if (value.includes('cash') || value.includes('dinheiro')) return 'Dinheiro'
  return rawPayment || '-'
}

function statusLabel(status) {
  const map = {
    pending: 'Pendente',
    preparing: 'Em preparo',
    on_the_way: 'Em entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }

  return map[status] || 'Em andamento'
}

function canTransitionUi(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return false
  if (currentStatus === 'delivered' || currentStatus === 'cancelled') return false

  if (nextStatus === 'cancelled') {
    return ['pending', 'preparing', 'on_the_way'].includes(currentStatus)
  }

  const expectedNext = NEXT_STATUS_BY_CURRENT[currentStatus]
  return expectedNext === nextStatus
}

function openOrderPreview(order) {
  previewOrder.value = order
  previewDialogOpen.value = true
}

function cancelDeliveryConfirmation() {
  deliveryConfirmDialogOpen.value = false
  pendingDeliveryStatusUpdate.value = null
}

async function confirmDeliveryAndUpdateStatus() {
  const pendingUpdate = pendingDeliveryStatusUpdate.value
  if (!pendingUpdate) return

  deliveryConfirmDialogOpen.value = false
  pendingDeliveryStatusUpdate.value = null
  await performOrderStatusUpdate(pendingUpdate.orderId, pendingUpdate.status)
}

async function loadOrders(options = {}) {
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
    loading.value = true
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders?limit=300`, { headers })
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
      errorMessage.value = data.message || 'Nao foi possivel carregar pedidos admin.'
      return
    }

    orders.value = data.items || []
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar pedidos admin.'
  } finally {
    requestInFlight.value = false
    if (!silent) {
      loading.value = false
    }
  }
}

async function performOrderStatusUpdate(orderId, status) {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  updatingOrderId.value = orderId
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
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

    if (response.status === 409) {
      errorMessage.value = data.message || 'Status desatualizado. Atualizamos a lista.'
      await loadOrders({ silent: true })
      return
    }

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel atualizar status.'
      return
    }

    successMessage.value = data.message || 'Status atualizado com sucesso.'
    const updatedOrder = data.order

    if (updatedOrder?.id) {
      orders.value = orders.value.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    }
  } catch {
    errorMessage.value = 'Erro de conexao ao atualizar status do pedido.'
  } finally {
    updatingOrderId.value = null
  }
}

async function updateOrderStatus(orderId, status) {
  if (status === 'delivered') {
    pendingDeliveryStatusUpdate.value = { orderId, status }
    deliveryConfirmDialogOpen.value = true
    return
  }

  await performOrderStatusUpdate(orderId, status)
}

onMounted(() => {
  loadOrders()
  pollingHandle.value = window.setInterval(() => {
    loadOrders({ silent: true })
  }, POLLING_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (pollingHandle.value) {
    window.clearInterval(pollingHandle.value)
    pollingHandle.value = null
  }
})
</script>

<style scoped>
.bf-admin-page {
  background:
    radial-gradient(circle at 20% 12%, rgba(255, 255, 255, 0.85) 0%, rgba(246, 243, 238, 0.95) 36%),
    #f2efea;
  min-height: 100vh;
  padding: 22px 0 34px;
  overflow-x: hidden;
}

.bf-admin-shell {
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 16px;
  overflow-x: hidden;
}

.bf-admin-head {
  margin-bottom: 12px;
}

.bf-admin-head h1 {
  margin: 0;
  color: #25201c;
  font-size: 2.15rem;
  line-height: 1.1;
  font-weight: 700;
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

.bf-admin-head p {
  margin: 6px 0 0;
  color: #706860;
  font-size: 1rem;
}

.bf-metric-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.bf-metric-card {
  background: #ffffff;
  border: 1px solid #e9e2d9;
  border-radius: 10px;
  min-height: 96px;
  padding: 13px 11px;
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: 11px;
}

.bf-metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.bf-metric-icon.is-orange {
  background: #ffe4cf;
  color: #ea7a22;
}

.bf-metric-icon.is-yellow {
  background: #fff5d7;
  color: #e39b00;
}

.bf-metric-icon.is-blue {
  background: #dff0ff;
  color: #1976d2;
}

.bf-metric-icon.is-green {
  background: #e2f5e4;
  color: #2e7d32;
}

.bf-metric-icon.is-violet {
  background: #f0e8ff;
  color: #6f42c1;
}

.bf-metric-card p {
  margin: 0;
  color: #7c746c;
  font-size: 0.82rem;
}

.bf-metric-card strong {
  display: block;
  margin-top: 4px;
  color: #23201d;
  font-size: 1.5rem;
}

.bf-toolbar {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.bf-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.bf-tab-btn {
  border: 0;
  background: transparent;
  color: #4d443d;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.bf-tab-btn:hover {
  color: #db6f1e;
}

.bf-tab-btn.is-active {
  color: #db6f1e;
  border-bottom-color: #db6f1e;
}

.bf-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

.bf-date-box {
  border: 1px solid #ddd3c8;
  background: #fff;
  border-radius: 9px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  flex: 1 1 320px;
  max-width: 460px;
}

.bf-date-box span {
  color: #8b8278;
  font-size: 0.9rem;
}

.bf-date-input {
  border: 0;
  outline: 0;
  background: transparent;
  color: #3a332d;
  font-size: 0.88rem;
  min-width: 0;
  width: 100%;
}

.bf-refresh-btn {
  border: 1px solid #ddd3c8;
  border-radius: 9px;
  min-height: 42px;
  padding: 0 14px;
  white-space: nowrap;
}

.bf-table-card {
  margin-top: 12px;
  background: #fff;
  border: 1px solid #e9e2d9;
  border-radius: 10px;
  overflow: hidden;
}

.bf-table-wrap {
  overflow-x: auto;
}

.bf-orders-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.bf-orders-table thead th {
  text-align: left;
  font-size: 0.84rem;
  color: #5a5148;
  font-weight: 700;
  background: #faf8f4;
  border-bottom: 1px solid #ece4d9;
  padding: 13px 11px;
}

.bf-orders-table tbody td {
  padding: 12px 11px;
  border-bottom: 1px solid #f1ebe3;
  vertical-align: top;
}

.bf-orders-table tbody tr:last-child td {
  border-bottom: 0;
}

.bf-orders-table strong {
  display: block;
  color: #2d2621;
  font-size: 0.9rem;
  line-height: 1.2;
}

.bf-orders-table small {
  display: block;
  margin-top: 2px;
  color: #857c72;
  font-size: 0.82rem;
}

.bf-link {
  margin-top: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8a7f74;
  font-size: 0.8rem;
  text-decoration: underline;
  cursor: pointer;
}

.bf-payment {
  color: #2e2823;
  font-size: 0.88rem;
  font-weight: 600;
}

.bf-status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 0.8rem;
  padding: 4px 9px;
  font-weight: 700;
}

.bf-status-pill.is-pending {
  background: #ffe8cf;
  color: #b86b08;
}

.bf-status-pill.is-preparing {
  background: #dfeeff;
  color: #1969bf;
}

.bf-status-pill.is-on_the_way {
  background: #dff6e3;
  color: #1b7f35;
}

.bf-status-pill.is-delivered {
  background: #e6f8e7;
  color: #1f7d2d;
}

.bf-status-pill.is-cancelled {
  background: #ffdfe0;
  color: #c53f42;
}

.bf-action-dropdown {
  border: 1px solid #e4dace;
  border-radius: 8px;
  font-size: 0.84rem;
}

.bf-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.bf-status-dot.is-pending {
  background: #d98410;
}

.bf-status-dot.is-preparing {
  background: #1976d2;
}

.bf-status-dot.is-on_the_way {
  background: #2e7d32;
}

.bf-status-dot.is-delivered {
  background: #4caf50;
}

.bf-status-dot.is-cancelled {
  background: #ef5350;
}

.bf-table-footer {
  border-top: 1px solid #ece4d9;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.bf-table-footer p {
  margin: 0;
  color: #7b7268;
  font-size: 0.86rem;
}

.bf-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bf-page-size {
  min-width: 120px;
}

.bf-empty {
  padding: 22px;
  color: #756c63;
  font-size: 0.96rem;
}

.bf-mobile-order-list {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.bf-mobile-order-card {
  border: 1px solid #ebdfd1;
  border-radius: 12px;
  background: #fffefc;
  padding: 10px;
  display: grid;
  gap: 9px;
}

.bf-mobile-order-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.bf-mobile-order-head strong {
  display: block;
  color: #2d2621;
  font-size: 1rem;
}

.bf-mobile-order-head small {
  display: block;
  color: #857c72;
  font-size: 0.8rem;
  margin-top: 2px;
}

.bf-mobile-order-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.bf-mobile-order-label {
  margin: 0;
  color: #7b7268;
  font-size: 0.76rem;
  font-weight: 700;
}

.bf-mobile-order-value {
  margin: 2px 0 0;
  color: #2f2822;
  font-size: 0.9rem;
  font-weight: 600;
}

.bf-mobile-order-sub {
  margin: 2px 0 0;
  color: #8b8177;
  font-size: 0.8rem;
}

.bf-mobile-order-total {
  margin: 4px 0 0;
  color: #d24f21;
  font-size: 1.05rem;
  font-weight: 700;
}

.bf-mobile-order-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.bf-mobile-action-btn {
  width: 100%;
  border-radius: 9px;
}

.bf-preview-card {
  width: min(92vw, 560px);
}

.bf-preview-card p {
  margin: 8px 0 0;
}

.bf-delivery-confirm-card {
  width: min(92vw, 500px);
  border-radius: 14px;
  overflow: hidden;
}

.bf-delivery-confirm-head {
  display: grid;
  grid-template-columns: 48px 1fr;
  align-items: start;
  gap: 10px;
  background: linear-gradient(180deg, #fff6ec 0%, #fff 100%);
}

.bf-delivery-confirm-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #ffead6;
  color: #d96817;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.bf-delivery-confirm-head h3 {
  margin: 0;
  color: #2f251f;
  font-size: 1.12rem;
}

.bf-delivery-confirm-head p {
  margin: 4px 0 0;
  color: #7a6f65;
  font-size: 0.9rem;
}

.bf-delivery-confirm-body p {
  margin: 6px 0 0;
  color: #433830;
}

.bf-delivery-confirm-actions {
  padding: 8px 14px 14px;
}

@media (max-width: 1080px) {
  .bf-metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .bf-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .bf-metric-grid {
    grid-template-columns: 1fr;
  }

  .bf-mobile-order-grid,
  .bf-mobile-order-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .bf-admin-page {
    padding-top: 14px;
  }

  .bf-admin-shell {
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .bf-admin-nav-btn {
    width: 100%;
    text-align: center;
    padding: 8px 10px;
  }

  .bf-toolbar {
    margin-top: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .bf-tabs {
    overflow-x: hidden;
    flex-wrap: wrap;
    padding-bottom: 4px;
  }

  .bf-tab-btn {
    white-space: normal;
    padding: 9px 8px;
    font-size: 0.85rem;
  }

  .bf-toolbar-right {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .bf-date-box {
    width: 100%;
    max-width: 100%;
    flex: 1 1 auto;
    padding: 6px 10px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 6px;
  }

  .bf-date-input {
    min-width: 0;
    width: 100%;
  }

  .bf-refresh-btn {
    width: 100%;
    min-height: 44px;
    justify-content: center;
  }

  .bf-table-footer p {
    width: 100%;
    font-size: 0.8rem;
  }

  .bf-footer-right {
    width: 100%;
    justify-content: flex-start;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .bf-footer-right :deep(.q-pagination) {
    width: 100%;
    justify-content: center;
  }

  .bf-page-size {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 520px) {
  .bf-date-box {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .bf-date-box span {
    display: none;
  }
}
</style>
