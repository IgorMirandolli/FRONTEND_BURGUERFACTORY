<template>
  <q-page class="bf-admin-reports-page">
    <div class="bf-admin-reports-shell">
      <header class="bf-admin-head">
        <nav class="bf-admin-nav">
          <button type="button" class="bf-admin-nav-btn" @click="goOrdersAdmin">Pedidos</button>
          <button type="button" class="bf-admin-nav-btn" @click="goProductsAdmin">Produtos</button>
          <button type="button" class="bf-admin-nav-btn is-active" @click="goReportsAdmin">Relatorios</button>
        </nav>

        <h1>Relatorios de vendas</h1>
        <p>Acompanhe faturamento, produtos mais vendidos e indicadores do periodo.</p>
      </header>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
        {{ errorMessage }}
      </q-banner>

      <section class="bf-filter-bar">
        <div class="bf-date-box">
          <input v-model="dateFrom" type="date" class="bf-date-input" />
          <span>-</span>
          <input v-model="dateTo" type="date" class="bf-date-input" />
        </div>

        <q-select
          v-model="groupBy"
          :options="groupByOptions"
          emit-value
          map-options
          dense
          outlined
          class="bf-group-select"
        />

        <q-btn
          no-caps
          flat
          icon="refresh"
          label="Atualizar"
          class="bf-refresh-btn"
          :loading="loading"
          @click="loadReports"
        />
      </section>

      <div v-if="loading" class="row justify-center q-py-xl">
        <q-spinner color="deep-orange-8" size="38px" />
      </div>

      <template v-else>
        <section class="bf-summary-grid">
          <article class="bf-summary-card">
            <p>Faturamento bruto</p>
            <strong>R$ {{ formatPrice(summary.gross_revenue) }}</strong>
          </article>
          <article class="bf-summary-card">
            <p>Lucro estimado</p>
            <strong>R$ {{ formatPrice(summary.estimated_profit) }}</strong>
          </article>
          <article class="bf-summary-card">
            <p>Ticket medio</p>
            <strong>R$ {{ formatPrice(summary.average_ticket) }}</strong>
          </article>
          <article class="bf-summary-card">
            <p>Pedidos entregues</p>
            <strong>{{ summary.delivered_orders }}</strong>
          </article>
          <article class="bf-summary-card">
            <p>Pedidos cancelados</p>
            <strong>{{ summary.cancelled_orders }}</strong>
          </article>
          <article class="bf-summary-card">
            <p>Itens vendidos</p>
            <strong>{{ summary.items_sold }}</strong>
          </article>
        </section>

        <section class="bf-panel">
          <header class="bf-panel-head">
            <h2>Faturamento no periodo</h2>
            <small>{{ dateFrom }} ate {{ dateTo }}</small>
          </header>

          <div v-if="salesSeries.length === 0" class="bf-empty">
            Sem vendas entregues no periodo selecionado.
          </div>

          <div v-else class="bf-series-list">
            <div v-for="point in salesSeriesWithShare" :key="point.bucket" class="bf-series-item">
              <div class="bf-series-label">{{ formatBucket(point.bucket) }}</div>
              <div class="bf-series-bar-wrap">
                <span class="bf-series-bar" :style="{ width: `${point.share}%` }"></span>
              </div>
              <div class="bf-series-value">R$ {{ formatPrice(point.revenue) }}</div>
            </div>
          </div>
        </section>

        <section class="bf-panel">
          <header class="bf-panel-head">
            <h2>Produtos mais vendidos</h2>
            <small>Top {{ topProducts.length }}</small>
          </header>

          <div v-if="topProducts.length === 0" class="bf-empty">Sem dados de produtos no periodo.</div>

          <div v-else class="bf-top-list">
            <article v-for="item in topProductsWithShare" :key="`${item.product_id}-${item.product_name}`" class="bf-top-item">
              <div class="bf-top-main">
                <strong>{{ item.product_name }}</strong>
                <small>{{ item.quantity_sold }} vendidos</small>
              </div>
              <div class="bf-top-progress">
                <span class="bf-top-progress-fill" :style="{ width: `${item.share}%` }"></span>
              </div>
              <div class="bf-top-value">R$ {{ formatPrice(item.revenue) }}</div>
            </article>
          </div>
        </section>

        <section class="bf-two-panels">
          <article class="bf-panel">
            <header class="bf-panel-head">
              <h2>Vendas por categoria</h2>
            </header>

            <div v-if="categoryShare.length === 0" class="bf-empty">Sem categorias com vendas.</div>

            <div v-else class="bf-share-list">
              <div v-for="item in categoryShareWithPercent" :key="item.category_name" class="bf-share-item">
                <div class="bf-share-line">
                  <strong>{{ item.category_name }}</strong>
                  <span>{{ item.percent }}%</span>
                </div>
                <small>{{ item.quantity_sold }} itens · R$ {{ formatPrice(item.revenue) }}</small>
              </div>
            </div>
          </article>

          <article class="bf-panel">
            <header class="bf-panel-head">
              <h2>Formas de pagamento</h2>
            </header>

            <div v-if="paymentMethods.length === 0" class="bf-empty">Sem pagamentos no periodo.</div>

            <div v-else class="bf-share-list">
              <div v-for="item in paymentMethodsWithPercent" :key="item.payment_label" class="bf-share-item">
                <div class="bf-share-line">
                  <strong>{{ item.payment_label }}</strong>
                  <span>{{ item.percent }}%</span>
                </div>
                <small>{{ item.orders_count }} pedidos · R$ {{ formatPrice(item.revenue) }}</small>
              </div>
            </div>
          </article>
        </section>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const groupBy = ref('day')

