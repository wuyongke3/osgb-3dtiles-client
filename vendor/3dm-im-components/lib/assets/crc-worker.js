var a = /* @__PURE__ */ ((e) => (e[e._1KB = 1024] = "_1KB", e[e._1MB = 1048576] = "_1MB", e[e._10MB = 10485760] = "_10MB", e[e._16MB = 16777216] = "_16MB", e[e._1GB = 1073741824] = "_1GB", e[e._2GB = 2147483648] = "_2GB", e[e._100GB = 107374182400] = "_100GB", e[e._1TB = 1099511627776] = "_1TB", e))(a || {}), l = /* @__PURE__ */ ((e) => (e._3DM_BIG_FILE_UPLOAD = "_3dm_bil_file_upload", e))(l || {});
function f(e, t = 4294967295, n = 0, r = !0) {
  const o = b();
  for (let i = 0; i < (n || e.byteLength); i++)
    t = t >> 8 & 16777215 ^ o[t & 255 ^ e[i]];
  return r && (t = (t ^ -1) >>> 0), t;
}
function b() {
  const e = new Array(256);
  let t, n, r;
  for (t = 0; t < 256; t++) {
    for (r = t, n = 0; n < 8; n++)
      r & 1 ? r = r >> 1 & 2147483647 ^ 3988292384 : r = r >> 1 & 2147483647;
    e[t] = r;
  }
  return e;
}
function y(e, t) {
  const n = e.byteLength + t.byteLength, r = new Uint8Array(n);
  return r.set(new Uint8Array(e), 0), r.set(new Uint8Array(t), e.byteLength), r.buffer;
}
function d(e, t, n) {
  return new Promise((r) => {
    let o = t, i = new ArrayBuffer(0), c = 0;
    e.read().then(function u({
      done: B,
      value: s
    }) {
      if (B) {
        console.log(`readStream() complete. Total bytes: ${o}`);
        return;
      }
      return i = y(i, s.buffer), c += s.byteLength, o += s.byteLength, o == n ? r({ buffer: i, offset: c, bytesReceivedTemp: o }) : c >= a._16MB ? r({ buffer: i, offset: c, bytesReceivedTemp: o }) : e.read().then(u);
    });
  });
}
async function g(e, t) {
  let n = 4294967295;
  const r = e.stream().getReader();
  let o = 0;
  for (console.time("crc生成时间"); ; ) {
    const i = await d(r, o, t.fileSize);
    if (o = i.bytesReceivedTemp, o == t.fileSize) {
      n = f(new Uint8Array(i.buffer), n, i.offset);
      break;
    }
    if (o > t.fileSize)
      throw console.error("读取的文件大于其文件本身大小"), Error("未知错误");
    n = f(new Uint8Array(i.buffer), n, 0, !1);
  }
  return new Promise((i) => {
    r.cancel(), console.timeEnd("crc生成时间"), i(n);
  });
}
onmessage = async (e) => {
  const { file: t, fileInfo: n, source: r } = e.data;
  if (!Object.is(r, l._3DM_BIG_FILE_UPLOAD))
    return;
  const o = await g(t, n);
  postMessage({ res: o });
};
