import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Vue Query setup
import { VueQueryPlugin, vueQueryPluginOptions } from '@/shared/services/queryClient'

// Create Vue app
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, vueQueryPluginOptions)

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error, info)

  // You can send to error tracking service here
  // trackError(error, { instance, info })
}

// Mount app
app.mount('#app')