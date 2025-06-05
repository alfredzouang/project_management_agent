import React, { useState } from "react";
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

    // Simulate backend delay 3-5s
    const delay = 3000 + Math.floor(Math.random() * 2000);
    setTimeout(() => {
      const lower = userMessage.toLowerCase();
      if (lower.includes("json") || lower.includes("project")) {
        // Return a mock project object
        onReceiveChatResponse({
          type: "project",
          project: {
            name: "Demo Project",
            description: "This is a mock project returned from the backend.",
            customer: "Lenovo",
            estimated_start_date: "2025-06-10",
            estimated_finish_date: "2025-07-10",
            actual_start_date: "2025-06-12",
            actual_finish_date: "",
            estimated_effort_in_hours: "120",
            effort_completed_in_hours: "10",
            complete_percentage: "8",
            estimated_total_cost: "50000",
            actual_total_cost: "",
            cost_consumption_percentage: "2",
            project_type: "IDG - Bench Time (Non-billable)",
            sow_expriation_date: "2025-07-15",
            owner: "Alice",
            project_manager: "Bob",
            project_coordinator: "Charlie",
            solution_architect: "Diana",
            client_name: "Acme Corp",
            client_phone: "1234567890",
            client_address: "123 Main St",
            client_email: "client@acme.com",
            supplier_name: "Supplier Inc",
            supplier_phone: "0987654321",
            supplier_address: "456 Supplier Rd",
            supplier_email: "contact@supplier.com"
          }
        });
      } else {
        // Return a mock AI message
        onReceiveChatResponse({
          type: "ai",
          text: "This is a mock AI response from the backend."
        });
      }
      setLocalProcessing(false);
    }, delay);
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
