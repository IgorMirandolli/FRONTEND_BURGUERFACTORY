<template>
  <q-page class="orders-page q-pa-md q-pa-lg-xl" :class="{ 'orders-page-mobile': isMobile }">
    <section class="orders-hero q-mb-lg">
      <h1 class="orders-title q-my-none">Meus pedidos</h1>
      <p class="orders-subtitle q-mt-xs q-mb-none">Acompanhe todos os seus pedidos feitos na Burger Factory.</p>
    </section>

    <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
      {{ errorMessage }}
    </q-banner>

    <div class="orders-switch q-mb-lg">
      <button type="button" class="orders-switch-btn" :class="{ active: activeTab === 'ongoing' }" @click="activeTab = 'ongoing'">
        Pedidos de agora
      </button>
      <button type="button" class="orders-switch-btn" :class="{ active: activeTab === 'past' }" @click="activeTab = 'past'">
        Pedidos passados
      </button>
    </div>

    <section v-if="activeTab === 'ongoing'" class="orders-block q-mb-lg">
      <h2 class="orders-block-title q-my-none">Pedidos de agora</h2>
      <p class="orders-block-subtitle q-mt-xs q-mb-md">Estes sao os pedidos que estao em andamento.</p>

      <div v-if="loading" class="row justify-center q-py-lg">
        <q-spinner color="deep-orange-8" size="36px" />
      </div>
      <div v-else-if="ongoingOrders.length === 0" class="text-grey-7">Nenhum pedido em andamento.</div>

      <div v-else-if="!isMobile" class="orders-list">
        <article v-for="order in ongoingOrders" :key="order.id" class="order-line">
          <div class="order-thumb">
            <img
              v-if="order.preview_image"
              :src="resolveOrderImageUrl(order.preview_image)"
              :alt="`Pedido #${order.id}`"
            />
            <q-icon v-else name="restaurant" size="32px" />
          </div>

          <div class="order-col order-main">
            <div class="order-id">Pedido #BF{{ order.id }}</div>
            <div class="order-date">{{ formatDate(order.created_at) }}</div>
            <q-badge class="order-pill" color="orange-2" text-color="orange-10">{{ order.computed_status_label }}</q-badge>
          </div>

          <div class="order-col">
            <div class="order-meta-title">{{ order.items_count || 0 }} itens</div>
            <button type="button" class="order-link-btn" @click="openOrder(order.id)">Ver detalhes</button>
            <div class="order-meta-text">{{ order.delivery_address }}</div>
          </div>

          <div class="order-col">
            <div class="order-meta-title">Total</div>
            <div class="order-total">R$ {{ formatPrice(order.total_amount) }}</div>
            <div class="order-meta-text">Pagamento: {{ normalizePaymentLabel(order.payment_method) }}</div>
          </div>

          <div class="order-col order-eta">
            <div class="order-meta-title">Previsao de entrega</div>
            <div class="order-eta-time">{{ getEtaText(order) }}</div>
            <div class="order-meta-text">Chegada estimada: {{ getEtaClock(order) }}</div>
            <q-btn outline color="deep-orange-8" no-caps label="Ver status" class="q-mt-sm" @click="openOrder(order.id)" />
          </div>
        </article>
      </div>

      <div v-else class="orders-mobile-list">
        <article v-for="order in ongoingOrders" :key="order.id" class="orders-mobile-card">
          <div class="orders-mobile-head">
            <div>
              <div class="orders-mobile-id">Pedido #BF{{ order.id }}</div>
              <div class="orders-mobile-date">{{ formatDate(order.created_at) }}</div>
            </div>
            <q-badge class="orders-mobile-badge" color="orange-2" text-color="orange-10">
              {{ order.computed_status_label }}
            </q-badge>
          </div>

          <div class="orders-mobile-body">
            <div class="orders-mobile-thumb">
              <img
                v-if="order.preview_image"
                :src="resolveOrderImageUrl(order.preview_image)"
                :alt="`Pedido #${order.id}`"
              />
              <q-icon v-else name="restaurant" size="30px" />
            </div>

            <div class="orders-mobile-info">
              <div class="orders-mobile-meta">{{ order.items_count || 0 }} itens</div>
              <div class="orders-mobile-meta">Pagamento: {{ normalizePaymentLabel(order.payment_method) }}</div>
              <div class="orders-mobile-total">R$ {{ formatPrice(order.total_amount) }}</div>
            </div>
          </div>

          <div class="orders-mobile-address">{{ order.delivery_address }}</div>

          <div class="orders-mobile-eta">
            <span>{{ getEtaText(order) }}</span>
            <small>Chegada estimada: {{ getEtaClock(order) }}</small>
          </div>

          <q-btn
            no-caps
            unelevated
            color="deep-orange-8"
            label="Ver status"
            class="orders-mobile-action"
            @click="openOrder(order.id)"
          />
        </article>
      </div>
    </section>

    <section v-if="activeTab === 'past'" class="orders-block">
      <h2 class="orders-block-title q-my-none">Pedidos passados</h2>
      <p class="orders-block-subtitle q-mt-xs q-mb-md">Lista de pedidos ja finalizados.</p>

      <div v-if="loading" class="row justify-center q-py-lg">
        <q-spinner color="deep-orange-8" size="36px" />
      </div>
      <div v-else-if="pastOrders.length === 0" class="text-grey-7">Nenhum pedido passado.</div>

      <div v-else-if="!isMobile" class="orders-list">
        <article v-for="order in pastOrders" :key="order.id" class="order-line">
          <div class="order-thumb">
            <img
              v-if="order.preview_image"
              :src="resolveOrderImageUrl(order.preview_image)"
              :alt="`Pedido #${order.id}`"
            />
            <q-icon v-else name="restaurant" size="32px" />
          </div>

          <div class="order-col order-main">
            <div class="order-id">Pedido #BF{{ order.id }}</div>
            <div class="order-date">{{ formatDate(order.created_at) }}</div>
            <q-badge class="order-pill" color="green-2" text-color="green-10">Entregue</q-badge>
          </div>

          <div class="order-col">
            <div class="order-meta-title">{{ order.items_count || 0 }} itens</div>
            <button type="button" class="order-link-btn" @click="openOrder(order.id)">Ver detalhes</button>
            <div class="order-meta-text">{{ order.delivery_address }}</div>
          </div>

          <div class="order-col">
            <div class="order-meta-title">Total</div>
            <div class="order-total">R$ {{ formatPrice(order.total_amount) }}</div>
            <div class="order-meta-text">Pagamento: {{ normalizePaymentLabel(order.payment_method) }}</div>
          </div>

          <div class="order-col order-eta">
            <q-btn outline color="deep-orange-8" no-caps label="Ver detalhes" @click="openOrder(order.id)" />
          </div>
        </article>
      </div>

      <div v-else class="orders-mobile-list">
        <article v-for="order in pastOrders" :key="order.id" class="orders-mobile-card">
          <div class="orders-mobile-head">
            <div>
              <div class="orders-mobile-id">Pedido #BF{{ order.id }}</div>
              <div class="orders-mobile-date">{{ formatDate(order.created_at) }}</div>
            </div>
            <q-badge class="orders-mobile-badge" color="green-2" text-color="green-10">Entregue</q-badge>
          </div>

          <div class="orders-mobile-body">
            <div class="orders-mobile-thumb">
              <img
                v-if="order.preview_image"
                :src="resolveOrderImageUrl(order.preview_image)"
                :alt="`Pedido #${order.id}`"
              />
              <q-icon v-else name="restaurant" size="30px" />
            </div>

            <div class="orders-mobile-info">
              <div class="orders-mobile-meta">{{ order.items_count || 0 }} itens</div>
              <div class="orders-mobile-meta">Pagamento: {{ normalizePaymentLabel(order.payment_method) }}</div>
              <div class="orders-mobile-total">R$ {{ formatPrice(order.total_amount) }}</div>
            </div>
          </div>

          <div class="orders-mobile-address">{{ order.delivery_address }}</div>

          <q-btn
            no-caps
            unelevated
            color="deep-orange-8"
            label="Ver detalhes"
            class="orders-mobile-action"
            @click="openOrder(order.id)"
          />
        </article>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const $q = useQuasar()
