<template>
  <q-page class="bf-checkout-page">
    <div class="bf-checkout-shell">
      <button type="button" class="bf-back-link" @click="goMenu">
        <q-icon name="arrow_back" size="20px" />
        <span>Voltar para o cardapio</span>
      </button>

      <header class="bf-page-head">
        <h1 class="bf-page-title">Finalizar pedido</h1>
        <p class="bf-page-subtitle">Revise seus dados e escolha a forma de pagamento.</p>
      </header>

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
        {{ errorMessage }}
      </q-banner>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9 q-mb-md rounded-borders">
        {{ successMessage }}
      </q-banner>

      <div class="bf-checkout-grid">
        <section class="bf-checkout-main">
          <article class="bf-block">
            <header class="bf-block-head">
              <span class="bf-step">1</span>
              <h2>Seus dados</h2>
            </header>

            <div class="bf-fields bf-two-cols">
              <q-input v-model="form.customer_name" outlined dense label="Nome completo" class="bf-input" />
              <q-input
                v-model="form.customer_phone"
                outlined
                dense
                label="Numero de telefone"
                mask="(##) #####-####"
                fill-mask
                class="bf-input"
              />
            </div>
          </article>

          <article class="bf-block">
            <header class="bf-block-head">
              <span class="bf-step">2</span>
              <h2>Endereco de entrega</h2>
            </header>

            <div class="bf-fields bf-two-cols">
              <q-input v-model="form.cep" outlined dense label="CEP" class="bf-input">
                <template #append>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-input v-model="form.street" outlined dense label="Rua" class="bf-input" />
            </div>

            <div class="bf-fields bf-three-cols">
              <q-input v-model="form.address_number" outlined dense label="Numero" class="bf-input" />
              <q-input v-model="form.complement" outlined dense label="Complemento (opcional)" class="bf-input" />
              <q-input v-model="form.district" outlined dense label="Bairro" class="bf-input" />
            </div>

            <div class="bf-fields bf-two-cols-city">
              <q-input v-model="form.city" outlined dense label="Cidade" class="bf-input" />
              <q-input v-model="form.state" outlined dense label="Estado" class="bf-input" />
            </div>
          </article>

          <article class="bf-block">
            <header class="bf-block-head">
              <span class="bf-step">3</span>
              <h2>Forma de pagamento</h2>
            </header>

            <div class="bf-payment-list">
              <button
                v-for="method in paymentOptions"
                :key="method.value"
                type="button"
                class="bf-payment-item"
                :class="{ 'is-active': selectedPaymentMethod === method.value }"
                @click="selectedPaymentMethod = method.value"
              >
                <span class="bf-payment-radio" :class="{ 'is-active': selectedPaymentMethod === method.value }">
                  <span class="bf-payment-dot" />
                </span>
                <q-icon :name="method.icon" size="24px" class="bf-payment-icon" />
                <span class="bf-payment-text">
                  <strong>{{ method.label }}</strong>
                  <small>{{ method.subtitle }}</small>
                </span>
                <span v-if="method.badge" class="bf-payment-badge">{{ method.badge }}</span>
              </button>
            </div>
          </article>

          <article class="bf-block">
            <header class="bf-block-head">
              <span class="bf-step">4</span>
              <h2>Observacao (opcional)</h2>
            </header>

            <q-input
              v-model="form.notes"
              type="textarea"
              outlined
              autogrow
              maxlength="120"
              counter
              label="Ex.: Sem cebola, molho a parte, ponto da carne..."
              class="bf-input bf-notes-input"
            />
          </article>
        </section>

        <aside class="bf-summary-wrap">
          <div class="bf-summary-card">
            <h2 class="bf-summary-title">Resumo do pedido</h2>

            <div v-if="loadingCart" class="row justify-center q-py-lg">
              <q-spinner color="deep-orange-8" size="34px" />
            </div>

            <div v-else-if="cartItems.length === 0" class="bf-empty-cart">
              Seu carrinho esta vazio.
            </div>

            <template v-else>
              <div class="bf-summary-items">
                <article v-for="item in cartItems" :key="item.id" class="bf-summary-item">
                  <div class="bf-summary-thumb-wrap">
                    <img :src="resolveImageUrl(item.imageUrl)" :alt="item.name" class="bf-summary-thumb" />
                    <span class="bf-summary-qty">{{ item.quantity }}x</span>
                  </div>

                  <div class="bf-summary-info">
                    <h3>{{ item.name }}</h3>
                    <p>{{ item.notes || defaultCardSubtitle }}</p>
                  </div>

                  <strong class="bf-summary-price">R$ {{ formatPrice(item.unit_price * item.quantity) }}</strong>
                </article>
              </div>

              <div class="bf-summary-totals">
                <div class="bf-total-line">
                  <span>Subtotal</span>
                  <strong>R$ {{ formatPrice(subtotal) }}</strong>
                </div>
                <div class="bf-total-line">
                  <span>Taxa de entrega</span>
                  <strong>R$ {{ formatPrice(deliveryFee) }}</strong>
                </div>
                <div class="bf-total-line bf-total-final">
                  <span>Total</span>
                  <strong>R$ {{ formatPrice(grandTotal) }}</strong>
                </div>
              </div>

              <div class="bf-extra-boxes">
                <div class="bf-extra-box">
                  <q-icon name="schedule" size="22px" class="bf-extra-icon" />
                  <div>
                    <strong>Previsao de entrega</strong>
                    <p>25-35 min</p>
                  </div>
                </div>

                <div class="bf-extra-box">
                  <q-icon name="location_on" size="22px" class="bf-extra-icon" />
                  <div>
                    <strong>Endereco de entrega</strong>
                    <p>{{ deliveryAddressPreview }}</p>
                  </div>
                </div>

                <div class="bf-extra-box">
                  <q-icon name="receipt_long" size="22px" class="bf-extra-icon" />
                  <div>
                    <strong>Itens</strong>
                    <p>{{ itemCount }} itens</p>
                  </div>
                </div>
              </div>

              <q-btn
                class="bf-confirm-btn"
                no-caps
                unelevated
                icon="shopping_bag"
                label="Confirmar pedido"
                :loading="loadingSubmit"
                :disable="cartItems.length === 0"
                @click="submitOrder"
              />

              <p class="bf-security-note">
                <q-icon name="verified_user" size="18px" />
                Seus dados estao seguros
              </p>
            </template>
          </div>
        </aside>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()
