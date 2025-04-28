import { Button, Progress, Space, Typography } from "antd";
import { StyledCard } from "../styles/AppStyle";

const { Title, Paragraph } = Typography;

const ExtractStep = ({ isExtracting, handleExtractContent, fileList }) => {
  return (
    <StyledCard
      title={
        <Title level={4} style={{ margin: 0 }}>
          Extract Content
        </Title>
      }
      bordered={false}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Paragraph>
          We'll analyze your PowerPoint and extract the text content to create a
          storyboard.
        </Paragraph>

        <Button
          type="primary"
          onClick={handleExtractContent}
          loading={isExtracting}
          size="large"
          block
        >
          {isExtracting ? "Extracting..." : "Extract Content"}
        </Button>

        {isExtracting && (
          <Space
            direction="vertical"
            style={{ width: "100%", textAlign: "center" }}
          >
            <Progress percent={50} status="active" showInfo={false} />
            <Typography.Text type="secondary">
              Processing your slides...
            </Typography.Text>
          </Space>
        )}
      </Space>
    </StyledCard>
  );
};

export default ExtractStep;
