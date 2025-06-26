import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Project Management", path: "/projects" },
  { label: "Purchase Requirements", path: "/purchase-requirements" }
];

function AppHeader({ mode, onToggleMode }) {
  const location = useLocation();

  return (
    <AppBar position="static" color={mode === "dark" ? "default" : "primary"} elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            color: mode === "dark" ? "#e0e0e0" : "#fff",
            letterSpacing: 1
          }}
        >
          Project Management Assistant
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color={location.pathname === item.path ? "secondary" : "inherit"}
              sx={{
                fontWeight: 500,
                color: location.pathname === item.path
                  ? (mode === "dark" ? "#4B256D" : "#fff")
                  : (mode === "dark" ? "#e0e0e0" : "#fff"),
                bgcolor: location.pathname === item.path
                  ? (mode === "dark" ? "#e3e3f7" : "primary.main")
                  : "transparent",
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  bgcolor: mode === "dark" ? "#4B256D" : "#e3e3f7",
                  color: "#fff"
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
        <IconButton
          sx={{ ml: 2 }}
          onClick={onToggleMode}
          color="inherit"
          title="Toggle dark/light mode"
        >
          {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;