const router = useRouter()
const isMobile = computed(() => $q.screen.lt.md)

const loading = ref(false)
const errorMessage = ref('')
const activeTab = ref('ongoing')
const orders = ref([])

const ongoingOrders = computed(() => orders.value.filter((order) => order.computed_status !== 'delivered'))
const pastOrders = computed(() => orders.value.filter((order) => order.computed_status === 'delivered'))

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('pt-BR')
  } catch {
    return value
  }
}

function normalizePaymentLabel(payment) {
  const value = String(payment || '').toLowerCase()
  if (value.includes('pix')) return 'Pix'
  if (value.includes('card') || value.includes('cartao')) return 'Cartao'
  if (value.includes('cash') || value.includes('dinheiro')) return 'Dinheiro'
  return payment || '-'
}

function resolveOrderImageUrl(rawUrl) {
  const value = String(rawUrl || '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value
  }

  const normalized = value.startsWith('/') ? value : `/${value}`
  if (normalized.startsWith('/menu/') || normalized.startsWith('/uploads/')) {
    return `${API_BASE_URL}${normalized}`
  }

  return normalized
}

function getEtaMinutes(order) {
  const status = order?.computed_status
  if (status === 'delivered') return 0
  if (status === 'on_the_way') return 15
  return 30
}

function getEtaText(order) {
  const eta = getEtaMinutes(order)
  if (eta === 0) return 'Pedido entregue'
  return `${Math.max(eta - 5, 5)}-${eta} min`
}

