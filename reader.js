(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FlexReader = api;
})(typeof self !== "undefined" ? self : this, function () {
  function create(options) {
    const opts = options || {};
    const setStatus = opts.setStatus || function () {};
    const asset = opts.asset || function (path) {
      return new URL(path, location.href).href;
    };
    let workerPromise = null;
    let sliceLabel = "";

    function loadImage(file) {
      return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error("画像を開けませんでした")); };
        img.src = URL.createObjectURL(file);
      });
    }

    function paintSlice(img, sy, sh, scale, mode) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, canvas.width, canvas.height);
      if (mode === "invert") {
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = image.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
        ctx.putImageData(image, 0, 0);
      }
      return canvas;
    }

    function slicesOf(img, mode) {
      const scale = img.width > 1400 ? 1400 / img.width : 1.6;
      const sliceH = Math.max(700, Math.floor(1600 / scale));
      const step = Math.max(1, sliceH - Math.round(160 / scale));
      const out = [];
      for (let y = 0; y < img.height; y += step) {
        const h = Math.min(sliceH, img.height - y);
        out.push(paintSlice(img, y, h, scale, mode));
        if (y + h >= img.height) break;
      }
      return out;
    }

    async function recognize(canvas) {
      if (typeof Tesseract === "undefined") {
        throw new Error("文字認識のファイルを読み込めませんでした。ページを開き直してください。");
      }
      if (!workerPromise) {
        const base = asset("vendor/tesseract/");
        workerPromise = Tesseract.createWorker("jpn", 1, {
          workerPath: base + "worker.min.js",
          corePath: base,
          langPath: base,
          workerBlobURL: false,
          gzip: true,
          logger: function (m) {
            if (m.status === "recognizing text") {
              setStatus(sliceLabel + " " + Math.round((m.progress || 0) * 100) + "%");
            } else if (m.status === "loading language traineddata") {
              setStatus("日本語の辞書を準備しています");
            }
          }
        }).catch(function (e) {
          workerPromise = null;
          throw e;
        });
      }
      const worker = await workerPromise;
      try {
        if (!worker.__flexReady) {
          await worker.setParameters({ tessedit_pageseg_mode: "6" });
          worker.__flexReady = true;
        }
        const result = await worker.recognize(canvas);
        return result.data.text || "";
      } catch (e) {
        try { await worker.terminate(); } catch (err) {}
        workerPromise = null;
        throw e;
      }
    }

    async function readMode(img, mode) {
      const parts = slicesOf(img, mode);
      let text = "";
      for (let i = 0; i < parts.length; i++) {
        sliceLabel = "文字を読んでいます " + (i + 1) + "/" + parts.length;
        setStatus(sliceLabel);
        try {
          text += "\n" + await recognize(parts[i]);
        } catch (e) {
          text += "\n";
        }
      }
      return text;
    }

    async function readFile(file) {
      const img = await loadImage(file);
      if (img.width < 500) {
        throw new Error("画像の横幅が" + img.width + "pxしかありません。番地が潰れて読めません。スマホの写真アプリにある元の長尺ファイル（横1000px前後）を選んでください。");
      }
      const plain = await readMode(img, "plain");
      if (FlexPlanner.parseFlexText(plain).length) return plain;
      const inverted = await readMode(img, "invert");
      return FlexPlanner.parseFlexText(inverted).length ? inverted : plain;
    }

    return { readFile: readFile };
  }

  return { create: create };
});
