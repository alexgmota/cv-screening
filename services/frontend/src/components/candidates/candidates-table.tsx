'use client';

import { CvListItem } from '@/lib/api';
import { CopyButton } from './copy-button';

interface CandidatesTableProps {
  cvs: CvListItem[];
  onOpenCv: (cvId: string) => void;
}

const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide';
const tdClass = 'px-4 py-3 align-top';

export function CandidatesTable({ cvs, onOpenCv }: CandidatesTableProps) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={thClass}>Name</th>
            <th className={thClass}>Role</th>
            <th className={thClass}>Phone</th>
            <th className={thClass}>Email</th>
            <th className={thClass}>Skills</th>
            <th className={`${thClass} text-right`}>Open CV</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {cvs.map((cv) => (
            <tr key={cv.id} className="hover:bg-gray-50">
              <td className={tdClass}>
                <span className="text-sm font-medium text-gray-900">{cv.name}</span>
              </td>
              <td className={tdClass}>
                <span className="text-sm text-gray-700">{cv.role}</span>
              </td>
              <td className={tdClass}>
                {cv.phone ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-600 whitespace-nowrap">{cv.phone}</span>
                    <CopyButton value={cv.phone} />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">&mdash;</span>
                )}
              </td>
              <td className={tdClass}>
                {cv.email ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-600 truncate max-w-[180px]">{cv.email}</span>
                    <CopyButton value={cv.email} />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">&mdash;</span>
                )}
              </td>
              <td className={tdClass}>
                <div className="flex flex-wrap gap-1">
                  {cv.skills.length > 0 ? (
                    cv.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">&mdash;</span>
                  )}
                </div>
              </td>
              <td className={`${tdClass} text-right`}>
                <button
                  onClick={() => onOpenCv(cv.id)}
                  className="text-xs bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Open CV
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
