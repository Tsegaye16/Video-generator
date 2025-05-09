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
  Tooltip,
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
  logoURL,
}) => {
  const carouselRef = useRef();
  const videoResultRef = useRef(null);
  const [internalSelectedAvatar, setInternalSelectedAvatar] =
    useState(selectedAvatar);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  useEffect(() => {
    // Keep the internal state in sync with the prop
    setInternalSelectedAvatar(selectedAvatar);
  }, [selectedAvatar]);

  useEffect(() => {
    // Reset isGeneratingVideo when video generation is complete or failed
    if (
      videoResult?.status === "completed" ||
      videoResult?.status === "failed"
    ) {
      setIsGeneratingVideo(false);
    }
    // Auto-scroll to video result when it appears
    if (videoResult && videoResultRef.current) {
      videoResultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [videoResult]);

  const handleAvatarChange = (value) => {
    setInternalSelectedAvatar(value); // Handle the special case for "Without Avatar"
    setSelectedAvatar(value === "WithoutAvatar_id" ? null : value); // Update the parent's state as well
  };

  const handleGenerateVideoClick = () => {
    setIsGeneratingVideo(true); // Set generating state
    handleGenerateVideo(internalSelectedAvatar);
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
            Review and edit the generated scenes. Select an avatar and voice to
            customize your video.
          </Typography.Paragraph>
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
              activeSceneIndex={activeSceneIndex}
              logoURL={logoURL}
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
      <Row
        justify="space-between"
        align="middle"
        style={{ marginTop: 0, marginBottom: 4, width: "100%" }}
      >
        <Col>
          <Popconfirm
            title="Are you sure you want to start over?"
            description="This will reset all your current progress."
            icon={<QuestionCircleOutlined style={{ color: "#ff4d4f" }} />}
            onConfirm={resetState}
            okText="Yes"
            cancelText="No"
            disabled={isGeneratingVideo}
          >
            <Button size="large" disabled={isGeneratingVideo}>
              Start Over
            </Button>
          </Popconfirm>
        </Col>

        <Col>
          <Button
            type="primary"
            size="large"
            onClick={handleGenerateVideoClick}
            icon={<VideoCameraOutlined />}
            disabled={!selectedVoice || isGeneratingVideo || isGeneratingImages}
          >
            {videoResult?.videoUrl ? "Regenerate Video" : "Generate Video"}
          </Button>
        </Col>
      </Row>
      <Card style={{ marginTop: 4 }}>
        <Form.Item
          label={
            <Tooltip title="Generate video with avatar will take 30 mins or more and will be notified once generated.">
              <span>
                Select Avatar{" "}
                <QuestionCircleOutlined
                  style={{ marginLeft: 4, color: "#1890ff" }}
                />
              </span>
            </Tooltip>
          }
        >
          <Select
            value={internalSelectedAvatar}
            onChange={handleAvatarChange}
            placeholder="Select an avatar (Optional)"
            optionFilterProp="children"
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.avatar_name ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {avatars?.map((avatar) => (
              <Option
                key={avatar?.avatar_id}
                value={avatar?.avatar_id}
                disabled={avatar?.premium}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  {avatar?.preview_image_url && (
                    <img
                      src={avatar?.preview_image_url}
                      alt={avatar?.name}
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
                  )}
                  <div>
                    {avatar?.avatar_name}
                    {avatar?.premium && (
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

        <Form.Item
          label={
            <Tooltip title="The video will be generated with the selected voice.">
              <span>
                Select Voice{" "}
                <QuestionCircleOutlined
                  style={{ marginLeft: 4, color: "#1890ff" }}
                />
              </span>
            </Tooltip>
          }
        >
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

      {videoResult && (
        <Row justify="center" style={{ width: "100%", marginTop: 4 }}>
          <Col span={12}>
            <div ref={videoResultRef}>
              <VideoResult
                videoId={videoResult.videoId}
                videoUrl={videoResult.videoUrl}
                status={videoResult.status}
                progress={videoResult.progress}
                error={videoResult.error}
              />
            </div>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ReviewStep;
