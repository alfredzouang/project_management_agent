import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Stack,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { evaluatePurchaseRequirement } from "../api/api";
import StarIcon from "@mui/icons-material/Star";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { deepOrange, deepPurple, blue, green, red, teal, amber } from "@mui/material/colors";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 字段 label 映射
const fieldLabels = {
  "PR Code": "PR Code",
  "PR Type": "PR Type",
  "PR Title": "PR Title",
  "PR Category": "PR Category",
  "Business Unit (Requestor) (User)": "Business Unit",
  "Skill": "Skill",
  "Creator": "Creator",
  "Requestor": "Requestor",
  "Approval Status": "Approval Status",
  "Created Time": "Created Time",
  "Last Modified Time": "Last Modified Time",
  "Description": "Description",
};

const mainFields = [
  "PR Code", "PR Title", "PR Type", "PR Category", "Business Unit (Requestor) (User)", "Skill"
];
const peopleFields = [
  "Creator", "Requestor"
];
const statusFields = [
  "Approval Status", "Created Time", "Last Modified Time"
];

function getAvatarText(name) {
  if (!name || typeof name !== "string") return "";
  const n = name.trim();
  // 中文名：取前两字
  if (/^[\u4e00-\u9fa5]{2,}/.test(n)) return n.slice(0, 2);
  // 英文名：取首字母+姓首字母
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  // 单个英文单词
  return n.slice(0, 2).toUpperCase();
}

// 颜色池
const avatarColors = [
  deepOrange[500],
  deepPurple[500],
  blue[500],
  green[500],
  red[500],
  teal[500],
  amber[700]
];
function getAvatarColor(name, idx = 0) {
  // hash name to color index
  if (!name) return avatarColors[idx % avatarColors.length];
  let hash = 0;
  for (let i = 0; i < name.length; ++i) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colorIdx = Math.abs(hash) % avatarColors.length;
  return avatarColors[colorIdx];
}
// 拆分多人
function splitNames(str) {
  if (!str || typeof str !== "string") return [];
  // 只以逗号、分号、顿号、中文逗号分隔，不以空格分割
  return str.split(/[,;、，]+/).map(s => s.trim()).filter(Boolean);
}

