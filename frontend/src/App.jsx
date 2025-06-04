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
  PlayArrow,
  Flag,
  CheckCircle,
  Visibility,
  Build,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";

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
  "Start",
  "Create Task",
  "Review Task",
  "Assign Resource",
  "Generate Output",
  "Review Output",
  "Finish",
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

  // Multi-run state
  const [runs, setRuns] = useState([
    {
      id: 1,
      name: "Run 1",
      project: { ...initialProject },
      activeStep: 0,
      processing: false,
      error: "",
      outputs: null,
      processHistory: [],
      historyExpanded: false,
      // Accordion state for each section
      projectInfoExpanded: true,
      clientInfoExpanded: true,
      supplierInfoExpanded: true,
      datesExpanded: true,
      financialsExpanded: true,
    },
  ]);
  const [selectedRunId, setSelectedRunId] = useState(1);

  // Helpers to get/set current run
  const getCurrentRunIndex = () => {
    const idx = runs.findIndex((r) => r.id === selectedRunId);
    return idx === -1 ? 0 : idx;
  };
  const currentRunIndex = getCurrentRunIndex();
  const currentRun = runs[currentRunIndex];

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      updatedRuns[currentRunIndex] = {
        ...updatedRuns[currentRunIndex],
        project: {
          ...updatedRuns[currentRunIndex].project,
          [name]: value,
        },
      };
      return updatedRuns;
    });
  };

  // Handle accordion state changes
  const handleAccordionChange = (section, expanded) => {
    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      updatedRuns[currentRunIndex] = {
        ...updatedRuns[currentRunIndex],
        [section]: expanded,
      };
      return updatedRuns;
    });
  };

  // Create a new run
  const handleAddRun = () => {
    const newId = runs.length > 0 ? Math.max(...runs.map((r) => r.id)) + 1 : 1;
    setRuns((prevRuns) => [
      ...prevRuns,
      {
        id: newId,
        name: `Run ${newId}`,
        project: { ...initialProject },
        activeStep: 0,
        processing: false,
        error: "",
        outputs: null,
        processHistory: [],
        historyExpanded: false,
        projectInfoExpanded: true,
        clientInfoExpanded: true,
        supplierInfoExpanded: true,
        datesExpanded: true,
        financialsExpanded: true,
      },
    ]);
    setSelectedRunId(newId);
  };

  // Select a run
  const handleSelectRun = (id) => {
    setSelectedRunId(id);
  };

  // Rename a run
  const handleRenameRun = (id, newName) => {
    setRuns((prevRuns) =>
      prevRuns.map((run) =>
        run.id === id ? { ...run, name: newName } : run
      )
    );
  };

  // Delete a run
  const handleDeleteRun = (id) => {
    let newRuns = runs.filter((run) => run.id !== id);
    if (newRuns.length === 0) {
      // Always keep at least one run
      newRuns = [
        {
          id: 1,
          name: "Run 1",
          project: { ...initialProject },
          activeStep: 0,
          processing: false,
          error: "",
          outputs: null,
          processHistory: [],
          historyExpanded: false,
          projectInfoExpanded: true,
          clientInfoExpanded: true,
          supplierInfoExpanded: true,
          datesExpanded: true,
          financialsExpanded: true,
        },
      ];
    }
    setRuns(newRuns);
    setSelectedRunId(newRuns[0].id);
  };

  // Simulate process (replace with real API integration)
  const handleStart = async () => {
    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      updatedRuns[currentRunIndex] = {
        ...updatedRuns[currentRunIndex],
        processing: true,
        error: "",
        outputs: null,
        activeStep: 0,
        projectInfoExpanded: false,
        clientInfoExpanded: false,
        supplierInfoExpanded: false,
        datesExpanded: false,
        financialsExpanded: false,
        processHistory: [],
        historyExpanded: true,
      };
      return updatedRuns;
    });

    // Log "Start" in history
    let history = [{
      step: "Start",
      status: "Process started",
      timestamp: new Date().toLocaleTimeString(),
    }];
    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      updatedRuns[currentRunIndex] = {
        ...updatedRuns[currentRunIndex],
        processHistory: [...history],
      };
      return updatedRuns;
    });
    await new Promise((res) => setTimeout(res, 500));

    // Simulate process with review/circle-back logic
    let step = 0;
    while (step < steps.length) {
      setRuns((prevRuns) => {
        const updatedRuns = [...prevRuns];
        updatedRuns[currentRunIndex] = {
          ...updatedRuns[currentRunIndex],
          activeStep: step,
        };
        return updatedRuns;
      });
      const stepName = steps[step];
      history.push({
        step: stepName,
        status: "Started",
        timestamp: new Date().toLocaleTimeString(),
      });
      setRuns((prevRuns) => {
        const updatedRuns = [...prevRuns];
        updatedRuns[currentRunIndex] = {
          ...updatedRuns[currentRunIndex],
          processHistory: [...history],
        };
        return updatedRuns;
      });
      await new Promise((res) => setTimeout(res, 1000));
      if (stepName === "Review Task") {
        // Simulate approval (random for demo, replace with real logic)
        const approved = Math.random() > 0.3;
        history.push({
          step: stepName,
          status: approved ? "Approved" : "Not Approved (circle back)",
          timestamp: new Date().toLocaleTimeString(),
        });
        setRuns((prevRuns) => {
          const updatedRuns = [...prevRuns];
          updatedRuns[currentRunIndex] = {
            ...updatedRuns[currentRunIndex],
            processHistory: [...history],
          };
          return updatedRuns;
        });
        if (!approved) {
          step = 0; // Go back to "Create Task"
          continue;
        }
      }
      if (stepName === "Review Output") {
        // Simulate approval (random for demo, replace with real logic)
        const approved = Math.random() > 0.3;
        history.push({
          step: stepName,
          status: approved ? "Approved" : "Not Approved (circle back)",
          timestamp: new Date().toLocaleTimeString(),
        });
        setRuns((prevRuns) => {
          const updatedRuns = [...prevRuns];
          updatedRuns[currentRunIndex] = {
            ...updatedRuns[currentRunIndex],
            processHistory: [...history],
          };
          return updatedRuns;
        });
        if (!approved) {
          step = steps.indexOf("Generate Output");
          continue;
        }
      }
      step++;
    }

    // Log "Finish" in history
    history.push({
      step: "Finish",
      status: "Process finished",
      timestamp: new Date().toLocaleTimeString(),
    });
    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      updatedRuns[currentRunIndex] = {
        ...updatedRuns[currentRunIndex],
        processHistory: [...history],
      };
      return updatedRuns;
    });
    await new Promise((res) => setTimeout(res, 500));

    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      updatedRuns[currentRunIndex] = {
        ...updatedRuns[currentRunIndex],
        outputs: {
          markdown: "/output/output.md",
          pdf: "/output/output.pdf",
          word: "/output/output.docx",
        },
        processing: false,
        historyExpanded: false,
      };
      return updatedRuns;
    });
  };

  // Render input fields
  const renderInput = (key, project, processing) => {
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
        flexDirection="row"
        bgcolor="background.default"
      >
        {/* Left Sidebar */}
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
              onClick={handleAddRun}
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
                onClick={() => handleSelectRun(run.id)}
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
                    handleDeleteRun(run.id);
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
        {/* Main Content */}
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
        >
          <Container maxWidth={false} sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", px: 0 }}>
            <Paper elevation={8} sx={{ width: "100%", p: { xs: 2, md: 6 }, borderRadius: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: "stretch",
                  justifyContent: "center",
                  width: "100%",
                  gap: { xs: 2, md: 4 },
                }}
              >
                {/* Left: Form and header */}
                <Box flex={2} minWidth={0}>
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
                  expanded={currentRun.projectInfoExpanded}
                  onChange={(_, expanded) => handleAccordionChange("projectInfoExpanded", expanded)}
                  disabled={currentRun.processing}
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
                            {renderInput(key, currentRun.project, currentRun.processing)}
                          </Grid>
                        ))}
                      {/* Description as last field, full width, always in its own row */}
                      <Grid item xs={12}>
                        <TextField
                          label="Description"
                          name="description"
                          value={currentRun.project["description"]}
                          onChange={handleChange}
                          multiline
                          minRows={6}
                          maxRows={12}
                          fullWidth
                          variant="outlined"
                          placeholder="Enter project description..."
                          disabled={currentRun.processing}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                {/* Client & Supplier Information Combined Accordion */}
                <Accordion
                  expanded={currentRun.clientInfoExpanded}
                  onChange={(_, expanded) => handleAccordionChange("clientInfoExpanded", expanded)}
                  disabled={currentRun.processing}
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
                              {renderInput(key, currentRun.project, currentRun.processing)}
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
                              {renderInput(key, currentRun.project, currentRun.processing)}
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
                {/* Dates Accordion */}
                <Accordion
                  expanded={currentRun.datesExpanded}
                  onChange={(_, expanded) => handleAccordionChange("datesExpanded", expanded)}
                  disabled={currentRun.processing}
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
                          {renderInput(key, currentRun.project, currentRun.processing)}
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                {/* Financials & Progress Accordion */}
                <Accordion
                  expanded={currentRun.financialsExpanded}
                  onChange={(_, expanded) => handleAccordionChange("financialsExpanded", expanded)}
                  disabled={currentRun.processing}
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
                          {renderInput(key, currentRun.project, currentRun.processing)}
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
                    disabled={currentRun.processing}
                    sx={{ minWidth: 160, fontWeight: "bold" }}
                    startIcon={currentRun.processing ? <CircularProgress size={24} color="inherit" /> : null}
                  >
                    {currentRun.processing ? "Processing..." : "Start"}
                  </Button>
                </Box>
              </form>
                </Box>
              </Box>
              {/* Process Status */}
              {(currentRun.processing || currentRun.activeStep > 0) && (
                <Box mt={6}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Process Status
                  </Typography>
                  {/* Step icons mapping */}
                  <Stepper activeStep={currentRun.activeStep} alternativeLabel>
                    {steps.map((label, idx) => {
                      // Determine status
                      let status = "pending";
                      if (idx < currentRun.activeStep) status = "completed";
                      else if (idx === currentRun.activeStep) status = "active";

                      // Icon color logic
                      let iconColor = "action";
                      if (status === "completed") iconColor = "success";
                      else if (status === "active") iconColor = "primary";
                      else iconColor = "disabled";

                      // Icon selection (large)
                      let icon = null;
                      const iconProps = { color: iconColor, sx: { fontSize: 36 } };
                      if (status === "active" && currentRun.processing) {
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
                  {currentRun.processing && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <CircularProgress color="primary" size={40} />
                    </Box>
                  )}
                  {/* Process Running History Accordion */}
                  <Accordion
                    sx={{ mt: 4 }}
                    expanded={currentRun.historyExpanded}
                    onChange={(_, expanded) =>
                      setRuns((prevRuns) => {
                        const updatedRuns = [...prevRuns];
                        updatedRuns[currentRunIndex] = {
                          ...updatedRuns[currentRunIndex],
                          historyExpanded: expanded,
                        };
                        return updatedRuns;
                      })
                    }
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
                      {currentRun.processHistory.filter(
                        (entry) => entry.step !== "Start" && entry.step !== "Finish"
                      ).length === 0 ? (
                        <Typography color="text.secondary">No history yet.</Typography>
                      ) : (
                        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                          {currentRun.processHistory
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
              )}
              {/* Error Message */}
              {currentRun.error && (
                <Box mt={4}>
                  <Alert severity="error">{currentRun.error}</Alert>
                </Box>
              )}
              {/* Output Download */}
              {currentRun.outputs && (
                <Box mt={6} textAlign="center">
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Download Outputs
                  </Typography>
                  <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} justifyContent="center">
                    <Button
                      component={Link}
                      href={currentRun.outputs.markdown}
                      download
                      variant="contained"
                      color="primary"
                    >
                      Download Markdown
                    </Button>
                    <Button
                      component={Link}
                      href={currentRun.outputs.pdf}
                      download
                      variant="contained"
                      color="success"
                    >
                      Download PDF
                    </Button>
                    <Button
                      component={Link}
                      href={currentRun.outputs.word}
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
      </Box>
    </ThemeProvider>
  );
}

export default App;
