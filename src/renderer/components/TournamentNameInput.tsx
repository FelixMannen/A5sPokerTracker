import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  names: string[]
  inputClass: string
  autoFocus?: boolean
  placeholder?: string
}

// Rank: prefix matches before mid-string matches, max 6
function rankSuggestions(query: string, names: string[]): string[] {
  const q = query.toLowerCase()
  const matches = names.filter((n) => n.toLowerCase().includes(q))
  const prefix = matches.filter((n) => n.toLowerCase().startsWith(q))
  const middle = matches.filter((n) => !n.toLowerCase().startsWith(q))
  return [...prefix, ...middle].slice(0, 6)
}

/**
 * Tournament name input with autocomplete over previously used names.
 * Self-contained: owns its dropdown, keyboard nav, and click-outside handling.
 * On Escape it closes the dropdown and stops propagation, so a surrounding modal's
 * own Escape-to-close only fires once the dropdown is already closed.
 */
export default function TournamentNameInput({
  value,
  onChange,
  names,
  inputClass,
  autoFocus,
  placeholder
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Scroll active item into view on keyboard navigation
  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // Click-outside: close dropdown when clicking outside the input+dropdown container
  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  const openSuggestions = useCallback(
    (v: string) => {
      if (!v.trim()) {
        setSuggestions([])
        setShowDropdown(false)
        setActiveIndex(-1)
        return
      }
      const ranked = rankSuggestions(v, names)
      setSuggestions(ranked)
      setShowDropdown(ranked.length > 0)
      setActiveIndex(-1)
    },
    [names]
  )

  function handleChange(v: string) {
    onChange(v)
    openSuggestions(v)
  }

  function select(selected: string) {
    onChange(selected)
    setSuggestions([])
    setShowDropdown(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Close the dropdown first; stop propagation so the modal stays open
    if (e.key === 'Escape' && showDropdown) {
      e.preventDefault()
      e.stopPropagation()
      setShowDropdown(false)
      setActiveIndex(-1)
      return
    }
    if (!showDropdown) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault() // don't submit the form
      select(suggestions[activeIndex])
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClass}
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1a] shadow-2xl">
          {suggestions.map((s, i) => (
            <li
              key={s}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              // onMouseDown + preventDefault keeps input focused and fires before blur
              onMouseDown={(e) => {
                e.preventDefault()
                select(s)
              }}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                i === activeIndex
                  ? 'bg-emerald-600/20 text-emerald-300'
                  : 'text-gray-300 hover:bg-emerald-600/20 hover:text-emerald-300'
              } ${i < suggestions.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