const cartItems = ref([])
const cartTotal = ref(0)
const loadingCart = ref(false)
const loadingSubmit = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const selectedPaymentMethod = ref('pix')
const deliveryFee = 6
const defaultCardSubtitle = 'Pedido Burger Factory.'

const form = ref({
  customer_name: '',
  customer_phone: '',
  cep: '',
  street: '',
  address_number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  notes: '',
})

const paymentOptions = [
  { value: 'pix', label: 'Pix', subtitle: 'Aprovacao imediata', icon: 'qr_code_2', badge: 'Aprovacao imediata' },
  { value: 'card', label: 'Cartao de credito', subtitle: 'Ate 12x com juros', icon: 'credit_card' },
  { value: 'cash', label: 'Dinheiro', subtitle: 'Pagamento na entrega', icon: 'payments' },
]

const subtotal = computed(() => Number(cartTotal.value || 0))
const grandTotal = computed(() => subtotal.value + deliveryFee)
const itemCount = computed(() =>
  cartItems.value.reduce((accumulator, item) => accumulator + Number(item.quantity || 0), 0)
)

const deliveryAddressPreview = computed(() => {
  const streetPart = [form.value.street, form.value.address_number].filter(Boolean).join(', ')
  const districtPart = form.value.district || 'Centro'
  const cityPart = form.value.city || 'Sao Paulo'
  const statePart = form.value.state || 'SP'
  const cepPart = form.value.cep || '01000-000'

  return `${streetPart || 'Rua das Flores, 123'}, ${districtPart} - ${cityPart}/${statePart}, ${cepPart}`
})

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return '/menu/combo-smash.webp'
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
}

function goMenu() {
  router.push('/lanches')
}

function getOrCreateGuestSessionId() {
  const existing = localStorage.getItem('bf_guest_session_id')
  if (existing) return existing

  const generated = crypto.randomUUID()
  localStorage.setItem('bf_guest_session_id', generated)
  return generated
}

function getCartContext() {
  const session = JSON.parse(localStorage.getItem('bf_session') || '{}')
  const token = session.token || null
  const isAuth = session.mode === 'auth' && token
  const sessionId = getOrCreateGuestSessionId()

  const headers = {}
  if (isAuth) {
    headers.Authorization = `Bearer ${token}`
  }

  return { headers, isAuth, sessionId, user: session.user || null }
}

