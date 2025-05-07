import {
  Button,
  Card,
  Space,
  message,
  Progress,
  Alert,
  Typography,
  Row,
  Col,
} from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect } from "react";

const { Text } = Typography;

// Map HeyGen error messages to user-friendly versions
const mapErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";
  if (error.includes("Daily rate limit exceeded")) {
    return "You've reached the daily limit for video generation. Please try again tomorrow or upgrade your HeyGen plan.";
  }
  if (error.includes("Video is too long")) {
    return "The video duration exceeds the limit (60 minutes). Please shorten the scenes or upgrade your HeyGen plan.";
  }
  if (error.includes("Invalid API key")) {
    return "There was an issue with the API key. Please contact support.";
  }
  if (error.includes("timed out")) {
    return "Video generation took too long. Please try again later.";
  }
  return error; // Fallback to the original error message
};

const VideoResult = ({ videoId, videoUrl, status, progress, error }) => {
  console.log("VideoResult - Status:", status, "Error:", error);

  const handleDownload = async () => {
    if (!videoUrl) {
      message.error("No download URL available.");
      return;
    }

    try {
      console.log(
        `VideoResult: Initiating download for videoId=${videoId}, url=${videoUrl}`
      );

      // Fetch the video as a blob
      const response = await fetch(videoUrl, {
        method: "GET",
        headers: {
          // Add any necessary headers, e.g., for authentication if required
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `presentation-video-${videoId}.mp4`;
      document.body.appendChild(link);
      link.click();

      // Clean up
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
      const userFriendlyError = mapErrorMessage(error);
      message.error(userFriendlyError);
    }
  }, [status, videoUrl, error]);

  return (
    <Card title="Video Generation Result" style={{ marginTop: 20 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Text strong>Status:</Text>
          <Text style={{ marginLeft: 8, textTransform: "capitalize" }}>
            {status || "unknown"}
          </Text>
        </div>

        <Progress
          percent={progress}
          status={
            status === "failed"
              ? "exception"
              : status === "completed"
              ? "success"
              : "active"
          }
        />

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
                    console.log(
                      `VideoResult: Opening fullscreen for videoId=${videoId}`
                    );
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
          <Alert message={mapErrorMessage(error)} type="error" showIcon />
        )}
      </Space>
    </Card>
  );
};

export default VideoResult;
