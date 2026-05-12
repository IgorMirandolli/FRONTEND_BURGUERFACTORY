<template>
  <q-page class="orders-page q-pa-md q-pa-lg-xl">
    <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
      {{ errorMessage }}
    </q-banner>

    <q-card v-if="order" class="order-detail-sheet">
      <q-card-section class="detail-back">
        <button type="button" class="detail-back-btn" @click="goBack">← Voltar para pedidos</button>
      </q-card-section>

      <q-card-section class="detail-top">
        <div>
          <div class="detail-order-id">Pedido #BF{{ order.id }}</div>
          <h3 class="detail-title q-my-none">Acompanhe seu pedido</h3>
          <p class="detail-subtitle q-mt-xs q-mb-none">Estamos preparando algo incrivel para voce.</p>
        </div>
        <div class="detail-eta-card">
          <div class="detail-eta-label">Previsao de entrega</div>
          <div class="detail-eta-value">{{ getEtaText(order) }}</div>
          <div class="detail-eta-clock">Chegada estimada: {{ getEtaClock(order) }}</div>
        </div>
      </q-card-section>

      <q-card-section class="detail-status">
        <div class="detail-timeline">
          <div v-for="(stage, index) in stages" :key="stage.key" class="detail-step" :class="{ active: index <= detailStageIndex }">
            <div class="detail-step-dot">
              <q-icon :name="stage.icon" size="14px" />
            </div>
            <div class="detail-step-text">{{ stage.label }}</div>
          </div>
          <div class="detail-line detail-line-active" :style="{ width: `${(detailStageIndex / 3) * 100}%` }" />
          <div class="detail-line detail-line-base" />
        </div>

        <div class="detail-alert">
          <div class="detail-alert-title">Seu pedido esta em {{ order.computed_status_label?.toLowerCase() }}!</div>
          <div class="detail-alert-sub">Nossa equipe esta cuidando de tudo com carinho.</div>
        </div>
      </q-card-section>

      <q-card-section class="detail-grid">
        <div class="detail-box detail-box-large">
          <div class="detail-box-title">Detalhes do pedido</div>
          <q-list separator>
            <q-item v-for="item in items" :key="item.id">
              <q-item-section avatar>
                <q-avatar rounded size="52px">
                  <img :src="item.imageUrl" :alt="item.name" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ item.name }}</q-item-label>
                <q-item-label caption>Qtd: {{ item.quantity }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-weight-bold">R$ {{ formatPrice(item.unit_price * item.quantity) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <div class="detail-total">Total do pedido <strong>R$ {{ formatPrice(order.total_amount) }}</strong></div>
        </div>

        <div class="detail-box">
          <div class="detail-box-title">Endereco de entrega</div>
          <div class="detail-text">{{ order.delivery_address }}</div>
        </div>

        <div class="detail-box">
          <div class="detail-box-title">Informacoes</div>
          <div class="detail-text">Pagamento: {{ normalizePaymentLabel(order.payment_method) }}</div>
          <div class="detail-text">Realizado em: {{ formatDate(order.created_at) }}</div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const order = ref(null)
const items = ref([])

const stages = [
  { key: 'received', label: 'Pedido recebido', icon: 'inventory_2' },
  { key: 'preparing', label: 'Em preparo', icon: 'lunch_dining' },
  { key: 'on_the_way', label: 'Saiu para entrega', icon: 'two_wheeler' },
  { key: 'delivered', label: 'Entregue', icon: 'check_circle' },
]

const detailStageIndex = computed(() => {
  const status = order.value?.computed_status
  if (status === 'delivered') return 3
  if (status === 'on_the_way') return 2
  return 1
})

function goBack() {
  router.push('/pedidos')
}

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

function getEtaMinutes(orderValue) {
  const status = orderValue?.computed_status
  if (status === 'delivered') return 0
  if (status === 'on_the_way') return 15
  return 30
}

function getEtaText(orderValue) {
  const eta = getEtaMinutes(orderValue)
  if (eta === 0) return 'Pedido entregue'
  return `${Math.max(eta - 5, 5)}-${eta} min`
}

function getEtaClock(orderValue) {
  const now = new Date()
  const eta = getEtaMinutes(orderValue)
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

async function loadOrder() {
  loading.value = true
  errorMessage.value = ''

  try {
    const orderId = Number(route.params.orderId)
    if (!Number.isInteger(orderId) || orderId <= 0) {
      errorMessage.value = 'Pedido invalido.'
      return
    }

    const { headers, isAuth, sessionId } = getRequestContext()
    let url = `${API_BASE_URL}/api/orders/${orderId}`
    if (!isAuth) {
      url += `?session_id=${encodeURIComponent(sessionId)}`
    }

    const response = await fetch(url, { headers })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel abrir pedido.'
      return
    }

    order.value = data.order
    items.value = data.items || []
  } catch {
    errorMessage.value = 'Erro de conexao ao abrir pedido.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>
