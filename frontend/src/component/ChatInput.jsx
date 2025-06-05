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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || processing || localProcessing) return;
    setLocalProcessing(true);
    const userMessage = chatInput;
    onSendChat(userMessage);

    try {
      // Send the list of messages (previous + new)
      const response = await sendChatMessages([
        ...chatMessages
          .filter(m => typeof m === "object" && m.role && m.content)
          .map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage }
      ]);
      if (response && response.project) {
        onReceiveChatResponse({
          type: "project",
          project: response.project
        });
      } else {
        onReceiveChatResponse({
          type: "error",
          text: "No project returned from backend."
        });
      }
    } catch (error) {
      onReceiveChatResponse({
        type: "error",
        text: error.message || "Failed to get project from backend."
      });
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
              if (e.target.value.length <= 1000) onChatInputChange(e);
            }}
            placeholder="describe your project here"
            fullWidth
            multiline
            minRows={5}
            maxRows={10}
            variant="outlined"
            inputProps={{ maxLength: 1000 }}
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
            }}
          >
            <AutoAwesomeIcon sx={{ color: "#bdbdbd", fontSize: 20, mr: 1, pointerEvents: "auto" }} />
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {chatInput.length}/1000
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
