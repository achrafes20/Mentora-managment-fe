import { Tabs } from 'antd'
import { DepartementsTab } from './DepartementsTab'
import { EmployesListTab } from './EmployesListTab'

export function EmployesPage() {
  return (
    <Tabs
      defaultActiveKey="employes"
      items={[
        { key: 'employes', label: 'Employés', children: <EmployesListTab /> },
        { key: 'departements', label: 'Départements', children: <DepartementsTab /> },
      ]}
    />
  )
}
