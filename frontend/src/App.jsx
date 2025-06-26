import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppHeader from "./component/AppHeader";
import ProjectManagement from "./page/ProjectManagement";
import PurchaseRequirementList from "./page/PurchaseRequirementList";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import PurchaseRequirement from "./page/PurchaseRequirement";

function App() {
  const [mode, setMode] = React.useState(localStorage.getItem("theme") || "light");
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppHeader mode={mode} onToggleMode={() => setMode((prev) => (prev === "dark" ? "light" : "dark"))} />
        <Routes>
          <Route
            path="/projects"
            element={<ProjectManagement mode={mode} onToggleMode={() => setMode((prev) => (prev === "dark" ? "light" : "dark"))} />}
          />
          <Route
            path="/purchase-requirements"
            element={<PurchaseRequirementList />}
          />
          <Route
            path="/purchaserequirement/:prCode"
            element={<PurchaseRequirement />}
          />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
