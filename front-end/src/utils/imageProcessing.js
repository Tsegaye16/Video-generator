import { uploadMergedImage } from "./api";

const CONFIG = {
  FG_WIDTH: 800, // No longer used for resizing
  FG_HEIGHT: 300, // No longer used for resizing
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

    // Calculate foreground dimensions to fit within background
    let fgWidth = fgImage.width;
    let fgHeight = fgImage.height;

    // Scale down foreground if it's larger than background, preserving aspect ratio
    if (fgWidth > bgImage.width || fgHeight > bgImage.height) {
      const scale = Math.min(
        bgImage.width / fgWidth,
        bgImage.height / fgHeight
      );
      fgWidth = fgImage.width * scale;
      fgHeight = fgImage.height * scale;
    }

    // Draw foreground centered at calculated size
    ctx.drawImage(
      fgImage,
      (bgImage.width - fgWidth) / 2, // Center horizontally
      (bgImage.height - fgHeight) / 2, // Center vertically
      fgWidth, // Scaled or original width
      fgHeight // Scaled or original height
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
