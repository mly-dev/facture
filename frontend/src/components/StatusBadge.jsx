const STATUS_CONFIG = {
  brouillon: { label: 'Brouillon', className: 'bg-gray-700 text-gray-300' },
  envoyee: { label: 'Envoyée', className: 'bg-blue-900/50 text-blue-300' },
  payee: { label: 'Payée', className: 'bg-green-900/50 text-green-300' },
  partielle: { label: 'Part. payée', className: 'bg-yellow-900/50 text-yellow-300' },
  annulee: { label: 'Annulée', className: 'bg-red-900/50 text-red-400' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-700 text-gray-300' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
