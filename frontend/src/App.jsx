import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  TextareaAutosize,
  FormControl,
  InputLabel,
  OutlinedInput,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Link,
  IconButton,
  useTheme,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  ExpandMore,
  Assignment,
  AccountCircle,
  Business,
  Event,
  AttachMoney,
} from "@mui/icons-material";

// Project model fields grouped by section
const fieldGroups = [
  {
    title: "Project Information",
    fields: [
      "name",
      "project_type",
      "owner",
      "project_manager",
      "project_coordinator",
      "solution_architect",
    ],
  },
  {
    title: "Client Information",
    fields: [
      "client_name",
      "client_phone",
      "client_email",
      "client_address",
    ],
  },
  {
    title: "Supplier Information",
    fields: [
      "supplier_name",
      "supplier_phone",
      "supplier_email",
      "supplier_address",
    ],
  },
  {
    title: "Dates",
    fields: [
      "estimated_start_date",
      "estimated_finish_date",
      "actual_start_date",
      "actual_finish_date",
      "sow_expriation_date",
      "kick_off_partner_completed_and_minutes_published_date",
      "kick_off_internal_completed_and_minutes_published_date",
      "kick_off_customer_completed_and_minutes_published_date",
    ],
  },
  {
    title: "Financials & Progress",
    fields: [
      "estimated_effort_in_hours",
      "effort_completed_in_hours",
      "complete_percentage",
      "estimated_total_cost",
      "actual_total_cost",
      "cost_consumption_percentage",
      "customer",
    ],
  },
];

const initialProject = {
  name: "",
  description: "",
  customer: "",
  estimated_start_date: "",
  estimated_finish_date: "",
  actual_start_date: "",
  actual_finish_date: "",
  estimated_effort_in_hours: "",
  effort_completed_in_hours: "",
  complete_percentage: "",
  estimated_total_cost: "",
  actual_total_cost: "",
  cost_consumption_percentage: "",
  project_type: "",
  sow_expriation_date: "",
  kick_off_partner_completed_and_minutes_published_date: "",
  kick_off_internal_completed_and_minutes_published_date: "",
  kick_off_customer_completed_and_minutes_published_date: "",
  owner: "",
  project_manager: "",
  project_coordinator: "",
  solution_architect: "",
  client_name: "",
  client_phone: "",
  client_address: "",
  client_email: "",
  supplier_name: "",
  supplier_phone: "",
  supplier_address: "",
  supplier_email: "",
};

const steps = [
  "Task Creation",
  "Resource Assignment",
  "Plan Generation",
  "SOW Generation",
  "Output Ready",
];

