import React, { useState } from "react";
import { sendChatMessages } from "../api/api";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";

/**
 * ChatInput component
 * Props:
 * - chatInput: string
 * - onChatInputChange: function(e)
 * - onSendChat: function(message)
 * - onReceiveChatResponse: function(response)
 * - chatMessages: array
 * - processing: boolean
 * - mode: string ("light" | "dark")
 */
function ChatInput({
  chatInput,
  onChatInputChange,
  onSendChat,
  onReceiveChatResponse,
  chatMessages,
  processing,
  mode
}) {
  const [localProcessing, setLocalProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "text/markdown"
      ];
      const allowedExtensions = [".pdf", ".txt", ".md"];
      const fileName = file.name.toLowerCase();
      const fileType = file.type;
      const isAllowedType = allowedTypes.includes(fileType);
      const isAllowedExt = allowedExtensions.some(ext => fileName.endsWith(ext));
      if (!isAllowedType && !isAllowedExt) {
        alert("Only PDF, text, or markdown files are allowed.");
        return;
      }
      setSelectedFile(file);
      console.log("Selected file:", file);
    }
  };

  const fileInputRef = React.useRef();

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || processing || localProcessing) return;
    setLocalProcessing(true);
    const userMessage = chatInput;
    // Pass both message and file to parent
    onSendChat(userMessage, selectedFile);

    try {
      // Send the list of messages (previous + new)
      const response = await sendChatMessages(
        [
          ...chatMessages
            .filter(m => typeof m === "object" && m.role && m.content)
            .map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage }
        ],
        selectedFile
      );
      if (response && response.project) {
        onReceiveChatResponse({
          type: "project",
          project: response.project
        });
        // Do not clear file after send; only clear if user removes it
      } else {
        onReceiveChatResponse({
          type: "error",
          text: "No project returned from backend."
        });
        // Optionally, keep file for retry
      }
    } catch (error) {
      onReceiveChatResponse({
        type: "error",
        text: error.message || "Failed to get project from backend."
      });
      // Optionally, keep file for retry
    }
    setLocalProcessing(false);
  };

  return (
    <React.Fragment>
      <Box mb={3}>
        <form onSubmit={handleSubmit} style={{ width: "100%", position: "relative" }}>
          <TextField
            value={chatInput}
            onChange={(e) => {
              if (e.target.value.length <= 10000) onChatInputChange(e);
            }}
            placeholder="describe your project here"
            fullWidth
            multiline
            minRows={5}
            maxRows={10}
            variant="outlined"
            inputProps={{ maxLength: 10000 }}
            sx={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                fontSize: "1.35rem",
                padding: "20px 48px 20px 20px",
                background: "#fff",
                boxShadow: "none",
                border: "1.5px solid #333",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "1.5px solid #333",
              },
              "& .MuiOutlinedInput-root.Mui-focused": {
                boxShadow: "none",
                border: "1.5px solid #333",
              },
              "& .MuiOutlinedInput-root:after": {
                borderBottom: "3px solid #1976d2",
              },
              "& .MuiInputBase-input::placeholder": {
                color: mode === "dark" ? "#888" : "#888",
                opacity: 1,
              },
            }}
            disabled={processing || localProcessing}
            autoComplete="off"
          />
          {/* Hidden file input */}
          <input
            type="file"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
            tabIndex={-1}
          />
          {/* Modal overlay with CircularProgress */}
          {localProcessing && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                bgcolor: "rgba(255,255,255,0.7)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "16px"
              }}
            >
              <CircularProgress
                size={48}
                thickness={5}
                color="primary"
              />
            </Box>
          )}
          {/* Bottom bar with icons and counter */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 8,
              pointerEvents: "none",
              zIndex: 2,
              gap: 1
            }}
          >
            <AutoAwesomeIcon sx={{ color: "#bdbdbd", fontSize: 20, mr: 1, pointerEvents: "auto" }} />
            {/* Upload file button */}
            <IconButton
              color="primary"
              component="span"
              onClick={handleUploadClick}
              sx={{ ml: 1, mr: 1, pointerEvents: "auto" }}
              tabIndex={0}
              disabled={processing || localProcessing}
            >
              <AttachFileIcon />
            </IconButton>
            {/* File chip next to upload button */}
            {selectedFile && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "#f5f5f5",
                  borderRadius: "16px",
                  px: 1.5,
                  py: 0.5,
                  ml: 1,
                  mr: 1,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  border: "1px solid #e0e0e0",
                  maxWidth: 180,
                  minWidth: 0,
                  pointerEvents: "auto"
                }}
              >
                <AttachFileIcon sx={{ color: "#1976d2", fontSize: 18, mr: 0.5, flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#222",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "0.95rem",
                    maxWidth: 80
                  }}
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#666",
                    fontSize: "0.8rem",
                    ml: 0.5,
                    flexShrink: 0
                  }}
                >
                  {((selectedFile.size || 0) / 1024).toFixed(1)} KB
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Remove file"
                  onClick={() => setSelectedFile(null)}
                  sx={{
                    ml: 0.5,
                    p: "2px"
                  }}
                  tabIndex={0}
                  disabled={processing || localProcessing}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, ml: 1 }}>
              {chatInput.length}/10000
            </Typography>
            <Box sx={{ pointerEvents: "auto" }}>
              <IconButton
                type="submit"
                color="primary"
                disabled={!chatInput.trim() || processing || localProcessing}
                sx={{
                  position: "relative",
                  right: "-8px",
                  bgcolor: "transparent",
                  "&:hover": { bgcolor: "transparent" },
                }}
                tabIndex={0}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </form>
      </Box>
    </React.Fragment>
  );
}

export default ChatInput;
