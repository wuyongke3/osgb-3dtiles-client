/*
 * @Author: your name
 * @Date: 2020-11-05 10:10:53
 * @LastEditTime: 2020-11-16 14:38:30
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \front-end\src\utils\auth.js
 */
import Cookies from "js-cookie";
import { cookieCache } from ".";
import { LOGIN } from "@/enums";

// const TokenKey = 'Admin-Token'
export function getToken(TokenKey) {
  //return Cookies.get(TokenKey)
  return cookieCache.getCache(LOGIN.TOKEN);
}

export function setToken(TokenKey, token) {
  // return Cookies.set(TokenKey, token);
  return cookieCache.setCache(LOGIN.TOKEN, token);
}


export function removeToken(TokenKey) {
  return cookieCache.removeCache(LOGIN.TOKEN);
  // return Cookies.remove(TokenKey);
}

export function getUserId(IdKey) {
  return Cookies.get(IdKey);
}

export function setUserId(IdKey, Id) {
  return Cookies.set(IdKey, Id);
}

export function removeUserId(IdKey) {
  return Cookies.remove(IdKey);
}

export function setIpAdress(IpAdress, ip) {
  return Cookies.set(IpAdress, ip);
}

export function getIp(IpAdress) {
  return Cookies.get(IpAdress);
}

export function setSystemName(systemName, value) {
  return Cookies.set(systemName, value);
}
export function getSystemName(systemName) {
  return Cookies.get(systemName);
}
export function setUserName(systemName, value) {
  return Cookies.set(systemName, value);
}
export function getUserName(systemName) {
  return Cookies.get(systemName);
}
export function removeSystemName(systemName) {
  return Cookies.remove(systemName);
}

export function getCsrf() {
  return Cookies.get("XSRF-TOKEN");
}
