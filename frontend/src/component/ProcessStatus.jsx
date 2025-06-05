import React from "react";
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
  Link
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

  // After process started or finished: show process status, history, outputs, and (if finished) the Start button
  const showRestart = !processing && activeStep === steps.length - 1;

  return (
    <Box mt={6}>
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
      {/* Step icons mapping */}
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
      {/* Output Download */}
      {outputs && (
        <Box mt={6} textAlign="center">
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Download Outputs
          </Typography>
          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} justifyContent="center">
            <Button
              component={Link}
              href={outputs.markdown}
              download
              variant="contained"
              color="primary"
            >
              Download Markdown
            </Button>
            <Button
              component={Link}
              href={outputs.pdf}
              download
              variant="contained"
              color="success"
            >
              Download PDF
            </Button>
            <Button
              component={Link}
              href={outputs.word}
              download
              variant="contained"
              color="secondary"
            >
              Download Word
            </Button>
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
          {processHistory.filter(
            (entry) => entry.step !== "Start" && entry.step !== "Finish"
          ).length === 0 ? (
            <Typography color="text.secondary">No history yet.</Typography>
          ) : (
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              {processHistory
                .filter(
                  (entry) => entry.step !== "Start" && entry.step !== "Finish"
                )
                .map((entry, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">
                      [{entry.timestamp}] <b>{entry.step}</b>: {entry.status}
                    </Typography>
                  </li>
                ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default ProcessStatus;