function getEtaClock(order) {
  const now = new Date()
  const eta = getEtaMinutes(order)
  now.setMinutes(now.getMinutes() + eta)
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function getOrCreateGuestSessionId() {
  const existing = localStorage.getItem('bf_guest_session_id')
  if (existing) return existing

  const generated = crypto.randomUUID()
  localStorage.setItem('bf_guest_session_id', generated)
  return generated
}

function getRequestContext() {
  const session = JSON.parse(localStorage.getItem('bf_session') || '{}')
  const token = session.token || null
  const isAuth = session.mode === 'auth' && token
  const sessionId = getOrCreateGuestSessionId()
  const headers = {}

  if (isAuth) {
    headers.Authorization = `Bearer ${token}`
  }

  return { headers, isAuth, sessionId }
}

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { headers, isAuth, sessionId } = getRequestContext()
    let url = `${API_BASE_URL}/api/orders`
    if (!isAuth) {
      url += `?session_id=${encodeURIComponent(sessionId)}`
    }

    const response = await fetch(url, { headers })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel carregar pedidos.'
      return
    }

    orders.value = data.items || []
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar pedidos.'
  } finally {
    loading.value = false
  }
}

function openOrder(orderId) {
  router.push(`/pedidos/${orderId}`)
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-mobile-list {
  display: grid;
  gap: 10px;
}

.orders-mobile-card {
  background: #fffdf8;
  border: 1px solid #e8d7bf;
  border-radius: 14px;
  padding: 10px;
  display: grid;
  gap: 10px;
}

.orders-mobile-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.orders-mobile-id {
  color: #261b14;
  font-size: 1.22rem;
  line-height: 1.1;
  font-family: 'Anton', sans-serif;
}

.orders-mobile-date {
  color: #6f6154;
  margin-top: 3px;
  font-size: 0.85rem;
}

.orders-mobile-badge {
  border-radius: 999px;
  font-weight: 700;
}

.orders-mobile-body {
  display: grid;
  grid-template-columns: 98px 1fr;
  gap: 10px;
}

.orders-mobile-thumb {
  width: 98px;
  height: 78px;
  border-radius: 10px;
  background: #f4ead9;
  border: 1px solid #e2d0b4;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orders-mobile-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.orders-mobile-info {
  min-width: 0;
  display: grid;
  gap: 2px;
  align-content: center;
}

.orders-mobile-meta {
  color: #5f5145;
  font-size: 0.88rem;
}

.orders-mobile-total {
  margin-top: 5px;
  color: #d24f21;
  font-size: 1.42rem;
  line-height: 1;
  font-weight: 700;
}

.orders-mobile-address {
  color: #625449;
  font-size: 0.86rem;
  line-height: 1.35;
  border-top: 1px solid #f0e2d0;
  padding-top: 8px;
}

.orders-mobile-eta {
  border: 1px solid #edd7bb;
  background: #fff7ea;
  border-radius: 10px;
  padding: 8px 9px;
  display: grid;
  gap: 2px;
}

.orders-mobile-eta span {
  color: #cf4e1f;
  font-size: 1.16rem;
  line-height: 1;
  font-weight: 700;
}

.orders-mobile-eta small {
  color: #6f6154;
  font-size: 0.8rem;
}

.orders-mobile-action {
  border-radius: 10px;
  min-height: 38px;
}

.orders-page-mobile :deep(.orders-switch-btn) {
  font-size: 0.9rem;
  padding: 7px 1px;
}

.orders-page-mobile :deep(.orders-block-title) {
  font-size: 1.46rem;
}

.orders-page-mobile :deep(.orders-block-subtitle) {
  font-size: 0.9rem;
  margin-bottom: 10px;
}
</style>
