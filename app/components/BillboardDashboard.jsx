"use client";

import { useState } from "react";

export default function BillboardDashboard({ reportData, reportText, reportDate }) {
  const [viewMode, setViewMode] = useState("dashboard"); // "dashboard" | "document"

  // 마크다운 보고서 텍스트에서 섹션별 정보 파싱
  const parseReportSections = (text) => {
    if (!text) return {};

    const sections = {
      overview: "",
      breakdown: "",
      rca: "",
      actionItems: "",
    };

    const overviewMatch = text.match(/# 📊 1\.\s*일일 품질 종합 지표[\s\S]*?(?=# 🏭 2\.|\n# |\n---|$)/i);
    if (overviewMatch) sections.overview = overviewMatch[0].trim();

    const breakdownMatch = text.match(/# 🏭 2\.\s*불량 유형 및 라인 분석[\s\S]*?(?=# ⚠️ 3\.|\n# |\n---|$)/i);
    if (breakdownMatch) sections.breakdown = breakdownMatch[0].trim();

    const rcaMatch = text.match(/# ⚠️ 3\.\s*근본 원인 분석[\s\S]*?(?=# 💡 4\.|\n# |\n---|$)/i);
    if (rcaMatch) sections.rca = rcaMatch[0].trim();

    const actionMatch = text.match(/# 💡 4\.\s*익일 현장 시정 조치 지시[\s\S]*?(?=$)/i);
    if (actionMatch) sections.actionItems = actionMatch[0].trim();

    return sections;
  };

  const parsed = parseReportSections(reportText);

  // 불량 수량 및 위험도 계산
  const totalDefects = reportData?.total_defects ?? 0;
  const highRiskCount = reportData?.high_risk_defects ?? 0;
  const statusStr = highRiskCount > 5 ? "DANGER" : highRiskCount > 0 ? "WARNING" : "NORMAL";

  // 조치 사항 태스크 추출
  const parseActionTasks = (actionText) => {
    if (!actionText) return { containment: [], corrective: [] };
    const lines = actionText.split("\n");
    const containment = [];
    const corrective = [];
    let currentCategory = "containment";

    lines.forEach((line) => {
      if (line.includes("즉시 긴급 조치") || line.includes("Containment")) {
        currentCategory = "containment";
      } else if (line.includes("근본 예방 조치") || line.includes("Corrective")) {
        currentCategory = "corrective";
      } else if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        const task = line.replace(/^[\-\*]\s*/, "").replace(/\*\*/g, "").trim();
        if (task) {
          if (currentCategory === "containment") containment.push(task);
          else corrective.push(task);
        }
      }
    });

    return { containment, corrective };
  };

  const tasks = parseActionTasks(parsed.actionItems);

  return (
    <div style={styles.container}>
      {/* 대시보드 뷰어 헤더 바 & 뷰 모드 스위처 */}
      <div style={styles.dashboardHeader}>
        <div style={styles.headerTitleGroup}>
          <span style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            LIVE MONITORING
          </span>
          <h2 style={styles.headerTitle}>🖥️ 스마트팩토리 품질 현장 전광판</h2>
          <span style={styles.dateBadge}>기준 일자: {reportDate || "오늘"}</span>
        </div>

        {/* 뷰 모드 토글 스위치 */}
        <div style={styles.switchGroup}>
          <button
            onClick={() => setViewMode("dashboard")}
            style={{
              ...styles.switchBtn,
              ...(viewMode === "dashboard" ? styles.switchBtnActive : {}),
            }}
          >
            📊 전광판 대시보드 뷰
          </button>
          <button
            onClick={() => setViewMode("document")}
            style={{
              ...styles.switchBtn,
              ...(viewMode === "document" ? styles.switchBtnActive : {}),
            }}
          >
            📄 상세 문서 뷰
          </button>
        </div>
      </div>

      {viewMode === "document" ? (
        <div style={styles.documentCard}>
          <div style={styles.documentContent}>{reportText}</div>
        </div>
      ) : (
        <div style={styles.dashboardGrid}>
          {/* ============================================================== */}
          {/* STEP 1: 핵심 KPI 카운터 카드 게이지 (한눈에 파악) */}
          {/* ============================================================== */}
          <div style={styles.kpiRow}>
            {/* KPI 1: 일일 총 결함 수 */}
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiIcon}>⚠️</span>
                <span style={styles.kpiLabel}>총 탐지 결함 수</span>
              </div>
              <div style={styles.kpiValueGroup}>
                <span style={styles.kpiNumber}>{totalDefects}</span>
                <span style={styles.kpiUnit}>건</span>
              </div>
              <div style={styles.kpiSubText}>실시간 비전 AI 검사 집계</div>
            </div>

            {/* KPI 2: 고위험 불량 건수 */}
            <div
              style={{
                ...styles.kpiCard,
                ...(highRiskCount > 0 ? styles.kpiCardDanger : {}),
              }}
            >
              <div style={styles.kpiHeader}>
                <span style={styles.kpiIcon}>🚨</span>
                <span style={styles.kpiLabel}>고위험 결함 (High Risk)</span>
              </div>
              <div style={styles.kpiValueGroup}>
                <span
                  style={{
                    ...styles.kpiNumber,
                    color: highRiskCount > 0 ? "#ef4444" : "#10b981",
                  }}
                >
                  {highRiskCount}
                </span>
                <span style={styles.kpiUnit}>건</span>
              </div>
              <div style={styles.kpiSubText}>Confidence ≥ 0.85 고위험군</div>
            </div>

            {/* KPI 3: 현장 종합 위험도 상태 */}
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiIcon}>🛡️</span>
                <span style={styles.kpiLabel}>라인 경보 상태</span>
              </div>
              <div style={styles.statusBadgeLargeContainer}>
                {statusStr === "DANGER" && (
                  <span style={styles.badgeDanger}>🚨 DANGER (즉시점검)</span>
                )}
                {statusStr === "WARNING" && (
                  <span style={styles.badgeWarning}>⚠️ WARNING (주의)</span>
                )}
                {statusStr === "NORMAL" && (
                  <span style={styles.badgeNormal}>✅ NORMAL (정상)</span>
                )}
              </div>
              <div style={styles.kpiSubText}>실시간 종합 라인 가동 상태</div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* STEP 2: 불량 분석 & 5-Why 원인 분석 카드 */}
          {/* ============================================================== */}
          <div style={styles.mainGrid}>
            {/* 좌측: 불량 분포 & 현장 분석 카드 */}
            <div style={styles.glassCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardHeaderIcon}>🏭</span>
                <span style={styles.cardHeaderTitle}>라인 및 결함 현황 요약</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.sectionBox}>
                  <div style={styles.sectionLabel}>현장 분석 요약</div>
                  <div style={styles.sectionText}>
                    {parsed.breakdown || "불량 유형별 분포 및 심각도 분석 진행 중..."}
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 8D 5-Why 원인 추론 포커스 카운터 */}
            <div style={{ ...styles.glassCard, borderColor: "rgba(99, 102, 241, 0.4)" }}>
              <div style={styles.cardHeader}>
                <span style={styles.cardHeaderIcon}>🔬</span>
                <span style={styles.cardHeaderTitle}>8D Root Cause (5-Why 원인 분석)</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.rcaHighlightBox}>
                  <div style={styles.rcaBadge}>AI 수석 엔지니어 원인 추론</div>
                  <div style={styles.rcaText}>
                    {parsed.rca || "원인 분석 데이터 처리 중..."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* STEP 3: 현장 조치 지시서 (Action Items Task Board) */}
          {/* ============================================================== */}
          <div style={styles.taskBoardCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardHeaderIcon}>💡</span>
              <span style={styles.cardHeaderTitle}>
                익일 현장 필수 시정 조치 지시서 (Action Items)
              </span>
            </div>

            <div style={styles.taskBoardGrid}>
              {/* 긴급 조치 Column */}
              <div style={styles.taskColumn}>
                <div style={styles.taskColumnHeaderRed}>
                  <span>🚨 즉시 긴급 조치 (Containment Action)</span>
                </div>
                <div style={styles.taskList}>
                  {tasks.containment.length > 0 ? (
                    tasks.containment.map((task, idx) => (
                      <div key={idx} style={styles.taskItemRed}>
                        <input type="checkbox" style={styles.checkbox} defaultChecked />
                        <span style={styles.taskText}>{task}</span>
                      </div>
                    ))
                  ) : (
                    <div style={styles.taskItemRed}>
                      <span style={styles.taskText}>- 현장 제품 격리 및 이송 라인 비전 센서 긴급 점검</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 예방 조치 Column */}
              <div style={styles.taskColumn}>
                <div style={styles.taskColumnHeaderBlue}>
                  <span>🔧 근본 예방 조치 (Corrective Action)</span>
                </div>
                <div style={styles.taskList}>
                  {tasks.corrective.length > 0 ? (
                    tasks.corrective.map((task, idx) => (
                      <div key={idx} style={styles.taskItemBlue}>
                        <input type="checkbox" style={styles.checkbox} />
                        <span style={styles.taskText}>{task}</span>
                      </div>
                    ))
                  ) : (
                    <div style={styles.taskItemBlue}>
                      <span style={styles.taskText}>- 쿨링 유량 자동 제어 모듈 재교정 및 금형 압력 튜닝</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
  },
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "18px 24px",
    flexWrap: "wrap",
    gap: "14px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  liveIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "800",
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "4px 10px",
    borderRadius: "9999px",
    letterSpacing: "0.05em",
  },
  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    boxShadow: "0 0 10px #ef4444",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#f8fafc",
    margin: 0,
  },
  dateBadge: {
    fontSize: "13px",
    color: "#94a3b8",
    backgroundColor: "#0f172a",
    padding: "4px 12px",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  switchGroup: {
    display: "flex",
    gap: "6px",
    backgroundColor: "#0f172a",
    padding: "4px",
    borderRadius: "10px",
    border: "1px solid #334155",
  },
  switchBtn: {
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  switchBtnActive: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.4)",
  },
  dashboardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  kpiCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  },
  kpiCardDanger: {
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  kpiHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  kpiIcon: {
    fontSize: "18px",
  },
  kpiLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#cbd5e1",
  },
  kpiValueGroup: {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
  },
  kpiNumber: {
    fontSize: "36px",
    fontWeight: "900",
    color: "#f8fafc",
    lineHeight: 1,
  },
  kpiUnit: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#64748b",
  },
  kpiSubText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  statusBadgeLargeContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "4px",
  },
  badgeDanger: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "6px 14px",
    borderRadius: "8px",
  },
  badgeWarning: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#f59e0b",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    padding: "6px 14px",
    borderRadius: "8px",
  },
  badgeNormal: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    padding: "6px 14px",
    borderRadius: "8px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
  },
  glassCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "12px",
    borderBottom: "1px solid #334155",
  },
  cardHeaderIcon: {
    fontSize: "20px",
  },
  cardHeaderTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#f8fafc",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#818cf8",
  },
  sectionText: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },
  rcaHighlightBox: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  rcaBadge: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#818cf8",
  },
  rcaText: {
    fontSize: "14px",
    color: "#e2e8f0",
    lineHeight: "1.75",
    whiteSpace: "pre-wrap",
  },
  taskBoardCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  taskBoardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  taskColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  taskColumnHeaderRed: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "10px 14px",
    borderRadius: "10px",
  },
  taskColumnHeaderBlue: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    padding: "10px 14px",
    borderRadius: "10px",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  taskItemRed: {
    backgroundColor: "#0f172a",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "10px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  taskItemBlue: {
    backgroundColor: "#0f172a",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    borderRadius: "10px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  checkbox: {
    marginTop: "3px",
    accentColor: "#6366f1",
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  taskText: {
    fontSize: "13.5px",
    color: "#cbd5e1",
    lineHeight: "1.5",
  },
  documentCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "28px",
  },
  documentContent: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: "1.85",
    whiteSpace: "pre-wrap",
  },
};
