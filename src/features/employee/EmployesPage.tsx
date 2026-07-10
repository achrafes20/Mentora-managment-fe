import { Tabs } from 'antd'
import { ModulePlaceholder } from '../../app/ModulePlaceholder'
import { DepartementsTab } from './DepartementsTab'

export function EmployesPage() {
  return (
    <Tabs
      defaultActiveKey="departements"
      items={[
        {
          key: 'employes',
          label: 'Employés',
          children: <ModulePlaceholder label="Dossier employé (T1.B2)" />,
        },
        { key: 'departements', label: 'Départements', children: <DepartementsTab /> },
      ]}
    />
  )
}
