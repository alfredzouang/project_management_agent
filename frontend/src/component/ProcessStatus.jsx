import React, { useState } from "react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert
} from "@mui/material";
import {
  PlayArrow,
  Assignment,
  Visibility,
  AccountCircle,
  Build,
  CheckCircle,
  Flag,
  ExpandMore
} from "@mui/icons-material";

/**
 * ProcessStatus component
 * Props:
 * - processing: boolean
 * - activeStep: number
 * - steps: array of step names
 * - processHistory: array
 * - historyExpanded: boolean
 * - onHistoryAccordionChange: function(expanded)
 * - outputs: object (optional, {markdown, pdf, word})
 * - onStart: function (for the start/process button)
 * - mode: string ("light" | "dark")
 */
function ProcessStatus({
  processing,
  activeStep,
  steps,
  processHistory,
  historyExpanded,
  onHistoryAccordionChange,
  outputs,
  onStart,
  mode
}) {
  // Step/status to user-friendly message mapping
  const stepStatusMessage = (step, status) => {
    if (!step) {
      if (status && (status.toLowerCase().includes("done") || status.toLowerCase().includes("finished"))) {
        return "Process finished.";
      }
      return "";
    }
    // Map backend step names to user-friendly messages
    if (step.startsWith("CreateProjectTaskStep.create_tasks")) {
      return "Program manager is creating tasks based on project information.";
    }
    if (step.startsWith("CreateProjectTaskStep.revise_tasks")) {
      return "Program manager is revising the task list based on feedback.";
    }
    if (step.startsWith("ReviewTaskStep.review_task")) {
      return "Task reviewer is reviewing the generated task list.";
    }
    if (step.startsWith("AssignResourceStep.assign_resources")) {
      return "Resource manager is assigning resources to each task.";
    }
    if (step.startsWith("GenerateOutputStep.generate_output")) {
      return "Document writer is generating project outputs based on all information.";
    }
    if (step.startsWith("GenerateOutputStep.revise_output")) {
      return "Document writer is revising the outputs based on feedback.";
    }
    if (step.startsWith("GenerateOutputStep.review_output")) {
      return "Document editor is reviewing the generated outputs.";
    }
    // Fallback: prettify step name
    return step.replace(/([A-Z])/g, " $1").replace(/Step/g, " Step").replace(/_/g, " ").replace(/\./g, " ").trim() + (status ? `: ${status}` : "");
  };

  // Helper to render status with color for task list
  const renderStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "done" || s === "finished") return <span style={{ color: "#388e3c", fontWeight: 600 }}>Done</span>;
    if (s === "need_revision") return <span style={{ color: "#fbc02d", fontWeight: 600 }}>Need Revision</span>;
    if (s === "suggestion") return <span style={{ color: "#0288d1", fontWeight: 600 }}>Suggestion</span>;
    if (s === "error" || s.includes("error")) return <span style={{ color: "#d32f2f", fontWeight: 600 }}>Error</span>;
    return <span>{status}</span>;
  };

  /**
   * Render runtime payload (object/array) in a user-friendly way.
   * - Arrays: closed accordion with table.
   * - Objects: closed accordion with key-value table, or sub-accordions for known keys.
   * - Strings/primitives: caption.
   * Accepts opts: { inProcessHistory: boolean }
   */
  const renderPayload = (payload, label = "Details", opts = {}) => {
    if (!payload) return null;

    // String/primitive: show as caption
    if (typeof payload === "string" || typeof payload === "number" || typeof payload === "boolean") {
      return (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: "block" }}>
          {String(payload)}
        </Typography>
      );
    }

    // Array: show as table in a closed accordion
    if (Array.isArray(payload)) {
      if (payload.length === 0) return null;
      const columns = Object.keys(payload[0]);
      return (
        <Accordion sx={{ mt: 1, mb: 1 }} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="caption" fontWeight="bold">{label} (Table)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ overflowX: "hidden", maxWidth: "100%" }}>
              <TableContainer component={Paper} sx={{ width: "100%", maxWidth: "100%", maxHeight: 300 }}>
                <Table size="small" stickyHeader>
<TableHead>
  <TableRow>
    {columns.map(col => (
      <TableCell
        key={col}
        sx={{
          wordBreak: "break-word",
          whiteSpace: "normal",
          fontWeight: "bold",
          backgroundColor: "#e3f2fd",
          color: "#333",
          padding: "8px",
          borderBottom: "2px solid #e0e0e0"
        }}
      >
        {col === "status" ? "Status" : col}
      </TableCell>
    ))}
  </TableRow>
