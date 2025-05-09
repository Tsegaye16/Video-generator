import { Button, Space, Typography, Row, Col } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const { Title } = Typography;

const ExtractStep = ({ isExtracting, handleExtractContent, fileList }) => {
  return (
    <Row justify="center" style={{ width: "100%" }}>
      <Col span={24}>
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Title level={4}>Extract Content</Title>
          <Typography.Paragraph>
            Click the button below to extract content from your uploaded{" "}
            {fileList.length > 0 ? fileList[0].name : "file"}.
          </Typography.Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={handleExtractContent}
            disabled={isExtracting || fileList.length === 0}
            icon={isExtracting ? <LoadingOutlined /> : null}
          >
            {isExtracting ? "Extracting..." : "Extract Content"}
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

export default ExtractStep;