export default function PurchaseRequirementDetails({ data }) {
  // 计算 label 最大宽度
  const allLabels = [
    ...mainFields,
    ...peopleFields,
    ...statusFields,
    ...Object.keys(data || {}).filter(
      (key) =>
        !mainFields.includes(key) &&
        !peopleFields.includes(key) &&
        !statusFields.includes(key) &&
        key !== "Description" &&
        !String(key).toLowerCase().includes("do not modify") &&
        !String((data || {})[key]).toLowerCase().includes("do not modify")
    ),
  ].map((key) => fieldLabels[key] || key);
  const maxLabelLength = allLabels.reduce((max, label) => Math.max(max, label.length), 0);
  const maxLabelWidth = Math.max(140, Math.min(340, maxLabelLength * 11));

  return (
    <Box>
      {/* Main Info */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ px: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <tbody>
              {mainFields.map((field) =>
                data[field] ? (
                  <tr key={field}>
                    <td
                      style={{
                        minWidth: maxLabelWidth,
                        width: maxLabelWidth,
                        fontWeight: "bold",
                        color: "#222",
                        textAlign: "right",
                        padding: "8px 16px 8px 0",
                        verticalAlign: field === "Skill" ? "middle" : "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fieldLabels[field] || field}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 0 8px 0" }}>
                      {field === "Skill" ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {String(data[field])
                            .split("/")
                            .map((skill, idx) =>
                              skill.trim() ? (
                                <Chip
                                  key={idx}
                                  label={skill.trim()}
                                  color="success"
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              ) : null
                            )}
                        </Stack>
                      ) : (
                        <Typography variant="body1" fontWeight={500} sx={{ textAlign: "left" }}>
                          {String(data[field])}
                        </Typography>
                      )}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </Box>
        </CardContent>
      </Card>
      {/* People Info */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ px: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            People
          </Typography>
          <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <tbody>
              {peopleFields.map((field) =>
                data[field] ? (
                  <tr key={field}>
                    <td
                      style={{
                        minWidth: maxLabelWidth,
                        width: maxLabelWidth,
                        fontWeight: "bold",
                        color: "#222",
                        textAlign: "right",
                        padding: "8px 16px 8px 0",
                        verticalAlign: field === "Approval Status" ? "middle" : "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fieldLabels[field] || field}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 0 8px 0" }}>
                      <Typography variant="body1" fontWeight={500} sx={{ textAlign: "left" }}>
                        {(() => {
                          const names = splitNames(data[field]);
                          if (names.length > 1) {
                            return (
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 40, height: 40, fontSize: 20, fontWeight: 700 } }}>
                                  {names.map((n, idx) => (
                                    <Avatar
                                      key={n + idx}
                                      sx={{
                                        bgcolor: getAvatarColor(n, idx),
                                        color: "#fff"
                                      }}
                                    >
                                      {getAvatarText(n)}
                                    </Avatar>
                                  ))}
                                </AvatarGroup>
                                <Typography variant="body1" fontWeight={600} sx={{ textAlign: "left" }}>
                                  {names.join(", ")}
                                </Typography>
                              </Stack>
                            );
                          } else {
                            const n = names[0] || "";
                            return (
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar
                                  sx={{
                                    bgcolor: getAvatarColor(n, 0),
                                    color: "#fff",
                                    width: 40,
                                    height: 40,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    boxShadow: "0 2px 8px rgba(25,118,210,0.15)"
                                  }}
                                >
                                  {getAvatarText(n)}
                                </Avatar>
                                <Typography variant="body1" fontWeight={600} sx={{ textAlign: "left" }}>
                                  {n}
                                </Typography>
                              </Stack>
                            );
                          }
                        })()}
                      </Typography>
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </Box>
        </CardContent>
      </Card>
      {/* Status Info */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ px: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Status
          </Typography>
          <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <tbody>
              {statusFields.map((field) =>
                data[field] ? (
                  <tr key={field}>
                    <td
                      style={{
                        minWidth: maxLabelWidth,
                        width: maxLabelWidth,
                        fontWeight: "bold",
                        color: "#222",
                        textAlign: "right",
                        padding: "8px 16px 8px 0",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fieldLabels[field] || field}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 0 8px 0" }}>
                      {field === "Approval Status" ? (
                        <Chip
                          label={String(data[field])}
                          color={
                            data[field] === "Approved"
                              ? "success"
                              : data[field] === "Rejected"
                              ? "error"
                              : data[field] === "Pending" || data[field] === "Submitted"
                              ? "info"
                              : "default"
                          }
                          sx={{ fontWeight: 700, fontSize: 15, minWidth: 80 }}
                        />
                      ) : (
                        <Typography variant="body1" fontWeight={500} sx={{ textAlign: "left" }}>
                          {String(data[field])}
                        </Typography>
                      )}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </Box>
        </CardContent>
      </Card>
      {/* Description or Other Fields */}
      {data["Description"] && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {data["Description"]}
            </Typography>
          </CardContent>
        </Card>
      )}
      {/* Show any other fields not covered above */}
      {Object.entries(data)
        .filter(
          ([key, value]) =>
            !mainFields.includes(key) &&
            !peopleFields.includes(key) &&
            !statusFields.includes(key) &&
            key !== "Description" &&
            !String(key).toLowerCase().includes("do not modify") &&
            !String(value).toLowerCase().includes("do not modify")
        )
        .length > 0 && (
        <Card variant="outlined">
          <CardContent sx={{ px: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Other Information
            </Typography>
            <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <tbody>
                {Object.entries(data)
                  .filter(
                    ([key, value]) =>
                      !mainFields.includes(key) &&
                      !peopleFields.includes(key) &&
                      !statusFields.includes(key) &&
                      key !== "Description" &&
                      !String(key).toLowerCase().includes("do not modify") &&
                      !String(value).toLowerCase().includes("do not modify")
                  )
                  .map(([key, value]) => (
                    <tr key={key}>
                      <td
                        style={{
                          minWidth: maxLabelWidth,
                          width: maxLabelWidth,
                          fontWeight: "bold",
                          color: "#222",
                          textAlign: "right",
                          padding: "8px 16px 8px 0",
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fieldLabels[key] || key}
                      </td>
                      <td style={{ textAlign: "left", padding: "8px 0 8px 0" }}>
                        <Typography variant="body1" fontWeight={500} sx={{ textAlign: "left" }}>
                          {String(value)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Box>
            {/* 评估按钮与结果卡片 */}
            <EvaluatePRCard prCode={data["PR Code"]} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// 评估按钮与结果展示
function EvaluatePRCard({ prCode }) {
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError("");
    setResult(null);
    try {
      const res = await evaluatePurchaseRequirement(prCode);
      setResult(res);
    } catch (e) {
      setError(e.message || "Evaluation failed");
    }
    setEvaluating(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleEvaluate}
        disabled={evaluating || !prCode}
      >
        Evaluate Purchase Requirement & Resumes
      </Button>
      {evaluating && (
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 80 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
      )}
      {result && (
        <PurchaseRequirementEvaluationResult result={result} />
      )}
    </Box>
  );
}

// 评估结果展示组件
function PurchaseRequirementEvaluationResult({ result }) {
  // 兼容后端返回结构
  let prCode = result.prCode || "";
  let candidates = [];
  let summaryReport = "";
  let recommendTableMd = "";
  let rawContent = "";

  // 1. 解析 raw.content
  if (result.raw && result.raw.raw && result.raw.raw.content) {
    try {
      const parsed = JSON.parse(result.raw.raw.content);
      if (parsed.results && Array.isArray(parsed.results)) {
        candidates = parsed.results;
      }
      if (parsed.evaluation_report) {
        summaryReport = parsed.evaluation_report;
      }
      // 提取推荐表格 markdown
      if (parsed.evaluation_report) {
        // 尝试提取推荐表格 markdown
        const tableMatch = parsed.evaluation_report.match(/(\| Resume No\..+\|[\s\S]+?\|[-]+\|[\s\S]+?\|[\s\S]+?)(?:\n\n|---|> )/);
        if (tableMatch) {
          recommendTableMd = tableMatch[1];
        }
      }
      rawContent = parsed.evaluation_report || "";
    } catch (e) {
      // fallback
      summaryReport = "";
    }
  }
  // 2. 若 results 直接有数据
  if ((!candidates || candidates.length === 0) && result.results && Array.isArray(result.results)) {
    candidates = result.results;
  }

  // 3. 综合评估报告 markdown
  const renderMarkdown = (md) => {
    if (!md) return null;
    return (
      <Box sx={{ my: 2 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
      </Box>
    );
  };

  // 4. 推荐人选表格（结构化）
  let recommendRows = [];
  if (recommendTableMd) {
    // 解析 markdown 表格为数组
    const lines = recommendTableMd.split("\n").filter(l => l.trim());
    if (lines.length >= 3) {
      const header = lines[0].split("|").map(s => s.trim()).filter(Boolean);
      for (let i = 2; i < lines.length; ++i) {
        const cols = lines[i].split("|").map(s => s.trim());
        if (cols.length === header.length) {
          recommendRows.push(cols);
        }
      }
    }
  }

  // 5. 展示
  return (
    <Card variant="outlined" sx={{ mt: 2, borderColor: "#1976d2" }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          采购需求评估结果 (PR Code: {prCode})
        </Typography>
        {/* 综合评估报告 */}
        {summaryReport && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              综合评估报告
            </Typography>
            {renderMarkdown(summaryReport)}
          </Box>
        )}
        {/* 推荐人选列表 */}
        {recommendRows.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              推荐人选列表
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {recommendRows[0].map((col, idx) => (
                    <TableCell key={idx}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {recommendRows.slice(1).map((row, idx) => (
                  <TableRow key={idx}>
                    {row.map((col, j) => (
                      <TableCell key={j}>{col}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {/* 候选人详细卡片 */}
        {candidates && candidates.length > 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              候选人详细评价
            </Typography>
            {candidates.map((c, idx) => (
              <Accordion key={c.resumeNo || idx} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography fontWeight="bold">{c.consultant_name}</Typography>
                    <Chip label={c.klevel} color="info" size="small" />
                    <Chip label={`CNY ${c.manday_cost_aka_rating}/天`} color="success" size="small" />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {c.comment}
                    </Typography>
                    {c.evaluation_report && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                          详细评估报告
                        </Typography>
                        {renderMarkdown(c.evaluation_report)}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        {/* 无数据提示 */}
        {(!summaryReport && recommendRows.length === 0 && (!candidates || candidates.length === 0)) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            暂无评估结果数据
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
