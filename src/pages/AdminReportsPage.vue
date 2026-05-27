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
        <p>Painel com indicadores, comparativos e desempenho do periodo.</p>
      </header>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
        {{ errorMessage }}
      </q-banner>

      <section class="bf-filter-bar">
        <div class="bf-date-box">
          <input
            v-model="dateFrom"
            type="date"
            class="bf-date-input"
            @change="selectedQuickRange = 0"
          />
          <span>-</span>
          <input
            v-model="dateTo"
            type="date"
            class="bf-date-input"
            @change="selectedQuickRange = 0"
          />
        </div>

        <div class="bf-quick-range">
          <button
            v-for="item in quickRanges"
            :key="item.days"
            type="button"
            class="bf-quick-range-btn"
            :class="{ 'is-active': selectedQuickRange === item.days }"
            @click="applyQuickRange(item.days)"
          >
            {{ item.label }}
          </button>
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
          <article class="bf-summary-card is-emphasis">
            <p>Faturamento bruto</p>
            <strong>R$ {{ formatPrice(summary.gross_revenue) }}</strong>
            <small :class="['bf-trend', getTrendClass(revenueTrend)]">
              {{ formatTrendText(revenueTrend) }}
            </small>
          </article>
          <article class="bf-summary-card">
            <p>Lucro estimado</p>
            <strong>R$ {{ formatPrice(summary.estimated_profit) }}</strong>
            <small>Margem {{ estimatedMarginPercent }}%</small>
          </article>
          <article class="bf-summary-card">
            <p>Ticket medio</p>
            <strong>R$ {{ formatPrice(summary.average_ticket) }}</strong>
            <small>{{ summary.delivered_orders }} pedidos entregues</small>
          </article>
          <article class="bf-summary-card">
            <p>Pedidos entregues</p>
            <strong>{{ summary.delivered_orders }}</strong>
            <small :class="['bf-trend', getTrendClass(deliveredTrend)]">
              {{ formatTrendText(deliveredTrend) }}
            </small>
          </article>
          <article class="bf-summary-card">
            <p>Pedidos cancelados</p>
            <strong>{{ summary.cancelled_orders }}</strong>
            <small>Taxa {{ cancellationRate }}%</small>
          </article>
          <article class="bf-summary-card">
            <p>Itens vendidos</p>
            <strong>{{ summary.items_sold }}</strong>
            <small :class="['bf-trend', getTrendClass(itemsTrend)]">
              {{ formatTrendText(itemsTrend) }}
            </small>
          </article>
        </section>

        <section class="bf-insights">
          <article class="bf-insight-card">
            <span>Categoria lider</span>
            <strong>
              {{ topCategoryInsight ? topCategoryInsight.category_name : 'Sem dados no periodo' }}
            </strong>
          </article>
          <article class="bf-insight-card">
            <span>Produto destaque</span>
            <strong>
              {{ topProductInsight ? topProductInsight.product_name : 'Sem dados no periodo' }}
            </strong>
          </article>
          <article class="bf-insight-card">
            <span>Pagamento principal</span>
            <strong>
              {{ topPaymentInsight ? topPaymentInsight.payment_label : 'Sem dados no periodo' }}
            </strong>
          </article>
        </section>

        <section class="bf-panel bf-chart-panel">
          <header class="bf-panel-head">
            <div>
              <h2>Faturamento no periodo</h2>
              <small>{{ formatDateLabel(dateFrom) }} ate {{ formatDateLabel(dateTo) }}</small>
            </div>
            <div class="bf-panel-metrics">
              <span>R$ {{ formatPrice(salesTotalRevenue) }}</span>
              <small>{{ salesTotalOrders }} pedidos</small>
            </div>
          </header>

          <div v-if="salesSeries.length === 0" class="bf-empty">
            Sem vendas entregues no periodo selecionado.
          </div>

          <div v-else class="bf-chart-wrap">
            <svg
              class="bf-chart-svg"
              viewBox="0 0 1000 280"
              preserveAspectRatio="none"
              aria-label="Grafico de faturamento"
            >
              <defs>
                <linearGradient id="bfRevenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ee7b1f" stop-opacity="0.34" />
                  <stop offset="100%" stop-color="#ee7b1f" stop-opacity="0.03" />
                </linearGradient>
              </defs>

              <g v-for="line in chartGridLines" :key="line.y">
                <line
                  :x1="chartPaddingX"
                  :x2="1000 - chartPaddingX"
                  :y1="line.y"
                  :y2="line.y"
                  class="bf-grid-line"
                />
              </g>

              <path v-if="salesAreaPath" :d="salesAreaPath" fill="url(#bfRevenueArea)" />
              <polyline v-if="salesLinePoints" :points="salesLinePoints" class="bf-line-main" />

              <g v-for="point in salesChartDots" :key="point.bucket">
                <circle :cx="point.x" :cy="point.y" r="4.4" class="bf-line-dot" />
                <title>{{ formatBucket(point.bucket) }} - R$ {{ formatPrice(point.revenue) }}</title>
              </g>

              <rect x="0" y="0" :width="chartPaddingX - 8" :height="chartHeight" class="bf-axis-mask" />
              <line
                :x1="chartPaddingX"
                :x2="chartPaddingX"
                :y1="chartPaddingY"
                :y2="chartBaseY"
                class="bf-axis-divider"
              />

              <g v-for="line in chartGridLines" :key="`label-${line.y}`">
                <text :x="8" :y="line.y - 3" class="bf-grid-label">
                  R$ {{ formatCompactPrice(line.value) }}
                </text>
              </g>
            </svg>

            <div class="bf-chart-labels">
              <span v-for="label in visibleChartLabels" :key="label.bucket">
                {{ formatBucket(label.bucket) }}
              </span>
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
            <article
              v-for="(item, index) in topProductsWithShare"
              :key="`${item.product_id}-${item.product_name}`"
              class="bf-top-item"
            >
              <div class="bf-top-rank">#{{ index + 1 }}</div>
              <div class="bf-top-main">
                <strong>{{ item.product_name }}</strong>
                <small>{{ item.quantity_sold }} vendidos - {{ item.items_share }}% dos itens</small>
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
                <div class="bf-share-bar">
                  <span :style="{ width: `${item.percent_width}%` }"></span>
                </div>
                <small>{{ item.quantity_sold }} itens - R$ {{ formatPrice(item.revenue) }}</small>
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
                <div class="bf-share-bar is-payment">
                  <span :style="{ width: `${item.percent_width}%` }"></span>
                </div>
                <small>{{ item.orders_count }} pedidos - R$ {{ formatPrice(item.revenue) }}</small>
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

