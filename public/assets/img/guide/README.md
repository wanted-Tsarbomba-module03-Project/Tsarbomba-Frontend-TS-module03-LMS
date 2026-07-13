# 가이드 페이지 스크린샷

비로그인 홈(서비스 가이드)에서 쓰는 화면 캡처. `HomeLandingGuide.tsx` 가 이 경로들을 참조합니다.

| 파일명 | 내용 |
| ------ | ---- |
| `lecture.png` | 강의 수강 화면 |
| `problem-catalog.png` | 문제풀이 목록(카탈로그) - 카테고리별 문제 리스트 |
| `code-run.png` | 소문제 코드 작성 + 실행결과 |
| `correct.png` | 제출 → "정답입니다" 모달 |
| `problem-chatbot.png` | 문제풀이 챗봇 (막힐 때 도움) |
| `explanation.png` | 해설 확인 모달 |
| `done.png` | "축하합니다!" 문제 풀이 완료 모달 |
| `ranking-board.png` | 랭킹 페이지 (전체 랭킹) |

- 가로형 PNG 권장. 파일명이 정확히 일치해야 노출됩니다.
- ⚠️ **이미지를 교체해도 화면이 안 바뀌면** next/image 캐시 때문이에요.
  → 같은 파일명으로 덮으면 캐시가 남을 수 있으니, 확실히 하려면 **파일명을 살짝 바꾸고**
  `HomeLandingGuide.tsx` 의 경로도 함께 수정하세요. (또는 `.next/cache/images` 삭제 + 강력 새로고침)
