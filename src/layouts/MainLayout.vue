<template>
  <q-layout view="lHh lpr lFf" class="site-layout">
    <q-header class="bg-transparent text-dark" elevated>
      <q-toolbar class="toolbar-shell">
        <div class="brand-wrap row items-center no-wrap">
          <img :src="logo" alt="Burger Factory" class="brand-logo" />
          <q-toolbar-title class="text-weight-bold brand-title">Burger Factory</q-toolbar-title>
        </div>

        <q-btn v-if="isOnMenu" flat no-caps color="dark" label="Sair" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from 'src/assets/logoburguerfactory.png.png'

const route = useRoute()
const router = useRouter()

const isOnMenu = computed(() => route.path === '/lanches')

function logout() {
  localStorage.removeItem('bf_session')
  router.push('/login')
}
</script>
