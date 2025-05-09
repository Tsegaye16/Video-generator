import { Upload, Progress, Space, Typography, message } from "antd";
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
  const validateFileType = (file) => {
    const validFormats = [".ppt", ".pptx"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!validFormats.includes(fileExtension)) {
      message.error("Invalid file format! Please upload a .ppt or .pptx file.");
      return false;
    }
    return true;
  };

  // Modified beforeUploadCheck to include file type validation
  const enhancedBeforeUploadCheck = (file) => {
    // Perform file type validation
    if (!validateFileType(file)) {
      return Upload.LIST_IGNORE; // Prevent upload if invalid format
    }
    // Call the original beforeUploadCheck if provided
    return beforeUploadCheck ? beforeUploadCheck(file) : true;
  };

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
          beforeUpload={enhancedBeforeUploadCheck} // Use enhanced validation
          maxCount={1}
          accept=".ppt,.pptx" // Restrict file picker to .ppt, .pptx
          disabled={uploading}
          style={{ padding: "20px" }}
        >
          <Space direction="vertical" size="middle">
            <UploadOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            <Typography.Text strong>
              Click or drag file to this area
            </Typography.Text>
            <Typography.Text type="secondary">
              Support for single PowerPoint file (.ppt or .pptx)
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
