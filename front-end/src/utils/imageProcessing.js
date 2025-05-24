import { uploadMergedImage } from "./api";

const CONFIG = {
  FG_WIDTH: 800,
  FG_HEIGHT: 300,
};

export const overlayAndUploadImage = async (bgImageUrl, fgImageUrl) => {
  try {
    if (!bgImageUrl || !fgImageUrl) {
      throw new Error("Missing image URLs");
    }

    // Load images with CORS handling
    const loadImage = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });

    const [bgImage, fgImage] = await Promise.all([
      loadImage(bgImageUrl),
      loadImage(fgImageUrl),
    ]);

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = bgImage.width;
    canvas.height = bgImage.height;
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.drawImage(bgImage, 0, 0);

    // Draw foreground centered
    ctx.drawImage(
      fgImage,
      (bgImage.width - CONFIG.FG_WIDTH) / 2,
      (bgImage.height - CONFIG.FG_HEIGHT) / 2,
      CONFIG.FG_WIDTH,
      CONFIG.FG_HEIGHT
    );

    // Convert to Blob
    const imageBlob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });

    // Upload merged image using the API module
    return await uploadMergedImage(imageBlob);
  } catch (error) {
    console.error("Image processing error:", error.message, error.stack);
    throw error;
  }
};
