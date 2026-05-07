<template>
  <q-page class="menu-page q-pa-md q-pa-lg-xl">
    <section class="hero-home q-mb-xl" id="sobre">
      <div class="hero-content">
        <q-badge class="home-badge" color="amber-6" text-color="dark" label="Hamburgueres Artesanais" />
        <h1 class="home-title q-my-md">O SABOR QUE VOCE MONTA DO SEU JEITO.</h1>
        <p class="home-subtitle">Faca login para acompanhar pedidos ou compre rapidamente sem cadastro.</p>

        <div class="row q-gutter-sm q-mt-md">
          <q-btn color="deep-orange-8" no-caps unelevated label="Fazer Login" @click="goLogin" />
          <q-btn color="deep-orange-8" no-caps outline label="Comprar sem login" @click="continueAsGuest" />
        </div>
      </div>

      <div class="hero-highlight"></div>
    </section>

    <section v-if="loading" class="q-py-lg">
      <q-spinner color="orange-8" size="40px" />
    </section>

    <q-banner v-else-if="errorMessage" inline-actions class="bg-red-1 text-red-9 q-mb-md rounded-borders">
      {{ errorMessage }}
    </q-banner>

    <section v-else id="menu">
      <h2 class="menu-section-title q-mb-md">MENU INICIAL</h2>
      <div class="menu-grid">
        <q-card v-for="item in menuItems" :key="item.id" class="menu-card" flat bordered>
          <q-card-section>
            <div class="menu-item-title q-mb-xs">{{ item.name }}</div>
            <div class="menu-description q-mb-md">{{ item.description }}</div>
            <div class="menu-price">R$ {{ formatPrice(item.price) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()
const menuItems = ref([])
const loading = ref(true)
const errorMessage = ref('')

function formatPrice(value) {
  return Number(value).toFixed(2).replace('.', ',')
}

function goLogin() {
  router.push('/login')
}

function continueAsGuest() {
  localStorage.setItem(
    'bf_session',
    JSON.stringify({
      mode: 'guest',
      token: null,
      user: null,
    })
  )
}

async function loadMenu() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/menu`)
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel carregar o cardapio.'
      return
    }

    menuItems.value = data.items || []
  } catch {
    errorMessage.value = 'Erro de conexao com servidor.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMenu()
})
</script>
