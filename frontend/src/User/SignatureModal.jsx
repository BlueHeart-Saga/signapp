import React, { useRef } from "react";
import SignaturePad from "signature_pad";
import "../style/documentBuilder.css";

const SignatureModal = ({ onClose, onSave }) => {
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  React.useEffect(() => {
    padRef.current = new SignaturePad(canvasRef.current);
  }, []);

  const handleSave = () => {
    const dataURL = padRef.current.toDataURL();
    onSave(dataURL);
  };

  const handleClear = () => {
    padRef.current.clear();
  };

  return (
    <div className="signature-modal">
      <div className="signature-box">
        <h3>✍️ Sign Here</h3>
        <canvas ref={canvasRef} width={400} height={150} className="signature-canvas" />
        <div className="modal-actions">
          <button onClick={handleClear}>Clear</button>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
