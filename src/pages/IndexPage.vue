<template>
  <q-page class="menu-page q-pa-md q-pa-lg-xl">
    <section class="hero q-mb-xl">
      <div>
        <div class="text-overline text-weight-bold brand-overline">Burger Factory</div>
        <h1 class="hero-title q-my-sm">Lanches da Casa</h1>
        <p class="hero-subtitle">Escolha seu combo favorito. Sabor intenso, preparo rapido e qualidade artesanal.</p>
      </div>

      <q-badge color="orange-8" text-color="white" class="session-badge" :label="sessionLabel" />
    </section>

    <section v-if="loading" class="q-py-lg">
      <q-spinner color="orange-8" size="40px" />
    </section>

    <q-banner v-else-if="errorMessage" inline-actions class="bg-red-1 text-red-9 q-mb-md rounded-borders">
      {{ errorMessage }}
    </q-banner>

    <section v-else class="menu-grid">
      <q-card v-for="item in menuItems" :key="item.id" class="menu-card" flat bordered>
        <q-card-section>
          <div class="row items-center justify-between no-wrap q-mb-sm">
            <div class="menu-item-title">{{ item.name }}</div>
            <div class="menu-price">R$ {{ formatPrice(item.price) }}</div>
          </div>
          <div class="menu-description">{{ item.description }}</div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn no-caps unelevated color="dark" label="Adicionar" class="add-btn" />
        </q-card-actions>
      </q-card>
    </section>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const session = JSON.parse(localStorage.getItem('bf_session') || '{}')

const sessionLabel = session.mode === 'auth' ? 'Cliente logado' : 'Visitante'
const menuItems = ref([])
const loading = ref(true)
const errorMessage = ref('')

function formatPrice(value) {
  return Number(value).toFixed(2).replace('.', ',')
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
