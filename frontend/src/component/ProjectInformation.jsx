import React from "react";
import { Accordion, AccordionSummary, AccordionDetails, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";
import { Assignment, ExpandMore } from "@mui/icons-material";

const projectTypeOptions = [
  "IDG - Bench Time (Non-billable)",
  "Managed Services - DSS",
  "IDG - DaaS Services",
  "Managed Services - BWA",
  "IDG - Multi Stream Projects",
  "ARS",
  "Lenovo Storage DSS-G",
  "IDG - CFS Projects (ISG)",
  "IDG - ARS Projects",
  "HPC",
  "DB Migration",
  "IDG - ARS Projects (Channel)",
  "IDG - TruScale Projects (ISG)",
  "IDG - CFS Projects (Channel)",
  "Hardware-only deployment",
  "Managed Services - Hardware only",
  "IDG - ARS Projects (ISG)",
  "Lenovo Storage (other)",
  "IDG - CFS Projects",
  "ThinkSystem DM Remote",
  "IDG - System Integration",
  "IDG - CSP Projects",
  "Managed Services - Flex",
  "VDI Remote Visualization",
  "Managed Services - HPC",
  "Managed Services - HANA",
  "IDG - Custom Application Development",
  "IDG - Deploy Projects (ISG)",
  "IDG - CO2 Projects (ISG)",
  "IDG - Other (Time off)",
  "IDG - CO2 Projects",
  "ThinkSystem DM/DE",
  "IDG - Managed Services",
  "IDG - Enablement ISU Projects",
  "TruScale",
  "IDG - Agency Services",
  "IDG - Business Consulting",
  "Hardware Install",
  "IDG - SSG Presales",
  "Extended Services",
  "Healthcheck",
  "IDG - CO2 Projects (Channel)",
  "IDG - Business Process Outsourcing",
  "Flex Services",
  "IDG - Presales Activity (Non-Billable)",
  "IDG - Legacy Non SOW",
  "IDG - Application Management",
  "IDG - Workplace Solutions (ISU)",
  "IDG - Deploy Projects",
  "ThinkAgile MX",
  "IDG - Education & Training Projects",
  "IDG - Global Shared Support (GSS)",
  "Other",
  "IDG - IT Consulting",
  "ThinkAgile CP",
  "Azure Cloud Migration Workshop",
  "Data Center Services",
  "ThinkAgile SXM (Azure Stack)",
  "IDG - ITC Projects",
  "ThinkAgile VX (VSAN)",
  "ThinkAgile HX & SXN (Nutanix)",
  "IDG - ITC Projects  (ISG)",
  "IDG - DaaS Services Transition",
  "IDG - MSCT Activity",
  "IDG - Internal Lenovo Project",
  "IDG - DWS Managed Service Desk",
  "SAP-HANA",
  "vRealize Cloud Operations Management Services",
  "Network configuration services",
  "Other - Virtualization & VDI",
  "IDG - PMO Transition Projects",
  "IDG - Other (Non-Billable)",
  "IDG - WW Presales (Non-Billable)",
  "IDG - Esports Projects",
  "ThinkAgile VX Remote Deployment",
  "Tokens",
  "ThinkAgile SXM Remote Deployment",
  "IDG - Lenovo Managed Services (LMS)",
  "Other - Hybrid Cloud",
  "ThinkSystem DE Remote",
  "Presales",
  "VDI",
  "VDI Architecture Jumpstart Services"
];

const ProjectInformation = ({
  expanded,
  onAccordionChange,
  project,
  handleChange,
  processing,
  mode,
  updatedFields = []
}) => (
  <Accordion
    expanded={expanded}
    onChange={(_, exp) => onAccordionChange("projectInfoExpanded", exp)}
    disabled={processing}
    sx={{ mb: 4 }}
  >
    <AccordionSummary
      expandIcon={<ExpandMore sx={{ color: "#fff" }} />}
      aria-controls="project-info-content"
      id="project-info-header"
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
      <Assignment sx={{ mr: 1, color: "#fff" }} />
      <Typography variant="h6" fontWeight="bold">
        Project Information
      </Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ mt: 2 }}>
      <Grid container spacing={2} columns={12}>
        {/* Name */}
        <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
          <TextField
            label="Name"
            name="name"
            value={project["name"] || ""}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="Enter project name..."
            disabled={processing}
            className={updatedFields.includes("name") ? "input-updated" : ""}
          />
        </Grid>
        {/* Project Type */}
        <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
          <FormControl fullWidth variant="outlined" disabled={processing}>
            <InputLabel id="project-type-label" shrink={true}>Project Type</InputLabel>
            <Select
              labelId="project-type-label"
              name="project_type"
              value={project["project_type"] || ""}
              onChange={handleChange}
              label="Project Type"
              displayEmpty
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              className={updatedFields.includes("project_type") ? "input-updated" : ""}
              renderValue={(selected) =>
                selected === "" || selected === undefined
                  ? <span style={{ color: "#aaa" }}>Select project type...</span>
                  : projectTypeOptions.find((opt) => opt === selected) || selected
              }
            >
              <MenuItem value="">
                <span style={{ color: "#aaa" }}>Select project type...</span>
              </MenuItem>
              {projectTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Owner */}
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <TextField
            label="Owner"
            name="owner"
            value={project["owner"] || ""}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="Enter owner..."
            disabled={processing}
            className={updatedFields.includes("owner") ? "input-updated" : ""}
          />
        </Grid>
        {/* Project Manager */}
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <TextField
            label="Project Manager"
            name="project_manager"
            value={project["project_manager"] || ""}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="Enter project manager..."
            disabled={processing}
            className={updatedFields.includes("project_manager") ? "input-updated" : ""}
          />
        </Grid>
        {/* Project Coordinator */}
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <TextField
            label="Project Coordinator"
            name="project_coordinator"
            value={project["project_coordinator"] || ""}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="Enter project coordinator..."
            disabled={processing}
            className={updatedFields.includes("project_coordinator") ? "input-updated" : ""}
          />
        </Grid>
        {/* Solution Architect */}
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <TextField
            label="Solution Architect"
            name="solution_architect"
            value={project["solution_architect"] || ""}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="Enter solution architect..."
            disabled={processing}
            className={updatedFields.includes("solution_architect") ? "input-updated" : ""}
          />
        </Grid>
        {/* Description field, aligned with last input in first row */}
        <Grid item size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
          <TextField
            label="Description"
            name="description"
            value={project["description"] || ""}
            onChange={handleChange}
            multiline
            minRows={6}
            maxRows={12}
            fullWidth
            variant="outlined"
            placeholder="Enter project description..."
            disabled={processing}
            className={updatedFields.includes("description") ? "input-updated" : ""}
          />
        </Grid>
      </Grid>
    </AccordionDetails>
  </Accordion>
);

export default ProjectInformation;
