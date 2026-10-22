import React from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: React.ReactNode;
  /** Action buttons rendered under the description */
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, children }) => (
  <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center bg-slate-900/40">
    <Icon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
    <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
    {description && <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">{description}</p>}
    {children && <div className="mt-5 flex items-center justify-center gap-3">{children}</div>}
  </div>
);