const summary = ref({
  gross_revenue: 0,
  estimated_profit: 0,
  average_ticket: 0,
  delivered_orders: 0,
  cancelled_orders: 0,
  items_sold: 0,
})
const salesSeries = ref([])
const topProducts = ref([])
const categoryShare = ref([])
const paymentMethods = ref([])

const groupByOptions = [
  { label: 'Agrupar por dia', value: 'day' },
  { label: 'Agrupar por mes', value: 'month' },
]

const salesSeriesWithShare = computed(() => {
  const maxRevenue = Math.max(1, ...salesSeries.value.map((item) => Number(item.revenue || 0)))
  return salesSeries.value.map((item) => {
    const revenue = Number(item.revenue || 0)
    return {
      ...item,
      revenue,
      share: revenue > 0 ? Math.max(6, Number(((revenue / maxRevenue) * 100).toFixed(2))) : 0,
    }
  })
})

const topProductsWithShare = computed(() => {
  const maxQuantity = Math.max(1, ...topProducts.value.map((item) => Number(item.quantity_sold || 0)))
  return topProducts.value.map((item) => {
    const quantitySold = Number(item.quantity_sold || 0)
    return {
      ...item,
      quantity_sold: quantitySold,
      share: quantitySold > 0 ? Math.max(6, Number(((quantitySold / maxQuantity) * 100).toFixed(2))) : 0,
    }
  })
})

const categoryShareWithPercent = computed(() => {
  const totalRevenue = categoryShare.value.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
  return categoryShare.value.map((item) => {
    const revenue = Number(item.revenue || 0)
    return {
      ...item,
      revenue,
      quantity_sold: Number(item.quantity_sold || 0),
      percent: totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(1)) : 0,
    }
  })
})

const paymentMethodsWithPercent = computed(() => {
  const totalRevenue = paymentMethods.value.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
  return paymentMethods.value.map((item) => {
    const revenue = Number(item.revenue || 0)
    return {
      ...item,
      revenue,
      orders_count: Number(item.orders_count || 0),
      percent: totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(1)) : 0,
    }
  })
})