const chartPaddingX = 116
const chartHeight = 280
const chartPaddingY = 26

const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const groupBy = ref('day')
const selectedQuickRange = ref(30)

const summary = ref({
  gross_revenue: 0,
  estimated_profit: 0,
  average_ticket: 0,
  delivered_orders: 0,
  cancelled_orders: 0,
  items_sold: 0,
})
const previousSummary = ref(null)
const salesSeries = ref([])
const topProducts = ref([])
const categoryShare = ref([])
const paymentMethods = ref([])

const groupByOptions = [
  { label: 'Agrupar por dia', value: 'day' },
  { label: 'Agrupar por mes', value: 'month' },
]

const quickRanges = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
]

const salesTotalRevenue = computed(() =>
  salesSeries.value.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
)
const salesTotalOrders = computed(() =>
  salesSeries.value.reduce((sum, item) => sum + Number(item.orders_count || 0), 0)
)

const topProductsWithShare = computed(() => {
  const maxQuantity = Math.max(1, ...topProducts.value.map((item) => Number(item.quantity_sold || 0)))
  const totalItemsSold = Math.max(1, Number(summary.value.items_sold || 0))

  return topProducts.value.map((item) => {
    const quantitySold = Number(item.quantity_sold || 0)
    const itemsShare = Number(((quantitySold / totalItemsSold) * 100).toFixed(1))
    return {
      ...item,
      quantity_sold: quantitySold,
      revenue: Number(item.revenue || 0),
      share: quantitySold > 0 ? Math.max(6, Number(((quantitySold / maxQuantity) * 100).toFixed(2))) : 0,
      items_share: clampPercent(itemsShare),
    }
  })
})

const categoryShareWithPercent = computed(() => {
  const totalRevenue = categoryShare.value.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
  return categoryShare.value.map((item) => {
    const revenue = Number(item.revenue || 0)
    const percent = totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(1)) : 0
    return {
      ...item,
      revenue,
      quantity_sold: Number(item.quantity_sold || 0),
      percent: clampPercent(percent),
      percent_width: percent > 0 ? Math.max(4, clampPercent(percent)) : 0,
    }
  })
})

const paymentMethodsWithPercent = computed(() => {
  const totalRevenue = paymentMethods.value.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
  return paymentMethods.value.map((item) => {
    const revenue = Number(item.revenue || 0)
    const percent = totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(1)) : 0
    return {
      ...item,
      revenue,
      orders_count: Number(item.orders_count || 0),
      percent: clampPercent(percent),
      percent_width: percent > 0 ? Math.max(4, clampPercent(percent)) : 0,
    }
  })
})

