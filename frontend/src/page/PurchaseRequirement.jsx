import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress, Divider } from "@mui/material";
import { useParams } from "react-router-dom";
import { getPurchaseRequirement } from "../api/api";
import PurchaseRequirementDetails from "../component/PurchaseRequirementDetails";
import ResumeListTable from "../component/ResumeListTable";

function PurchaseRequirement() {
  const { prCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Resume list state
  const [resumes, setResumes] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await getPurchaseRequirement(prCode);
        setData(res);
      } catch (err) {
        setError(err.message || "加载失败");
        setData(null);
      }
      setLoading(false);
    }
    if (prCode) fetchData();
  }, [prCode]);

  // Fetch resumes by PR Code
  useEffect(() => {
    async function fetchResumes() {
      setResumeLoading(true);
      setResumeError("");
      try {
        const res = await import("../api/api").then(mod => mod.getResumesByPRCode(prCode));
        setResumes(res);
      } catch (err) {
        setResumeError(err.message || "Failed to load resumes");
        setResumes([]);
      }
      setResumeLoading(false);
    }
    if (prCode) fetchResumes();
  }, [prCode]);

  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      bgcolor="background.default"
      sx={{ width: "100%", py: 4, boxSizing: "border-box" }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          mx: "auto",
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          boxSizing: "border-box",
        }}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
          Purchase Requirement Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : !data ? (
          <Typography color="text.secondary">No data found</Typography>
        ) : (
          <PurchaseRequirementDetails data={data} />
        )}

        <Divider sx={{ my: 4 }} />
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Related Resumes
          </Typography>
          {resumeLoading ? (
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 120 }}>
              <CircularProgress />
            </Box>
          ) : resumeError ? (
            <Typography color="error">{resumeError}</Typography>
          ) : resumes.length === 0 ? (
            <Typography color="text.secondary">No resumes found for this purchase requirement.</Typography>
          ) : (
            <ResumeListTable resumes={resumes} />
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default PurchaseRequirement;
