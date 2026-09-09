import React from 'react';

// SVG 1: Open Book Illustration for Question Screen (Image 1)
export const OpenBookIllustration: React.FC = () => (
  <svg
    viewBox="0 0 420 130"
    className="w-56 sm:w-72 mx-auto -mt-6 sm:-mt-8 drop-shadow-md select-none pointer-events-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Underneath Page Shadow Layers */}
    <path
      d="M210 115 C165 92 90 92 25 110 C18 98 18 38 25 26 C90 10 165 10 210 32 C255 10 330 10 395 26 C402 38 402 98 395 110 C330 92 255 92 210 115 Z"
      fill="#FDFBF7"
      stroke="#3E2723"
      strokeWidth="2.8"
    />
    {/* Left Page Curvature Lines */}
    <path d="M210 32 C165 12 90 12 28 28" stroke="#3E2723" strokeWidth="2" fill="none" />
    <path d="M210 48 C165 28 90 28 30 44" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    <path d="M210 64 C165 44 90 44 32 60" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    <path d="M210 80 C165 60 90 60 34 76" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    <path d="M210 96 C165 76 90 76 36 92" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    {/* Right Page Curvature Lines */}
    <path d="M210 32 C255 12 330 12 392 28" stroke="#3E2723" strokeWidth="2" fill="none" />
    <path d="M210 48 C255 28 330 28 390 44" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    <path d="M210 64 C255 44 330 44 388 60" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    <path d="M210 80 C255 60 330 60 386 76" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    <path d="M210 96 C255 76 330 76 384 92" stroke="#5D4037" strokeWidth="1.2" strokeDasharray="4 2" fill="none" />
    {/* Spine Center Seam */}
    <path d="M210 32 L210 115" stroke="#3E2723" strokeWidth="3.5" strokeLinecap="round" />
    {/* Bottom Curving Page Edges */}
    <path d="M25 110 C90 92 165 92 210 115 C255 92 330 92 395 110" stroke="#2D1A14" strokeWidth="3.5" fill="none" />
    <path d="M22 114 C87 96 162 96 210 119 C258 96 333 96 398 114" stroke="#8D6E63" strokeWidth="1.8" fill="none" />
  </svg>
);

// SVG 2: Gold Filigree Floral Corner Flourish for Certificate (Image 2)
export const GoldCornerFlourish: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 140 140"
    className={`w-16 h-16 sm:w-24 sm:h-24 pointer-events-none select-none ${className || ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="#D4AF37" stroke="#9A7B1C" strokeWidth="0.8">
      {/* Corner Outer Border Lines */}
      <path d="M10 10 L130 10" stroke="#C59B27" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 10 L10 130" stroke="#C59B27" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 16 L120 16" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      <path d="M16 16 L16 120" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      {/* Mandala Leaves & Swirls */}
      <circle cx="34" cy="34" r="8" fill="#D4AF37" stroke="#B8860B" strokeWidth="1.2" />
      <circle cx="34" cy="34" r="4.5" fill="#FFF3C4" />
      {/* Floral Paisley Petals */}
      <path d="M34 16 C42 22 46 28 44 34 C38 32 30 26 34 16 Z" fill="#FFE082" />
      <path d="M16 34 C22 42 28 46 34 44 C32 38 26 30 16 34 Z" fill="#FFE082" />
      <path d="M34 52 C42 46 46 40 44 34 C38 36 30 42 34 52 Z" fill="#D4AF37" />
      <path d="M52 34 C46 42 40 46 34 44 C36 38 42 30 52 34 Z" fill="#D4AF37" />
      {/* Outer Paisley Clusters */}
      <path d="M60 20 C75 16 95 24 100 40 C85 45 70 35 60 20 Z" fill="#C59B27" />
      <path d="M20 60 C16 75 24 95 40 100 C45 85 35 70 20 60 Z" fill="#C59B27" />
      <circle cx="85" cy="28" r="4.5" fill="#FFE082" stroke="#9A7B1C" />
      <circle cx="28" cy="85" r="4.5" fill="#FFE082" stroke="#9A7B1C" />
      <path d="M70 48 C86 52 98 70 90 90 C75 80 65 65 70 48 Z" fill="#D4AF37" />
      <circle cx="82" cy="74" r="4" fill="#FFE082" stroke="#B8860B" />
      <path d="M48 70 C52 86 70 98 90 90 C80 75 65 65 48 70 Z" fill="#D4AF37" />
      <circle cx="74" cy="82" r="4" fill="#FFE082" stroke="#B8860B" />
      {/* Little accent buds */}
      <circle cx="115" cy="20" r="3.5" fill="#FFE082" stroke="#B8860B" />
      <circle cx="20" cy="115" r="3.5" fill="#FFE082" stroke="#B8860B" />
    </g>
  </svg>
);
