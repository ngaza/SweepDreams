// Keep small originals unchanged; resize larger photos locally before upload.
export async function prepareProofPhoto(file) {
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size > 15 * 1024 * 1024
  )
    throw Error("Choose a JPEG or PNG photo up to 15 MB.");
  const read = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(Error("Unable to read photo."));
      reader.readAsDataURL(blob);
    });
  if (file.size <= 1024 * 1024) return read(file);
  const bitmap = await createImageBitmap(file);
  try {
    let longest = Math.min(1920, Math.max(bitmap.width, bitmap.height));
    for (let pass = 0; pass < 5; pass++) {
      const scale = Math.min(
        1,
        longest / Math.max(bitmap.width, bitmap.height),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Unable to process photo.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.9, 0.8, 0.7]) {
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality),
        );
        if (blob && blob.size <= 1024 * 1024) return read(blob);
      }
      longest = Math.round(longest * 0.8);
    }
    throw Error("Unable to resize this photo. Please choose a smaller image.");
  } finally {
    bitmap.close();
  }
}
