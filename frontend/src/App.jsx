import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Link,
  IconButton,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ProjectInformation from "./component/ProjectInformation";
import ClientInformation from "./component/ClientInformation";
import SupplierInformation from "./component/SupplierInformation";
import DatesSection from "./component/DatesSection";
import FinancialsSection from "./component/FinancialsSection";
import PageHeader from "./component/PageHeader";
import ProjectRuns from "./component/ProjectRuns";
import ProcessStatus from "./component/ProcessStatus";
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
import ChatInput from "./component/ChatInput";

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
      chatMessages: [],
    },
  ]);
  const [selectedRunId, setSelectedRunId] = useState(1);

  // Chat input state
  const [chatInput, setChatInput] = useState("");

  // Handle chat input change
  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  // Add user message to chat history
  const handleSendChat = (message) => {
    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      const run = { ...updatedRuns[getCurrentRunIndex()] };
      run.chatMessages = [
        ...(run.chatMessages || []),
        { text: message, sender: "user", timestamp: new Date().toLocaleTimeString() }
      ];
      updatedRuns[getCurrentRunIndex()] = run;
      return updatedRuns;
    });
    setChatInput("");
  };

  // Add assistant message to chat history and update project if needed
  const handleReceiveChatResponse = (response) => {
    if (response.type === "project") {
      setRuns((prevRuns) => {
        const updatedRuns = [...prevRuns];
        const run = { ...updatedRuns[getCurrentRunIndex()] };
        run.project = { ...run.project, ...response.project };
        run.chatMessages = [
          ...(run.chatMessages || []),
          {
            role: "assistant",
            content: JSON.stringify(response.project, null, 2),
            timestamp: new Date().toLocaleTimeString()
          }
        ];
        updatedRuns[getCurrentRunIndex()] = run;
        return updatedRuns;
      });
    } else if (response.type === "ai") {
      setRuns((prevRuns) => {
        const updatedRuns = [...prevRuns];
        const run = { ...updatedRuns[getCurrentRunIndex()] };
        run.chatMessages = [
          ...(run.chatMessages || []),
          {
            role: "assistant",
            content: response.text,
            timestamp: new Date().toLocaleTimeString()
          }
        ];
        updatedRuns[getCurrentRunIndex()] = run;
        return updatedRuns;
      });
    }
  };

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
        chatMessages: [],
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
        <ProjectRuns
          runs={runs}
          selectedRunId={selectedRunId}
          onSelectRun={handleSelectRun}
          onAddRun={handleAddRun}
          onDeleteRun={handleDeleteRun}
          mode={mode}
        />
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
                  <PageHeader
                    mode={mode}
                    onToggleMode={() => setMode((prev) => (prev === "dark" ? "light" : "dark"))}
                  />
                  {/* Chat UI */}
                  <ChatInput
                    chatInput={chatInput}
                    onChatInputChange={handleChatInputChange}
                    onSendChat={handleSendChat}
                    onReceiveChatResponse={handleReceiveChatResponse}
                    chatMessages={currentRun.chatMessages}
                    processing={currentRun.processing}
                    mode={mode}
                  />
                  {/* Project Information Accordion */}
                  <ProjectInformation
                    expanded={currentRun.projectInfoExpanded}
                    onAccordionChange={handleAccordionChange}
                    project={currentRun.project}
                    handleChange={handleChange}
                    processing={currentRun.processing}
                    mode={mode}
                  />
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
                        minHeight: 28,
                        "& .MuiTypography-root": { color: "#fff", fontSize: "0.95rem" },
                        "& .MuiSvgIcon-root": { color: "#fff" },
                        "&.MuiAccordionSummary-root": { minHeight: 28 },
                        "& .MuiAccordionSummary-content": { margin: "6px 0" }
                      }}
                    >
                      <AccountCircle sx={{ mr: 1, color: "#fff" }} />
                      <Typography variant="h6" fontWeight="bold">
                        Client & Supplier Information
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ mt: 2 }}>
                      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2}>
                        <ClientInformation
                          project={currentRun.project}
                          handleChange={handleChange}
                          processing={currentRun.processing}
                          mode={mode}
                        />
                        <SupplierInformation
                          project={currentRun.project}
                          handleChange={handleChange}
                          processing={currentRun.processing}
                          mode={mode}
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                  {/* Dates Accordion */}
                  <DatesSection
                    expanded={currentRun.datesExpanded}
                    onAccordionChange={handleAccordionChange}
                    project={currentRun.project}
                    handleChange={handleChange}
                    processing={currentRun.processing}
                    mode={mode}
                  />
                  {/* Financials & Progress Accordion */}
                  <FinancialsSection
                    expanded={currentRun.financialsExpanded}
                    onAccordionChange={handleAccordionChange}
                    project={currentRun.project}
                    handleChange={handleChange}
                    processing={currentRun.processing}
                    mode={mode}
                  />
                </Box>
              </Box>
              {/* Process Status */}
              <ProcessStatus
                processing={currentRun.processing}
                activeStep={currentRun.activeStep}
                steps={steps}
                processHistory={currentRun.processHistory}
                historyExpanded={currentRun.historyExpanded}
                onHistoryAccordionChange={(expanded) =>
                  setRuns((prevRuns) => {
                    const updatedRuns = [...prevRuns];
                    updatedRuns[currentRunIndex] = {
                      ...updatedRuns[currentRunIndex],
                      historyExpanded: expanded,
                    };
                    return updatedRuns;
                  })
                }
                outputs={currentRun.outputs}
                onStart={handleStart}
                mode={mode}
              />
              {/* Error Message */}
              {currentRun.error && (
                <Box mt={4}>
                  <Alert severity="error">{currentRun.error}</Alert>
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
