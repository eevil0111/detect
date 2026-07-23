"use client";
import { useState } from "react";

export default function Home() {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/report");
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      alert("리포트를 불러오는 데 실패했습니다.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* 로딩 애니메이션용 CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* 배경 상단 빛 반사 효과 */}
      <div style={styles.bgGradient} />

      <main style={styles.main}>
        {/* 헤더 영역 */}
        <header style={styles.header}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            AI 품질분석 에이전트
          </div>
          <h1 style={styles.title}>제조 품질관리 AI 일일 리포트</h1>
          <p style={styles.description}>
            실시간 검사 데이터와 Gemini AI 모델을 연동하여 불량 통계 및 품질 관리 인사이트를 자동 작성합니다.
          </p>
        </header>

        {/* 대시보드 컨트롤 카드 */}
        <div style={styles.actionCard}>
          <div style={styles.actionInfo}>
            <div style={styles.actionTitle}>최신 불량 데이터 분석</div>
            <div style={styles.actionSub}>FastAPI 백엔드 DB와 연동하여 실시간 보고서를 생성합니다.</div>
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
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI 분석 중...
              </span>
            ) : (
              <span style={styles.buttonContent}>
                ✨ 오늘의 리포트 생성하기
              </span>
            )}
          </button>
        </div>

        {/* AI 리포트 결과 출력 카드 */}
        {report && (
          <div style={styles.reportCard}>
            <div style={styles.reportHeader}>
              <div style={styles.reportHeaderTitle}>
                <span style={styles.reportIcon}>📊</span>
                <span>생성된 일일 품질 보고서</span>
              </div>
              <span style={styles.statusBadge}>분석 완료</span>
            </div>
            <div style={styles.reportDivider} />
            <div style={styles.reportContent}>
              {report}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Inline Styles (별도 CSS 파일 설치 없이 100% 동작)
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "60px 20px",
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
    maxWidth: "1200px",
    height: "350px",
    background: "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0) 70%)",
    pointerEvents: "none",
  },
  main: {
    width: "100%",
    maxWidth: "800px",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "28px",
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
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
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
    maxWidth: "560px",
    lineHeight: "1.6",
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
    gap: "4px",
  },
  actionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#f1f5f9",
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
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
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
  reportCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportHeaderTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
  },
  reportIcon: {
    fontSize: "20px",
  },
  statusBadge: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "4px 10px",
    borderRadius: "9999px",
  },
  reportDivider: {
    height: "1px",
    backgroundColor: "#334155",
    width: "100%",
  },
  reportContent: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
  },
};