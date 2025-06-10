import React from "react";
import { Box, Typography, Grid, TextField } from "@mui/material";

const SupplierInformation = ({
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
      Supplier Information
    </Typography>
    <Grid container spacing={2} alignItems="center">
      {/* Supplier Name */}
      <Grid item size={{xs: 12, sm: 6, md: 4}}>
        <TextField
          label="Supplier Name"
          name="supplier_name"
          value={project["supplier_name"] || ""}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          placeholder="Enter supplier name..."
          disabled={processing}
          className={updatedFields.includes("supplier_name") ? "input-updated" : ""}
        />
      </Grid>
      {/* Supplier Phone */}
      <Grid item size={{xs: 12, sm: 6, md: 4}}>
        <TextField
          label="Supplier Phone"
          name="supplier_phone"
          value={project["supplier_phone"] || ""}
          onChange={handleChange}
          type="tel"
          fullWidth
          variant="outlined"
          placeholder="Enter supplier phone..."
          disabled={processing}
          className={updatedFields.includes("supplier_phone") ? "input-updated" : ""}
        />
      </Grid>
      {/* Supplier Email */}
      <Grid item size={{xs: 12, sm: 6, md: 4}}>
        <TextField
          label="Supplier Email"
          name="supplier_email"
          value={project["supplier_email"] || ""}
          onChange={handleChange}
          type="email"
          fullWidth
          variant="outlined"
          placeholder="Enter supplier email..."
          disabled={processing}
          className={updatedFields.includes("supplier_email") ? "input-updated" : ""}
        />
      </Grid>
      {/* Supplier Address */}
      <Grid item size={{xs: 12, sm: 12, md: 12}}>
        <TextField
          label="Supplier Address"
          name="supplier_address"
          value={project["supplier_address"] || ""}
          onChange={handleChange}
          multiline
          minRows={2}
          maxRows={4}
          fullWidth
          variant="outlined"
          placeholder="Enter supplier address..."
          disabled={processing}
          className={updatedFields.includes("supplier_address") ? "input-updated" : ""}
        />
      </Grid>
    </Grid>
  </Box>
);

export default SupplierInformation;
