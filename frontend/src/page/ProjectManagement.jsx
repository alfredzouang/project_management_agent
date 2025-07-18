import React, { useState, useRef } from "react";
import AppHeader from "../component/AppHeader";
import { startProcessWithStatusStream } from "../api/api";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import ProjectInformation from "../component/ProjectInformation";
import ClientInformation from "../component/ClientInformation";
import SupplierInformation from "../component/SupplierInformation";
import DatesSection from "../component/DatesSection";
import FinancialsSection from "../component/FinancialsSection";
import PageHeader from "../component/PageHeader";
import ProjectRuns from "../component/ProjectRuns";
import ProcessStatus from "../component/ProcessStatus";
import {
  Brightness4,
  Brightness7,
  ExpandMore,
  AccountCircle,
} from "@mui/icons-material";
import ChatInput from "../component/ChatInput";

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

function ProjectManagement({ mode, onToggleMode }) {
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

  // Add user message to chat history (now supports file)
  const handleSendChat = (message, file) => {
    setRuns((prevRuns) => {
      const updatedRuns = [...prevRuns];
      const run = { ...updatedRuns[getCurrentRunIndex()] };
      run.chatMessages = [
        ...(run.chatMessages || []),
        {
          text: message,
          sender: "user",
          timestamp: new Date().toLocaleTimeString(),
          file: file
            ? {
                name: file.name,
                size: file.size,
                type: file.type,
              }
            : null,
        }
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
        const runIdx = getCurrentRunIndex();
        const run = { ...updatedRuns[runIdx] };
        const prevProject = run.project || {};
        const newProject = { ...run.project, ...response.project };
        // Find changed fields
        const updatedFields = [];
        for (const key in response.project) {
          if (prevProject[key] !== response.project[key]) {
            updatedFields.push(key);
          }
        }
        run.project = newProject;
        run.updatedFields = updatedFields;
        run.chatMessages = [
          ...(run.chatMessages || []),
          {
            role: "assistant",
            content: JSON.stringify(response.project, null, 2),
            timestamp: new Date().toLocaleTimeString()
          }
        ];
        updatedRuns[runIdx] = run;
        // Clear updatedFields after 1s
        setTimeout(() => {
          setRuns((runsAfterTimeout) => {
            const runsCopy = [...runsAfterTimeout];
            const runTimeout = { ...runsCopy[runIdx] };
            runTimeout.updatedFields = [];
            runsCopy[runIdx] = runTimeout;
            return runsCopy;
          });
        }, 1000);
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

  // Stepper logic
  const getActiveStepFromHistory = (processHistory) => {
    if (!processHistory || processHistory.length === 0) return 0;
    const backendStepToStepperIndex = (step) => {
      if (!step) return 0;
      if (step === "Finish") return 6;
      if (step.startsWith("CreateProjectTaskStep")) {
        return 1;
      }
      if (step.startsWith("ReviewTaskStep")) {
        return 2;
      }
      if (step.startsWith("AssignResourceStep")) {
        return 3;
      }
      if (step.startsWith("GenerateOutputStep.generate_output") || step.startsWith("GenerateOutputStep.revise_output")) {
        return 4;
      }
      if (step.startsWith("GenerateOutputStep.review_output")) {
        return 5;
      }
      return 0;
    };
    const lastEntry = processHistory[processHistory.length - 1];
    if (
      lastEntry &&
      lastEntry.status &&
      (
        lastEntry.status.toLowerCase().includes("finished") ||
        lastEntry.status.toLowerCase().includes("done") ||
        lastEntry.status.toLowerCase().includes("error")
      ) &&
      (!lastEntry.step || lastEntry.step === "")
    ) {
      return 6;
    }
    if (lastEntry && lastEntry.step === "Finish") {
      return 6;
    }
    for (let i = processHistory.length - 1; i >= 0; i--) {
      const entry = processHistory[i];
      if (entry && entry.status) {
        const statusLower = entry.status.toLowerCase();
        if (
          statusLower === "start" ||
          statusLower === "active" ||
          statusLower === "processing"
        ) {
          if (entry.step) {
            return backendStepToStepperIndex(entry.step);
          }
        }
      }
    }
    for (let i = processHistory.length - 1; i >= 0; i--) {
      const entry = processHistory[i];
      if (entry && entry.step) {
        return backendStepToStepperIndex(entry.step);
      }
    }
    return 0;
  };
  const computedActiveStep = getActiveStepFromHistory(currentRun.processHistory);

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

  // Store unsubscribe functions for process status streams
  const processUnsubscribers = useRef({});

  // Start backend process and stream status updates
  const handleStart = async () => {
    const runId = selectedRunId;
    if (processUnsubscribers.current[runId]) {
      processUnsubscribers.current[runId]();
      delete processUnsubscribers.current[runId];
    }
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
        processHistory: [
          {
            step: "Start",
            status: "Process started",
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
        historyExpanded: true,
      };
      return updatedRuns;
    });

    try {
      const unsubscribe = await startProcessWithStatusStream(
        runs[currentRunIndex].project,
        (event) => {
          // ...（与原 App.jsx 相同的事件处理逻辑，略）
          // 这里可根据需要精简日志
          let parsedEvent = event;
          if (
            typeof event === "string" &&
            event.trim().length > 0
          ) {
            try {
              parsedEvent = JSON.parse(event);
            } catch (e) {
              return;
            }
          }
          if (
            parsedEvent &&
            typeof parsedEvent === "object" &&
            typeof parsedEvent.raw === "string" &&
            parsedEvent.raw.trim().length > 0
          ) {
            try {
              const rawObj = JSON.parse(parsedEvent.raw);
              parsedEvent = { ...parsedEvent, ...rawObj };
            } catch (e) {}
          }
          setRuns((prevRuns) => {
            const updatedRuns = [...prevRuns];
            const idx = updatedRuns.findIndex((r) => r.id === runId);
            if (idx === -1) return prevRuns;
            const run = { ...updatedRuns[idx] };
            let step = "", status = "", extra = undefined;
            if (typeof parsedEvent === "object") {
              step = parsedEvent.step || "";
              status = parsedEvent.status || "";
              extra = parsedEvent.extra;
            } else if (typeof parsedEvent === "string") {
              status = parsedEvent;
            }
            const backendToUIMap = {
              "Start": 0,
              "CreateProjectTaskStep": 1,
              "ReviewTaskStep": 2,
              "AssignResourceStep": 3,
              "GenerateOutputStep": 4,
              "ReviewOutputStep": 5,
              "Finish": 6
            };
            let stepIdx = 0;
            if (
              status &&
              (status.toLowerCase().includes("finished") ||
                status.toLowerCase().includes("done") ||
                status.toLowerCase().includes("error"))
            ) {
              stepIdx = backendToUIMap["Finish"];
            } else if (step) {
              const baseStep = step.split(".")[0];
              if (backendToUIMap.hasOwnProperty(baseStep)) {
                stepIdx = backendToUIMap[baseStep];
              }
            }
            let extraInfo = extra;
            if (extra && extra.suggestion) {
              extraInfo = `Suggestion: ${extra.suggestion}`;
            }
            const history = run.processHistory ? [...run.processHistory] : [];
            const lastEntry = history[history.length - 1];
            if (
              (step && step.trim() !== "") ||
              (status && status.trim() !== "")
            ) {
              if (
                !lastEntry ||
                lastEntry.step !== (step || "") ||
                lastEntry.status !== (status || "")
              ) {
                let filteredState = undefined;
                if (parsedEvent && parsedEvent.state) {
                  const s = parsedEvent.state;
                  filteredState = {};
                  if (s.project !== undefined) filteredState.project = s.project;
                  if (s.task_list !== undefined) filteredState.task_list = s.task_list;
                  if (s.need_revision !== undefined) filteredState.need_revision = s.need_revision;
                  if (s.suggestion !== undefined) filteredState.suggestion = s.suggestion;
                  if (s.payload && typeof s.payload === "object") {
                    if (s.payload.need_revision !== undefined) filteredState.need_revision = s.payload.need_revision;
                    if (s.payload.suggestion !== undefined) filteredState.suggestion = s.payload.suggestion;
                  }
                  if (Object.keys(filteredState).length === 0) filteredState = undefined;
                }
                let suggestion = undefined;
                if (parsedEvent && parsedEvent.suggestion) {
                  suggestion = parsedEvent.suggestion;
                } else if (extra && extra.suggestion) {
                  suggestion = extra.suggestion;
                } else if (filteredState && filteredState.suggestion) {
                  suggestion = filteredState.suggestion;
                } else if (parsedEvent && parsedEvent.payload && parsedEvent.payload.suggestion) {
                  suggestion = parsedEvent.payload.suggestion;
                }
                let displayStatus = status || "";
                const isReviewStep =
                  step &&
                  (step.startsWith("ReviewTaskStep.review_task") ||
                    step.startsWith("GenerateOutputStep.review_output"));
                const isApprovedStatus =
                  status &&
                  typeof status === "string" &&
                  status.trim().toLowerCase() === "approved";
                if (
                  isReviewStep &&
                  (
                    (filteredState && filteredState.need_revision === false) ||
                    (parsedEvent && parsedEvent.need_revision === false) ||
                    (parsedEvent && parsedEvent.payload && parsedEvent.payload.need_revision === false) ||
                    isApprovedStatus
                  )
                ) {
                  displayStatus = "Passed";
                }
                history.push({
                  step: step || "",
                  status: displayStatus,
                  timestamp: new Date().toLocaleTimeString(),
                  extra: extraInfo,
                  state: filteredState,
                  ...(suggestion ? { suggestion } : {}),
                });
              }
            }
            let outputs = run.outputs;
            let processing = run.processing;
            let activeStepFinal = stepIdx;
            if (
              status &&
              (status.toLowerCase().includes("finished") ||
                status.toLowerCase().includes("done") ||
                status.toLowerCase().includes("error"))
            ) {
              processing = false;
              activeStepFinal = 6;
              const lastHistory = history[history.length - 1];
              if (!lastHistory || lastHistory.step !== "Finish") {
                history.push({
                  step: "Finish",
                  status: "Finished",
                  timestamp: new Date().toLocaleTimeString(),
                });
              }
              if (event.output_files) {
                outputs = event.output_files;
              } else if (parsedEvent && parsedEvent.output_files) {
                outputs = parsedEvent.output_files;
              }
            }
            updatedRuns[idx] = {
              ...run,
              processHistory: history,
              activeStep: activeStepFinal,
              processing,
              outputs,
            };
            return updatedRuns;
          });
        }
      );
      processUnsubscribers.current[runId] = unsubscribe;
    } catch (err) {
      setRuns((prevRuns) => {
        const updatedRuns = [...prevRuns];
        updatedRuns[currentRunIndex] = {
          ...updatedRuns[currentRunIndex],
          processing: false,
          error: err.message || "Failed to start process",
        };
        return updatedRuns;
      });
    }
  };

  return (
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
                  onToggleMode={onToggleMode}
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
                  updatedFields={currentRun.updatedFields || []}
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
                        updatedFields={currentRun.updatedFields || []}
                      />
                      <SupplierInformation
                        project={currentRun.project}
                        handleChange={handleChange}
                        processing={currentRun.processing}
                        mode={mode}
                        updatedFields={currentRun.updatedFields || []}
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
                  updatedFields={currentRun.updatedFields || []}
                />
                {/* Financials & Progress Accordion */}
                <FinancialsSection
                  expanded={currentRun.financialsExpanded}
                  onAccordionChange={handleAccordionChange}
                  project={currentRun.project}
                  handleChange={handleChange}
                  processing={currentRun.processing}
                  mode={mode}
                  updatedFields={currentRun.updatedFields || []}
                />
              </Box>
            </Box>
            {/* Process Status */}
            <ProcessStatus
              processing={currentRun.processing}
              activeStep={computedActiveStep}
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
  );
}

export default ProjectManagement;
