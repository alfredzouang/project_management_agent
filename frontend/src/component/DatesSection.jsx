import React from "react";
import { Accordion, AccordionSummary, AccordionDetails, Grid, Typography, Box } from "@mui/material";
import { Event, ExpandMore } from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const dateFields = [
  { label: "Estimated Start Date", name: "estimated_start_date", placeholder: "Enter estimated start date..." },
  { label: "Estimated Finish Date", name: "estimated_finish_date", placeholder: "Enter estimated finish date..." },
  { label: "Actual Start Date", name: "actual_start_date", placeholder: "Enter actual start date..." },
  { label: "Actual Finish Date", name: "actual_finish_date", placeholder: "Enter actual finish date..." },
  { label: "SOW Expiration Date", name: "sow_expriation_date", placeholder: "Enter SOW expiration date..." },
  { label: "Kick Off Partner Completed and Minutes Published Date", name: "kick_off_partner_completed_and_minutes_published_date", placeholder: "Enter date..." },
  { label: "Kick Off Internal Completed and Minutes Published Date", name: "kick_off_internal_completed_and_minutes_published_date", placeholder: "Enter date..." },
  { label: "Kick Off Customer Completed and Minutes Published Date", name: "kick_off_customer_completed_and_minutes_published_date", placeholder: "Enter date..." }
];

const DatesSection = ({
  expanded,
  onAccordionChange,
  project,
  handleChange,
  processing,
  mode
}) => {
  // Helper to handle DatePicker value changes
  const handleDateChange = (name) => (value) => {
    handleChange({
      target: {
        name,
        value: value ? dayjs(value).format("YYYY-MM-DD") : ""
      }
    });
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, exp) => onAccordionChange("datesExpanded", exp)}
      disabled={processing}
      sx={{ mb: 2 }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore sx={{ color: "#fff" }} />}
        aria-controls="dates-content"
        id="dates-header"
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
        <Event sx={{ mr: 1, color: "#fff" }} />
        <Typography variant="h6" fontWeight="bold">
          Dates
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ mt: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center">
            {dateFields.map((field) => (
              <Grid item size={{ xs: 12, sm: 6, md: 6 }} key={field.name}>
                <DatePicker
                  label={field.label}
                  value={project[field.name] ? dayjs(project[field.name]) : null}
                  onChange={handleDateChange(field.name)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      placeholder: field.placeholder,
                      disabled: processing
                    }
                  }}
                  format="YYYY-MM-DD"
                />
              </Grid>
            ))}
          </Grid>
        </LocalizationProvider>
      </AccordionDetails>
    </Accordion>
  );
};

export default DatesSection;
