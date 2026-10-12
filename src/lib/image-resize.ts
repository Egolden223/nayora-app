export function fileToResizedDataUrl(
  file: File,
  { maxSize = 1024, quality = 0.82 }: { maxSize?: number; quality?: number } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas unsupported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function makeBlurDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("decode failed"));
    img.onload = () => {
      const ratio = img.width / img.height;
      const small = document.createElement("canvas");
      small.width = ratio >= 1 ? 12 : Math.max(8, Math.round(12 * ratio));
      small.height = ratio >= 1 ? Math.max(8, Math.round(12 / ratio)) : 12;
      const sctx = small.getContext("2d");
      if (!sctx) return reject(new Error("canvas unsupported"));
      sctx.drawImage(img, 0, 0, small.width, small.height);
      const big = document.createElement("canvas");
      big.width = small.width * 10;
      big.height = small.height * 10;
      const bctx = big.getContext("2d");
      if (!bctx) return reject(new Error("canvas unsupported"));
      bctx.imageSmoothingEnabled = true;
      bctx.imageSmoothingQuality = "high";
      bctx.drawImage(small, 0, 0, big.width, big.height);
      resolve(big.toDataURL("image/jpeg", 0.6));
    };
    img.src = dataUrl;
  });
}
