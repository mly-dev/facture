export default function Pagination({ count, page, pageSize = 10, onPageChange }) {
  const totalPages = Math.ceil(count / pageSize)
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
      <div className="text-sm text-gray-400">
        {count} résultat{count > 1 ? 's' : ''}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        {pages.map((p, i) => (
          p === '...'
            ? <span key={i} className="px-2 text-gray-500">…</span>
            : <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                  ${page === p
                    ? 'bg-accent text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                {p}
              </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}