function paymentMethodToBackend() {
  if (selectedPaymentMethod.value === 'pix') return 'app_pix'
  if (selectedPaymentMethod.value === 'card') return 'delivery_card_credit'
  return 'delivery_cash'
}

function buildDeliveryAddress() {
  const parts = [
    [form.value.street, form.value.address_number].filter(Boolean).join(', '),
    form.value.complement,
    form.value.district,
    [form.value.city, form.value.state].filter(Boolean).join('/'),
    form.value.cep ? `CEP ${form.value.cep}` : '',
  ].filter(Boolean)

  return parts.join(' - ')
}

async function loadCart() {
  loadingCart.value = true
  errorMessage.value = ''

  try {
    const { headers, isAuth, sessionId, user } = getCartContext()
    let url = `${API_BASE_URL}/api/cart`

    if (!isAuth) {
      url += `?session_id=${encodeURIComponent(sessionId)}`
    }

    if (user?.name) {
      form.value.customer_name = user.name
    }

    const response = await fetch(url, { headers })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel carregar carrinho.'
      return
    }

    cartItems.value = data.items || []
    cartTotal.value = Number(data.total || 0)
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar carrinho.'
  } finally {
    loadingCart.value = false
  }
}

async function submitOrder() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.value.customer_name || !form.value.customer_phone) {
    errorMessage.value = 'Preencha nome e telefone.'
    return
  }

  if (!form.value.street || !form.value.address_number || !form.value.city || !form.value.state) {
    errorMessage.value = 'Preencha endereco completo para entrega.'
    return
  }

  if (cartItems.value.length === 0) {
    errorMessage.value = 'Seu carrinho esta vazio.'
    return
  }

  loadingSubmit.value = true

  try {
    const { headers, isAuth, sessionId } = getCartContext()
    let url = `${API_BASE_URL}/api/cart/checkout`

    if (!isAuth) {
      url += `?session_id=${encodeURIComponent(sessionId)}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: form.value.customer_name,
        customer_phone: form.value.customer_phone,
        delivery_address: buildDeliveryAddress(),
        payment_method: paymentMethodToBackend(),
        notes: form.value.notes || null,
        ...(isAuth ? {} : { session_id: sessionId }),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel finalizar pedido.'
      return
    }

    successMessage.value = 'Pedido finalizado com sucesso.'
    cartItems.value = []
    cartTotal.value = 0
    window.dispatchEvent(new Event('bf-cart-updated'))
    router.push('/pedidos')
  } catch {
    errorMessage.value = 'Erro de conexao ao finalizar pedido.'
  } finally {
    loadingSubmit.value = false
  }
}

onMounted(() => {
  loadCart()
})
</script>

<style scoped>
.bf-checkout-page {
  background: var(--bf-page-bg);
  padding: 26px 0 36px;
}

.bf-checkout-shell {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 24px;
}

.bf-back-link {
  border: 0;
  background: transparent;
  color: #ed761f;
  font-size: 1.05rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0;
}

.bf-page-head {
  margin-top: 14px;
  margin-bottom: 24px;
}

.bf-page-title {
  margin: 0;
  color: #1f130f;
  font-size: clamp(2rem, 2.7vw, 3rem);
  line-height: 1;
}

.bf-page-subtitle {
  margin: 10px 0 0;
  color: #67594d;
  font-size: 1.08rem;
}

.bf-checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(360px, 0.95fr);
  gap: 18px;
  align-items: start;
}

.bf-checkout-main {
  display: grid;
  gap: 14px;
}

.bf-block {
  border: 1px solid #f0e2d3;
  border-radius: 14px;
  background: #ffffff;
  padding: 12px;
}

.bf-block-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.bf-block-head h2 {
  margin: 0;
  color: #1f140f;
  font-size: 1.95rem;
}

.bf-step {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ef7b20;
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
}

.bf-fields {
  display: grid;
  gap: 10px;
}

.bf-two-cols {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bf-three-cols {
  margin-top: 10px;
  grid-template-columns: 0.95fr 1fr 0.95fr;
}

.bf-two-cols-city {
  margin-top: 10px;
  grid-template-columns: 2fr 0.9fr;
}

.bf-input :deep(.q-field__control) {
  border-radius: 10px;
  background: #ffffff;
}

.bf-payment-list {
  display: grid;
  gap: 10px;
}

.bf-payment-item {
  border: 1px solid #f0dfcd;
  border-radius: 10px;
  background: #ffffff;
  min-height: 68px;
  display: grid;
  grid-template-columns: 26px 28px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
}

.bf-payment-item.is-active {
  border-color: #ef7b20;
  box-shadow: 0 0 0 1px rgba(239, 123, 32, 0.16) inset;
}

.bf-payment-radio {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid #e0c7a8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bf-payment-radio.is-active {
  border-color: #ef7b20;
}

.bf-payment-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: transparent;
}

.bf-payment-radio.is-active .bf-payment-dot {
  background: #ef7b20;
}

.bf-payment-icon {
  color: #522b16;
}

.bf-payment-text {
  display: grid;
}

.bf-payment-text strong {
  color: #2b1b13;
  font-size: 1.05rem;
  line-height: 1.1;
}

.bf-payment-text small {
  color: #6d5f54;
  margin-top: 2px;
  font-size: 0.94rem;
}

.bf-payment-badge {
  border-radius: 999px;
  background: #d9f0d8;
  color: #2e7d32;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 5px 10px;
}

.bf-notes-input :deep(textarea) {
  min-height: 72px;
}

.bf-summary-wrap {
  position: sticky;
  top: 110px;
}

.bf-summary-card {
  border: 1px solid #f0e2d3;
  border-radius: 14px;
  background: #ffffff;
  padding: 16px;
}

.bf-summary-title {
  margin: 0;
  color: #1e140f;
  font-size: 2.1rem;
}

.bf-empty-cart {
  margin-top: 14px;
  color: #6f6257;
}

.bf-summary-items {
  margin-top: 12px;
  display: grid;
  gap: 14px;
}

.bf-summary-item {
  display: grid;
  grid-template-columns: 108px 1fr auto;
  gap: 12px;
  align-items: start;
}

.bf-summary-thumb-wrap {
  position: relative;
}

.bf-summary-thumb {
  width: 108px;
  height: 84px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #f0e2d3;
}

.bf-summary-qty {
  position: absolute;
  right: 5px;
  top: 5px;
  border-radius: 9px;
  background: #f7e7d8;
  color: #9a521f;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 2px 7px;
}

.bf-summary-info h3 {
  margin: 4px 0 4px;
  font-size: 1.12rem;
  color: #2a1a13;
}

.bf-summary-info p {
  margin: 0;
  color: #695c50;
  font-size: 0.96rem;
  line-height: 1.4;
}

.bf-summary-price {
  margin-top: 8px;
  color: #2a1a13;
  font-size: 1.02rem;
  white-space: nowrap;
}

.bf-summary-totals {
  border-top: 1px solid #f0e2d3;
  margin-top: 14px;
  padding-top: 14px;
  display: grid;
  gap: 8px;
}

.bf-total-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #39271d;
}

.bf-total-final {
  margin-top: 6px;
}

.bf-total-final span,
.bf-total-final strong {
  color: #ef7b20;
  font-size: 1.38rem;
}

.bf-extra-boxes {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.bf-extra-box {
  border: 1px solid #f0e2d3;
  border-radius: 10px;
  padding: 12px;
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 10px;
  align-items: start;
}

.bf-extra-icon {
  color: #9a5828;
}

.bf-extra-box strong {
  display: block;
  color: #2f1d14;
  font-size: 1.03rem;
}

.bf-extra-box p {
  margin: 3px 0 0;
  color: #6c5f54;
  font-size: 0.95rem;
  line-height: 1.4;
}

.bf-confirm-btn {
  width: 100%;
  margin-top: 14px;
  height: 56px;
  border-radius: 10px;
  background: linear-gradient(90deg, #ef7b20 0%, #f56c00 100%);
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 700;
}

.bf-security-note {
  margin: 14px 0 0;
  color: #4f4035;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 1120px) {
  .bf-checkout-grid {
    grid-template-columns: 1fr;
  }

  .bf-summary-wrap {
    position: static;
  }
}

@media (max-width: 780px) {
  .bf-checkout-shell {
    padding: 0 12px;
  }

  .bf-two-cols,
  .bf-three-cols,
  .bf-two-cols-city {
    grid-template-columns: 1fr;
  }

  .bf-summary-item {
    grid-template-columns: 96px 1fr;
  }

  .bf-summary-price {
    grid-column: 2;
    margin-top: 2px;
  }
}
</style>