function getTodayInputDate() {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateInputMinusDays(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

function formatBucket(bucket) {
  const raw = String(bucket || '')
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split('-')
    return `${month}/${year}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-')
    return `${day}/${month}/${year}`
  }

  return raw
}

async function loadReports() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  if (!dateFrom.value || !dateTo.value) {
    errorMessage.value = 'Informe intervalo de datas valido.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams()
    params.set('from', dateFrom.value)
    params.set('to', dateTo.value)
    params.set('group_by', groupBy.value)
    params.set('top', '10')
    params.set('margin', '35')

    const response = await fetch(`${API_BASE_URL}/api/admin/reports/sales?${params.toString()}`, {
      headers,
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
      errorMessage.value = data.message || 'Nao foi possivel carregar relatorios.'
      return
    }

    summary.value = {
      gross_revenue: Number(data?.summary?.gross_revenue || 0),
      estimated_profit: Number(data?.summary?.estimated_profit || 0),
      average_ticket: Number(data?.summary?.average_ticket || 0),
      delivered_orders: Number(data?.summary?.delivered_orders || 0),
      cancelled_orders: Number(data?.summary?.cancelled_orders || 0),
      items_sold: Number(data?.summary?.items_sold || 0),
    }
    salesSeries.value = data.sales_series || []
    topProducts.value = data.top_products || []
    categoryShare.value = data.category_share || []
    paymentMethods.value = data.payment_methods || []
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar relatorios.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  dateTo.value = getTodayInputDate()
  dateFrom.value = getDateInputMinusDays(29)
  loadReports()
})
</script>

<style scoped>
.bf-admin-reports-page {
  background:
    radial-gradient(circle at 16% 8%, rgba(255, 255, 255, 0.86) 0%, rgba(244, 241, 236, 0.95) 35%),
    #f2eeea;
  min-height: 100vh;
  padding: 22px 0 34px;
}

.bf-admin-reports-shell {
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 16px;
}

.bf-admin-head {
  margin-bottom: 12px;
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
  font-size: 2.1rem;
  line-height: 1.1;
  font-weight: 700;
}

.bf-admin-head p {
  margin: 6px 0 0;
  color: #706860;
  font-size: 1rem;
}

.bf-filter-bar {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px 160px;
  gap: 10px;
}

.bf-date-box {
  border: 1px solid #ddd3c8;
  background: #fff;
  border-radius: 9px;
  min-height: 42px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  padding: 0 10px;
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
  width: 100%;
  min-width: 0;
}

.bf-group-select :deep(.q-field__control),
.bf-refresh-btn {
  min-height: 42px;
  border-radius: 9px;
}

.bf-refresh-btn {
  border: 1px solid #ddd3c8;
}

.bf-summary-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.bf-summary-card {
  background: #fff;
  border: 1px solid #eadfce;
  border-radius: 12px;
  padding: 12px;
}

.bf-summary-card p {
  margin: 0;
  color: #7e7064;
  font-size: 0.82rem;
}

.bf-summary-card strong {
  display: block;
  margin-top: 4px;
  color: #2f251f;
  font-size: 1.24rem;
  line-height: 1;
}

.bf-panel {
  margin-top: 12px;
  background: #fff;
  border: 1px solid #e7ddd1;
  border-radius: 12px;
  padding: 12px;
}

.bf-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.bf-panel-head h2 {
  margin: 0;
  color: #2f251f;
  font-size: 1.12rem;
}

.bf-panel-head small {
  color: #85796d;
  font-size: 0.82rem;
}

.bf-empty {
  color: #756c63;
  font-size: 0.92rem;
  padding: 10px 4px;
}

.bf-series-list {
  display: grid;
  gap: 8px;
}

.bf-series-item {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr) 140px;
  gap: 10px;
  align-items: center;
}

.bf-series-label {
  color: #574c43;
  font-size: 0.84rem;
  font-weight: 700;
}

.bf-series-bar-wrap {
  height: 10px;
  border-radius: 999px;
  background: #f4ece2;
  overflow: hidden;
}

.bf-series-bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ef7d1f 0%, #ffad52 100%);
}

.bf-series-value {
  text-align: right;
  color: #2f251f;
  font-size: 0.88rem;
  font-weight: 700;
}

.bf-top-list {
  display: grid;
  gap: 9px;
}

.bf-top-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) 120px;
  gap: 10px;
  align-items: center;
}

.bf-top-main strong {
  display: block;
  color: #2d241d;
  font-size: 0.9rem;
  line-height: 1.2;
}

.bf-top-main small {
  display: block;
  margin-top: 2px;
  color: #887d72;
  font-size: 0.8rem;
}

.bf-top-progress {
  height: 8px;
  border-radius: 999px;
  background: #f3e8dd;
  overflow: hidden;
}

.bf-top-progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #ea7a22;
}

.bf-top-value {
  text-align: right;
  color: #2f251f;
  font-size: 0.86rem;
  font-weight: 700;
}

.bf-two-panels {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.bf-share-list {
  display: grid;
  gap: 9px;
}

.bf-share-item {
  border: 1px solid #efe4d8;
  border-radius: 10px;
  padding: 9px;
  background: #fffdfb;
}

.bf-share-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bf-share-line strong {
  color: #312820;
  font-size: 0.9rem;
}

.bf-share-line span {
  color: #e26d1d;
  font-size: 0.85rem;
  font-weight: 700;
}

.bf-share-item small {
  display: block;
  margin-top: 3px;
  color: #7e7266;
  font-size: 0.8rem;
}

@media (max-width: 1200px) {
  .bf-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .bf-filter-bar {
    grid-template-columns: 1fr;
  }

  .bf-two-panels {
    grid-template-columns: 1fr;
  }

  .bf-series-item {
    grid-template-columns: 96px minmax(0, 1fr) 110px;
  }
}

@media (max-width: 760px) {
  .bf-admin-reports-page {
    padding-top: 14px;
  }

  .bf-admin-reports-shell {
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
    padding: 8px 8px;
    font-size: 0.82rem;
  }

  .bf-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bf-top-item {
    grid-template-columns: 1fr;
  }

  .bf-top-value {
    text-align: left;
  }
}

@media (max-width: 520px) {
  .bf-summary-grid {
    grid-template-columns: 1fr;
  }

  .bf-date-box {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 8px 10px;
  }

  .bf-date-box span {
    display: none;
  }

  .bf-series-item {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .bf-series-value {
    text-align: left;
  }
}
</style>
