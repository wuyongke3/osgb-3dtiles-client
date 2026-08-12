<script setup lang="ts">
import { ref } from 'vue'
import { navigate } from '../router'
import BgImage from '../assets/img/abc.png'

const T_TITLE = '用户登录'; // ????
const T_BTN = '登录'; // ??
const T_HINT = '默认账号 admin / 密码 123456'; // ???? admin / ?? 123456
const T_ERR_EMPTY = '请输入用户名和密码'; // ?????????

const username = ref('admin')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = T_ERR_EMPTY
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await window.electronAPI.login(username.value, password.value)
    if (res.success && res.user) {
      sessionStorage.setItem('bs-user', JSON.stringify(res.user))
      navigate('/admin')
    } else {
      error.value = res.error || '登录失败'
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="loginbox">
      <div class="login-copy">
        <img :src="BgImage" alt="copy" />
      </div>
      <div class="login-panel">
        <h1 class="title">{{ T_TITLE }}</h1>
        <div class="form">
          <div class="login-form">
            <div class="login-form-item">
              <input v-model="username" type="text" placeholder="用户名" @keyup.enter="handleLogin" />
            </div>
            <div class="login-form-item">
              <input v-model="password" type="password" placeholder="密码" @keyup.enter="handleLogin" />
            </div>
            <p v-if="error" class="login-error">{{ error }}</p>
            <button class="login-btn" type="button" :disabled="loading" @click="handleLogin">
              {{ loading ? '登录中...' : T_BTN }}
            </button>
            <p class="login-hint">{{ T_HINT }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e3f3ff;
  width: 100%;
  height: 100%;
  margin: auto;
}
.loginbox {
  display: flex;
  flex-direction: row;
  width: 840px;
  height: 500px;
}
.login-copy {
  display: flex;
  justify-content: right;
  box-shadow: 0 0 20px rgba(80, 145, 230, 0.8);
  width: 440px;
  height: 500px;
  border-radius: 10px;
}
.login-copy img {
  margin: auto 0 auto auto;
  border-radius: 10px;
}
.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  box-sizing: border-box;
  width: 400px;
  height: 460px;
  background-color: #ffffff;
  padding: 40px 90px 60px 90px;
  border-radius: 0 10px 10px 0;
  box-shadow: 0 0 10px rgba(7, 38, 78, 0.3);
}
.title {
  padding: 8%;
  color: #409eff;
  text-align: center;
  font-size: 25px;
  font-weight: 700;
  margin: 0;
}
.form {
  display: flex;
  justify-content: center;
}
.login-form {
  width: 100%;
}
.login-form-item {
  height: 40px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  margin-bottom: 22px;
}
.login-form-item input {
  width: 100%;
  height: 38px;
  border: none;
  outline: none;
  font-size: 14px;
  color: #000;
  background: transparent;
}
.login-form-item input::placeholder {
  color: #999;
}
.login-error {
  color: #e05555;
  font-size: 12px;
  margin: -8px 0 8px;
  text-align: center;
}
.login-btn {
  width: 100%;
  padding: 0;
  height: 40px;
  background-color: #4190f8;
  color: #fff;
  font-size: 15px;
  letter-spacing: 4px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 6px;
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.login-hint {
  margin: 14px 0 0;
  text-align: center;
  font-size: 12px;
  color: #889aa4;
}
</style>
