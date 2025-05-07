import axios from "axios";
import { message } from "antd";

const isLocal = window.location.hostname === "localhost";

const API_BASE_URL = isLocal
  ? process.env.REACT_APP_LOCAL_API_BASE_URL
  : process.env.REACT_APP_PROD_API_BASE_URL;

export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/upload`,
  EXTRACT: `${API_BASE_URL}/extract`,
  GENERATE_SCENES: `${API_BASE_URL}/generate-scenes`,
  GENERATE_IMAGE: `${API_BASE_URL}/generate-image`,
  GET_AVATARS: `${API_BASE_URL}/get_avatars`,
  GET_VOICES: `${API_BASE_URL}/get_voices`,
  GENERATE_VIDEO: `${API_BASE_URL}/generate-video`,
  UPLOAD_LOGO: `${API_BASE_URL}/upload-logo`,
};

export const uploadLogo = async (logoFile) => {
  const formData = new FormData();
  formData.append("logo", logoFile);

  try {
    const response = await axios.post(API_ENDPOINTS.UPLOAD_LOGO, formData);
    console.log("Logo upload response:", response.data);
    message.success("Logo uploaded successfully!");
    console.log("Logo ID:", response); // Debugging line to check logoId
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    message.error(`Logo upload failed: ${errorMsg}`);
    throw error;
  }
};

export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      },
    });
    console.log("File upload response:", response);
    message.success(`${file.name} uploaded successfully!`);
    return response.data.file_id;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    message.error(`Upload failed: ${errorMsg}`);
    throw error;
  }
};

export const extractContent = async (fileId) => {
  try {
    const response = await axios.post(API_ENDPOINTS.EXTRACT, {
      file_id: fileId,
    });
    message.success("Content extracted successfully!");
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    message.error(`Extraction failed: ${errorMsg}`);
    throw error;
  }
};

export const generateScenes = async (extractionData) => {
  try {
    const response = await axios.post(API_ENDPOINTS.GENERATE_SCENES, {
      extraction_data: extractionData,
    });
    message.success("Storyboard scenes generated!");
    return response.data.scenes;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    message.error(`Generation error: ${errorMsg}`);
    throw error;
  }
};

export const generateImage = async (
  prompt,
  sceneId,
  logoId,
  logoURL,
  aspectRatio
) => {
  try {
    const response = await axios.post(API_ENDPOINTS.GENERATE_IMAGE, {
      prompt,
      scene_id: sceneId,
      logo_id: logoId,
      logo_url: logoURL,
      aspect_ratio: aspectRatio,
    });
    return `${response.data.image_url}`;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    message.error(`Image generation failed: ${errorMsg}`);
    throw error;
  }
};

export const fetchAvatarsAndVoices = async () => {
  try {
    const [avatarsRes, voicesRes] = await Promise.all([
      axios.get(API_ENDPOINTS.GET_AVATARS),
      axios.get(API_ENDPOINTS.GET_VOICES),
    ]);

    const avatars = avatarsRes.data?.data || [];
    const voices = voicesRes.data?.data || [];

    if (!avatarsRes.data?.data) {
      console.warn(
        "Avatars data not found in expected format:",
        avatarsRes.data
      );
    }
    if (!voicesRes.data?.data) {
      console.warn("Voices data not found in expected format:", voicesRes.data);
    }

    return { avatars, voices };
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    message.error("Failed to fetch avatars and voices.");
    return { avatars: [], voices: [] };
  }
};

export const generateVideo = async (scenes, avatarId, voiceId, onProgress) => {
  const payload = {
    scenes: scenes.map((scene) => ({
      original_slide_number: scene.original_slide_number,
      image_url: scene.generated_image_url,
      speech_script: scene.speech_script,
    })),
    avatar_id: avatarId,
    voice_id: voiceId,
  };

  let interval;
  try {
    // Simulate progress (e.g., increment from 0% to 90% over 10 seconds)
    let progress = 0;
    interval = setInterval(() => {
      if (progress < 90) {
        progress += 10; // Increment by 10% every second
        onProgress({ progress, status: "processing" });
      }
    }, 1000);

    const response = await axios.post(API_ENDPOINTS.GENERATE_VIDEO, payload);
    console.log("Video generation response:", response.data);

    clearInterval(interval); // Stop progress simulation

    if (
      response.data.success &&
      response.data.video_id &&
      response.data.video_url
    ) {
      onProgress({ progress: 100, status: "completed" });
      message.success("Video generated successfully!");
      return {
        videoId: response.data.video_id,
        videoUrl: response.data.video_url,
      };
    } else {
      const errorMsg =
        response.data.detail?.error ||
        response.data.error ||
        "Unknown backend error";
      onProgress({ progress: 0, status: "failed", error: errorMsg });
      message.error(`Video generation failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  } catch (error) {
    clearInterval(interval); // Stop progress simulation on error
    let errorMsg;
    if (error.response?.data?.detail?.error) {
      errorMsg = error.response.data.detail.error;
    } else if (error.response?.data?.error) {
      errorMsg = error.response.data.error;
    } else if (typeof error.response?.data?.detail === "string") {
      // Handle case where detail is a string (e.g., old response format)
      errorMsg = error.response.data.detail;
    } else {
      errorMsg = error.message || "Failed to generate video";
    }
    onProgress({ progress: 0, status: "failed", error: errorMsg });
    message.error(`Video generation failed: ${errorMsg}`);
    console.error("Video generation error:", error.response || error);
    throw error;
  }
};
