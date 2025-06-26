import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";

/**
 * PageHeader component
 * Props:
 * - mode: string ("light" | "dark")
 * - onToggleMode: function
 */
function PageHeader({ mode, onToggleMode }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Box width="100%" textAlign="center" mb={1}>
        <Typography
          variant="h3"
          fontWeight="bold"
          sx={{
            display: "inline",
            background: mode === "dark"
              ? "linear-gradient(90deg, #64b5f6 30%, #ce93d8 90%)"
              : "linear-gradient(90deg, #1976d2 30%, #9c27b0 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
            fontSize: { xs: "2rem", md: "2.8rem" },
            letterSpacing: "0.5px"
          }}
        >
          Project Assistant Team
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: mode === "dark" ? "#e0e0e0" : "#444",
            fontWeight: 400,
            mt: 1,
            fontSize: { xs: "1rem", md: "1.2rem" }
          }}
        >
          Ask your AI team for help
        </Typography>
      </Box>
    </Box>
  );
}

export default PageHeader;
