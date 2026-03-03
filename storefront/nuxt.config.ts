export default defineNuxtConfig({
  compatibilityDate: '2025-03-28',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_API_BASE_URL || 'http://localhost:3000/api',
      stripePublishableKey: process.env.NUXT_STRIPE_PUBLISHABLE_KEY || ''
    }
  },
  app: {
    head: {
      title: 'Demo Shop',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  }
})
