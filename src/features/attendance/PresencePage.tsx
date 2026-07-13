import { Tabs } from 'antd'
import { PointagesPage } from './PointagesPage'
import { AnomaliesPage } from './AnomaliesPage'
import { HorairesReferencePage } from './HorairesReferencePage'

/**
 * Page container pour le module Présence (attendance). Trois onglets :
 * Historique Pointages, Anomalies, Horaires de référence.
 */
export function PresencePage() {
  const items = [
    {
      key: 'pointages',
      label: 'Historique pointages',
      children: <PointagesPage />,
    },
    {
      key: 'anomalies',
      label: 'Anomalies',
      children: <AnomaliesPage />,
    },
    {
      key: 'horaires',
      label: 'Horaires de référence',
      children: <HorairesReferencePage />,
    },
  ]

  return <Tabs defaultActiveKey="pointages" items={items} />
}
