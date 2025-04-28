import React from "react";
import { Modal, Space, Steps, Button, Typography, Alert } from "antd";
import {
  FilePptOutlined,
  EditOutlined,
  SyncOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

const { Step } = Steps;
const { Text } = Typography;

const HelpModal = ({ showHelpModal, setShowHelpModal }) => (
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
          description="Upload your PowerPoint file (.ppt or .pptx). We recommend files with 5-10 slides for best results."
          icon={<FilePptOutlined />}
        />
        <Step
          title="Content Extraction"
          description="Our system analyzes your slides and extracts text content to create a storyboard framework."
          icon={<EditOutlined />}
        />
        <Step
          title="AI Scene Generation"
          description="We generate video scenes with AI-created visuals that match your slide content."
          icon={<SyncOutlined />}
        />
        <Step
          title="Review & Customize"
          description="Edit the generated scenes, modify visuals, and add your branding before final video generation."
          icon={<FileImageOutlined />}
        />
      </Steps>
      <Alert
        message="Pro Tips"
        description={
          <Space direction="vertical">
            <Text>
              - For best results, ensure your PowerPoint has clear slide titles
            </Text>
            <Text>- Use concise bullet points rather than long paragraphs</Text>
            <Text>- Add your logo for professional branding</Text>
            <Text>- Customize image prompts for better visual results</Text>
          </Space>
        }
        type="info"
        showIcon
      />
    </Space>
  </Modal>
);

export default HelpModal;
