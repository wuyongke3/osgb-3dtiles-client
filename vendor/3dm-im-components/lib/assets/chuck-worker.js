var f = /* @__PURE__ */ ((e) => (e[e._1KB = 1024] = "_1KB", e[e._1MB = 1048576] = "_1MB", e[e._10MB = 10485760] = "_10MB", e[e._16MB = 16777216] = "_16MB", e[e._1GB = 1073741824] = "_1GB", e[e._2GB = 2147483648] = "_2GB", e[e._100GB = 107374182400] = "_100GB", e[e._1TB = 1099511627776] = "_1TB", e))(f || {}), c = /* @__PURE__ */ ((e) => (e._3DM_BIG_FILE_UPLOAD = "_3dm_bil_file_upload", e))(c || {});
function y(e, r) {
  const i = e.byteLength + r.byteLength, t = new Uint8Array(i);
  return t.set(new Uint8Array(e), 0), t.set(new Uint8Array(r), e.byteLength), t.buffer;
}
function b(e, r, i) {
  return new Promise((t) => {
    let n = r, s = new ArrayBuffer(0), B = 0;
    e.read().then(function u({
      done: _,
      value: a
    }) {
      if (_) {
        console.log(`readStream() complete. Total bytes: ${n}`);
        return;
      }
      return s = y(s, a.buffer), B += a.byteLength, n += a.byteLength, n == i ? t({ buffer: s, offset: B, bytesReceivedTemp: n }) : B >= f._16MB ? t({ buffer: s, offset: B, bytesReceivedTemp: n }) : e.read().then(u);
    });
  });
}
let o;
onmessage = async (e) => {
  const { file: r, bytesReceived: i, fileSize: t, source: n } = e.data;
  if (!Object.is(n, c._3DM_BIG_FILE_UPLOAD))
    return;
  !o && (o = r.stream().getReader());
  const s = await b(o, i, t);
  postMessage({ res: s });
};