function App() {
  // Theme state
  const [mode, setMode] = useState(
    localStorage.getItem("theme") || "light"
  );
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#1976d2",
          },
          secondary: {
            main: "#9c27b0",
          },
          accent: {
            main: "#f50057",
          },
        },
      }),
    [mode]
  );

  React.useEffect(() => {
    localStorage.setItem("theme", mode);
  }, [mode]);

  const [project, setProject] = useState(initialProject);
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState(null);

  // Accordion state for each section
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(true);
  const [clientInfoExpanded, setClientInfoExpanded] = useState(true);
  const [supplierInfoExpanded, setSupplierInfoExpanded] = useState(true);
  const [datesExpanded, setDatesExpanded] = useState(true);
  const [financialsExpanded, setFinancialsExpanded] = useState(true);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Simulate process (replace with real API integration)
  const handleStart = async () => {
    setProcessing(true);
    setError("");
    setOutputs(null);
    setActiveStep(0);
    setProjectInfoExpanded(false);
    setClientInfoExpanded(false);
    setSupplierInfoExpanded(false);
    setDatesExpanded(false);
    setFinancialsExpanded(false);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((res) => setTimeout(res, 1000));
      setActiveStep(i);
    }

    setOutputs({
      markdown: "/output/output.md",
      pdf: "/output/output.pdf",
      word: "/output/output.docx",
    });
    setProcessing(false);
  };

  // Render input fields
  const renderInput = (key) => {
    const labelText = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    if (key === "description") {
      return (
        <Grid item xs={12} key={key}>
          <TextField
            label={labelText}
            name={key}
            value={project[key]}
            onChange={handleChange}
            multiline
            minRows={6}
            maxRows={12}
            fullWidth
            variant="outlined"
            placeholder="Enter project description..."
            disabled={processing}
          />
        </Grid>
      );
    }
    if (key === "client_address" || key === "supplier_address") {
      return (
        <Grid item xs={12} md={6} key={key}>
          <Typography variant="subtitle1" gutterBottom>
            {labelText}
          </Typography>
          <TextareaAutosize
            name={key}
            value={project[key]}
            onChange={handleChange}
            minRows={1}
            maxRows={4}
            placeholder={`Enter ${labelText.toLowerCase()}...`}
            style={{
              width: "100%",
              fontSize: "1rem",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              resize: "horizontal",
              boxSizing: "border-box",
              backgroundColor: processing ? "#f5f5f5" : undefined,
            }}
            disabled={processing}
          />
        </Grid>
      );
    }
    const type =
      key.includes("date") ? "date" :
      key.includes("email") ? "email" :
      key.includes("phone") ? "tel" :
      key.includes("cost") || key.includes("effort") || key.includes("percentage") ? "number" :
      "text";
    return (
      <Grid item xs={12} md={6} key={key}>
        <TextField
          label={labelText}
          name={key}
          value={project[key]}
          onChange={handleChange}
          type={type}
          fullWidth
          variant="outlined"
          InputLabelProps={type === "date" ? { shrink: true } : undefined}
          placeholder={`Enter ${labelText.toLowerCase()}...`}
          disabled={processing}
        />
      </Grid>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="background.default"
      >
        <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100vw", px: 0 }}>
          <Paper elevation={8} sx={{ maxWidth: "100vw", width: "100vw", p: { xs: 2, md: 6 }, borderRadius: 0 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography variant="h3" fontWeight="bold" textAlign="center" width="100%">
                Project Kickstart
              </Typography>
              <IconButton
                sx={{ ml: 2 }}
                onClick={() => setMode((prev) => (prev === "dark" ? "light" : "dark"))}
                color="inherit"
                title="Toggle dark/light mode"
              >
                {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Box>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStart();
              }}
            >
              {/* Project Information Accordion */}
              <Accordion
                expanded={projectInfoExpanded}
                onChange={(_, expanded) => setProjectInfoExpanded(expanded)}
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
                    "& .MuiTypography-root": { color: "#fff" },
                    "& .MuiSvgIcon-root": { color: "#fff" },
                  }}
                >
                  <Assignment sx={{ mr: 1, color: "#fff" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Project Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {/* All project info fields except description, each in half-width grid */}
                    {fieldGroups[0].fields
                      .filter((key) => key !== "description")
                      .map((key) => (
                        <Grid item xs={12} md={6} key={key}>
                          {renderInput(key)}
                        </Grid>
                      ))}
                    {/* Description as last field, full width, always in its own row */}
                    <Grid item xs={12}>
                      <TextField
                        label="Description"
                        name="description"
                        value={project["description"]}
                        onChange={handleChange}
                        multiline
                        minRows={6}
                        maxRows={12}
                        fullWidth
                        variant="outlined"
                        placeholder="Enter project description..."
                        disabled={processing}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              {/* Client & Supplier Information Combined Accordion */}
              <Accordion
                expanded={clientInfoExpanded}
                onChange={(_, expanded) => setClientInfoExpanded(expanded)}
                disabled={processing}
                sx={{ mb: 2 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: "#fff" }} />}
                  aria-controls="client-supplier-info-content"
                  id="client-supplier-info-header"
                  sx={{
                    bgcolor: mode === "dark" ? "#4B256D" : "primary.main",
                    color: "#fff",
                    borderRadius: 1,
                    boxShadow: 1,
                    "& .MuiTypography-root": { color: "#fff" },
                    "& .MuiSvgIcon-root": { color: "#fff" },
                  }}
                >
                  <AccountCircle sx={{ mr: 1, color: "#fff" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Client & Supplier Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2}>
                    {/* Client Info Column */}
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Client Information
                      </Typography>
                      <Grid container spacing={2}>
                        {fieldGroups[1].fields.map((key) =>
                          <Grid item xs={12} md={12} key={key}>
                            {renderInput(key)}
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                    {/* Supplier Info Column */}
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Supplier Information
                      </Typography>
                      <Grid container spacing={2}>
                        {fieldGroups[2].fields.map((key) =>
                          <Grid item xs={12} md={12} key={key}>
                            {renderInput(key)}
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
              {/* Dates Accordion */}
              <Accordion
                expanded={datesExpanded}
                onChange={(_, expanded) => setDatesExpanded(expanded)}
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
                    "& .MuiTypography-root": { color: "#fff" },
                    "& .MuiSvgIcon-root": { color: "#fff" },
                  }}
                >
                  <Event sx={{ mr: 1, color: "#fff" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Dates
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {fieldGroups[3].fields.map((key) =>
                      <Grid item xs={12} md={6} key={key}>
                        {renderInput(key)}
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              {/* Financials & Progress Accordion */}
              <Accordion
                expanded={financialsExpanded}
                onChange={(_, expanded) => setFinancialsExpanded(expanded)}
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
                    "& .MuiTypography-root": { color: "#fff" },
                    "& .MuiSvgIcon-root": { color: "#fff" },
                  }}
                >
                  <AttachMoney sx={{ mr: 1, color: "#fff" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Financials & Progress
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {fieldGroups[4].fields.map((key) =>
                      <Grid item xs={12} md={6} key={key}>
                        {renderInput(key)}
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              <Box display="flex" justifyContent="center" mt={4}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={processing}
                  sx={{ minWidth: 160, fontWeight: "bold" }}
                  startIcon={processing ? <CircularProgress size={24} color="inherit" /> : null}
                >
                  {processing ? "Processing..." : "Start"}
                </Button>
              </Box>
            </form>
            {/* Process Status */}
            {(processing || activeStep > 0) && (
              <Box mt={6}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Process Status
                </Typography>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                {processing && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress color="primary" size={40} />
                  </Box>
                )}
              </Box>
            )}
            {/* Error Message */}
            {error && (
              <Box mt={4}>
                <Alert severity="error">{error}</Alert>
              </Box>
            )}
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
          </Paper>
        </Container>
        <Box component="footer" textAlign="center" mt="auto" py={2} color="text.secondary">
          &copy; {new Date().getFullYear()} Project Management Agents
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
