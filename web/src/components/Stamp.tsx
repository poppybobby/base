export function Stamp({ score, repaired }: { score: string; repaired?: boolean }) {
  const tone = repaired || score === 'R' ? 'stamp stamp--r' : 'stamp'
  return (
    <span className={tone} title={repaired ? '修復歴あり' : `評価点 ${score}`}>
      <em>{score}</em>
      <small>{repaired ? '修復' : '評価'}</small>
    </span>
  )
}
