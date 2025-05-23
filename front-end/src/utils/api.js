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
  UPLOAD_IMAGE: `${API_BASE_URL}/upload-image`,
  VIDEO_STATUS: `${API_BASE_URL}/video-status`,
};

export const uploadLogo = async (logoFile) => {
  const formData = new FormData();
  formData.append("logo", logoFile);

  try {
    const response = await axios.post(API_ENDPOINTS.UPLOAD_LOGO, formData);

    message.success("Logo uploaded successfully!");

    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    message.error(`Logo upload failed: ${errorMsg}`);
    throw error;
  }
};

export const uploadImage = async (imageFile, logo_url, onProgress) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("logo_url", logo_url);

  try {
    const response = await axios.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    message.success("Image uploaded successfully!");
    return response.data; // Should contain image URL or ID from backend
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    message.error(`Image upload failed: ${errorMsg}`);
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
    console.log("Generated scenes:", response.data);
    return {
      scenes: response.data.scenes || [],
      table_image_urls: response.data.table_image_urls || {},
    };
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

    const fetchedAvatars = avatarsRes.data?.data || [];
    const fetchedVoices = voicesRes.data?.data || [];

    if (!avatarsRes.data?.data) {
      console.warn(
        "Avatars data not found in expected format:",
        avatarsRes.data
      );
    }
    if (!voicesRes.data?.data) {
      console.warn("Voices data not found in expected format:", voicesRes.data);
    }

    return { fetchedAvatars, fetchedVoices };
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

  try {
    // Initiate video generation
    const generateResponse = await axios.post(
      API_ENDPOINTS.GENERATE_VIDEO,
      payload
    );

    if (!generateResponse.data.success || !generateResponse.data.video_id) {
      const errorDetails =
        generateResponse.data.detail || generateResponse.data;
      const errorMsg =
        errorDetails.error || "Failed to initiate video generation";
      const errorCode = errorDetails.error_code || null;
      onProgress({
        progress: 0,
        status: "failed",
        error: errorMsg,
        errorCode,
      });
      message.error(`Video generation failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const videoId = generateResponse.data.video_id;
    let progress = 0;

    // Start progress simulation
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += 5;
        onProgress({ progress, status: "processing" });
      }
    }, 1000);

    // Poll video status every 3 seconds
    while (true) {
      try {
        const statusResponse = await axios.get(
          `${API_ENDPOINTS.VIDEO_STATUS}/${videoId}`
        );
        const statusData = statusResponse.data;

        if (statusData.status === "completed") {
          clearInterval(progressInterval);
          onProgress({
            progress: 100,
            status: "completed",
          });
          message.success("Video generated successfully!");
          return {
            videoId: statusData.video_id,
            videoUrl: statusData.video_url,
          };
        } else if (statusData.status === "failed") {
          clearInterval(progressInterval);
          const errorMsg = statusData.error || "Video generation failed";
          const errorCode = statusData.error_code || null;
          onProgress({
            progress: 0,
            status: "failed",
            error: errorMsg,
            errorCode,
          });
          message.error(`Video generation failed: ${errorMsg}`);
          throw new Error(errorMsg);
        } else if (statusData.status === "error") {
          clearInterval(progressInterval);
          const errorMsg = statusData.error || "Failed to check video status";
          const errorCode =
            statusData.error_code || statusData.http_status || null;
          onProgress({
            progress: 0,
            status: "failed",
            error: errorMsg,
            errorCode,
          });
          message.error(`Video generation failed: ${errorMsg}`);
          throw new Error(errorMsg);
        }

        // Wait 3 seconds before next status check
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (statusError) {
        clearInterval(progressInterval);
        let errorMsg = "Failed to check video status";
        let errorCode = null;

        if (statusError.response?.data) {
          const errorData =
            statusError.response.data.detail || statusError.response.data;
          errorMsg = errorData.error || errorData.message || errorMsg;
          errorCode = errorData.error_code || errorData.http_status || null;
        } else {
          errorMsg = statusError.message || errorMsg;
        }

        onProgress({
          progress: 0,
          status: "failed",
          error: errorMsg,
          errorCode,
        });
        message.error(`Video generation failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    }
  } catch (error) {
    let errorMsg = "Failed to generate video";
    let errorCode = null;

    if (error.response?.data) {
      const errorData = error.response.data.detail || error.response.data;
      errorMsg = errorData.error || errorData.message || errorMsg;
      errorCode = errorData.error_code || errorData.http_status || null;
    } else {
      errorMsg = error.message || errorMsg;
    }

    onProgress({
      progress: 0,
      status: "failed",
      error: errorMsg,
      errorCode,
    });
    message.error(`Video generation failed: ${errorMsg}`);
    console.error("Video generation error:", error.response || error);
    throw new Error(errorMsg);
  }
};
