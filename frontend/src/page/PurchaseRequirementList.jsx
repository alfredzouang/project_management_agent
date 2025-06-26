import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, CircularProgress, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import { getPurchaseRequirements } from "../api/api";

const columns = [
  { id: "PR Code", label: "PR Code" },
  { id: "PR Type", label: "PR Type" },
  { id: "PR Title", label: "PR Title" },
  { id: "PR Category", label: "PR Category" },
  { id: "Business Unit (Requestor) (User)", label: "Business Unit" },
  { id: "Skill", label: "Skill" },
  { id: "Creator", label: "Creator" },
  { id: "Requestor", label: "Requestor" },
  { id: "Approval Status", label: "Approval Status" },
];

function PurchaseRequirementList() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // MUI page is 0-based
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  // Search and filter states
  const [prCode, setPrCode] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prType, setPrType] = useState("");
  const [prCategory, setPrCategory] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [skill, setSkill] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");

  // Filter options
  const [prTypeOptions, setPrTypeOptions] = useState([]);
  const [prCategoryOptions, setPrCategoryOptions] = useState([]);
  const [businessUnitOptions, setBusinessUnitOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [approvalStatusOptions, setApprovalStatusOptions] = useState([]);

  useEffect(() => {
    fetchData(page, pageSize);
    // eslint-disable-next-line
  }, [page, pageSize, prCode, prTitle, prType, prCategory, businessUnit, skill, approvalStatus]);

  useEffect(() => {
    // Fetch filter options on mount
    async function fetchFilters() {
      try {
        const res = await import("../api/api").then(mod => mod.getPurchaseRequirementFilters());
        setPrTypeOptions(res.pr_types || []);
        setPrCategoryOptions(res.pr_categories || []);
        setBusinessUnitOptions(res.business_units || []);
        setSkillOptions(res.skills || []);
        setApprovalStatusOptions(res.approval_statuses || []);
      } catch (err) {
        setPrTypeOptions([]);
        setPrCategoryOptions([]);
        setBusinessUnitOptions([]);
        setSkillOptions([]);
        setApprovalStatusOptions([]);
      }
    }
    fetchFilters();
  }, []);

  const fetchData = async (page, pageSize) => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: pageSize,
        pr_code: prCode || undefined,
        pr_title: prTitle || undefined,
        pr_type: prType || undefined,
        pr_category: prCategory || undefined,
        business_unit: businessUnit || undefined,
        skill: skill || undefined,
        approval_status: approvalStatus || undefined
      };
      const res = await import("../api/api").then(mod => mod.getPurchaseRequirements(params));
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setData([]);
      setTotal(0);
    }
    setLoading(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      bgcolor="background.default"
      sx={{ width: "100%", py: 4 }}
    >
      <Paper elevation={6} sx={{ width: "100vw", minWidth: 360, p: { xs: 1, md: 3 }, borderRadius: 2, overflowX: "auto" }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
          Purchase Requirement List
        </Typography>
        <Box sx={{ mb: 2 }}>
          <span style={{ fontSize: 16, color: "#666" }}>Example PR Code: </span>
          <span
            style={{
              color: "#1976d2",
              textDecoration: "underline",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 16,
              marginLeft: 4,
            }}
            onClick={() => { setPrCode("PR20250414000040"); setPage(0); }}
          >
            PR20250414000040
          </span>
          <span
            style={{
              color: "#1976d2",
              textDecoration: "underline",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 16,
              marginLeft: 16,
            }}
            onClick={() => { setPrCode("PR20240626000070"); setPage(0); }}
          >
            PR20240626000070
          </span>
        </Box>
        {/* Search & Filter Form */}
        <Box
          component="form"
          onSubmit={e => { e.preventDefault(); fetchData(0, pageSize); setPage(0); }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
            alignItems: "center"
          }}
        >
          <input
            type="text"
            placeholder="PR Code (fuzzy search)"
            value={prCode || ""}
            onChange={e => { setPrCode(e.target.value); setPage(0); }}
            style={{
              flex: "1 1 120px",
              minWidth: 120,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          />
          <input
            type="text"
            placeholder="PR Title (fuzzy search)"
            value={prTitle || ""}
            onChange={e => { setPrTitle(e.target.value); setPage(0); }}
            style={{
              flex: "1 1 120px",
              minWidth: 120,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          />
          <select
            value={prType || ""}
            onChange={e => { setPrType(e.target.value); setPage(0); }}
            style={{
              minWidth: 120,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          >
            <option value="">All Types</option>
            {prTypeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={prCategory || ""}
            onChange={e => { setPrCategory(e.target.value); setPage(0); }}
            style={{
              minWidth: 120,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          >
            <option value="">All Categories</option>
            {prCategoryOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={businessUnit || ""}
            onChange={e => { setBusinessUnit(e.target.value); setPage(0); }}
            style={{
              minWidth: 120,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          >
            <option value="">All Business Units</option>
            {businessUnitOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={skill || ""}
            onChange={e => { setSkill(e.target.value); setPage(0); }}
            style={{
              minWidth: 120,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          >
            <option value="">All Skills</option>
            {skillOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={approvalStatus || ""}
            onChange={e => { setApprovalStatus(e.target.value); setPage(0); }}
            style={{
              minWidth: 120,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 16
            }}
          >
            <option value="">All Status</option>
            {approvalStatusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: "8px 24px",
              borderRadius: 4,
              border: "none",
              background: "#1976d2",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer"
            }}
          >
            Search
          </button>
        </Box>
        <Box sx={{ minHeight: 400, position: "relative" }}>
          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 300 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              sx={{
                borderRadius: 3,
                boxShadow: "0 2px 16px 0 rgba(60,72,100,0.08)",
                background: "#fff",
                minHeight: 400
              }}
            >
              <Table
                size="small"
                sx={{
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  "& thead th": {
                    fontWeight: "bold",
                    background: "#fafbfc",
                    color: "#222",
                    borderBottom: "1.5px solid #f0f0f0",
                    fontSize: 15,
                    letterSpacing: 0.2,
                  },
                  "& tbody tr": {
                    transition: "background 0.2s",
                    "&:hover": {
                      background: "#f5f7fa"
                    }
                  },
                  "& td, & th": {
                    border: "none",
                    padding: "12px 10px"
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell key={col.id} sx={{ fontWeight: "bold" }}>
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center" sx={{ color: "text.secondary" }}>
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, idx) => (
                      <TableRow key={row["PR Code"] || idx}>
                        {columns.map((col) => (
                          <TableCell key={col.id}>
                            {col.id === "Approval Status" ? (
                              (() => {
                                let color = "default";
                                let label = row[col.id] || "";
                                let style = {
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "18px",
                                  fontWeight: 700,
                                  fontSize: 15,
                                  padding: "0 18px",
                                  height: "32px",
                                  letterSpacing: "0.2px",
                                  background: "#f5f7fa",
                                  color: "#222",
                                  minWidth: 80,
                                  boxSizing: "border-box"
                                };
                                // 彩色标签映射
                                switch (label) {
                                  case "Approved":
                                    style.background = "#e6f4ea";
                                    style.color = "#219653";
                                    break;
                                  case "Pending":
                                    style.background = "#e3f2fd";
                                    style.color = "#1976d2";
                                    break;
                                  case "Submitted":
                                    style.background = "#e3f2fd";
                                    style.color = "#1976d2";
                                    break;
                                  case "Draft":
                                    style.background = "#f4f6f8";
                                    style.color = "#757575";
                                    break;
                                  case "Cancelled":
                                    style.background = "#ececec";
                                    style.color = "#222";
                                    break;
                                  case "Rejected":
                                    style.background = "#fdeaea";
                                    style.color = "#d32f2f";
                                    break;
                                  case "Returned":
                                    style.background = "#fff3e0";
                                    style.color = "#ff9800";
                                    break;
                                  default:
                                    style.background = "#f5f7fa";
                                    style.color = "#222";
                                }
                                return (
                                  <span style={style}>{label}</span>
                                );
                              })()
                            ) : col.id === "Skill" ? (
                              (() => {
                                const skills = (row[col.id] || "").split("/").map(s => s.trim()).filter(Boolean);
                                if (skills.length === 0) return null;
                                return (
                                  <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {skills.map((skill, idx) => {
                                      const style = {
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "14px",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        padding: "0 14px",
                                        height: "28px",
                                        letterSpacing: "0.2px",
                                        background: "#e6f4ea",
                                        color: "#219653",
                                        minWidth: 40,
                                        boxSizing: "border-box"
                                      };
                                      return (
                                        <span key={idx} style={style}>{skill}</span>
                                      );
                                    })}
                                  </span>
                                );
                              })()
                            ) : (
                              col.id === "PR Code" ? (
                            <Link
                              to={`/purchaserequirement/${encodeURIComponent(row["PR Code"])}`}
                              style={{ color: "#1976d2", textDecoration: "underline", fontWeight: 600 }}
                              onClick={() => { console.log("Clicked PR Code:", row["PR Code"]); }}
                            >
                              {row["PR Code"]}
                            </Link>
                          ) :
                          row[col.id]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

export default PurchaseRequirementList;
