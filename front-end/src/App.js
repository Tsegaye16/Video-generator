// src/App.jsx
import { useState } from "react";
import {
  Layout,
  Space,
  Row,
  Button,
  Typography,
  Steps,
  Alert,
  Modal,
} from "antd";
import {
  VideoCameraOutlined,
  InfoCircleOutlined,
  FilePptOutlined,
  EditOutlined,
  SyncOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { theme } from "antd";
import UploadStep from "./components/UploadStep";
import ExtractStep from "./components/ExtractStep";
import GenerateStep from "./components/GenerateStep";
import ReviewStep from "./components/ReviewStep";
import StepContainer from "./components/StepContainer";
import { AppContainer } from "./styles/AppStyle";
import { usePresentation } from "./hooks/usePresentation";

const { Title } = Typography;
const { Step } = Steps;

const App = () => {
  const {
    fileList,
    uploading,
    isExtracting,
    isGeneratingScenes,
    storyboardScenes,
    isGeneratingImages,
    logoFile,
    setLogoFile,
    logoPreviewUrl,
    logoId,
    logoURL,
    currentStep,
    imageZoom,
    showAdvanced,
    activeSceneIndex,
    avatars,
    voices,
    selectedAvatar,
    selectedVoice,
    videoResult,
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
    setLogoPreviewUrl,
    setShowAdvanced,
    setActiveSceneIndex,
    setSelectedAvatar,
    setSelectedVoice,
    setLogoId,
    setLogoURL,
    aspectRatio, // Add aspectRatio
    setAspectRatio, // Add setAspectRatio
    generatedImagesCount,
  } = usePresentation();

  const [showHelpModal, setShowHelpModal] = useState(false); // State to hold the logo URL
  const {
    token: { colorPrimary },
  } = theme.useToken();

  return (
    <Layout>
      <AppContainer>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Space align="center">
              <VideoCameraOutlined
                style={{ fontSize: 36, color: colorPrimary }}
              />
              <Title level={2} style={{ margin: 0 }}>
                Presentation to Video
              </Title>
            </Space>
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => setShowHelpModal(true)}
              size="large"
            >
              How It Works
            </Button>
          </Row>

          <StepContainer
            currentStep={currentStep}
            fileList={fileList}
            storyboardScenes={storyboardScenes}
          />

          {currentStep === 0 && (
            <UploadStep
              fileList={fileList}
              uploading={uploading}
              handleUploadChange={handleUploadChange}
              beforeUploadCheck={beforeUploadCheck}
              handleCustomUploadRequest={handleCustomUploadRequest}
            />
          )}

          {currentStep === 1 && (
            <ExtractStep
              isExtracting={isExtracting}
              handleExtractContent={handleExtractContent}
              fileList={fileList}
            />
          )}

          {currentStep === 2 && (
            <GenerateStep
              isGeneratingScenes={isGeneratingScenes}
              handleGenerateScenes={handleGenerateScenes}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              logoFile={logoFile}
              setLogoFile={setLogoFile}
              logoPreviewUrl={logoPreviewUrl}
              setLogoPreviewUrl={setLogoPreviewUrl}
              logoId={logoId}
              setLogoId={setLogoId}
              logoURL={logoURL}
              setLogoURL={setLogoURL}
              handleLogoUpload={handleLogoUpload}
              handleRemoveLogo={handleRemoveLogo}
              aspectRatio={aspectRatio} // Pass aspectRatio
              setAspectRatio={setAspectRatio} // Pass setAspectRatio
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              storyboardScenes={storyboardScenes}
              logoPreviewUrl={logoPreviewUrl}
              logoFile={logoFile}
              setLogoFile={setLogoFile}
              logoId={logoId}
              setLogoId={setLogoId}
              handleLogoUpload={handleLogoUpload}
              handleRemoveLogo={handleRemoveLogo}
              setLogoPreviewUrl={setLogoPreviewUrl}
              handleSceneChange={handleSceneChange}
              handleRegenerateImage={handleRegenerateImage}
              imageZoom={imageZoom}
              handleZoom={handleZoom}
              activeSceneIndex={activeSceneIndex}
              setActiveSceneIndex={setActiveSceneIndex}
              isGeneratingImages={isGeneratingImages}
              handleGenerateVideo={handleGenerateVideo}
              resetState={resetState}
              avatars={avatars}
              voices={voices}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              videoResult={videoResult}
              logoUrl={logoURL}
              generatedImagesCount={generatedImagesCount}
            />
          )}
        </Space>
      </AppContainer>

      <Modal
        title="How It Works"
        open={showHelpModal}
        onCancel={() => setShowHelpModal(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setShowHelpModal(false)}
            type="primary"
          >
            Got It
          </Button>,
        ]}
        width={700}
      >
        <Space direction="vertical" size="middle">
          <Steps direction="vertical" size="small">
            <Step
              title="Upload PowerPoint"
              description="Upload your PowerPoint file (.ppt or .pptx). We recommend files with up to 5 slides for best results."
              icon={<FilePptOutlined />}
            />
            <Step
              title="Content Extraction"
              description="Our system analyzes your slides and extracts text content to create a storyboard framework."
              icon={<EditOutlined />}
            />
            <Step
              title="AI Scene Generation"
              description="Upload a logo and generate video scenes with AI-created visuals that match your slide content."
              icon={<SyncOutlined />}
            />
            <Step
              title="Review & Customize"
              description="Edit the generated scenes, modify visuals, and finalize your video."
              icon={<FileImageOutlined />}
            />
          </Steps>

          <Alert
            message="Pro Tips"
            description={
              <Space direction="vertical">
                <Typography.Text>
                  - For best results, ensure your PowerPoint has clear slide
                  titles
                </Typography.Text>
                <Typography.Text>
                  - Use concise bullet points rather than long paragraphs
                </Typography.Text>
                <Typography.Text>
                  - Upload a logo to enable image generation
                </Typography.Text>
                <Typography.Text>
                  - Customize image prompts for better visual results
                </Typography.Text>
              </Space>
            }
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </Layout>
  );
};

export default App;
