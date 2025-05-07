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
  showAdvanced,
  setShowAdvanced,
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
  console.log("Logo ID:", logoId);
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
                  }}
                  icon={<MinusOutlined />}
                >
                  Remove Logo
                </Button>
              )}
            </Space>
          </Row>

          <div style={{ marginBottom: 16 }}>
            <Switch
              checked={showAdvanced}
              onChange={setShowAdvanced}
              checkedChildren="Advanced"
              unCheckedChildren="Basic"
            />
            {showAdvanced && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                Customize generation parameters
              </Text>
            )}
          </div>

          {showAdvanced && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Generation Parameters</Text>
                <Space align="baseline">
                  <Text>Aspect Ratio:</Text>
                  <Select
                    value={aspectRatio}
                    onChange={setAspectRatio}
                    style={{ width: 120 }}
                    placeholder="Select aspect ratio"
                  >
                    <Option value="16:9">16:9 (Widescreen)</Option>
                    <Option value="4:3">4:3 (Standard)</Option>
                    <Option value="1:1">1:1 (Square)</Option>
                    <Option value="9:16">9:16 (Vertical)</Option>
                  </Select>
                </Space>
                <Text type="secondary">
                  Select the aspect ratio for generated images.
                </Text>
              </Space>
            </Card>
          )}

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
