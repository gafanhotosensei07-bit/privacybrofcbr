const VerifiedBadge = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="hsl(24, 95%, 53%)" strokeWidth="2" fill="none" />
    <path
      d="M8 12.5L10.5 15L16 9.5"
      stroke="hsl(24, 95%, 53%)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default VerifiedBadge;
