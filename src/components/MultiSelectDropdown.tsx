import { useEffect, useRef, useState, type ReactNode } from 'react'
import chevronDown from '@/assets/icons/chevron-down.svg'
import styles from './MultiSelectDropdown.module.css'

export type MultiSelectOption = {
  value: string
  label: string
  icon?: ReactNode
}

type MultiSelectDropdownProps = {
  label: string
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    )
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${selected.length > 0 ? styles.active : ''}`}
        onClick={() => setOpen(!open)}
      >
        {label}
        {selected.length > 0 && (
          <span className={styles.count}>{selected.length}</span>
        )}
        <img src={chevronDown} alt="" width={12} height={12} />
      </button>

      {open && (
        <div className={styles.menu}>
          {options.length === 0 && (
            <div className={styles.empty}>No options</div>
          )}
          {options.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
              {option.icon}
              <span className={styles.optionLabel}>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