const estimatedMarginPercent = computed(() => {
  const gross = Number(summary.value.gross_revenue || 0)
  if (gross <= 0) return '0,0'
  const margin = (Number(summary.value.estimated_profit || 0) / gross) * 100
  return margin.toFixed(1).replace('.', ',')
})

const totalProcessedOrders = computed(
  () => Number(summary.value.delivered_orders || 0) + Number(summary.value.cancelled_orders || 0)
)
const cancellationRate = computed(() => {
  if (totalProcessedOrders.value <= 0) return '0,0'
  const rate = (Number(summary.value.cancelled_orders || 0) / totalProcessedOrders.value) * 100
  return rate.toFixed(1).replace('.', ',')
})

const topCategoryInsight = computed(() => categoryShareWithPercent.value[0] || null)
const topProductInsight = computed(() => topProductsWithShare.value[0] || null)
const topPaymentInsight = computed(() => paymentMethodsWithPercent.value[0] || null)

const revenueTrend = computed(() =>
  calculateTrend(summary.value.gross_revenue, previousSummary.value?.gross_revenue)
)
const deliveredTrend = computed(() =>
  calculateTrend(summary.value.delivered_orders, previousSummary.value?.delivered_orders)
)
const itemsTrend = computed(() =>
  calculateTrend(summary.value.items_sold, previousSummary.value?.items_sold)
)

const chartInnerHeight = chartHeight - chartPaddingY * 2
const chartBaseY = chartHeight - chartPaddingY

const chartMaxRevenue = computed(() =>
  Math.max(1, ...salesSeries.value.map((item) => Number(item.revenue || 0)))
)

const salesChartDots = computed(() => {
  const points = salesSeries.value
  const total = points.length
  if (total === 0) return []

  return points.map((item, index) => {
    const revenue = Number(item.revenue || 0)
    const ratio = revenue / chartMaxRevenue.value
    const x =
      total === 1
        ? 500
        : chartPaddingX + (index * (1000 - chartPaddingX * 2)) / Math.max(1, total - 1)
    const y = chartBaseY - ratio * chartInnerHeight

    return {
      ...item,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      revenue,
    }
  })
})

const salesLinePoints = computed(() =>
  salesChartDots.value.map((point) => `${point.x},${point.y}`).join(' ')
)

const salesAreaPath = computed(() => {
  if (salesChartDots.value.length === 0) return ''
  const first = salesChartDots.value[0]
  const last = salesChartDots.value[salesChartDots.value.length - 1]
  const linePath = salesChartDots.value.map((point) => `${point.x} ${point.y}`).join(' L ')
  return `M ${first.x} ${chartBaseY} L ${linePath} L ${last.x} ${chartBaseY} Z`
})

const chartGridLines = computed(() => {
  const rows = 5
  const lines = []
  for (let i = 0; i < rows; i += 1) {
    const ratio = rows === 1 ? 0 : i / (rows - 1)
    const y = chartPaddingY + ratio * chartInnerHeight
    const value = chartMaxRevenue.value * (1 - ratio)
    lines.push({
      y: Number(y.toFixed(2)),
      value: Number(value.toFixed(2)),
    })
  }
  return lines
})

