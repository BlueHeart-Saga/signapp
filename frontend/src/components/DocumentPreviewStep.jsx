// components/DocumentPreviewStep.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  X, 
  Maximize2, 
  Minimize2,
  Info,
  Type,
  Image as ImageIcon,
  Signature,
  Calendar,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';

const DocumentPreviewStep = ({ 
  document, 
  fields, 
  onSignComplete,
  onFieldClick 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeField, setActiveField] = useState(null);
  const [signedFields, setSignedFields] = useState([]);
  const [showGuide, setShowGuide] = useState(true);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Simulated document data
  const documentData = {
    title: "Business Partnership Agreement",
    pages: 5,
    lastModified: "2024-01-15",
    size: "2.4 MB"
  };

  const guideSteps = [
    { id: 1, text: "Review the document carefully", completed: true },
    { id: 2, text: "Click on fields to sign", completed: false },
    { id: 3, text: "Verify all signatures", completed: false },
    { id: 4, text: "Complete the signing process", completed: false }
  ];

  const handleFieldClick = (field) => {
    setActiveField(field);
    onFieldClick(field);
  };

  const handleSignField = () => {
    if (activeField) {
      setSignedFields([...signedFields, activeField.id]);
      setActiveField(null);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const FieldIcon = ({ type }) => {
    const icons = {
      signature: <Signature className="w-4 h-4" />,
      text: <Type className="w-4 h-4" />,
      date: <Calendar className="w-4 h-4" />,
      image: <ImageIcon className="w-4 h-4" />
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Process Bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-white font-medium">{documentData.title}</span>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-300">
                <span>Pages: {documentData.pages}</span>
                <span>Modified: {documentData.lastModified}</span>
                <span>Size: {documentData.size}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-gray-300" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-gray-300" />
                )}
              </button>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Toggle Guide"
              >
                <Info className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {guideSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500' 
                      : index === 1 
                        ? 'bg-blue-500' 
                        : 'bg-gray-700'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <span className={`font-medium ${
                        index === 1 ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step.completed 
                      ? 'text-green-400' 
                      : index === 1 
                        ? 'text-white' 
                        : 'text-gray-400'
                  }`}>
                    {step.text}
                  </span>
                </div>
                {index < guideSteps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 bg-gray-700" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div ref={containerRef} className="flex h-[calc(100vh-140px)]">
          {/* Document Viewer - Main Content */}
          <div className={`flex-1 bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${
            showGuide ? 'mr-4' : ''
          }`}>
            {/* Viewer Controls */}
            <div className="bg-gray-900 p-3 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5 text-gray-300" />
                </button>
                <span className="text-gray-300 font-medium">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5 text-gray-300" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-5 h-5 text-gray-300" />
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                Page 1 of {documentData.pages}
              </div>
            </div>

            {/* Document Container */}
            <div className="relative h-[calc(100%-56px)] overflow-auto bg-gray-900">
              {/* Simulated Document */}
              <div 
                className="bg-white mx-auto my-8 shadow-2xl"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease',
                  width: '210mm',
                  minHeight: '297mm'
                }}
              >
                {/* Document Header */}
                <div className="p-12 border-b">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {documentData.title}
                  </h1>
                  <p className="text-gray-600">
                    This agreement is made and entered into as of {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Document Content with Fields */}
                <div className="p-12">
                  <div className="space-y-8">
                    {/* Field positions (simulated) */}
                    {fields.map((field) => (
                      <div
                        key={field.id}
                        onClick={() => handleFieldClick(field)}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          activeField?.id === field.id
                            ? 'border-blue-500 bg-blue-50'
                            : signedFields.includes(field.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-dashed border-gray-300 hover:border-blue-300'
                        }`}
                        style={{
                          position: 'absolute',
                          left: `${field.x}px`,
                          top: `${field.y}px`,
                          width: `${field.width}px`,
                          height: `${field.height}px`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{field.label}</span>
                          <FieldIcon type={field.type} />
                        </div>
                        {signedFields.includes(field.id) && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-10 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Document Content */}
                    <div className="space-y-4 text-gray-700">
                      {/* Add your actual document content here */}
                      <p>This is a simulated document preview. In a real implementation, this would display your actual PDF or document content.</p>
                      {/* ... more document content */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Fields & Guide */}
          {showGuide && (
            <div className="w-80 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              {/* Fields Panel */}
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Signing Fields ({signedFields.length}/{fields.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      onClick={() => handleFieldClick(field)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeField?.id === field.id
                          ? 'bg-blue-900'
                          : signedFields.includes(field.id)
                          ? 'bg-green-900'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FieldIcon type={field.type} />
                          <span className="ml-2 text-white">{field.label}</span>
                        </div>
                        {signedFields.includes(field.id) && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{field.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signing Panel */}
              {activeField && (
                <div className="p-4 border-b border-gray-700">
                  <h4 className="font-medium text-white mb-3">
                    Sign: {activeField.label}
                  </h4>
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-32 border border-gray-700 rounded bg-white touch-none"
                    />
                  </div>
                  <button
                    onClick={handleSignField}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Apply Signature
                  </button>
                </div>
              )}

              {/* Guide Panel */}
              <div className="p-4 flex-1 overflow-y-auto">
                <h3 className="font-semibold text-white mb-4">Signing Guide</h3>
                <div className="space-y-3">
                  <div className="bg-gray-900 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-400 mb-2">How to Sign:</h4>
                    <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
                      <li>Click on any highlighted field in the document</li>
                      <li>Draw your signature in the signature pad</li>
                      <li>Click "Apply Signature" to confirm</li>
                      <li>Repeat for all required fields</li>
                    </ol>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-lg">
                    <h4 className="font-medium text-green-400 mb-2">Status Indicators:</h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-300">Signed field</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-300">Selected field</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Button */}
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={onSignComplete}
                  disabled={signedFields.length !== fields.length}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
                    signedFields.length === fields.length
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {signedFields.length === fields.length ? (
                    <>
                      Complete Signing
                      <CheckCircle className="ml-2 w-5 h-5" />
                    </>
                  ) : (
                    `Sign ${fields.length - signedFields.length} more fields`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewStep;