import {
  Button,
  Card,
  Space,
  message,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
} from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect } from "react";

const { Text } = Typography;

// Map HeyGen error messages to user-friendly versions
const mapErrorMessage = (error, errorCode) => {
  if (!error) return "An unknown error occurred.";

  if (errorCode === 40119 || error.includes("Video is too long")) {
    return "The video duration exceeds the limit (60 minutes). Please shorten the scenes or upgrade your HeyGen plan.";
  }
  if (error.includes("Insufficient credit")) {
    return "You've reached the daily limit for video generation. Please try again tomorrow or upgrade your HeyGen plan.";
  }
  if (error.includes("Invalid API key")) {
    return "There was an issue with the API key. Please contact support.";
  }
  if (error.includes("timed out")) {
    return "Video generation took too long. Please try again later.";
  }
  if (errorCode === 404 || error.includes("Video status not found")) {
    return "The video could not be found. It may have expired or the request was invalid. Please try generating the video again.";
  }
  return `${error}${errorCode ? ` (Error Code: ${errorCode})` : ""}`;
};

const VideoResult = ({
  videoId,
  videoUrl,
  status,

  error,
  errorCode,
}) => {
  const handleDownload = async () => {
    if (!videoUrl) {
      message.error("No download URL available.");
      return;
    }

    try {
      const response = await fetch(videoUrl, {
        method: "GET",
        headers: {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `presentation-video-${videoId}.mp4`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      message.success("Video download started!");
    } catch (err) {
      console.error("Download error:", err);
      message.error("Failed to download video. Please try again.");
    }
  };

  useEffect(() => {
    if (status === "completed" && videoUrl) {
      message.success("Video is ready to view!");
    } else if (status === "failed" && error) {
      const userFriendlyError = mapErrorMessage(error, errorCode);
      message.error(userFriendlyError);
    }
  }, [status, videoUrl, error, errorCode]);

  return (
    <Card title="Video Generation Result" style={{ marginTop: 0 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Text strong>Status:</Text>
          <Text style={{ marginLeft: 8, textTransform: "capitalize" }}>
            {status || "unknown"}
          </Text>
        </div>

        {status === "processing" && (
          <Space direction="vertical" align="center" style={{ marginTop: 16 }}>
            <Spin size="large" />
            <Text type="secondary">Generating video...</Text>
          </Space>
        )}

        {status === "completed" && videoUrl && (
          <div style={{ marginTop: 16 }}>
            <video
              controls
              src={videoUrl}
              style={{ width: "100%", marginBottom: 16 }}
            />

            <Row justify="space-between" align="middle">
              <Col>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    window.open(videoUrl, "_blank");
                  }}
                >
                  View Fullscreen
                </Button>
              </Col>
              <Col>
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download MP4
                </Button>
              </Col>
            </Row>
          </div>
        )}

        {status === "failed" && error && (
          <Alert
            message={mapErrorMessage(error, errorCode)}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Space>
    </Card>
  );
};

export default VideoResult;
