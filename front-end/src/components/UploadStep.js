import { Upload, Progress, Space, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { StyledCard } from "../styles/AppStyle";

const { Title, Paragraph } = Typography;

const UploadStep = ({
  fileList,
  uploading,
  handleUploadChange,
  beforeUploadCheck,
  handleCustomUploadRequest,
}) => {
  return (
    <StyledCard
      title={
        <Title level={4} style={{ margin: 0 }}>
          Upload Your PowerPoint
        </Title>
      }
      bordered={false}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Paragraph type="secondary">
          Upload a PowerPoint file (.ppt or .pptx) to convert it into an
          engaging video. We recommend presentations with up to 5 slides for
          best results.
        </Paragraph>

        <Upload.Dragger
          name="file"
          customRequest={handleCustomUploadRequest}
          fileList={fileList}
          onChange={handleUploadChange}
          beforeUpload={beforeUploadCheck}
          maxCount={1}
          accept=".ppt,.pptx"
          disabled={uploading}
          style={{ padding: "20px" }}
        >
          <Space direction="vertical" size="middle">
            <UploadOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            <Typography.Text strong>
              Click or drag file to this area
            </Typography.Text>
            <Typography.Text type="secondary">
              Support for single PowerPoint file
            </Typography.Text>
          </Space>
        </Upload.Dragger>

        {uploading && fileList[0]?.percent && (
          <Progress
            percent={fileList[0].percent}
            status="active"
            showInfo={false}
          />
        )}
      </Space>
    </StyledCard>
  );
};

export default UploadStep;
