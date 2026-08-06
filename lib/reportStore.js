import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "reports.json");

// 디렉토리 및 초기 파일 생성 확인
function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    // 초기 샘플 데이터 포함 가능
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getAllReports() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const reports = JSON.parse(raw);
    return Array.isArray(reports)
      ? reports.sort((a, b) => (b.report_date > a.report_date ? 1 : -1))
      : [];
  } catch (err) {
    console.error("Failed to read local reports JSON:", err);
    return [];
  }
}

export function getReportByDate(dateStr) {
  const reports = getAllReports();
  return reports.find((r) => r.report_date === dateStr) || null;
}

export function getReportById(id) {
  const reports = getAllReports();
  const numId = Number(id);
  return reports.find((r) => r.report_id === numId || String(r.report_id) === String(id)) || null;
}

export function saveOrUpdateReport(reportData) {
  ensureDataFile();
  const reports = getAllReports();
  const nowStr = new Date().toISOString();

  // report_date 기준으로 기존 보고서 존재 여부 확인
  const existingIndex = reports.findIndex(
    (r) => r.report_date === reportData.report_date
  );

  let resultReport;

  if (existingIndex >= 0) {
    // 업데이트
    const existing = reports[existingIndex];
    resultReport = {
      ...existing,
      title: reportData.title || existing.title,
      content: reportData.content || existing.content,
      total_defects:
        reportData.total_defects !== undefined
          ? reportData.total_defects
          : existing.total_defects,
      high_risk_defects:
        reportData.high_risk_defects !== undefined
          ? reportData.high_risk_defects
          : existing.high_risk_defects,
      status: reportData.status || existing.status || "COMPLETED",
      updated_at: nowStr,
    };
    reports[existingIndex] = resultReport;
  } else {
    // 신규 생성
    const maxId = reports.reduce(
      (max, r) => (r.report_id > max ? r.report_id : max),
      0
    );
    resultReport = {
      report_id: maxId + 1,
      report_date: reportData.report_date,
      title: reportData.title || `${reportData.report_date} 일일 품질결산 리포트`,
      content: reportData.content,
      total_defects: reportData.total_defects || 0,
      high_risk_defects: reportData.high_risk_defects || 0,
      status: reportData.status || "COMPLETED",
      created_at: nowStr,
      updated_at: nowStr,
    };
    reports.push(resultReport);
  }

  fs.writeFileSync(filePath, JSON.stringify(reports, null, 2), "utf-8");
  return resultReport;
}

export function deleteReport(idOrDate) {
  ensureDataFile();
  let reports = getAllReports();
  const initialLength = reports.length;

  reports = reports.filter(
    (r) =>
      String(r.report_id) !== String(idOrDate) &&
      r.report_date !== String(idOrDate)
  );

  if (reports.length !== initialLength) {
    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2), "utf-8");
    return true;
  }
  return false;
}
