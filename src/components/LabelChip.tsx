import styles from './LabelChip.module.css'

export function LabelChip({ label }: { label: string }) {
  return (
    <span className={styles.chip}>
      <span className={styles.dot} />
      {label}
    </span>
  )
}
