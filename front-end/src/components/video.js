
import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Space,
  message,
  Progress,
  Alert,
  Typography,
} from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";

const { Text } = Typography;

const VideoResult = ({ videoId }) => {
  const [status, setStatus] = useState("processing");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoId) {
      console.log("VideoResult: No videoId provided, skipping status check.");
      return;
    }

    console.log(`VideoResult: Starting status polling for videoId=${videoId}`);

    const checkStatus = async () => {
      try {
        console.log(`VideoResult: Checking status for videoId=${videoId}`);
        const response = await axios.get(
          `http://localhost:8000/api/video-status/${videoId}`,
          {
            timeout: 10000, // 10-second timeout for status check
          }
        );
        console.log(`VideoResult:`, response);
        if (response.data.success) {
          const { status: newStatus, download_url } = response.data;
          setStatus(newStatus);
          setDownloadUrl(download_url);

          // Update progress based on status
          if (newStatus === "completed") {
            setProgress(100);
            console.log(
              `VideoResult: Status completed for videoId=${videoId}, stopping polling.`
            );
          } else if (newStatus === "processing") {
            setProgress(50);
          } else if (newStatus === "failed") {
            setProgress(0);
            setError(response.data.error || "Video generation failed.");
            console.log(
              `VideoResult: Status failed for videoId=${videoId}, stopping polling.`
            );
          }
        } else {
          setError(response.data.error || "Failed to check status");
          console.log(
            `VideoResult: Failed to check status for videoId=${videoId}:`,
            response.data.error
          );
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Error checking video status";
        setError(errorMsg);
        console.error(
          `VideoResult: Error checking status for videoId=${videoId}:`,
          errorMsg,
          err
        );
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 5 seconds until status is completed or failed
    const interval = setInterval(() => {
      if (status === "completed" || status === "failed") {
        console.log(
          `VideoResult: Polling stopped for videoId=${videoId}, status=${status}`
        );
        clearInterval(interval);
        return;
      }
      checkStatus();
    }, 5000);

    // Cleanup interval on unmount or videoId change
    return () => {
      console.log(`VideoResult: Cleaning up interval for videoId=${videoId}`);
      clearInterval(interval);
    };
  }, [videoId, status]); // Include status in dependencies to re-evaluate polling

  const handleDownload = () => {
    if (!downloadUrl) {
      message.error("No download URL available.");
      return;
    }

    console.log(
      `VideoResult: Initiating download for videoId=${videoId}, url=${downloadUrl}`
    );
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `presentation-video-${videoId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card title="Video Generation Result" style={{ marginTop: 20 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Text strong>Status:</Text>
          <Text style={{ marginLeft: 8, textTransform: "capitalize" }}>
            {status}
          </Text>
        </div>

        <Progress
          percent={progress}
          status={status === "failed" ? "exception" : "active"}
        />

        {status === "completed" && downloadUrl && (
          <div style={{ marginTop: 16 }}>
            <video
              controls
              src={downloadUrl}
              style={{ width: "100%", maxWidth: 600, marginBottom: 16 }}
            />

            <Space>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => {
                  console.log(
                    `VideoResult: Opening fullscreen for videoId=${videoId}`
                  );
                  window.open(downloadUrl, "_blank");
                }}
              >
                View Fullscreen
              </Button>

              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Download MP4
              </Button>
            </Space>
          </div>
        )}

        {error && <Alert message={error} type="error" showIcon />}
      </Space>
    </Card>
  );
};

export default VideoResult;
