// src/components/GenerateStep.jsx
import {
  Button,
  Switch,
  Space,
  Progress,
  Typography,
  Card,
  Upload,
  Avatar,
  Row,
  Select,
} from "antd";
import { UploadOutlined, MinusOutlined } from "@ant-design/icons";
import { StyledCard } from "../styles/AppStyle";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const GenerateStep = ({
  isGeneratingScenes,
  handleGenerateScenes,
  logoFile,
  setLogoFile,
  logoPreviewUrl,
  setLogoPreviewUrl,
  logoId,
  setLogoId,
  logoURL,
  setLogoURL,
  handleLogoUpload,
  aspectRatio, // New prop for aspect ratio
  setAspectRatio, // New prop to update aspect ratio
}) => {
  return (
    <>
      <StyledCard
        title={
          <Title level={4} style={{ margin: 0 }}>
            Generate Storyboard
          </Title>
        }
        bordered={false}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Paragraph>
            We'll create a video storyboard with AI-generated visuals based on
            your slides. Please upload a logo to proceed with image generation.
          </Paragraph>
          <Row justify="center" style={{ marginBottom: 24 }}>
            <Space direction="vertical" align="center">
              <Text strong>Upload Logo (Required for Image Generation)</Text>
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
                    setLogoURL(null);
                  }}
                  icon={<MinusOutlined />}
                >
                  Remove Logo
                </Button>
              )}
            </Space>
          </Row>
          <Button
            type="primary"
            onClick={handleGenerateScenes}
            loading={isGeneratingScenes}
            disabled={!logoId}
            size="large"
            block
          >
            {isGeneratingScenes ? "Generating..." : "Generate Storyboard"}
          </Button>
          {isGeneratingScenes && (
            <Space
              direction="vertical"
              style={{ width: "100%", textAlign: "center" }}
            >
              <Progress percent={75} status="active" showInfo={false} />
              <Text type="secondary">
                Creating scenes and generating visuals...
              </Text>
            </Space>
          )}
        </Space>
      </StyledCard>
    </>
  );
};

export default GenerateStep;