const visibleChartLabels = computed(() => {
  const dots = salesChartDots.value
  if (dots.length <= 6) return dots
  const step = Math.ceil(dots.length / 6)
  return dots.filter((_, index) => index % step === 0 || index === dots.length - 1)
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
  date.setDate(date.getDate() - Math.max(0, days))
  return formatInputDate(date)
}

function formatInputDate(date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(inputDate) {
  const value = String(inputDate || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
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

function formatCompactPrice(value) {
  const amount = Number(value || 0)
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.', ',')}k`
  }
  return formatPrice(amount)
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

function clampPercent(value) {
  const numeric = Number(value || 0)
  if (numeric <= 0) return 0
  if (numeric >= 100) return 100
  return Number(numeric.toFixed(1))
}

function calculateTrend(currentValue, previousValue) {
  if (previousValue == null) return null
  const current = Number(currentValue || 0)
  const previous = Number(previousValue || 0)

  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }

  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function getTrendClass(value) {
  if (value == null || value === 0) return 'is-neutral'
  return value > 0 ? 'is-up' : 'is-down'
}

function formatTrendText(value) {
  if (value == null) return 'Sem base de comparacao'
  if (value === 0) return 'Mesmo resultado do periodo anterior'
  const signal = value > 0 ? '+' : ''
  return `${signal}${String(value).replace('.', ',')}% vs periodo anterior`
}

function normalizeDateRange(fromValue, toValue) {
  const from = String(fromValue || '').trim()
  const to = String(toValue || '').trim()
  if (!from || !to) return null
  if (from <= to) return { from, to }
  return { from: to, to: from }
}

function getRangeLengthInDays(from, to) {
  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T00:00:00`)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return 30
  const diff = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1
  return Math.max(1, diff)
}

function getPreviousRange(from, to) {
  const currentLength = getRangeLengthInDays(from, to)
  const currentFrom = new Date(`${from}T00:00:00`)
  if (Number.isNaN(currentFrom.getTime())) return null

  const prevTo = new Date(currentFrom)
  prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setDate(prevFrom.getDate() - (currentLength - 1))

  return {
    from: formatInputDate(prevFrom),
    to: formatInputDate(prevTo),
  }
}

function applyQuickRange(days) {
  const normalizedDays = Number(days)
  if (!Number.isInteger(normalizedDays) || normalizedDays <= 0) return

  selectedQuickRange.value = normalizedDays
  dateTo.value = getTodayInputDate()
  dateFrom.value = getDateInputMinusDays(normalizedDays - 1)
  loadReports()
}

function mapSummary(data) {
  return {
    gross_revenue: Number(data?.summary?.gross_revenue || 0),
    estimated_profit: Number(data?.summary?.estimated_profit || 0),
    average_ticket: Number(data?.summary?.average_ticket || 0),
    delivered_orders: Number(data?.summary?.delivered_orders || 0),
    cancelled_orders: Number(data?.summary?.cancelled_orders || 0),
    items_sold: Number(data?.summary?.items_sold || 0),
  }
}

async function fetchReportsRange({ from, to, group, headers }) {
  const params = new URLSearchParams()
  params.set('from', from)
  params.set('to', to)
  params.set('group_by', group)
  params.set('top', '10')
  params.set('margin', '35')

  const response = await fetch(`${API_BASE_URL}/api/admin/reports/sales?${params.toString()}`, {
    headers,
  })
  const data = await response.json()
  return { response, data }
}

async function loadReports() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  const range = normalizeDateRange(dateFrom.value, dateTo.value)
  if (!range) {
    errorMessage.value = 'Informe intervalo de datas valido.'
    return
  }

  dateFrom.value = range.from
  dateTo.value = range.to

  loading.value = true
  errorMessage.value = ''

  try {
    const { response, data } = await fetchReportsRange({
      from: range.from,
      to: range.to,
      group: groupBy.value,
      headers,
    })

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

    summary.value = mapSummary(data)
    salesSeries.value = data.sales_series || []
    topProducts.value = data.top_products || []
    categoryShare.value = data.category_share || []
    paymentMethods.value = data.payment_methods || []

    previousSummary.value = null
    const previousRange = getPreviousRange(range.from, range.to)
    if (previousRange) {
      try {
        const previousResult = await fetchReportsRange({
          from: previousRange.from,
          to: previousRange.to,
          group: groupBy.value,
          headers,
        })
        if (previousResult.response.ok) {
          previousSummary.value = mapSummary(previousResult.data)
        }
      } catch {
        previousSummary.value = null
      }
    }
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
    radial-gradient(circle at 14% 6%, rgba(255, 255, 255, 0.9) 0%, rgba(245, 240, 234, 0.95) 34%),
    linear-gradient(180deg, #f1ebe4 0%, #f5f1ec 100%);
  min-height: 100vh;
  padding: 20px 0 34px;
}

.bf-admin-reports-shell {
  max-width: 1550px;
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
  color: #1f1a16;
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
  grid-template-columns: minmax(0, 1fr) auto 220px 160px;
  gap: 10px;
  align-items: center;
}

.bf-date-box {
  border: 1px solid #ddd3c8;
  background: #fff;
  border-radius: 10px;
  min-height: 44px;
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

.bf-quick-range {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.bf-quick-range-btn {
  min-height: 42px;
  border: 1px solid #ddd3c8;
  border-radius: 999px;
  background: #fff;
  color: #5f5247;
  padding: 0 12px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.bf-quick-range-btn.is-active {
  border-color: #eb7d25;
  color: #eb7d25;
  background: #fff5ec;
}

.bf-group-select :deep(.q-field__control),
.bf-refresh-btn {
  min-height: 42px;
  border-radius: 10px;
}

.bf-refresh-btn {
  border: 1px solid #ddd3c8;
  color: #4b4037;
  background: #fff;
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

.bf-summary-card.is-emphasis {
  border-color: #eb7d25;
  box-shadow: 0 10px 26px rgba(231, 124, 31, 0.12);
}

.bf-summary-card p {
  margin: 0;
  color: #7e7064;
  font-size: 0.81rem;
}

.bf-summary-card strong {
  display: block;
  margin-top: 4px;
  color: #2f251f;
  font-size: 1.22rem;
  line-height: 1;
}

.bf-summary-card small {
  display: block;
  margin-top: 8px;
  color: #7f7468;
  font-size: 0.77rem;
}

.bf-trend {
  font-weight: 700;
}

.bf-trend.is-up {
  color: #2d9c56;
}

.bf-trend.is-down {
  color: #d95f4b;
}

.bf-trend.is-neutral {
  color: #7f7468;
}

.bf-insights {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.bf-insight-card {
  background: linear-gradient(180deg, #ffffff 0%, #fef8f3 100%);
  border: 1px solid #eddcc9;
  border-radius: 12px;
  padding: 12px;
}

.bf-insight-card span {
  display: block;
  color: #8a7b6e;
  font-size: 0.79rem;
}

.bf-insight-card strong {
  display: block;
  margin-top: 5px;
  color: #2e241e;
  font-size: 0.95rem;
  line-height: 1.2;
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

.bf-panel-metrics {
  text-align: right;
}

.bf-panel-metrics span {
  display: block;
  color: #2f251f;
  font-size: 1.05rem;
  font-weight: 700;
}

.bf-panel-metrics small {
  display: block;
  margin-top: 2px;
  color: #83776c;
  font-size: 0.78rem;
}

.bf-empty {
  color: #756c63;
  font-size: 0.92rem;
  padding: 10px 4px;
}

.bf-chart-wrap {
  border: 1px solid #efe2d2;
  border-radius: 12px;
  padding: 10px 10px 8px;
  background: linear-gradient(180deg, #fffdfb 0%, #fff8f2 100%);
}

.bf-chart-svg {
  display: block;
  width: 100%;
  height: 280px;
}

.bf-grid-line {
  stroke: #ebdfd1;
  stroke-width: 1;
}

.bf-axis-mask {
  fill: #fffaf5;
}

.bf-axis-divider {
  stroke: #e2d3c3;
  stroke-width: 1.2;
}

.bf-grid-label {
  fill: #9f9083;
  font-size: 11px;
  font-weight: 600;
}

.bf-line-main {
  fill: none;
  stroke: #eb7d25;
  stroke-width: 3.2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.bf-line-dot {
  fill: #fff;
  stroke: #ea7b22;
  stroke-width: 3;
}

.bf-chart-labels {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.bf-chart-labels span {
  color: #7a6e62;
  font-size: 0.74rem;
  font-weight: 600;
}

.bf-top-list {
  display: grid;
  gap: 9px;
}

.bf-top-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 0.7fr) 120px;
  gap: 10px;
  align-items: center;
}

.bf-top-rank {
  min-width: 42px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid #efdcc8;
  background: #fff9f2;
  color: #dc7222;
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
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
  height: 9px;
  border-radius: 999px;
  background: #f3e8dd;
  overflow: hidden;
}

.bf-top-progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ee801f 0%, #ffc374 100%);
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

.bf-share-bar {
  margin-top: 7px;
  height: 8px;
  border-radius: 999px;
  background: #f1e6d9;
  overflow: hidden;
}

.bf-share-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ec7d20 0%, #ffc06c 100%);
}

.bf-share-bar.is-payment span {
  background: linear-gradient(90deg, #5a7ee9 0%, #8ab9ff 100%);
}

.bf-share-item small {
  display: block;
  margin-top: 5px;
  color: #7e7266;
  font-size: 0.8rem;
}

@media (max-width: 1380px) {
  .bf-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .bf-filter-bar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .bf-group-select,
  .bf-refresh-btn {
    width: 100%;
  }
}

@media (max-width: 980px) {
  .bf-filter-bar {
    grid-template-columns: 1fr;
  }

  .bf-two-panels {
    grid-template-columns: 1fr;
  }

  .bf-insights {
    grid-template-columns: 1fr;
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
    border: 1px solid #efe2d2;
    border-radius: 10px;
    padding: 10px;
  }

  .bf-top-value {
    text-align: left;
  }

  .bf-top-rank {
    width: fit-content;
  }

  .bf-chart-svg {
    height: 250px;
  }
}

@media (max-width: 560px) {
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

  .bf-quick-range {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
  }

  .bf-quick-range-btn {
    width: 100%;
    padding: 0 6px;
  }

  .bf-panel-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .bf-panel-metrics {
    text-align: left;
  }

  .bf-chart-svg {
    height: 225px;
  }
}
</style>
