import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBatchStore } from '../store/useBatchStore'
import { TYPE_LABEL, money } from '../lib/format'

export function LeakBreakdown() {
  const metrics = useBatchStore((s) => s.metrics)

  const data = metrics
    ? Object.entries(metrics.byType).map(([type, v]) => ({
        type: TYPE_LABEL[type],
        atRisk: Math.round((v.atRisk - v.recovered) * 100) / 100,
        recovered: Math.round(v.recovered * 100) / 100,
      }))
    : []

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-100">Recovery by leak type</h3>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-signal-recover" /> Recovered</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-ink-600" /> Still at risk</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="#22272C" />
            <XAxis type="number" tickFormatter={(v) => money(v, true)} stroke="#5C666D" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="type" width={140} stroke="#8C969D" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: '#181C20' }}
              contentStyle={{ background: '#111417', border: '1px solid #22272C', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#E4E8EA' }}
              formatter={(v: number) => money(v)}
            />
            <Bar dataKey="recovered" stackId="a" fill="#5FA987" radius={[0, 0, 0, 0]} />
            <Bar dataKey="atRisk" stackId="a" fill="#2E353B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
