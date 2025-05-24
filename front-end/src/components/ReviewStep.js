import { useRef, useState, useEffect } from "react";
import {
  Button,
  Space,
  Typography,
  Row,
  Col,
  Badge,
  Popconfirm,
  Form,
  Select,
  Tag,
  Tooltip,
} from "antd";
import {
  VideoCameraOutlined,
  LeftOutlined,
  RightOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { StyledCard, StyledCarousel } from "../styles/AppStyle";
import SceneCard from "./SceneCard";
import VideoResult from "./video";

const { Title, Text } = Typography;
const { Option } = Select;

const ReviewStep = ({
  storyboardScenes,
  tableImageUrls,
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
  generatedImagesCount,
}) => {
  const carouselRef = useRef();
  const videoResultRef = useRef(null);
  const [internalSelectedAvatar, setInternalSelectedAvatar] =
    useState(selectedAvatar);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [activeTableImageIndex, setActiveTableImageIndex] = useState(0); // New state for table image slide index

  useEffect(() => {
    setInternalSelectedAvatar(selectedAvatar);
  }, [selectedAvatar]);

  useEffect(() => {
    if (
      videoResult?.status === "completed" ||
      videoResult?.status === "failed"
    ) {
      setIsGeneratingVideo(false);
    }
    if (videoResult && videoResultRef.current) {
      videoResultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [videoResult]);

  const handleAvatarChange = (value) => {
    setInternalSelectedAvatar(value);
    setSelectedAvatar(value === "WithoutAvatar_id" ? null : value);
  };

  const handleGenerateVideoClick = () => {
    setIsGeneratingVideo(true);
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

      <div style={{ position: "relative" }}>
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
              tableImageUrls={tableImageUrls}
              generatedImagesCount={generatedImagesCount}
              activeTableImageIndex={activeTableImageIndex} // Pass table image index
              setActiveTableImageIndex={setActiveTableImageIndex} // Pass setter
            />
          ))}
        </StyledCarousel>

        <Button
          icon={<LeftOutlined />}
          onClick={() => carouselRef.current?.prev()}
          style={{
            position: "absolute",
            top: "50%",
            left: "-40px",
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
            left: "100%",
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
        style={{
          marginTop: 0,
          width: "100%",
          position: "relative",
          top: "-20px",
        }}
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
            disabled={
              !selectedVoice ||
              isGeneratingVideo ||
              isGeneratingImages ||
              generatedImagesCount !== storyboardScenes.length
            }
          >
            {videoResult?.videoUrl ? "Regenerate Video" : "Generate Video"}
          </Button>
        </Col>
      </Row>
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
          filterOption={(input, option) => {
            const children = option?.children?.props?.children;
            const avatarName = children?.[1]?.props?.children?.[0] || "";
            const premiumTag =
              children?.[1]?.props?.children?.[1]?.props?.children || "";
            return (
              avatarName.toLowerCase().includes(input.toLowerCase()) ||
              premiumTag.toLowerCase().includes(input.toLowerCase())
            );
          }}
          notFoundContent={
            <div style={{ padding: 8, textAlign: "center" }}>
              No avatars found matching your search
            </div>
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
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) => {
            const text = option?.children?.toString().toLowerCase() || "";
            return text.includes(input.toLowerCase());
          }}
          notFoundContent={
            <div style={{ padding: 8, textAlign: "center" }}>
              No voices found matching your search
            </div>
          }
        >
          {voices?.map((voice) => (
            <Option key={voice.voice_id} value={voice.voice_id}>
              {voice.name} ({voice.gender || "unknown"}) - {voice.language}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {videoResult && (
        <Row justify="center" style={{ width: "100%", marginTop: 4 }}>
          <Col span={12}>
            <div ref={videoResultRef}>
              <VideoResult
                videoId={videoResult.videoId}
                videoUrl={videoResult.videoUrl}
                status={videoResult.status}
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
