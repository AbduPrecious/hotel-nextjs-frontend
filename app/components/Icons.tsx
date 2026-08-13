export const BedIcon = ({ size = 18, color = '#000000' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width={size} height={size}>
    <path d="M 230 780 L 230 600 L 230 350 Q 230 310 270 310 L 730 310 Q 770 310 770 350 L 770 780" fill="none" stroke={color} strokeWidth="35" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="230" y="780" width="40" height="60" rx="10" fill="none" stroke={color} strokeWidth="35" />
    <rect x="730" y="780" width="40" height="60" rx="10" fill="none" stroke={color} strokeWidth="35" />
    <rect x="310" y="380" width="130" height="80" rx="15" fill="none" stroke={color} strokeWidth="35" />
    <rect x="560" y="380" width="130" height="80" rx="15" fill="none" stroke={color} strokeWidth="35" />
    <line x1="230" y1="580" x2="770" y2="580" stroke={color} strokeWidth="35" strokeLinecap="round" />
    <line x1="230" y1="680" x2="770" y2="680" stroke={color} strokeWidth="35" strokeLinecap="round" />
  </svg>
);

export const GuestIcon = ({ size = 18, color = '#263238' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width={size} height={size}>
    <circle cx="500" cy="500" r="410" fill="none" stroke={color} strokeWidth="32" />
    <circle cx="500" cy="370" r="120" fill="none" stroke={color} strokeWidth="32" />
    <path d="M 320 680 A 180 180 0 0 1 680 680" fill="none" stroke={color} strokeWidth="32" strokeLinecap="round" />
  </svg>
);