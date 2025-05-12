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
} from "@ant-design/icons";
import {
  StyledCard,
  SceneImageContainer,
  ZoomControls,
  SceneCounter,
} from "../styles/AppStyle";
import AntImage from "antd/lib/image";
import { uploadImage } from "../utils/api";

const { Text } = Typography;
const { TextArea } = Input;

// Utility function to get ordinal suffix (e.g., 1st, 2nd, 3rd, 4th)
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
  errorCount,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const response = await uploadImage(
        file,
        localStorage.getItem("logo_url")
      );

      // Update the scene with the new image URL from backend
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
    return false; // Prevent default upload behavior
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

            {(scene.isGenerating || uploading) && (
              <Space direction="vertical" align="center">
                <Spin size="large" />
                <Text type="secondary">
                  {uploading ? "Uploading image..." : "Image in progress..."}
                </Text>
              </Space>
            )}

            {!(scene.isGenerating || uploading) && scene.isQueued && (
              <Space direction="vertical" align="center">
                <Spin size="small" />
                <Text type="secondary">
                  Generating{" "}
                  {getOrdinalSuffix(scene.generationProgress.current)} image
                </Text>
              </Space>
            )}

            {!(scene.isGenerating || uploading || scene.isQueued) &&
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

            {!(scene.isGenerating || uploading || scene.isQueued) &&
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
        </Col>
      </Row>
    </StyledCard>
  );
};

export default SceneCard;
