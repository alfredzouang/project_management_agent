import React from "react";
import { Accordion, AccordionSummary, AccordionDetails, Grid, TextField, Typography, InputAdornment, Box } from "@mui/material";
import { AttachMoney, ExpandMore } from "@mui/icons-material";

const FinancialsSection = ({
  expanded,
  onAccordionChange,
  project,
  handleChange,
  processing,
  mode
}) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={(_, exp) => onAccordionChange("financialsExpanded", exp)}
      disabled={processing}
      sx={{ mb: 4 }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore sx={{ color: "#fff" }} />}
        aria-controls="financials-content"
        id="financials-header"
        sx={{
          bgcolor: mode === "dark" ? "#4B256D" : "primary.main",
          color: "#fff",
          borderRadius: 1,
          boxShadow: 1,
          minHeight: 28,
          "& .MuiTypography-root": { color: "#fff", fontSize: "0.95rem" },
          "& .MuiSvgIcon-root": { color: "#fff" },
          "&.MuiAccordionSummary-root": { minHeight: 28 },
          "& .MuiAccordionSummary-content": { margin: "6px 0" }
        }}
      >
        <AttachMoney sx={{ mr: 1, color: "#fff" }} />
        <Typography variant="h6" fontWeight="bold">
          Financials & Progress
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Estimated Effort in Hours */}
          <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField
              label="Estimated Effort in Hours"
              name="estimated_effort_in_hours"
              value={project["estimated_effort_in_hours"] || ""}
              onChange={handleChange}
              type="number"
              fullWidth
              variant="outlined"
              placeholder="Enter estimated effort in hours..."
              disabled={processing}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>
                }
              }}
            />
          </Grid>
          {/* Effort Completed in Hours */}
          <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField
              label="Effort Completed in Hours"
              name="effort_completed_in_hours"
              value={project["effort_completed_in_hours"] || ""}
              onChange={handleChange}
              type="number"
              fullWidth
              variant="outlined"
              placeholder="Enter effort completed in hours..."
              disabled={processing}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>
                }
              }}
            />
          </Grid>
          {/* Complete Percentage */}
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Complete Percentage"
              name="complete_percentage"
              value={project["complete_percentage"] || ""}
              onChange={handleChange}
              type="number"
              fullWidth
              variant="outlined"
              placeholder="Enter complete percentage..."
              disabled={processing}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }
              }}
            />
          </Grid>
          {/* Estimated Total Cost */}
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Estimated Total Cost"
              name="estimated_total_cost"
              value={project["estimated_total_cost"] || ""}
              onChange={handleChange}
              type="number"
              fullWidth
              variant="outlined"
              placeholder="Enter estimated total cost..."
              disabled={processing}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }
              }}
            />
          </Grid>
          {/* Actual Total Cost */}
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Actual Total Cost"
              name="actual_total_cost"
              value={project["actual_total_cost"] || ""}
              onChange={handleChange}
              type="number"
              fullWidth
              variant="outlined"
              placeholder="Enter actual total cost..."
              disabled={processing}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }
              }}
            />
          </Grid>
          {/* Cost Consumption Percentage */}
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Cost Consumption Percentage"
              name="cost_consumption_percentage"
              value={project["cost_consumption_percentage"] || ""}
              onChange={handleChange}
              type="number"
              fullWidth
              variant="outlined"
              placeholder="Enter cost consumption percentage..."
              disabled={processing}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }
              }}
            />
          </Grid>
          {/* Customer */}
          <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField
              label="Customer"
              name="customer"
              value={project["customer"] || ""}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              placeholder="Enter customer..."
              disabled={processing}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FinancialsSection;
