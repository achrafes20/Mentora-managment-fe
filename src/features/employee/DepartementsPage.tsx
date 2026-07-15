import { DepartementsTab } from '@/features/employee/DepartementsTab'
import { PageHeader } from '@/components/ui/StatCard'

export function DepartementsPage() {
  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Départements" subtitle="Structures organisationnelles" />
      <DepartementsTab />
    </div>
  )
}
