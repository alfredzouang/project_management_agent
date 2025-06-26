import React, { useState } from "react";
import { Box, Dialog, DialogTitle, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ResumeDetailTable from "./ResumeDetailTable";

// ResumeListTable: 展示分组后的简历主表+可展开详情
export default function ResumeListTable({ resumes }) {
  // 优先显示非 cancelled
  const sortedResumes = [...resumes].sort((a, b) => {
    const statusA = (a.Status || a.status || "").toLowerCase();
    const statusB = (b.Status || b.status || "").toLowerCase();
    if (statusA === "cancelled" && statusB !== "cancelled") return 1;
    if (statusA !== "cancelled" && statusB === "cancelled") return -1;
    return 0;
  });

  // 分组：pr+itemno
  const grouped = {};
  sortedResumes.forEach((row) => {
    const key = `${row.PR}||${row.ItemNo}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });
  const mainRows = Object.values(grouped).map((rows) => rows[0]);

  // modal 控制
  const [openKey, setOpenKey] = useState(null);

  const thStyle = {
    fontWeight: "bold",
    background: "#f5f7fa",
    color: "#222",
    padding: "8px 12px",
    borderBottom: "2px solid #e0e0e0",
    textAlign: "left",
    whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "8px 12px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: 15,
    verticalAlign: "top",
    whiteSpace: "nowrap",
  };

  return (
    <Box sx={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>PR</th>
            <th style={thStyle}>ItemNo</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Details</th>
          </tr>
        </thead>
        <tbody>
          {mainRows.map((row, idx) => {
            const key = `${row.PR}||${row.ItemNo}`;
            return (
              <tr key={key} style={{ background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                <td style={tdStyle}>{row.PR}</td>
                <td style={tdStyle}>{row.ItemNo}</td>
                <td style={tdStyle}>{row.Name || row.name}</td>
                <td style={tdStyle}>{row.Status || row.status}</td>
                <td style={tdStyle}>
                  <button
                    style={{
                      border: "none",
                      background: "none",
                      color: "#1976d2",
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 15,
                      padding: 0,
                    }}
                    onClick={() => setOpenKey(key)}
                  >
                    Show
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Dialog
        open={!!openKey}
        onClose={() => setOpenKey(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, p: 0, minWidth: 480, maxWidth: 800 },
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: 22, pr: 5 }}>
          Resume Experience Details
          <IconButton
            aria-label="close"
            onClick={() => setOpenKey(null)}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: (theme) => theme.palette.grey[500],
            }}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: "#f8fafc" }}>
          {openKey && <ResumeDetailTable rows={grouped[openKey]} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
