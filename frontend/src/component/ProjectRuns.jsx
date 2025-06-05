import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

/**
 * ProjectRuns component
 * Props:
 * - runs: array of run objects
 * - selectedRunId: number
 * - onSelectRun: function(id)
 * - onAddRun: function()
 * - onDeleteRun: function(id)
 * - mode: string ("light" | "dark")
 */
function ProjectRuns({ runs, selectedRunId, onSelectRun, onAddRun, onDeleteRun, mode }) {
  return (
    <Box
      sx={{
        width: { xs: 180, md: 240 },
        bgcolor: mode === "dark" ? "#2d2d3a" : "#f4f4fa",
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        py: 2,
        minHeight: "100vh",
        position: "relative",
        zIndex: 2,
      }}
    >
      <Box px={2} mb={2} display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" fontWeight="bold">
          Project Runs
        </Typography>
        <IconButton
          size="small"
          color="primary"
          onClick={onAddRun}
          title="Add New Run"
          sx={{ ml: 1 }}
        >
          <AddIcon />
        </IconButton>
      </Box>
      <Box flex={1} overflow="auto">
        {runs.map((run) => (
          <Box
            key={run.id}
            display="flex"
            alignItems="center"
            px={2}
            py={1}
            sx={{
              bgcolor: run.id === selectedRunId ? (mode === "dark" ? "#4B256D" : "#e3e3f7") : "transparent",
              borderRadius: 1,
              mb: 1,
              cursor: "pointer",
              transition: "background 0.2s",
              "&:hover": {
                bgcolor: run.id === selectedRunId ? (mode === "dark" ? "#4B256D" : "#e3e3f7") : "#ececec",
              },
            }}
            onClick={() => onSelectRun(run.id)}
          >
            <Typography
              variant="body1"
              fontWeight={run.id === selectedRunId ? "bold" : "normal"}
              flex={1}
              sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              title={run.name}
            >
              {run.name}
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRun(run.id);
              }}
              title="Delete Run"
              sx={{ ml: 1 }}
              disabled={runs.length === 1}
            >
              <span style={{ fontWeight: "bold", fontSize: 16 }}>×</span>
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ProjectRuns;
