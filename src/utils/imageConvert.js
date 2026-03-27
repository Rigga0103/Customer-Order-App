export const convertToWebp = (file, size = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Maintain aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > size) {
            height *= size / width;
            width = size;
          }
        } else {
          if (height > size) {
            width *= size / height;
            height = size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = file.name.split('.')[0] + '.webp';
              const webpFile = new File([blob], fileName, { type: 'image/webp' });
              resolve(webpFile);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          "image/webp",
          0.8
        );
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
