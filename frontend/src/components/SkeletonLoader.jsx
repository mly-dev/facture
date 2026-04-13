export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-800 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="h-3 bg-gray-800 rounded w-1/3 mb-3" />
      <div className="h-7 bg-gray-800 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-800 rounded w-1/2" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}
