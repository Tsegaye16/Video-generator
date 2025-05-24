import React, { useState } from "react";
import {
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Input,
  Spin,
  Tooltip,
  Upload,
  message,
} from "antd";
import {
  SyncOutlined,
  PlusOutlined,
  MinusOutlined,
  UploadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  StyledCard,
  SceneImageContainer,
  ZoomControls,
  SceneCounter,
  StyledCarouselTableImage,
} from "../styles/AppStyle";
import AntImage from "antd/lib/image";
import { uploadImage } from "../utils/api";
import { overlayAndUploadImage } from "../utils/imageProcessing"; // Import the new utility

const { Text } = Typography;
const { TextArea } = Input;

const getOrdinalSuffix = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const SceneCard = ({
  scene,
  index,
  totalScenes,
  handleSceneChange,
  handleRegenerateImage,
  imageZoom,
  handleZoom,
  generatedImagesCount,
  tableImageUrls,
}) => {
  const [uploading, setUploading] = useState(false);
  const [overlaying, setOverlaying] = useState(false); // Track overlay/upload state

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const response = await uploadImage(
        file,
        localStorage.getItem("logo_url")
      );
      handleSceneChange(
        scene.scene_id,
        "generated_image_url",
        response.image_url
      );
      message.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      message.error("Image upload failed");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleAddToScene = async (scene, scene_id, tableImageUrl) => {
    if (!scene) {
      message.error("No background image available for this scene.");
      return;
    }

    setOverlaying(true);
    try {
      const newImageUrl = await overlayAndUploadImage(scene, tableImageUrl);
      handleSceneChange(scene_id, "generated_image_url", newImageUrl);
      message.success("Table image added to scene background successfully!");
    } catch (error) {
      message.error("Failed to add table image to scene.");
    } finally {
      setOverlaying(false);
    }
  };

  return (
    <StyledCard
      title={
        <Space>
          <Text strong>Scene {index + 1}</Text>
          <Text type="secondary">(Slide {scene.original_slide_number})</Text>
        </Space>
      }
    >
      <Row gutter={[12, 8]}>
        <Col xs={24} md={12}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong>Background Visual</Text>
            </Col>
            <Col>
              <Text type="secondary">
                {generatedImagesCount}/{totalScenes} images are generated
              </Text>
            </Col>
            <Col>
              <Space>
                <Tooltip title="Regenerate image">
                  <Button
                    icon={<SyncOutlined />}
                    onClick={() => handleRegenerateImage(scene.scene_id)}
                    loading={scene.isGenerating}
                    disabled={scene.isGenerating || uploading || scene.isQueued}
                    size="small"
                    shape="circle"
                  />
                </Tooltip>
                <Tooltip title="Upload local image">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleImageUpload}
                    disabled={uploading || scene.isGenerating || scene.isQueued}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      size="small"
                      shape="circle"
                      loading={uploading}
                      disabled={scene.isGenerating || scene.isQueued}
                    />
                  </Upload>
                </Tooltip>
              </Space>
            </Col>
          </Row>

          <SceneImageContainer>
            <SceneCounter>
              Scene {index + 1}/{totalScenes}
            </SceneCounter>

            {(scene.isGenerating || uploading || overlaying) && (
              <Space direction="vertical" align="center">
                <Spin size="large" />
                <Text type="secondary">
                  {uploading
                    ? "Uploading image..."
                    : overlaying
                    ? "Adding table image to scene..."
                    : "Image in progress..."}
                </Text>
              </Space>
            )}

            {!(scene.isGenerating || uploading || overlaying) &&
              scene.isQueued && (
                <Space direction="vertical" align="center">
                  <Spin size="small" />
                  <Text type="secondary">
                    Generating{" "}
                    {getOrdinalSuffix(scene.generationProgress.current)} image
                  </Text>
                </Space>
              )}

            {!(
              scene.isGenerating ||
              uploading ||
              overlaying ||
              scene.isQueued
            ) &&
              scene.generated_image_url && (
                <>
                  <ZoomControls>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => handleZoom("in")}
                      size="small"
                      disabled={imageZoom >= 2}
                    />
                    <Button
                      icon={<MinusOutlined />}
                      onClick={() => handleZoom("out")}
                      size="small"
                      disabled={imageZoom <= 0.5}
                      style={{ marginLeft: 4 }}
                    />
                  </ZoomControls>

                  <AntImage
                    src={scene.generated_image_url}
                    alt={`Visual for scene ${index + 1}`}
                    style={{
                      width: `${imageZoom * 100}%`,
                      height: "auto",
                      maxHeight: "400px",
                      transition: "all 0.3s ease",
                    }}
                    preview={{ mask: <span>Preview</span> }}
                  />
                </>
              )}

            {!(
              scene.isGenerating ||
              uploading ||
              overlaying ||
              scene.isQueued
            ) &&
              !scene.generated_image_url &&
              !scene.imageGenError && (
                <Text type="secondary">
                  Image not generated. Please regenerate it
                </Text>
              )}
          </SceneImageContainer>

          <TextArea
            rows={3}
            placeholder="Customize the image generation prompt..."
            value={scene.image_prompt}
            onChange={(e) =>
              handleSceneChange(scene.scene_id, "image_prompt", e.target.value)
            }
            style={{ marginBottom: 16 }}
          />

          {scene.imageGenError && (
            <Alert
              message={scene.imageGenError}
              type="error"
              showIcon
              closable
              onClose={() =>
                handleSceneChange(scene.scene_id, "imageGenError", null)
              }
            />
          )}
        </Col>

        <Col xs={24} md={12}>
          <Text strong>Speech Script</Text>
          <TextArea
            rows={8}
            placeholder="Customize the speech script..."
            value={scene.speech_script}
            onChange={(e) =>
              handleSceneChange(scene.scene_id, "speech_script", e.target.value)
            }
            style={{ marginTop: "3px" }}
          />

          <Text strong style={{ display: "block", marginTop: 16 }}>
            PPT Images
          </Text>

          {Object.values(tableImageUrls).flat().length === 0 ? (
            <Text type="secondary">No table images available.</Text>
          ) : (
            <StyledCarouselTableImage arrows dots={false}>
              {Object.values(tableImageUrls)
                .flat()
                .map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      padding: "8px",
                      textAlign: "center",
                      boxSizing:
                        "border-box" /* Include padding in element's total width and height */,
                    }}
                  >
                    <AntImage
                      src={url}
                      alt={`Table image ${idx + 1}`}
                      style={{
                        width: "70%",
                        maxWidth:
                          "70%" /* Ensure images don't exceed container width */,
                        height: "150px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        margin: "0 auto" /* Center the image */,
                      }}
                    />
                    <Tooltip title="Add to scene background">
                      <Button
                        type="primary"
                        shape="round"
                        icon={<PictureOutlined />}
                        size="small"
                        loading={overlaying}
                        disabled={
                          overlaying ||
                          uploading ||
                          scene.isGenerating ||
                          scene.isQueued ||
                          scene.generated_image_url === null
                        }
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: "rgba(24, 144, 255, 0.9)",
                          border: "none",
                          zIndex: 10,
                          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                        }}
                        aria-label={`Add table image ${
                          idx + 1
                        } to scene background`}
                        onClick={() =>
                          handleAddToScene(
                            scene.generated_image_url,
                            scene.scene_id,
                            url
                          )
                        }
                      >
                        Add to Scene
                      </Button>
                    </Tooltip>
                  </div>
                ))}
            </StyledCarouselTableImage>
          )}
        </Col>
      </Row>
    </StyledCard>
  );
};

export default SceneCard;
