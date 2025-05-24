import styled, { keyframes } from "styled-components";
import { Carousel, Card, Layout } from "antd";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const AppContainer = styled(Layout.Content)`
  padding: 24px 48px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  background: #fff;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.3s ease-out;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

export const SceneImageContainer = styled.div`
  position: relative;
  background: ${(props) => props.theme.token?.colorFillQuaternary || "#fafafa"};
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px dashed ${(props) => props.theme.token?.colorBorder || "#d9d9d9"};
`;

export const LogoOverlay = styled.img`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 15%;
  max-height: 70px;
  opacity: 0.85;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.25));
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
`;

export const StyledCarousel = styled(Carousel)`
  .slick-dots {
    bottom: -10px;

    li button {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${(props) => props.theme.token?.colorBorder || "#d9d9d9"};
    }

    li.slick-active button {
      background: ${(props) => props.theme.token?.colorPrimary || "#1890ff"};
      width: 12px;
    }
  }
`;

export const StepContainer = styled.div`
  margin: 24px 0 32px;
  padding: 0 20px;

  .ant-steps-item-process .ant-steps-item-icon {
    background: ${(props) => props.theme.token?.colorPrimary || "#1890ff"};
    border-color: ${(props) => props.theme.token?.colorPrimary || "#1890ff"};
  }

  @media (max-width: 768px) {
    .ant-steps-horizontal.ant-steps-label-horizontal {
      display: flex;
      flex-direction: column;
    }
  }
`;

export const ZoomControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const SceneCounter = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

export const StyledCarouselTableImage = styled(Carousel)`
  position: relative;
  margin-top: 12px;

  .slick-slide {
    text-align: center;
    position: relative;
    overflow: visible; /* Ensure buttons aren’t clipped */
    padding: 16px; /* Add padding to create space around images */
    box-sizing: border-box;
    height: 200px; /* Set a fixed height for the slide to ensure consistency */
    display: flex !important; /* Override default slick-slide display */
    align-items: center; /* Vertically center the image */
    justify-content: center; /* Horizontally center the image */
  }

  .slick-arrow {
    z-index: 2;
    width: 36px;
    height: 36px;
    color: rgba(0, 0, 0, 0.45);
    background: rgba(255, 255, 255, 0.8); /* Add background for visibility */
    border-radius: 50%; /* Make arrows circular */
    display: flex !important;
    align-items: center;
    justify-content: center;

    &::before {
      font-size: 20px; /* Increase arrow size for better visibility */
      color: black;
    }

    &:hover::before {
      color: ${(props) => props.theme.token?.colorPrimary || "#1890ff"};
    }
  }

  .slick-prev {
    left: 10px; /* Move arrow further left to avoid overlap */
  }

  .slick-next {
    right: 10px; /* Move arrow further right to avoid overlap */
  }

  .slick-dots {
    display: none !important;
  }
`;