</TableHead>
                  <TableBody>
{payload.map((row, idx) => (
  <TableRow
    key={idx}
    sx={{
      backgroundColor: idx % 2 === 0 ? "#fafafa" : "#fff"
    }}
  >
    {columns.map(col => (
      <TableCell
        key={col}
        sx={{
          wordBreak: "break-word",
          whiteSpace: "normal",
          padding: "8px"
        }}
        title={typeof row[col] === "object" && row[col] !== null
          ? JSON.stringify(row[col])
          : String(row[col])}
      >
        {col === "status"
          ? renderStatus(row[col])
          : (typeof row[col] === "object" && row[col] !== null
            ? JSON.stringify(row[col])
            : String(row[col]))}
      </TableCell>
    ))}
  </TableRow>
))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </AccordionDetails>
        </Accordion>
      );
    }

    // Object: check for known keys, otherwise show as key-value table
    if (typeof payload === "object") {
      // Show task_list as a table
      if (payload.task_list && Array.isArray(payload.task_list)) {
        return renderPayload(payload.task_list, "Task List", opts);
      }
      // Show project: as a table if in process history, else as a sub-accordion
      if (payload.project && typeof payload.project === "object") {
        if (opts.inProcessHistory) {
          // Render as a simple key-value table, not in an accordion
          return (
            <Box sx={{ mt: 1, mb: 1, ml: 2 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ mb: 1, display: "block" }}>Project Info</Typography>
<TableContainer component={Paper} sx={{ width: "100%", maxWidth: "100%", border: "1px solid #e0e0e0", borderRadius: 2, boxShadow: 1 }}>
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell
          sx={{
            fontWeight: "bold",
            backgroundColor: "#e3f2fd",
            color: "#333",
            padding: "8px",
            borderBottom: "2px solid #e0e0e0",
            width: "30%"
          }}
        >
          Field
        </TableCell>
        <TableCell
          sx={{
            fontWeight: "bold",
            backgroundColor: "#e3f2fd",
            color: "#333",
            padding: "8px",
            borderBottom: "2px solid #e0e0e0"
          }}
        >
          Value
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {Object.entries(payload.project)
        .filter(([_, v]) =>
          v !== null &&
          v !== undefined &&
          !(typeof v === "string" && v.trim() === "")
        )
        .map(([k, v], idx) => (
          <TableRow
            key={k}
            sx={{
              backgroundColor: idx % 2 === 0 ? "#fafafa" : "#fff"
            }}
          >
            <TableCell sx={{ fontWeight: "bold", wordBreak: "break-word", whiteSpace: "normal", padding: "8px" }}>{k}</TableCell>
            <TableCell sx={{ wordBreak: "break-word", whiteSpace: "normal", padding: "8px" }}>
              {v === null || v === undefined
                ? ""
                : (typeof v === "object"
                  ? JSON.stringify(v, null, 2)
                  : String(v))}
            </TableCell>
          </TableRow>
        ))}
    </TableBody>
  </Table>
</TableContainer>
            </Box>
          );
        } else {
          return (
            <Accordion sx={{ mt: 1, mb: 1 }} defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="caption" fontWeight="bold">Project Info</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderPayload(payload.project, "Project", opts)}
              </AccordionDetails>
            </Accordion>
          );
        }
      }
      // Show payload as a sub-accordion
      if (payload.payload && (Array.isArray(payload.payload) || typeof payload.payload === "object")) {
        return renderPayload(payload.payload, "Payload", opts);
      }
      // Otherwise, show as key-value table
      return (
        <Accordion sx={{ mt: 1, mb: 1 }} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="caption" fontWeight="bold">{label}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} sx={{ maxWidth: 600 }}>
              <Table size="small">
                <TableBody>
                  {Object.entries(payload).map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell sx={{ fontWeight: "bold" }}>{k}</TableCell>
                      <TableCell>
                        {typeof v === "object" && v !== null
                          ? JSON.stringify(v, null, 2)
                          : String(v)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      );
    }

    // Fallback: show as JSON
    return (
      <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: "block" }}>
        {JSON.stringify(payload, null, 2)}
      </Typography>
    );
  };

  // Show only the Start button if process not running and at start
  if (!processing && activeStep === 0) {
    return (
      <Box mt={6} display="flex" flexDirection="column" alignItems="center">
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onStart}
          sx={{ minWidth: 160, fontWeight: "bold" }}
        >
          Start
        </Button>
      </Box>
    );
  }

  // Show latest status at the top
  const latestEntry =
    processHistory && processHistory.length > 0
      ? processHistory[processHistory.length - 1]
      : null;
  const isError =
    latestEntry &&
    latestEntry.status &&
    latestEntry.status.toLowerCase().includes("error");

  // After process started or finished: show process status, history, outputs, and (if finished) the Start button
  const showRestart = !processing && activeStep === steps.length - 1;

  return (
    <Box mt={6}>
      {/* Latest status */}
      {latestEntry && (
        <Box
          mb={2}
          p={2}
          borderRadius={2}
          bgcolor={isError ? "#ffebee" : "#e3f2fd"}
          border={isError ? "1px solid #f44336" : "1px solid #1976d2"}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color={isError ? "error" : "primary"}
          >
            Latest Status: [{latestEntry.timestamp}]{" "}
            {stepStatusMessage(latestEntry.step, latestEntry.status)}
          </Typography>
          {latestEntry.extra && renderPayload(latestEntry.extra)}
        </Box>
      )}
      {showRestart && (
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onStart}
            sx={{ minWidth: 160, fontWeight: "bold" }}
          >
            Start
          </Button>
        </Box>
      )}
      {processing && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            disabled
            sx={{ minWidth: 160, fontWeight: "bold" }}
            startIcon={<CircularProgress size={24} color="inherit" />}
          >
            Processing...
          </Button>
        </Box>
      )}
      <Typography variant="h6" fontWeight="bold" mb={2} mt={processing ? 4 : 0}>
        Process Status
      </Typography>
      {/* Sticky Stepper */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: (theme) => theme.palette.background.default,
          pb: 1,
          mb: 2,
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, idx) => {
            // Determine status
            let status = "pending";
            if (idx < activeStep) status = "completed";
            else if (idx === activeStep) status = "active";

            // Icon color logic
            let iconColor = "action";
            if (status === "completed") iconColor = "success";
            else if (status === "active") iconColor = "primary";
            else iconColor = "disabled";

            // Icon selection (large)
            let icon = null;
            const iconProps = { color: iconColor, sx: { fontSize: 36 } };
            if (status === "active" && processing) {
              icon = (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress size={36} color="primary" />
                </Box>
              );
            } else if (label === "Start") icon = <PlayArrow {...iconProps} />;
            else if (label === "Create Task") icon = <Assignment {...iconProps} />;
            else if (label === "Review Task") icon = <Visibility {...iconProps} />;
            else if (label === "Assign Resource") icon = <AccountCircle {...iconProps} />;
            else if (label === "Generate Output") icon = <Build {...iconProps} />;
            else if (label === "Review Output") icon = <CheckCircle {...iconProps} />;
            else if (label === "Finish") icon = <Flag {...iconProps} />;

            // Prevent completed tick for Start/Finish
            const completedOverride = (label === "Start" || label === "Finish") ? false : undefined;

            return (
              <Step
                key={label}
                completed={completedOverride}
              >
                <StepLabel icon={icon}>
                  {label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>
      {/* Output Download */}
      {activeStep === steps.length - 1 && outputs && (
        <Box mt={6} textAlign="center">
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Download Outputs
          </Typography>
          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} justifyContent="center">
            {outputs.markdown && (
              <Button
                component={Link}
                href={outputs.markdown}
                download
                variant="contained"
                color="primary"
              >
                Download Markdown
              </Button>
            )}
            {outputs.pdf && (
              <Button
                component={Link}
                href={outputs.pdf}
                download
                variant="contained"
                color="success"
              >
                Download PDF
              </Button>
            )}
            {outputs.word && (
              <Button
                component={Link}
                href={outputs.word}
                download
                variant="contained"
                color="secondary"
              >
                Download Word
              </Button>
            )}
          </Box>
        </Box>
      )}
      {/* Process Running History Accordion */}
      <Accordion
        sx={{ mt: 4 }}
        expanded={historyExpanded}
        onChange={(_, expanded) => onHistoryAccordionChange(expanded)}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="process-history-content"
          id="process-history-header"
          sx={{
            bgcolor: "#f5f5f5",
            color: "#333",
            borderRadius: 1,
            boxShadow: 1,
            "& .MuiTypography-root": { color: "#333" },
            "& .MuiSvgIcon-root": { color: "#333" },
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Process Running History
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {processHistory.length === 0 ? (
            <Typography color="text.secondary">No history yet.</Typography>
          ) : (
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              {processHistory.map((entry, idx) => {
                // Collect all payload-like fields except step, status, timestamp, suggestion
                const payloadFields = Object.entries(entry)
                  .filter(([k, v]) =>
                    !["step", "status", "timestamp", "suggestion"].includes(k) &&
                    v !== undefined &&
                    v !== null &&
                    (typeof v === "object" || typeof v === "string" || typeof v === "number" || typeof v === "boolean")
                  );
                return (
                  <li key={idx}>
                    <Typography
                      variant="body2"
                      color={
                        entry.status &&
                        entry.status.toLowerCase().includes("error")
                          ? "error"
                          : "text.primary"
                      }
                    >
                      [{entry.timestamp}] {stepStatusMessage(entry.step, entry.status)}
                    </Typography>
                    {entry.suggestion && (
                      <Box sx={{ ml: 2, my: 1 }}>
                        <Alert severity="info" sx={{ fontSize: "0.85rem", py: 0.5 }}>
                          Suggestion: {entry.suggestion}
                        </Alert>
                      </Box>
                    )}
                    {payloadFields.map(([k, v]) => (
                      <Box key={k} sx={{ ml: 2 }}>
                        {renderPayload(v, k.charAt(0).toUpperCase() + k.slice(1), { inProcessHistory: true })}
                      </Box>
                    ))}
                  </li>
                );
              })}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default ProcessStatus;
