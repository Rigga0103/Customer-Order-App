export const convertToWebp = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      const size = 300; // profile image size
      canvas.width = size;
      canvas.height = size;

      // Center and crop to square
      const minSize = Math.min(img.width, img.height);
      const offsetX = (img.width - minSize) / 2;
      const offsetY = (img.height - minSize) / 2;

      ctx.drawImage(img, offsetX, offsetY, minSize, minSize, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/webP",
        0.8
      );
    };

    img.src = URL.createObjectURL(file);
  });
};
