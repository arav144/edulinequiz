'use client';

import React, { useState, useEffect } from 'react';
import { X, User, BookOpen, GraduationCap, Calendar, Award, Edit2, AlertCircle } from 'lucide-react';
import { IStudentProfile, getScoreRemarkShort } from './types';
import { apiGetMyAttempts, apiDownloadPdf } from '../services/api';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: IStudentProfile | null;
  onEditProfile?: () => void;
  onViewResult?: (attempt: any) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onEditProfile,
  onViewResult,
}) => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && profile) {
      loadAttempts();
    }
  }, [isOpen, profile]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGetMyAttempts();
      if (res.success && res.attempts) {
        setAttempts(res.attempts);
      } else {
        setError(res.message || 'Could not load your attempts.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attempts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = async (attemptId: string) => {
    try {
      setDownloadingPdf(attemptId);
      const blob = await apiDownloadPdf(attemptId, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Result_${profile?.firstName || 'Student'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Could not download result: ${err.message}`);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDownloadCertificate = async (attemptId: string) => {
    try {
      setDownloadingPdf(attemptId);
      const blob = await apiDownloadPdf(attemptId, 'certificate');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${profile?.firstName || 'Student'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Could not download certificate: ${err.message}`);
    } finally {
      setDownloadingPdf(null);
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center font-black text-2xl shrink-0 backdrop-blur-sm">
              {(profile.firstName || '?')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight leading-none text-white">
                {profile.fullName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-medium text-emerald-100">
                <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {profile.className || `Class ${profile.class}`}</span>
                <span>•</span>
                <span>{profile.schoolName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-600" />
            Student Profile Details
          </div>
          {onEditProfile && (
            <button
              onClick={() => { onClose(); onEditProfile(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition text-[11px] font-bold cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              My Quiz Attempts
            </h4>
            
            {loading ? (
              <div className="py-8 text-center text-xs font-medium text-slate-500 bg-white rounded-2xl border border-slate-200">
                Loading your attempts...
              </div>
            ) : attempts.length === 0 ? (
              <div className="py-8 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-slate-800 mb-1">No quizzes attempted yet</h5>
                <p className="text-xs text-slate-500">
                  You haven't participated in any quizzes. Start a quiz to see your results here!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div key={attempt.attemptId} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-emerald-200">
                    <div>
                      <div className="text-xs font-semibold text-emerald-600 mb-0.5">
                        {attempt.targetClass || `Class ${profile.class}`}
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm">{attempt.quizName}</h5>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(attempt.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-bold ${attempt.percentage >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {attempt.score}/{attempt.totalQuestions} ({Math.round(attempt.percentage)}%)
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${attempt.percentage >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                          {getScoreRemarkShort(attempt.percentage)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownloadCertificate(attempt.attemptId)}
                        disabled={downloadingPdf === attempt.attemptId}
                        className="px-3.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{downloadingPdf === attempt.attemptId ? 'Downloading...' : 'Download Certificate'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
