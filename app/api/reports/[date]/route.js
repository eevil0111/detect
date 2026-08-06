import { NextResponse } from "next/server";
import { getReportByDate, getReportById, deleteReport } from "@/lib/reportStore";

const LOCAL_FASTAPI_URL = "http://127.0.0.1:8000";

// GET /api/reports/[date] - 특정 날짜 또는 ID의 보고서 조회
export async function GET(req, { params }) {
  try {
    const { date } = await params;
    let report = getReportByDate(date) || getReportById(date);

    if (!report) {
      // FastAPI 백엔드에서 시도
      try {
        const res = await fetch(`${LOCAL_FASTAPI_URL}/reports/by-date/${date}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          report = await res.json();
        }
      } catch {
        // ignore
      }
    }

    if (!report) {
      return NextResponse.json(
        { error: "해당 날짜의 보고서가 존재하지 않습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/reports/[date] error:", error);
    return NextResponse.json(
      { error: "서버 통신 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[date] - 보고서 삭제
export async function DELETE(req, { params }) {
  try {
    const { date } = await params;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || date;

    const deletedLocal = deleteReport(id) || deleteReport(date);

    // FastAPI 백엔드 삭제 시도
    try {
      await fetch(`${LOCAL_FASTAPI_URL}/reports/${id}`, {
        method: "DELETE",
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      status: "success",
      message: `${date} 보고서가 정상적으로 삭제되었습니다.`,
    });
  } catch (error) {
    console.error("DELETE /api/reports/[date] error:", error);
    return NextResponse.json(
      { error: "보고서 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
