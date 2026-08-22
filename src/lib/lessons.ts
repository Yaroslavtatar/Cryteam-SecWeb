// Логика учебных заданий «собери схему атаки».
// Ученик восстанавливает правильный порядок шагов; функции ниже — чистые
// и покрыты тестами.

/** Детерминированная псевдослучайная перестановка индексов [0..n-1].
 *  Не совпадает с исходным порядком при n > 1. */
export function shuffledIndices(n: number, seed = 1): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = seed * 9301 + 49297;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Гарантируем, что порядок не идентичен исходному.
  if (n > 1 && arr.every((v, i) => v === i)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

/** Проверяет, что текущая расстановка (массив исходных индексов) верна.
 *  Верно, если индексы идут по возрастанию 0,1,2,… */
export function checkOrder(current: number[]): {
  correct: boolean;
  positions: boolean[];
} {
  const positions = current.map((v, i) => v === i);
  return { correct: positions.every(Boolean), positions };
}
