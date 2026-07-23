import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. FastAPI 백엔드에서 불량 로그 데이터 가져오기
    const backendResponse = await fetch("http://127.0.0.1:8000/defects/");
    const defectsData = await backendResponse.json();

    // 2. Gemini AI 초기화 (환경 변수에서 키를 자동으로 읽어옵니다)
    const ai = new GoogleGenAI({});

    // 3. AI에게 내릴 프롬프트 작성 (데이터 포함)
    // 데이터 구조에 포함된 defect_type, confidence 등의 필드를 요약하도록 지시합니다.
    const prompt = `
      너는 제조 품질관리 AI 비서야.
      다음은 오늘 발생한 불량 기록 데이터야: ${JSON.stringify(defectsData)}
      
      이 데이터를 분석해서 다음 양식으로 일일 품질 리포트를 작성해줘:
      - 총 검사 수 및 불량 수
      - 주로 발생한 불량 유형 (product_name, defect_type 참고)
      - 내일 생산 라인을 위한 조언
    `;

    // 4. Gemini 모델 호출
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
    });

    // 5. 프론트엔드 화면으로 결과 전달
    return NextResponse.json({ report: response.text });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "리포트 생성 중 에러가 발생했습니다." }, { status: 500 });
  }
}