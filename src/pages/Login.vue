<script setup lang="ts">
import { ref } from "vue";
import { navigate } from "../router";
import BgImage from "../assets/img/loginback.jpg";

const T_TITLE = "矿业综合管理平台";
const T_BTN = "进入系统";
const T_ERR_EMPTY = "请输入用户名和密码";

const username = ref("admin");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = T_ERR_EMPTY;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const res = await window.electronAPI.login(username.value, password.value);
    if (res.success && res.user) {
      sessionStorage.setItem("bs-user", JSON.stringify(res.user));
      navigate("/admin");
    } else {
      error.value = res.error || "登录失败";
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message || "登录失败";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="login-container"
    :style="{ backgroundImage: 'url(' + BgImage + ')' }"
  >
    <div class="login-mask"></div>
    <div class="login-card">
      <div class="login-head">
        <h1 class="title">{{ T_TITLE }}</h1>
      </div>
      <div class="login-form">
        <div class="login-form-item">
          <span class="login-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            v-model="username"
            type="text"
            placeholder="用户名"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="login-form-item">
          <span class="login-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            v-model="password"
            type="password"
            placeholder="密码"
            @keyup.enter="handleLogin"
          />
        </div>
        <p v-if="error" class="login-error">{{ error }}</p>
        <button
          class="login-btn"
          type="button"
          :disabled="loading"
          @click="handleLogin"
        >
          {{ loading ? "登录中..." : T_BTN }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #0b1e3d;
  overflow: hidden;
  background-size: cover;
}
.login-mask {
  position: absolute;
  inset: 0;
  background: rgba(6, 22, 48, 0.35);
}
.login-card {
  position: relative;
  width: 620px;
  padding: 54px 64px 48px;
  box-sizing: border-box;
  border-radius: 12px;
  box-shadow: 0 18px 50px rgba(7, 38, 78, 0.35);
}
.login-head {
  margin-bottom: 42px;
}
.title {
  margin: 0;
  text-align: center;
  font-size: 32px;
  font-weight: 500;
  letter-spacing: 6px;
  color: #ffffff;
}
.login-form-item {
  display: flex;
  align-items: center;
  height: 50px;
  margin-bottom: 24px;
  padding: 0 16px;
  background: #f2f6fc;
  border: 1px solid #d9e5f5;
  border-radius: 6px;
  transition: border-color 0.2s;
}
.login-form-item:focus-within {
  border-color: #2f7cf6;
}
.login-icon {
  display: inline-flex;
  color: #7d93b3;
  margin-right: 10px;
}
.login-form-item input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #22344f;
}
.login-form-item input::placeholder {
  color: #9aa9bf;
}
.login-error {
  margin: -8px 0 12px;
  text-align: center;
  color: #e05555;
  font-size: 13px;
}
.login-btn {
  width: 100%;
  height: 50px;
  margin-top: 8px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(90deg, #2f7cf6, #4d9bff);
  color: #fff;
  font-size: 17px;
  letter-spacing: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.login-btn:hover:not(:disabled) {
  opacity: 0.92;
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
