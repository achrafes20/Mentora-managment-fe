import { Result } from 'antd'

export function ModulePlaceholder({ label }: { label: string }) {
  return <Result status="info" title={label} subTitle="Module pas encore construit." />
}
