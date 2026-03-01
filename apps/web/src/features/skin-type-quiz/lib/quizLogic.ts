export function calculateSkinType(answers: string[]): string {
  const counts = answers.reduce<Record<string, number>>((acc, a) => {
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'normal';
}
