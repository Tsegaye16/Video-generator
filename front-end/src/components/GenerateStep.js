import { Button, Space, Progress, Typography, Upload, Avatar, Row } from "antd";
import { UploadOutlined, MinusOutlined } from "@ant-design/icons";
import { StyledCard } from "../styles/AppStyle";

const { Title, Text, Paragraph } = Typography;

const GenerateStep = ({
  isGeneratingScenes,
  handleGenerateScenes,

  logoPreviewUrl,

  handleLogoUpload,
  handleRemoveLogo,
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
              <Text strong>Upload Logo (Optional)</Text>
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
                  onClick={handleRemoveLogo}
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
