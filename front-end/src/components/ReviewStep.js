import { useRef, useState, useEffect } from "react";
import {
  Button,
  Space,
  Typography,
  Row,
  Col,
  Upload,
  Avatar,
  Badge,
  Popconfirm,
  Form,
  Select,
  Tag,
  Card,
} from "antd";
import {
  VideoCameraOutlined,
  MinusOutlined,
  LeftOutlined,
  RightOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { StyledCard, StyledCarousel } from "../styles/AppStyle";
import SceneCard from "./SceneCard";
import VideoResult from "./video";

const { Title, Text } = Typography;
const { Option } = Select;

const ReviewStep = ({
  storyboardScenes,
  logoPreviewUrl,
  logoFile,
  setLogoFile,
  logoId,
  setLogoId,
  handleLogoUpload,
  setLogoPreviewUrl,
  handleSceneChange,
  handleRegenerateImage,
  imageZoom,
  handleZoom,
  activeSceneIndex,
  setActiveSceneIndex,
  isGeneratingImages,
  handleGenerateVideo,
  resetState,
  avatars,
  voices,
  selectedAvatar,
  setSelectedAvatar,
  selectedVoice,
  setSelectedVoice,
  videoResult,
}) => {
  const carouselRef = useRef();
  const [internalSelectedAvatar, setInternalSelectedAvatar] =
    useState(selectedAvatar);

  useEffect(() => {
    // Keep the internal state in sync with the prop
    setInternalSelectedAvatar(selectedAvatar);
  }, [selectedAvatar]);

  const handleAvatarChange = (value) => {
    setInternalSelectedAvatar(value);
    setSelectedAvatar(value); // Update the parent's state as well
  };

  return (
    <>
      <StyledCard
        title={
          <Title level={4} style={{ margin: 0 }}>
            Review & Customize
          </Title>
        }
        bordered={false}
        extra={
          <Space>
            <Text strong>Scenes:</Text>
            <Badge count={storyboardScenes.length} showZero color="#1890ff" />
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Paragraph>
            Review and edit the generated scenes. You can optionally update the
            logo if needed.
          </Typography.Paragraph>

          <Row justify="center" style={{ marginBottom: 24 }}>
            <Space direction="vertical" align="center">
              <Text strong>Update Logo (Optional)</Text>
              <Upload
                name="logo"
                listType="picture-card"
                className="logo-uploader"
                showUploadList={false}
                beforeUpload={handleLogoUpload}
                accept="image/png, image/jpeg"
              >
                {logoPreviewUrl ? (
                  <Avatar src={logoPreviewUrl} size={100} shape="square" />
                ) : (
                  <div>
                    <UploadOutlined style={{ fontSize: 24 }} />
                    <div style={{ marginTop: 8 }}>Upload Logo</div>
                  </div>
                )}
              </Upload>
              {logoPreviewUrl && (
                <Button
                  size="small"
                  danger
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreviewUrl(null);
                    setLogoId(null);
                  }}
                  icon={<MinusOutlined />}
                >
                  Remove Logo
                </Button>
              )}
            </Space>
          </Row>
        </Space>
      </StyledCard>

      <div style={{ position: "relative", padding: "0 40px" }}>
        <StyledCarousel
          ref={carouselRef}
          dots={{ className: "custom-dots" }}
          afterChange={setActiveSceneIndex}
        >
          {storyboardScenes.map((scene, index) => (
            <SceneCard
              key={scene.scene_id}
              scene={scene}
              index={index}
              totalScenes={storyboardScenes.length}
              handleSceneChange={handleSceneChange}
              handleRegenerateImage={handleRegenerateImage}
              imageZoom={imageZoom}
              handleZoom={handleZoom}
              logoPreviewUrl={logoPreviewUrl}
              activeSceneIndex={activeSceneIndex}
            />
          ))}
        </StyledCarousel>

        <Button
          icon={<LeftOutlined />}
          onClick={() => carouselRef.current?.prev()}
          style={{
            position: "absolute",
            top: "50%",
            left: "0px",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
          shape="circle"
          size="large"
        />
        <Button
          icon={<RightOutlined />}
          onClick={() => carouselRef.current?.next()}
          style={{
            position: "absolute",
            top: "50%",
            right: "0px",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
          shape="circle"
          size="large"
        />
      </div>

      <Card style={{ marginTop: 24 }}>
        <Form.Item label="Select Avatar">
          <Select
            value={internalSelectedAvatar}
            onChange={handleAvatarChange}
            placeholder="Select an avatar (Optional)"
            optionFilterProp="children"
            showSearch
            allowClear // Add allowClear to enable deselecting
            filterOption={(input, option) =>
              (option?.children ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {avatars.map((avatar) => (
              <Option
                key={avatar.avatar_id}
                value={avatar.avatar_id}
                disabled={avatar.premium}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={avatar.preview_image_url}
                    alt={avatar.name}
                    style={{
                      width: 30,
                      height: 30,
                      marginRight: 8,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40";
                    }}
                  />
                  <div>
                    {avatar.avatar_name}
                    {avatar.premium && (
                      <Tag color="gold" style={{ marginLeft: 8 }}>
                        Premium
                      </Tag>
                    )}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Select Voice">
          <Select
            value={selectedVoice}
            onChange={setSelectedVoice}
            placeholder="Select a voice"
          >
            {voices?.map((voice) => (
              <Option key={voice.voice_id} value={voice.voice_id}>
                {voice.name} ({voice.gender || "unknown"})
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Card>

      <Row
        justify="space-between"
        align="middle"
        style={{ marginTop: 14, width: "100%" }}
      >
        <Col>
          <Popconfirm
            title="Are you sure you want to start over?"
            description="This will reset all your current progress."
            icon={<QuestionCircleOutlined style={{ color: "#ff4d4f" }} />}
            onConfirm={resetState}
            okText="Yes"
            cancelText="No"
          >
            <Button size="large">Start Over</Button>
          </Popconfirm>
        </Col>

        <Col>
          <Button
            type="primary"
            size="large"
            onClick={() => handleGenerateVideo(internalSelectedAvatar)} // Pass the internal state
            icon={<VideoCameraOutlined />}
            disabled={!selectedVoice} // Disable if no voice is selected
          >
            {videoResult?.videoUrl ? "Regenerate Video" : "Generate Video"}
          </Button>
        </Col>
      </Row>

      {videoResult && (
        <Row justify="center" style={{ width: "100%", marginTop: 4 }}>
          <Col span={12}>
            <VideoResult
              videoId={videoResult.videoId}
              videoUrl={videoResult.videoUrl}
              status={videoResult.status}
              progress={videoResult.progress}
              error={videoResult.error}
            />
          </Col>
        </Row>
      )}
    </>
  );
};

export default ReviewStep;
