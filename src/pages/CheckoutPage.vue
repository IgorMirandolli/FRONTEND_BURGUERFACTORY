<template>
  <q-page class="checkout-page q-pa-md q-pa-lg-xl">
    <div class="checkout-wrap">
      <section class="checkout-main">
        <h1 class="checkout-title q-mb-xs">Finalizar pedido</h1>
        <p class="checkout-subtitle q-mb-lg">Complete os dados para confirmar sua compra.</p>

        <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
          {{ errorMessage }}
        </q-banner>
        <q-banner v-if="successMessage" class="bg-green-1 text-green-9 q-mb-md rounded-borders">
          {{ successMessage }}
        </q-banner>

        <q-card class="checkout-form-card" flat bordered>
          <q-card-section class="q-gutter-md">
            <q-input v-model="form.customer_name" label="Nome" outlined dense />
            <q-input v-model="form.customer_phone" label="Telefone" outlined dense mask="(##) #####-####" fill-mask />
            <q-input v-model="form.delivery_address" label="Endereco de entrega" outlined dense />
            <q-input v-model="form.address_number" label="Numero" outlined dense />

            <q-select
              v-model="form.payment_method"
              :options="paymentOptions"
              label="Forma de pagamento"
              outlined
              dense
              emit-value
              map-options
            />

            <q-input v-model="form.notes" label="Observacoes (opcional)" type="textarea" outlined autogrow />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat no-caps label="Voltar ao cardapio" @click="goMenu" />
            <q-btn color="deep-orange-8" no-caps unelevated label="Confirmar pedido" :loading="loadingSubmit" @click="submitOrder" />
          </q-card-actions>
        </q-card>
      </section>

      <aside class="checkout-aside">
        <q-card class="checkout-summary-card" flat bordered>
          <q-card-section>
            <div class="text-h6 text-weight-bold">Resumo do pedido</div>
          </q-card-section>
          <q-separator />

          <q-card-section v-if="loadingCart" class="row justify-center q-py-lg">
            <q-spinner color="deep-orange-8" size="30px" />
          </q-card-section>

          <q-card-section v-else-if="cartItems.length === 0" class="text-grey-7">
            Seu carrinho esta vazio.
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="item in cartItems" :key="item.id">
              <q-item-section>
                <q-item-label>{{ item.name }}</q-item-label>
                <q-item-label caption>Qtd: {{ item.quantity }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-weight-bold">R$ {{ formatPrice(item.unit_price * item.quantity) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator />
          <q-card-section class="row items-center justify-between text-subtitle1 text-weight-bold">
            <span>Total</span>
            <span>R$ {{ formatPrice(cartTotal) }}</span>
          </q-card-section>
        </q-card>

        <q-card class="checkout-status-card q-mt-md" flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">Status do pedido (em breve)</div>
            <p class="q-mt-sm q-mb-none text-grey-7">
              Esta pagina ja fica pronta para receber rastreamento: recebido, preparando e saiu para entrega.
            </p>
          </q-card-section>
        </q-card>
      </aside>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()
const cartItems = ref([])
const cartTotal = ref(0)
const loadingCart = ref(false)
const loadingSubmit = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = ref({
  customer_name: '',
  customer_phone: '',
  delivery_address: '',
  address_number: '',
  payment_method: 'pix',
  notes: '',
})

const paymentOptions = [
  { label: 'Pix', value: 'pix' },
  { label: 'Cartao', value: 'cartao' },
  { label: 'Dinheiro', value: 'dinheiro' },
]

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
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

  if (!form.value.customer_name || !form.value.delivery_address || !form.value.payment_method) {
    errorMessage.value = 'Nome, endereco e forma de pagamento sao obrigatorios.'
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
        ...form.value,
        delivery_address: form.value.address_number
          ? `${form.value.delivery_address}, ${form.value.address_number}`
          : form.value.delivery_address,
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
