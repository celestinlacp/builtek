export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#1A2744" />
      <text
        x="4" y="24"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="20"
        fontWeight="900"
        fill="white"
        letterSpacing="-1"
      >
        B
      </text>
      <text
        x="17" y="24"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="20"
        fontWeight="900"
        fill="#00C2FF"
        letterSpacing="-1"
      >
        T
      </text>
    </svg>
  )
}
