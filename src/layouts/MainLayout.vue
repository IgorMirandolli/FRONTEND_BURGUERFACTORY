<template>
  <q-layout view="lHh lpr lFf" class="site-layout">
    <q-header v-if="!isLoginPage" class="topbar" reveal>
      <q-toolbar class="topbar-inner">
        <div class="brand-wrap row items-center no-wrap">
          <img :src="logo" alt="Burger Factory" class="brand-logo" />
          <q-toolbar-title class="text-weight-bold brand-title">BURGUERFACTORY</q-toolbar-title>
        </div>

        <nav class="nav-links row items-center no-wrap">
          <a href="#menu" class="nav-link">Cardapio</a>
          <a href="#sobre" class="nav-link">Sobre</a>
          <q-btn flat no-caps class="enter-btn" label="Entrar" @click="goLogin" />
        </nav>
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
const isLoginPage = computed(() => route.path === '/login')

function goLogin() {
  router.push('/login')
}
</script>
