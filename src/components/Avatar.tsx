import styles from './Avatar.module.css'

const COLORS = [
  '#5e6ad2',
  '#26b5ce',
  '#4cb782',
  '#f2994a',
  '#eb5757',
  '#9b51e0',
  '#2f80ed',
  '#e2537a',
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

type AvatarProps = {
  id: string
  name: string | null
  email?: string
  size?: number
  title?: string
}

export function Avatar({ id, name, email, size = 24, title }: AvatarProps) {
  const display = name?.trim() || email || '?'
  const parts = display.split(/\s+/)
  const initials =
    parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : display.slice(0, 2).toUpperCase()
  const background = COLORS[hashCode(id) % COLORS.length]

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background,
      }}
      title={title ?? display}
    >
      {initials}
    </span>
  )
}
