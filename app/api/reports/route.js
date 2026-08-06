import { NextResponse } from "next/server";
import { getAllReports, saveOrUpdateReport } from "@/lib/reportStore";

const LOCAL_FASTAPI_URL = "http://127.0.0.1:8000";

// GET /api/reports - 모든 일자별 보고서 목록 가져오기
export async function GET() {
  try {
    // 1. 먼저 local reportStore에서 데이터 가져오기
    let reports = getAllReports();

    // 2. 백엔드 FastAPI 연결 시도하여 동기화
    try {
      const res = await fetch(`${LOCAL_FASTAPI_URL}/reports/`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const fastApiReports = await res.json();
        if (Array.isArray(fastApiReports) && fastApiReports.length > 0) {
          // 로컬 스토어로 동기화
          fastApiReports.forEach((r) => saveOrUpdateReport(r));
          reports = getAllReports();
        }
      }
    } catch {
      // FastAPI 연결 실패 시 로컬 스토어 결과 바로 사용
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json(
      { error: "보고서 목록을 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/reports - 보고서 저장/업데이트
export async function POST(req) {
  try {
    const body = await req.json();
    const savedReport = saveOrUpdateReport(body);

    // FastAPI에도 저장 시도
    try {
      await fetch(`${LOCAL_FASTAPI_URL}/reports/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      // ignore
    }

    return NextResponse.json(savedReport, { status: 201 });
  } catch (error) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json(
      { error: "보고서 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
