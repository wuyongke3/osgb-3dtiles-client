<script setup lang="ts">
import { computed, watch } from 'vue'
import { route, isLoggedIn, navigate } from './router'
import Login from './pages/Login.vue'
import Admin from './pages/Admin.vue'
import Front from './pages/Front.vue'

const view = computed(() => {
  if (route.path === '/admin' || route.path === '/front') {
    if (!isLoggedIn()) {
      navigate('/login')
      return 'login'
    }
    return route.path === '/admin' ? 'admin' : 'front'
  }
  return 'login'
})

watch(
  () => route.path,
  (path) => {
    // yitai.css (后台深色科技风) 只在后台页面挂 body.dark 时生效，不影响前台
    if (path === '/admin') {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  },
  { immediate: true },
)
</script>

<template>
  <Login v-if="view === 'login'" />
  <Admin v-else-if="view === 'admin'" />
  <Front v-else-if="view === 'front'" />
</template>
