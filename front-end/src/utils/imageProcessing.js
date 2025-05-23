// utils/imageProcessing.js
import axios from "axios";

const CONFIG = {
  API_KEY: process.env.REACT_APP_HEYGEN_API_KEY,
  UPLOAD_ENDPOINT: "https://upload.heygen.com/v1/asset",
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

    // Upload to HeyGen as raw binary
    const response = await axios.post(CONFIG.UPLOAD_ENDPOINT, imageBlob, {
      headers: {
        "Content-Type": "image/png",
        "X-Api-Key": CONFIG.API_KEY,
      },
      timeout: 30000,
    });

    const imageUrl = response.data?.data?.url || response.data?.url;
    if (!imageUrl) {
      throw new Error("No valid URL returned from HeyGen");
    }

    return imageUrl;
  } catch (error) {
    console.error("Overlay/Upload error:", error.message, error.stack);
    throw error;
  }
};
