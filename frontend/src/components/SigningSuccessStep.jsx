// components/SigningSuccessStep.jsx
import React, { useState } from 'react';
import { 
  CheckCircle, 
  Download, 
  FileText, 
  Mail, 
  Share2, 
  Printer,
  Copy,
  ExternalLink
} from 'lucide-react';
import { saveAs } from 'file-saver';

const SigningSuccessStep = ({ document, onClose, onNewSign }) => {
  const [copied, setCopied] = useState(false);

  const documentDetails = {
    title: "Business Partnership Agreement",
    documentId: "DOC-2024-001-ABC123",
    signedAt: new Date().toLocaleString(),
    signatories: ["John Doe", "Jane Smith"],
    fileSize: "2.8 MB",
    pages: 5
  };

  const handleDownload = () => {
    // Simulate download
    const blob = new Blob(['Simulated document content'], { type: 'application/pdf' });
    saveAs(blob, `Signed_${documentDetails.title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/document/${documentDetails.documentId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actions = [
    {
      icon: <Download className="w-5 h-5" />,
      label: "Download PDF",
      description: "Get a copy for your records",
      action: handleDownload,
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email Copy",
      description: "Send to your email",
      action: () => console.log("Email requested"),
      color: "bg-green-100 text-green-600"
    },
    {
      icon: <Printer className="w-5 h-5" />,
      label: "Print Document",
      description: "Print physical copy",
      action: () => window.print(),
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      label: "Share Link",
      description: "Share secure link",
      action: handleCopyLink,
      color: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-full">
              <CheckCircle className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Document Successfully Signed!</h1>
          <p className="text-green-100 opacity-90">
            Your document has been legally executed and stored securely
          </p>
        </div>

        <div className="p-8">
          {/* Document Details Card */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center mb-2">
                  <FileText className="w-6 h-6 text-gray-400 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {documentDetails.title}
                  </h2>
                </div>
                <p className="text-gray-600">
                  Document ID: {documentDetails.documentId}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy ID"}
              </button>
            </div>

            {/* Document Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Signed On</div>
                <div className="font-semibold text-gray-900">
                  {documentDetails.signedAt}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Signatories</div>
                <div className="font-semibold text-gray-900">
                  {documentDetails.signatories.length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">File Size</div>
                <div className="font-semibold text-gray-900">
                  {documentDetails.fileSize}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Pages</div>
                <div className="font-semibold text-gray-900">
                  {documentDetails.pages}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What would you like to do next?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
                    {action.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{action.label}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Signatories List */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Signatories
            </h3>
            <div className="space-y-3">
              {documentDetails.signatories.map((signatory, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">
                      {signatory.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{signatory}</span>
                  </div>
                  <span className="text-sm text-gray-500">Signed</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={onNewSign}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center"
            >
              Sign Another Document
              <ExternalLink className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>

          {/* Success Message */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <p className="text-green-800">
                Your signed document has been securely stored and timestamped. 
                You can access it anytime from your documents dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigningSuccessStep;