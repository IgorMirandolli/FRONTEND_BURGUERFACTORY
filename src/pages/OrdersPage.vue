<template>
  <q-page class="orders-page q-pa-md q-pa-lg-xl">
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

      <div v-else class="orders-list">
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
    </section>

    <section v-if="activeTab === 'past'" class="orders-block">
      <h2 class="orders-block-title q-my-none">Pedidos passados</h2>
      <p class="orders-block-subtitle q-mt-xs q-mb-md">Lista de pedidos ja finalizados.</p>

      <div v-if="loading" class="row justify-center q-py-lg">
        <q-spinner color="deep-orange-8" size="36px" />
      </div>
      <div v-else-if="pastOrders.length === 0" class="text-grey-7">Nenhum pedido passado.</div>

      <div v-else class="orders-list">
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
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const router = useRouter()

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
