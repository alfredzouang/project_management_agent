import React from "react";
import { Box, Typography, Grid, TextField } from "@mui/material";

const ClientInformation = ({
  project,
  handleChange,
  processing,
  expanded,
  onAccordionChange,
  mode,
  updatedFields = []
}) => (
  <Box flex={1}>
    <Typography variant="subtitle1" fontWeight="bold" mb={1}>
      Client Information
    </Typography>
    <Grid container spacing={2} alignItems="center">
      {/* Client Name */}
      <Grid item size={{xs: 12, sm: 6, md: 4}}>
        <TextField
          label="Client Name"
          name="client_name"
          value={project["client_name"] || ""}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          placeholder="Enter client name..."
          disabled={processing}
          className={updatedFields.includes("client_name") ? "input-updated" : ""}
        />
      </Grid>
      {/* Client Phone */}
      <Grid item size={{xs: 12, sm: 6, md: 4}}>
        <TextField
          label="Client Phone"
          name="client_phone"
          value={project["client_phone"] || ""}
          onChange={handleChange}
          type="tel"
          fullWidth
          variant="outlined"
          placeholder="Enter client phone..."
          disabled={processing}
          className={updatedFields.includes("client_phone") ? "input-updated" : ""}
        />
      </Grid>
      {/* Client Email */}
      <Grid item size={{xs: 12, sm: 6, md: 4}}>
        <TextField
          label="Client Email"
          name="client_email"
          value={project["client_email"] || ""}
          onChange={handleChange}
          type="email"
          fullWidth
          variant="outlined"
          placeholder="Enter client email..."
          disabled={processing}
          className={updatedFields.includes("client_email") ? "input-updated" : ""}
        />
      </Grid>
      {/* Client Address */}
      <Grid item size={{xs: 12, sm: 12, md: 12}}>
        <TextField
          label="Client Address"
          name="client_address"
          value={project["client_address"] || ""}
          onChange={handleChange}
          multiline
          minRows={2}
          maxRows={4}
          fullWidth
          variant="outlined"
          placeholder="Enter client address..."
          disabled={processing}
          className={updatedFields.includes("client_address") ? "input-updated" : ""}
        />
      </Grid>
    </Grid>
  </Box>
);

export default ClientInformation;
