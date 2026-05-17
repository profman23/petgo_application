import * as React from "react"

// Aligned with Tailwind default breakpoints:
// sm: 640, md: 768, lg: 1024
export const BREAKPOINTS = {
  mobile: 640,   // < 640 = mobile
  tablet: 1024,  // 640..<1024 = tablet
  // >= 1024 = desktop
} as const

// Kept for backwards compatibility with imports expecting MOBILE_BREAKPOINT.
// Points to the same value as BREAKPOINTS.mobile.
export const MOBILE_BREAKPOINT = BREAKPOINTS.mobile

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}

// < 640px
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`)
}

// 640px .. <1024px
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
  )
}

// >= 1024px
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`)
}
