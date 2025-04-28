import { Steps } from "antd";
import {
  FilePptOutlined,
  EditOutlined,
  SyncOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { StepContainer as StyledStepContainer } from "../styles/AppStyle";

const { Step } = Steps;

const StepContainer = ({ currentStep, fileList, storyboardScenes }) => {
  return (
    <StyledStepContainer>
      <Steps current={currentStep}>
        <Step
          title="Upload"
          icon={<FilePptOutlined />}
          description={currentStep > 0 ? fileList[0]?.name : null}
        />
        <Step
          title="Extract"
          icon={<EditOutlined />}
          description={currentStep > 1 ? "Content extracted" : null}
        />
        <Step
          title="Generate"
          icon={<SyncOutlined />}
          description={
            currentStep > 2 ? `${storyboardScenes.length} scenes` : null
          }
        />
        <Step title="Review" icon={<FileImageOutlined />} />
      </Steps>
    </StyledStepContainer>
  );
};

export default StepContainer;
