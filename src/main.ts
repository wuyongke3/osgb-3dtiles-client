import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import 'mars3d/dist/mars3d.css'
import 'mars3d-cesium/Build/Cesium/Widgets/widgets.css'
import '3dm-im-components/lib/style.css'

import './style.css'
import './assets/yitai.css'

const app = createApp(App)
app.use(createPinia())
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
