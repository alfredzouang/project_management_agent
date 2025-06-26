import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Divider } from "@mui/material";
import { getConsultantByResumeNo } from "../api/api";

// 计算 label 宽度
function getMaxLabelWidth(consultant) {
  const labelKeys = [
    "Consultant Name",
    "Consultant ITcode",
    "Skill Model",
    "K Level",
    "Base",
    "Manager",
    "T3 Org",
    "Currency",
    "Rate",
    "Onboard Status",
    "Approve Status",
    "Valid Date",
    "Email",
    "Telephone",
    ...Object.keys(consultant || {}).filter(
      (k) =>
        ![
          "Consultant Name",
          "Consultant ITcode",
          "Skill Model",
          "K Level",
          "Base",
          "Manager",
          "T3 Org",
          "Currency",
          "Rate",
          "Onboard Status",
          "Approve Status",
          "Valid Date",
          "Email",
          "Telephone",
        ].includes(k)
    ),
  ];
  const maxLabelLength = labelKeys.reduce((max, k) => Math.max(max, String(k).length), 0);
  return Math.max(110, Math.min(340, maxLabelLength * 11));
}

// ResumeDetailTable: 展示该简历的所有经历
export default function ResumeDetailTable({ rows }) {
  // 只取第一个 row 的 ItemNo 作为简历唯一标识
  const itemNo = rows[0]?.ItemNo || rows[0]?.itemno;
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);

  // 计算 label 宽度
  const maxLabelWidth = getMaxLabelWidth(consultant);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const consultantRes = await getConsultantByResumeNo(itemNo);
        if (mounted) {
          setConsultant(consultantRes);
        }
      } catch (e) {
        if (mounted) {
          setConsultant(null);
        }
      }
      if (mounted) setLoading(false);
    }
    if (itemNo) fetchData();
    return () => { mounted = false; };
  }, [itemNo]);

  // 工具函数：只保留日期部分
  function formatDate(val) {
    if (!val) return "-";
    if (typeof val !== "string") return String(val);
    const m = val.match(/^(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
    return m ? m[1] : val;
  }

  return (
    <Box>
      {/* Consultant 信息（卡片式，主信息加粗，分组排版，风格与下方经历卡片一致） */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 2,
          bgcolor: "#fff",
          boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
          border: "1px solid #e0e4ea",
          minWidth: 320,
          maxWidth: 720,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Typography fontWeight="bold" fontSize={18} mb={2}>
            Consultant 信息
          </Typography>
          {loading ? (
            <Typography color="text.secondary">加载中...</Typography>
          ) : consultant ? (
            <Box>
              {/* 主信息分组多行排版 */}
              <Box mb={1}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        姓名：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["Consultant Name"] || "-"}
                      </td>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        ITCode：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["Consultant ITcode"] || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Skill Model：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["Skill Model"] || "-"}
                      </td>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        K Level：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["K Level"] || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Base：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["Base"] || "-"}
                      </td>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Manager：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["Manager"] || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        T3 Org：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["T3 Org"] || "-"}
                      </td>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Currency：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["Currency"] || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#222", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Rate：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 500, fontSize: 16, verticalAlign: "middle" }}>
                        {consultant["Rate"] ? `${consultant["Rate"]}` : "-"}
                      </td>
                      <td />
                      <td />
                    </tr>
                  </tbody>
                </Box>
              </Box>
              {/* 状态/时间/联系方式 */}
              <Box mb={1}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#666", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Onboard Status：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 400, fontSize: 15, verticalAlign: "middle" }}>
                        {consultant["Onboard Status"] || "-"}
                      </td>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#666", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Approve Status：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 400, fontSize: 15, verticalAlign: "middle" }}>
                        {consultant["Approve Status"] || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#666", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Valid Date：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 400, fontSize: 15, verticalAlign: "middle" }}>
                        {consultant["Valid Date"] || "-"}
                      </td>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#666", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Email：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 400, fontSize: 15, verticalAlign: "middle" }}>
                        {consultant["Email"] || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#666", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        Telephone：
                      </td>
                      <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 400, fontSize: 15, verticalAlign: "middle" }}>
                        {consultant["Telephone"] || "-"}
                      </td>
                      <td />
                      <td />
                    </tr>
                  </tbody>
                </Box>
              </Box>
              {/* 其它字段分组展示 */}
              <Divider sx={{ my: 1 }} />
              <Box>
                <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                  <tbody>
                    {Object.entries(consultant)
                      .filter(
                        ([k]) =>
                          ![
                            "Consultant Name",
                            "Consultant ITcode",
                            "Skill Model",
                            "K Level",
                            "Base",
                            "Manager",
                            "T3 Org",
                            "Currency",
                            "Rate",
                            "Onboard Status",
                            "Approve Status",
                            "Valid Date",
                            "Email",
                            "Telephone",
                          ].includes(k)
                      )
                      .map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ minWidth: maxLabelWidth, width: maxLabelWidth, fontWeight: "bold", color: "#666", textAlign: "right", padding: "6px 12px 6px 0", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                            {k}：
                          </td>
                          <td style={{ textAlign: "left", padding: "6px 0 6px 0", fontWeight: 400, fontSize: 15, verticalAlign: "middle" }}>
                            {String(v)}
                          </td>
                          <td />
                          <td />
                        </tr>
                      ))}
                  </tbody>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">无数据</Typography>
          )}
        </CardContent>
      </Card>
      {/* 原有经历卡片 */}
      {rows.map((row, idx) => (
        <Box
          key={idx}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 2,
            bgcolor: "#fff",
            boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
            border: "1px solid #e0e4ea",
            minWidth: 320,
            maxWidth: 720,
          }}
        >
          <Box mb={0.5}>
            <Box display="flex" alignItems="center" flexWrap="wrap">
              <Typography fontWeight="bold" fontSize={18} mr={2}>
                {row.Company || row.company || "-"}
              </Typography>
              <Typography fontWeight={500} fontSize={16} color="text.secondary" mr={2}>
                {row.JobTitle || row.jobtitle || "-"}
              </Typography>
            </Box>
            <Box mt={0.5}>
              <Typography
                fontSize={16}
                color="grey.800"
                fontWeight={500}
                sx={{
                  background: "#f5f7fa",
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  minWidth: 120,
                  textAlign: "left",
                  display: "inline-block",
                  letterSpacing: 1,
                  mt: 0.5,
                }}
              >
                {formatDate(row.Start || row.start) + " ~ " + formatDate(row.End || row.end)}
              </Typography>
            </Box>
          </Box>
          <Typography
            sx={{
              fontSize: 15,
              color: "#333",
              whiteSpace: "pre-line",
              wordBreak: "break-word",
              mt: 1,
              lineHeight: 1.7,
            }}
          >
            {row.Description || row.description || ""}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
