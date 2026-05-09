import { useEffect, useRef, useState } from 'react'
import { COUNTRIES, findCountry } from '../data/countries.js'

// Styles use the same CSS variables as .form-input so the picker adapts
// to the existing theme (light or dark) without a separate stylesheet.
const styles = {
  wrap: {
    position: 'relative',
    display: 'inline-flex',
  },
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 10px',
    height: 44,
    background: 'var(--color-bg-light, #FAFAFA)',
    border: '1.5px solid var(--color-border, #E5E5E5)',
    borderRight: 'none',
    borderTopLeftRadius: 'var(--radius, 10px)',
    borderBottomLeftRadius: 'var(--radius, 10px)',
    color: 'var(--color-black, #111111)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'var(--transition, all 150ms ease)',
  },
  triggerOpen: {
    borderColor: 'var(--color-red, #E11D2E)',
  },
  flag: { fontSize: 18, lineHeight: 1 },
  chevron: {
    width: 12,
    height: 12,
    opacity: 0.55,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    minWidth: 280,
    maxHeight: 320,
    background: '#ffffff',
    border: '1px solid var(--color-border, #E5E5E5)',
    borderRadius: 'var(--radius, 10px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  searchWrap: {
    padding: 8,
    borderBottom: '1px solid var(--color-border, #E5E5E5)',
  },
  search: {
    width: '100%',
    padding: '8px 10px',
    background: 'var(--color-bg-light, #FAFAFA)',
    border: '1px solid var(--color-border, #E5E5E5)',
    borderRadius: 6,
    color: 'var(--color-black, #111111)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  list: {
    overflowY: 'auto',
    flex: 1,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    cursor: 'pointer',
    color: 'var(--color-black, #111111)',
    fontSize: 13,
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  itemSelected: {
    background: 'rgba(225,29,46,0.10)',
  },
  itemHover: {
    background: 'rgba(0,0,0,0.04)',
  },
  itemName: { flex: 1 },
  itemDial: {
    color: 'var(--color-text-muted, #888888)',
    fontSize: 12,
  },
  empty: {
    padding: 16,
    textAlign: 'center',
    color: 'var(--color-text-muted, #888888)',
    fontSize: 12,
  },
}

export default function CountryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef(null)
  const searchRef = useRef(null)

  const country = findCountry(value)

  useEffect(() => {
    if (!open) return
    setTimeout(() => searchRef.current?.focus(), 50)

    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = search
    ? COUNTRIES.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.dial.includes(q) ||
          c.code.toLowerCase().includes(q)
        )
      })
    : COUNTRIES

  function pick(c) {
    onChange(c.code)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={wrapRef} style={styles.wrap}>
      <button
        type="button"
        style={{ ...styles.trigger, ...(open ? styles.triggerOpen : null) }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span style={styles.flag}>{country.flag}</span>
        <span>{country.dial}</span>
        <svg
          style={styles.chevron}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={styles.dropdown} role="listbox">
          <div style={styles.searchWrap}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country…"
              style={styles.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={styles.list}>
            {filtered.length === 0 ? (
              <div style={styles.empty}>No countries match "{search}"</div>
            ) : (
              filtered.map((c) => {
                const selected = c.code === country.code
                return (
                  <button
                    type="button"
                    key={c.code}
                    style={{
                      ...styles.item,
                      ...(selected ? styles.itemSelected : null),
                    }}
                    onClick={() => pick(c)}
                    onMouseEnter={(e) => {
                      if (!selected)
                        e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      if (!selected)
                        e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span style={styles.flag}>{c.flag}</span>
                    <span style={styles.itemName}>{c.name}</span>
                    <span style={styles.itemDial}>{c.dial}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
