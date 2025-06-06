import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import * as api from "../utils/api";

export const usePresentation = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionData, setExtractionData] = useState(null);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [storyboardScenes, setStoryboardScenes] = useState([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [logoId, setLogoId] = useState(null);
  const [logoURL, setLogoURL] = useState(null);
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
      const { avatars, voices } = await api.fetchAvatarsAndVoices();
      setAvatars(avatars);
      setVoices(voices);
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
    setLogoPreviewUrl(null);
    setLogoId(null);
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
      console.log("File uploaded successfully:", fileId);
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
    if (!logoId) {
      message.error("Please upload a logo before generating the storyboard.");
      return;
    }
    setIsGeneratingScenes(true);
    try {
      const scenes = await api.generateScenes(extractionData);
      await generateInitialImages(scenes);
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  const generateInitialImages = async (scenes) => {
    if (!scenes?.length) return;
    if (!logoId) {
      message.error("Please upload a logo before generating images.");
      return;
    }

    setIsGeneratingImages(true);
    setStoryboardScenes(
      scenes.map((scene) => ({
        ...scene,
        isGenerating: true,
        generated_image_url: null,
      }))
    );

    try {
      const results = await Promise.allSettled(
        scenes.map((scene) =>
          api.generateImage(scene.image_prompt, scene.scene_id, logoId, logoURL)
        )
      );

      const updatedScenes = scenes.map((scene, index) => {
        const result = results[index];
        if (result.status === "fulfilled") {
          return {
            ...scene,
            generated_image_url: result.value,
            isGenerating: false,
          };
        } else {
          return {
            ...scene,
            isGenerating: false,
            imageGenError: result.reason.message,
          };
        }
      });

      setStoryboardScenes(updatedScenes);
    } finally {
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
    if (!logoId) {
      message.error("Please upload a logo before regenerating images.");
      return;
    }

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
        logoId,
        logoURL
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
      console.log("Logo uploaded successfully:", data.logo_url);
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
    if (!selectedAvatar || !selectedVoice) {
      message.error("Please select an avatar and voice");
      return;
    }

    const scenesWithImages = storyboardScenes.filter(
      (scene) => scene.generated_image_url
    );
    if (scenesWithImages.length === 0) {
      message.error("No scenes with generated images found.");
      return;
    }
    if (scenesWithImages.length !== storyboardScenes.length) {
      message.warn("Some scenes are missing images and will be skipped.");
    }

    setIsGeneratingVideo(true);
    setVideoResult(null);

    try {
      const videoId = await api.generateVideo(
        scenesWithImages,
        selectedAvatar,
        selectedVoice
      );
      setVideoResult(videoId);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return {
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
    handleZoom,
    handleGenerateVideo,
    resetState,
  };
};
