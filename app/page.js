"use client";

import { useState, useEffect } from "react";
import BillboardDashboard from "./components/BillboardDashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState("generate"); // "generate" | "archive" | "billboard"

  // 생성 탭 상태
  const [report, setReport] = useState("");
  const [reportMeta, setReportMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);

  // 아카이브(일자별 조회) 탭 상태
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // 아카이브 목록 불러오기
  const fetchSavedReports = async () => {
    setArchiveLoading(true);
    setArchiveError("");
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("보고서 목록을 가져오는 데 실패했습니다.");
      const data = await res.json();
      setSavedReports(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      setArchiveError("DB에서 일자별 보고서 목록을 로드하지 못했습니다.");
      console.error(err);
    } finally {
      setArchiveLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "archive" || activeTab === "billboard") {
      fetchSavedReports();
    }
  }, [activeTab]);

  // AI 리포트 생성 및 백엔드 DB 자동 저장
  const generateReport = async () => {
    setLoading(true);
    setAutoSaveStatus(null);
    try {
      const response = await fetch("/api/report");
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setReport(data.report);
        setReportMeta({
          date: data.report_date,
          total_defects: data.total_defects,
          high_risk_defects: data.high_risk_defects,
        });

        // 생성 직후 DB 자동 저장 성공 여부 반영
        const now = new Date().toLocaleTimeString("ko-KR");
        if (data.saved_to_db) {
          setAutoSaveStatus({
            success: true,
            date: data.report_date,
            time: now,
            message: `생성된 리포트가 DB(${data.report_date})에 자동으로 저장되었습니다.`,
          });
        } else {
          setAutoSaveStatus({
            success: false,
            date: data.report_date,
            time: now,
            message: "리포트는 생성되었으나 DB 자동 저장 중 오류가 발생했습니다.",
          });
        }
      }
    } catch (error) {
      console.error(error);
      alert("리포트를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 보고서 삭제
  const handleDeleteReport = async (reportId, reportDate) => {
    if (!confirm(`${reportDate} 날짜의 보고서를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/reports/${reportDate}?id=${reportId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("보고서가 삭제되었습니다.");
        if (selectedReport && selectedReport.report_id === reportId) {
          setSelectedReport(null);
        }
        fetchSavedReports();
      } else {
        alert("보고서 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("삭제 처리 중 오류가 발생했습니다.");
    }
  };

  // 필터링된 보고서 목록
  const filteredReports = savedReports.filter((r) =>
    searchDate ? r.report_date.includes(searchDate) : true
  );

  const displayReport = selectedReport || (savedReports.length > 0 ? savedReports[0] : null);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* 상단 은은한 그라데이션 빛 반사 */}
      <div style={styles.bgGradient} />

      <main style={styles.main}>
        {/* 시스템 헤더 */}
        <header style={styles.header}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            스마트팩토리 AI 품질분석 에이전트
          </div>
          <h1 style={styles.title}>제조 품질관리 AI 리포트 & 전광판 시스템</h1>
          <p style={styles.description}>
            실시간 원시 결함 분석 및 8D 기반 현장 전광판 모니터링 시스템
          </p>
        </header>

        {/* 탭 내비게이션 바 */}
        <div style={styles.tabBar}>
          <button
            onClick={() => setActiveTab("generate")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "generate" ? styles.tabButtonActive : {}),
            }}
          >
            <span style={styles.tabIcon}>⚡</span>
            <span>AI 리포트 생성</span>
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "archive" ? styles.tabButtonActive : {}),
            }}
          >
            <span style={styles.tabIcon}>📅</span>
            <span>일자별 보고서 보관함</span>
            {savedReports.length > 0 && (
              <span style={styles.tabCountBadge}>{savedReports.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("billboard")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "billboard" ? styles.tabButtonActive : {}),
            }}
          >
            <span style={styles.tabIcon}>🖥️</span>
            <span>현장 전광판 (Billboard View)</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: AI 리포트 생성 (DB 자동 저장 & 전광판 뷰 지원) */}
        {/* ============================================================== */}
        {activeTab === "generate" && (
          <div className="animate-fade-in" style={styles.tabContent}>
            {/* 컨트롤 카드 */}
            <div style={styles.actionCard}>
              <div style={styles.actionInfo}>
                <div style={styles.actionTitleContainer}>
                  <div style={styles.actionTitle}>최신 불량 데이터 실시간 분석</div>
                  <span style={styles.autoSavePill}>💾 DB 자동 저장 활성화</span>
                </div>
                <div style={styles.actionSub}>
                  FastAPI 백엔드(http://172.16.205.85:8000) 원시 불량 데이터를 기반으로 생성 즉시 Report DB에 저장됩니다.
                </div>
              </div>
              <button
                onClick={generateReport}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                {loading ? (
                  <span style={styles.buttonContent}>
                    <svg style={styles.spinner} viewBox="0 0 24 24" fill="none">
                      <circle
                        style={{ opacity: 0.25 }}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        style={{ opacity: 0.75 }}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    AI 분석 & DB 자동 저장 중...
                  </span>
                ) : (
                  <span style={styles.buttonContent}>
                    ✨ 오늘의 리포트 생성하기
                  </span>
                )}
              </button>
            </div>

            {/* 자동 저장 알림 */}
            {autoSaveStatus && (
              <div
                style={{
                  ...styles.alertBanner,
                  ...(autoSaveStatus.success
                    ? styles.alertSuccess
                    : styles.alertError),
                }}
              >
                <div style={styles.alertIcon}>
                  {autoSaveStatus.success ? "✅" : "⚠️"}
                </div>
                <div>
                  <div style={styles.alertTitle}>
                    {autoSaveStatus.success
                      ? "Report DB 자동 저장 완료"
                      : "DB 저장 경고"}
                  </div>
                  <div style={styles.alertBody}>{autoSaveStatus.message}</div>
                </div>
                <span style={styles.alertTime}>{autoSaveStatus.time}</span>
              </div>
            )}

            {/* 생성된 결과: 전광판 대시보드 뷰어 연동 */}
            {report && (
              <BillboardDashboard
                reportText={report}
                reportData={reportMeta}
                reportDate={reportMeta?.date}
              />
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: 일자별 보고서 보관함 */}
        {/* ============================================================== */}
        {activeTab === "archive" && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.archiveToolbar}>
              <div style={styles.searchBox}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  placeholder="날짜 선택 검색"
                  style={styles.dateInput}
                />
                {searchDate && (
                  <button
                    onClick={() => setSearchDate("")}
                    style={styles.clearSearchBtn}
                  >
                    초기화
                  </button>
                )}
              </div>
              <button onClick={fetchSavedReports} style={styles.refreshButton}>
                🔄 목록 새로고침
              </button>
            </div>

            {archiveError && (
              <div style={{ ...styles.alertBanner, ...styles.alertError }}>
                <span>⚠️ {archiveError}</span>
              </div>
            )}

            {archiveLoading && savedReports.length === 0 ? (
              <div style={styles.loadingContainer}>
                <svg style={styles.spinnerLarge} viewBox="0 0 24 24" fill="none">
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Report DB에서 데이터를 불러오는 중...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📂</span>
                <div style={styles.emptyTitle}>저장된 보고서가 없습니다.</div>
                <div style={styles.emptySub}>
                  'AI 리포트 생성' 탭에서 오늘의 보고서를 생성하면 DB에 자동으로 저장됩니다.
                </div>
              </div>
            ) : (
              <div style={styles.archiveLayout}>
                {/* 왼쪽 사이드바 목록 */}
                <div style={styles.archiveSidebar}>
                  <div style={styles.sidebarHeader}>
                    일자별 보고서 목록 ({filteredReports.length}건)
                  </div>
                  <div style={styles.sidebarList}>
                    {filteredReports.map((item) => {
                      const isSelected =
                        selectedReport &&
                        selectedReport.report_id === item.report_id;
                      return (
                        <div
                          key={item.report_id}
                          onClick={() => {
                            setSelectedReport(item);
                          }}
                          style={{
                            ...styles.archiveItem,
                            ...(isSelected ? styles.archiveItemSelected : {}),
                          }}
                        >
                          <div style={styles.archiveItemHeader}>
                            <span style={styles.archiveItemDate}>
                              📅 {item.report_date}
                            </span>
                            <span style={styles.archiveItemBadge}>
                              결함 {item.total_defects}건
                            </span>
                          </div>
                          <div style={styles.archiveItemTitle}>
                            {item.title || `${item.report_date} 일일 품질결산 리포트`}
                          </div>
                          <div style={styles.archiveItemTime}>
                            등록: {new Date(item.created_at).toLocaleString("ko-KR")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 오른쪽 메인 뷰어: 전광판 대시보드 스위처 적용 */}
                <div style={styles.archiveMain}>
                  {selectedReport ? (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() =>
                          handleDeleteReport(
                            selectedReport.report_id,
                            selectedReport.report_date
                          )
                        }
                        style={styles.deleteButtonTopRight}
                      >
                        🗑️ 삭제
                      </button>
                      <BillboardDashboard
                        reportText={selectedReport.content}
                        reportData={selectedReport}
                        reportDate={selectedReport.report_date}
                      />
                    </div>
                  ) : (
                    <div style={styles.emptyState}>
                      <div>좌측 목록에서 조회할 보고서를 선택하세요.</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: 현장 전광판 전용 풀스크린 모드 */}
        {/* ============================================================== */}
        {activeTab === "billboard" && (
          <div className="animate-fade-in" style={styles.tabContent}>
            {displayReport ? (
              <BillboardDashboard
                reportText={displayReport.content}
                reportData={displayReport}
                reportDate={displayReport.report_date}
              />
            ) : (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>🖥️</span>
                <div style={styles.emptyTitle}>전광판에 표시할 데이터가 없습니다.</div>
                <div style={styles.emptySub}>
                  'AI 리포트 생성' 탭에서 보고서를 생성해 주십시오.
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "36px 20px 80px 20px",
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },
  bgGradient: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "1280px",
    height: "380px",
    background:
      "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0) 75%)",
    pointerEvents: "none",
  },
  main: {
    width: "100%",
    maxWidth: "1140px",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    borderRadius: "9999px",
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    color: "#818cf8",
    fontSize: "13px",
    fontWeight: "600",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    boxShadow: "0 0 8px #6366f1",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
  },
  description: {
    fontSize: "15px",
    color: "#94a3b8",
    margin: 0,
    maxWidth: "640px",
    lineHeight: "1.6",
  },
  tabBar: {
    display: "flex",
    gap: "10px",
    borderBottom: "1px solid #334155",
    paddingBottom: "12px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  tabButton: {
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid transparent",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
  },
  tabButtonActive: {
    backgroundColor: "#1e293b",
    color: "#818cf8",
    borderColor: "#334155",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  tabIcon: {
    fontSize: "16px",
  },
  tabCountBadge: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 7px",
    borderRadius: "9999px",
    marginLeft: "4px",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  actionCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
    flexWrap: "wrap",
  },
  actionInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },
  actionTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  actionTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#f1f5f9",
  },
  autoSavePill: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#34d399",
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    border: "1px solid rgba(52, 211, 153, 0.2)",
    padding: "3px 9px",
    borderRadius: "9999px",
  },
  actionSub: {
    fontSize: "13px",
    color: "#64748b",
  },
  button: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "13px 26px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
    whiteSpace: "nowrap",
  },
  buttonDisabled: {
    backgroundColor: "#475569",
    boxShadow: "none",
    cursor: "not-allowed",
    opacity: 0.8,
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  spinner: {
    width: "18px",
    height: "18px",
    animation: "spin 1s linear infinite",
  },
  alertBanner: {
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    fontSize: "14px",
  },
  alertSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    color: "#34d399",
  },
  alertError: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#f87171",
  },
  alertIcon: {
    fontSize: "20px",
  },
  alertTitle: {
    fontWeight: "700",
    marginBottom: "2px",
  },
  alertBody: {
    fontSize: "13px",
    opacity: 0.9,
  },
  alertTime: {
    marginLeft: "auto",
    fontSize: "12px",
    opacity: 0.7,
  },
  archiveToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "8px 14px",
  },
  searchIcon: {
    fontSize: "14px",
    color: "#64748b",
  },
  dateInput: {
    backgroundColor: "transparent",
    border: "none",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
  },
  clearSearchBtn: {
    backgroundColor: "#334155",
    color: "#cbd5e1",
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "12px",
    cursor: "pointer",
  },
  refreshButton: {
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  archiveLayout: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "20px",
    minHeight: "450px",
  },
  archiveSidebar: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "650px",
    overflowY: "auto",
  },
  sidebarHeader: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#cbd5e1",
    paddingBottom: "8px",
    borderBottom: "1px solid #334155",
  },
  sidebarList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  archiveItem: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    transition: "all 0.15s ease",
  },
  archiveItemSelected: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  archiveItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  archiveItemDate: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#f8fafc",
  },
  archiveItemBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#818cf8",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  archiveItemTitle: {
    fontSize: "13px",
    color: "#cbd5e1",
  },
  archiveItemTime: {
    fontSize: "11px",
    color: "#64748b",
  },
  archiveMain: {
    display: "flex",
    flexDirection: "column",
  },
  deleteButtonTopRight: {
    position: "absolute",
    top: "16px",
    right: "210px",
    zIndex: 10,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "8px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  emptyState: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#64748b",
  },
  emptyIcon: {
    fontSize: "36px",
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#cbd5e1",
  },
  emptySub: {
    fontSize: "13px",
    maxWidth: "400px",
  },
  loadingContainer: {
    padding: "60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    color: "#94a3b8",
  },
  spinnerLarge: {
    width: "32px",
    height: "32px",
    animation: "spin 1s linear infinite",
  },
};