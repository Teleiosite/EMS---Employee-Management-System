import React from 'react';
import { Upload, X, AlertCircle, Download, Loader2, CheckCircle2 } from 'lucide-react';

interface ImportModalProps {
  show: boolean;
  onClose: () => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  importing: boolean;
  importResult: { success: number; errors: string[] } | null;
  onDownloadTemplate: () => void;
  onStartImport: () => Promise<void>;
  onDone: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  show,
  onClose,
  importFile,
  setImportFile,
  importing,
  importResult,
  onDownloadTemplate,
  onStartImport,
  onDone
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in transition-all font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            Bulk Import Employees
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {!importResult ? (
            <div className="space-y-6">
              
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition-colors cursor-pointer relative py-8 px-4 text-center group">
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="mb-3 p-3 bg-white rounded-full shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                  <Upload className={`w-6 h-6 ${importFile ? 'text-green-500' : 'text-orange-400'}`} />
                </div>
                <h4 className="text-sm font-semibold text-gray-800">
                  {importFile ? importFile.name : 'Click or drag file to upload'}
                </h4>
                <p className="text-xs text-gray-500 mt-1">Supports CSV and Excel (.xlsx)</p>
              </div>

              <div className="bg-orange-50/80 border border-orange-100 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-orange-800 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" /> 
                  File Requirements
                </div>
                <p className="text-xs text-orange-700/80 leading-relaxed">
                  The spreadsheet must contain these exact column names: <span className="font-semibold">first_name, last_name, email, department, designation, base_salary, joining_date</span>.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onDownloadTemplate}
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Template
                  </button>
                </div>
              </div>

              <div className="pt-2 shrink-0">
                <button
                  onClick={onStartImport}
                  disabled={!importFile || importing}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold flex py-2.5 rounded-lg transition-colors items-center justify-center gap-2 text-sm"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {importing ? 'Importing Data...' : 'Start Import'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-1">Import Complete</h4>
                <p className="text-sm text-gray-500">
                  Successfully imported <span className="font-semibold text-green-600">{importResult.success}</span> employees.
                </p>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-left">
                  <div className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> 
                    {importResult.errors.length} rows had errors
                  </div>
                  <ul className="text-xs text-red-600 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold shrink-0">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onDone}
                className="w-full bg-gray-800 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-900 transition-colors text-sm"
              >
                Close Summary
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;

