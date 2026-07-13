/**
 * 입력값을 한국 휴대폰 번호 형식(010-1234-5678)으로 자동 포맷팅한다.
 * 숫자만 추출해 최대 11자리로 자르고, 자릿수에 맞춰 하이픈을 삽입한다.
 * - 10자리: 010-123-4567 (3-3-4)
 * - 11자리: 010-1234-5678 (3-4-4)
 * 기존 검증 정규식 /^01[0-9]-\d{3,4}-\d{4}$/ 와 호환된다.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length < 11)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
