"use client";

import { useRef, useState } from 'react';

interface Props {
  label: string;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onFiles: (files: File[]) => void;
  optional?: boolean;
}

export default function PDFDropZone({
  label,
  accept = 'application/pdf',
  multiple = false,
  files,
  onFiles,
  optional = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      accept.split(',').some((a) => {
        const t = a.trim();
        if (t === 'application/pdf') return f.type === 'application/pdf' || f.name.endsWith('.pdf');
        return f.name.endsWith(t.replace('*', '').replace('.', ''));
      })
    );

    if (dropped.length === 0) return;

    if (multiple) {
      onFiles([...files, ...dropped]);
    } else {
      onFiles([dropped[0]]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    if (multiple) {
      onFiles([...files, ...selected]);
    } else {
      onFiles([selected[0]]);
    }
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onFiles(files.filter((_, i) => i !== index));
  };

  const hasFiles = files.length > 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {optional && (
          <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">任意</span>
        )}
        {!optional && (
          <span className="text-xs text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">必須</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={[
          'relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200',
          'flex flex-col items-center justify-center gap-3 min-h-[120px]',
          isDragging
            ? 'border-blue-400 bg-blue-500/10'
            : hasFiles
            ? 'border-emerald-500/60 bg-emerald-500/5'
            : 'border-slate-600 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60',
        ].join(' ')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleInputChange}
        />

        {hasFiles ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">
              {files.length}件 追加済み
            </span>
          </div>
        ) : (
          <>
            <svg
              className={['w-10 h-10', isDragging ? 'text-blue-400' : 'text-slate-500'].join(' ')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <div className="text-center">
              <p className={['text-sm font-medium', isDragging ? 'text-blue-300' : 'text-slate-300'].join(' ')}>
                {isDragging ? 'ドロップしてください' : 'PDFをドラッグ＆ドロップ'}
              </p>
              <p className="text-xs text-slate-500 mt-1">またはクリックして選択</p>
            </div>
          </>
        )}
      </div>

      {/* File list */}
      {hasFiles && (
        <ul className="mt-2 space-y-1">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-xs text-slate-300 truncate">{file.name}</span>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0 text-base leading-none"
                aria-label="ファイルを削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
