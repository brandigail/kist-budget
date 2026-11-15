import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '../../lib/money'
import type { CategoryRow } from '../../lib/budget'
import type { CurrencyCode } from '../../types'

interface Props {
  rows: CategoryRow[]
  currency: CurrencyCode
}

/** Share of this month's spending by category. The legend and numbers live in the list below, so the chart stays simple. */
export function SpendChart({ rows, currency }: Props) {
  const data = rows.filter((r) => r.spent > 0).map((r) => ({ name: r.category.name, value: r.spent, color: r.category.color }))
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const description = data.map((d) => `${d.name} ${Math.round((d.value / total) * 100)}%`).join(', ')

  return (
    <div role="img" aria-label={`Donut chart of spending by category: ${description}`} className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="none" isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatMoney(Number(value), currency)} contentStyle={{ borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
