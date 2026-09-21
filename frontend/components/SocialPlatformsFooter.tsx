'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

const SocialPlatformsFooterComponent: React.FC = () => {
  return (
    <footer className="w-full mt-12 bg-slate-50 border-t border-slate-200 text-slate-700 py-6 select-none">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Heading & description */}
        <div className="text-center md:text-left space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            Join our Online Platforms to get updated –
          </h4>
          <p className="text-[11px] text-slate-500">
            Subscribe and follow Eduline Publishers for upcoming quiz updates and announcements.
          </p>
        </div>

        {/* Right: Small, professional brand icons */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* YouTube */}
          <a
            href="https://www.youtube.com/@edulinepublishersdigital1944"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 transition-all text-xs font-semibold shadow-xs group"
            title="Subscribe Our YouTube Channel: @edulinepublishersdigital1944"
          >
            <svg className="w-3.5 h-3.5 fill-red-600 shrink-0" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="text-[11px] font-medium">YouTube</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-red-500" />
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/edulinepublishersdigital/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all text-xs font-semibold shadow-xs group"
            title="Facebook: @edulinepublishersdigital"
          >
            <svg className="w-3.5 h-3.5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-[11px] font-medium">Facebook</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-500" />
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/edulinepublishersdigital/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-slate-200 hover:border-pink-300 transition-all text-xs font-semibold shadow-xs group"
            title="Instagram: @edulinepublishersdigital"
          >
            <svg className="w-3.5 h-3.5 fill-[#E4405F] shrink-0" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="text-[11px] font-medium">Instagram</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-pink-500" />
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 mt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>&copy; {new Date().getFullYear()} Eduline Publishers. All rights reserved.</span>
        <span>Curriculum Aligned Digital Quizzes for Classes 3 - 8</span>
      </div>
    </footer>
  );
};

export const SocialPlatformsFooter = React.memo(SocialPlatformsFooterComponent);
export default SocialPlatformsFooter;
