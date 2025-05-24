import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import * as api from "../utils/api";

export const usePresentation = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionData, setExtractionData] = useState(null);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [storyboardScenes, setStoryboardScenes] = useState([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  const [logoId, setLogoId] = useState(null);

  const [logoURL, setLogoURL] = useState(null);
  const [tableImageUrls, setTableImageUrls] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [avatars, setAvatars] = useState([]);
  const [voices, setVoices] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoResult, setVideoResult] = useState(null);

  const carouselRef = useRef();

  // Fetch avatars and voices on mount
  useEffect(() => {
    const fetchResources = async () => {
      const { fetchedAvatars, fetchedVoices } =
        await api.fetchAvatarsAndVoices();
      // Add "None" option
      fetchedAvatars?.unshift({
        avatar_id: "WithoutAvatar_id",
        avatar_name: "Without Avatar",
        gender: "female",
        preview_image_url: "",
        preview_video_url: "",
        premium: false,
        type: null,
        tags: null,
        default_voice_id: null,
      });
      setAvatars(fetchedAvatars);
      setVoices(fetchedVoices);
      if (avatars.length > 0) setSelectedAvatar(avatars[0].avatar_id);

      if (voices.length > 0) setSelectedVoice(voices[0].voice_id);
    };
    fetchResources();
  }, []);

  // Update current step
  useEffect(() => {
    if (storyboardScenes.length > 0) {
      setCurrentStep(3);
    } else if (extractionData) {
      setCurrentStep(2);
    } else if (uploadedFileId) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
  }, [uploadedFileId, extractionData, storyboardScenes]);

  const resetState = useCallback(() => {
    setFileList([]);
    setUploading(false);
    setUploadedFileId(null);
    setIsExtracting(false);
    setExtractionData(null);
    setIsGeneratingScenes(false);
    setStoryboardScenes([]);
    setIsGeneratingImages(false);
    setLogoFile(null);
    setImageFile(null);
    setLogoPreviewUrl(null);
    setLogoId(null);
    setLogoURL(null);
    setTableImageUrls({});
    setCurrentStep(0);
    setImageZoom(1);
    setShowAdvanced(false);
    setActiveSceneIndex(0);
    setVideoResult(null);
    if (carouselRef.current) {
      carouselRef.current.goTo(0);
    }
  }, []);

  const handleUploadChange = ({ fileList }) => {
    if (
      fileList.length === 0 ||
      (fileList.length > 0 && fileList[0].uid !== fileList[0]?.uid)
    ) {
      resetState();
    }
    setFileList(fileList.slice(-1));
  };

  const beforeUploadCheck = (file) => {
    resetState();
    const isPptx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.name.toLowerCase().endsWith(".pptx");
    const isPpt =
      file.type === "application/vnd.ms-powerpoint" ||
      file.name.toLowerCase().endsWith(".ppt");

    if (!isPptx && !isPpt) {
      message.error("Only PowerPoint (.ppt/.pptx) files are allowed!");
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("File must be smaller than 10MB!");
      return false;
    }

    return true;
  };

  const handleCustomUploadRequest = async ({ file }) => {
    setUploading(true);
    try {
      const fileId = await api.uploadFile(file, (percent) => {
        setFileList([{ ...file, percent }]);
      });
      setUploadedFileId(fileId);
    } finally {
      setUploading(false);
    }
  };

  const handleExtractContent = async () => {
    if (!uploadedFileId) return;
    setIsExtracting(true);
    try {
      const data = await api.extractContent(uploadedFileId);
      setExtractionData(data);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateScenes = async () => {
    if (!extractionData) return;

    setIsGeneratingScenes(true);
    try {
      const response = await api.generateScenes(extractionData);

      const { scenes, table_image_urls } = response;

      setTableImageUrls(table_image_urls);
      await generateInitialImages(scenes);
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  const generateInitialImages = async (scenes) => {
    if (!scenes?.length) return;

    setIsGeneratingImages(true);
    // Initialize storyboard scenes with isQueued, isGenerating, and generationProgress
    setStoryboardScenes(
      scenes.map((scene) => ({
        ...scene,
        isQueued: true, // All scenes are queued initially
        isGenerating: false, // No scene is generating yet
        generated_image_url: null,
        imageGenError: null, // Ensure no stale errors
        generationProgress: {
          current: 0, // No scene is being processed yet
          total: scenes.length, // Total number of scenes
        },
      }))
    );

    let updatedScenes = [...scenes]; // Define updatedScenes at the top
    try {
      // Process each scene sequentially
      for (let index = 0; index < scenes.length; index++) {
        const scene = scenes[index];
        // Update the current scene to isGenerating: true, keep others as is
        updatedScenes = updatedScenes.map((s, i) => ({
          ...s,
          isGenerating: i === index, // Only the current scene is generating
          // Keep isQueued: true for unprocessed scenes, false for processed
          isQueued: i >= index, // Queued if index is current or future
          generationProgress: {
            current: index + 1, // Current scene being processed (1-based index)
            total: scenes.length,
          },
        }));

        setStoryboardScenes([...updatedScenes]);

        try {
          const imageUrl = await api.generateImage(
            scene.image_prompt,
            scene.scene_id,
            logoId || null,
            logoURL || null,
            aspectRatio
          );
          // Update the scene with the generated image URL
          updatedScenes = updatedScenes.map((s, i) =>
            i === index
              ? {
                  ...s,
                  generated_image_url: imageUrl,
                  isGenerating: false,
                  isQueued: false, // No longer queued
                  imageGenError: null, // Clear any previous error
                  generationProgress: {
                    current: index + 1,
                    total: scenes.length,
                  },
                }
              : s
          );
        } catch (error) {
          // Handle error for this specific scene
          updatedScenes = updatedScenes.map((s, i) =>
            i === index
              ? {
                  ...s,
                  isGenerating: false,
                  isQueued: false, // No longer queued
                  imageGenError: error.message,
                  generationProgress: {
                    current: index + 1,
                    total: scenes.length,
                  },
                }
              : s
          );
        }

        setStoryboardScenes([...updatedScenes]);
      }
    } finally {
      // Clear generationProgress and isQueued for all scenes, preserving other properties
      updatedScenes = updatedScenes.map((scene) => ({
        ...scene,
        isQueued: false,
        isGenerating: false, // Ensure no scenes are marked as generating
        generationProgress: null, // Reset progress
      }));

      setStoryboardScenes(updatedScenes);
      setIsGeneratingImages(false);
    }
  };

  const handleSceneChange = (sceneId, field, value) => {
    setStoryboardScenes((prev) =>
      prev.map((scene) =>
        scene.scene_id === sceneId ? { ...scene, [field]: value } : scene
      )
    );
  };

  const handleRegenerateImage = async (sceneId) => {
    const scene = storyboardScenes.find((s) => s.scene_id === sceneId);
    if (!scene) return;

    setStoryboardScenes((prev) =>
      prev.map((s) =>
        s.scene_id === sceneId
          ? { ...s, isGenerating: true, imageGenError: null }
          : s
      )
    );

    try {
      const imageUrl = await api.generateImage(
        scene.image_prompt,
        scene.scene_id,
        logoId || null,
        logoURL || null,
        aspectRatio
      );
      setStoryboardScenes((prev) =>
        prev.map((s) =>
          s.scene_id === sceneId
            ? { ...s, generated_image_url: imageUrl, isGenerating: false }
            : s
        )
      );
      message.success(`Image updated for Scene ${activeSceneIndex + 1}`);
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.message ||
        "Image regeneration failed.";
      setStoryboardScenes((prev) =>
        prev.map((s) =>
          s.scene_id === sceneId
            ? { ...s, isGenerating: false, imageGenError: errorMsg }
            : s
        )
      );
      message.error(`Scene ${activeSceneIndex + 1}: ${errorMsg}`);
    }
  };

  const handleLogoUpload = async (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("Only JPG/PNG images are allowed!");
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Logo must be smaller than 2MB!");
      return false;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    try {
      const data = await api.uploadLogo(file);
      localStorage.setItem("logo_url", data.logo_url);
      setLogoId(data.logo_id);
      setLogoURL(data.logo_url);
    } catch (error) {
      setLogoFile(null);
      setLogoPreviewUrl(null);
      setLogoId(null);
      return false;
    }

    return false;
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoId(null);
    setLogoURL(null);
    localStorage.removeItem("logo_url");
  };

  const handleZoom = (direction) => {
    setImageZoom((prev) => {
      const newZoom =
        direction === "in"
          ? Math.min(prev + 0.1, 2)
          : Math.max(prev - 0.1, 0.5);
      return parseFloat(newZoom.toFixed(1));
    });
  };

  const handleGenerateVideo = async () => {
    try {
      setIsGeneratingVideo(true);
      const result = await api.generateVideo(
        storyboardScenes,
        selectedAvatar,
        selectedVoice,
        ({ progress, status, error, errorCode }) => {
          setVideoResult((prev) => ({
            ...prev,
            progress,
            status,
            error: error || null,
            errorCode: errorCode || null,
          }));
        }
      );
      setVideoResult({
        videoId: result.videoId,
        videoUrl: result.videoUrl,
        status: "completed",
        progress: 100,
        error: null,
        errorCode: null,
      });
    } catch (error) {
      const errorMsg = error.message || "Failed to generate video";
      const errorCode =
        error.response?.data?.detail?.error_code ||
        error.response?.data?.detail?.http_status ||
        null;
      setVideoResult({
        videoId: null,
        videoUrl: null,
        status: "failed",
        progress: 0,
        error: errorMsg,
        errorCode,
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Calculate the number of generated images
  const generatedImagesCount = storyboardScenes.filter(
    (scene) => scene.generated_image_url && !scene.imageGenError
  ).length;

  return {
    aspectRatio,
    setAspectRatio,
    fileList,
    uploading,
    uploadedFileId,
    isExtracting,
    extractionData,
    isGeneratingScenes,
    storyboardScenes,
    isGeneratingImages,
    logoFile,
    setLogoFile, // Add setLogoFile
    logoPreviewUrl,
    logoId,
    tableImageUrls,
    currentStep,
    imageZoom,
    showAdvanced,
    activeSceneIndex,
    avatars,
    voices,
    selectedAvatar,
    selectedVoice,
    isGeneratingVideo,
    videoResult,
    carouselRef,
    setFileList,
    setLogoPreviewUrl,
    setShowAdvanced,
    setActiveSceneIndex,
    setSelectedAvatar,
    setSelectedVoice,
    setLogoId,
    handleUploadChange,
    beforeUploadCheck,
    handleCustomUploadRequest,
    handleExtractContent,
    handleGenerateScenes,
    handleSceneChange,
    handleRegenerateImage,
    handleLogoUpload,
    handleRemoveLogo,
    handleZoom,
    handleGenerateVideo,
    resetState,
    generatedImagesCount,
  };
};
