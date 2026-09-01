import { ChatSource } from '@/lib/api';
import { CvTooltip } from './cv-tooltip';

interface SourceCardProps {
  source: ChatSource;
  onOpenCv?: (cvId: string) => void;
}

export function SourceCard({ source, onOpenCv }: SourceCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2">
      <CvTooltip cvId={source.cvId}>
        <span className="font-medium text-gray-800 cursor-help">
          {source.name} <span className="text-gray-500 font-normal">({source.role})</span>
        </span>
      </CvTooltip>
      {onOpenCv && (
        <button
          onClick={() => onOpenCv(source.cvId)}
          className="text-xs bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
        >
          Open CV
        </button>
      )}
    </div>
  );
}
