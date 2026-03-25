// HeroCard.jsx
import { useNavigate } from "react-router-dom";


const HeroCard = () => {
  const navigate = useNavigate();
  return (
    <div className="herocss-min-h-screen">
      <div className="herocss-container">
        {/* Main Heading */}
        <section className="herocss-hero-section">
          <h1 className="herocss-main-heading">
            <span className="herocss-teal-text">Future-Ready E-Signatures</span>
            <span className="herocss-gray-text"> for </span>
            {/* <br /> */}
            <span className="herocss-gray-text">Modern Business</span>
          </h1>
          
          <p className="herocss-subtitle">
            Fast, secure & automated document signing. Powered by intelligent workflows and real-time verification
          </p>
          
          {/* CTA Buttons */}
          <div className="herocss-cta-buttons">
  <button
    className="herocss-btn-primary"
    onClick={() => navigate("/login")}
  >
    Get Started
  </button>

  <button
    className="herocss-btn-secondary"
    onClick={() => navigate("/login")}
  >
    Book Demo
  </button>
</div>
        </section>

        <section className="herocss-hero-visual">
            <img src="/images/herocard.png" alt="herocard" />
        </section>

        
      </div>

      <style jsx>{`
        .herocss-min-h-screen {
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .herocss-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 5rem 1rem 4rem;
        }

        .herocss-hero-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .herocss-main-heading {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .herocss-teal-text {
          color: #0d9488;
        }

        .herocss-gray-text {
          color: #111827;
        }

        .herocss-subtitle {
          font-size: 1.25rem;
          color: #4b5563;
          max-width: 48rem;
          margin: 0 auto 2rem;
          line-height: 1.6;
        }

        .herocss-cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          margin-top: 2rem;
        }

        @media (min-width: 640px) {
          .herocss-cta-buttons {
            flex-direction: row;
          }
        }

        .herocss-btn-primary {
          background-color: #ea580c;
          color: white;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .herocss-btn-primary:hover {
          background-color: #0f766e;
         
          
          border-color: rgba(13, 148, 136, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.15);
        }

        .herocss-btn-secondary {
          background-color: white;
          color: #0d9488;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          border: 2px solid #0d9488;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .herocss-btn-secondary:hover {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.1);
          border-color: rgba(13, 148, 136, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.15);
        }

        .herocss-hero-visual {
          position: relative;
          margin-top: 4rem;
        }

        .herocss-teal-band {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 16rem;
          background-color: #0d9488;
          transform: translateY(-50%);
        }

        .herocss-cards-grid {
          position: relative;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          max-width: 72rem;
          margin: 0 auto;
          align-items: center;
        }

        @media (min-width: 768px) {
          .herocss-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }


        .herocss-hero-visual {
  margin-top: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.herocss-hero-visual img {
  max-width: 100%;
  width: 920px;
  height: auto;
  border-radius: 16px;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

/* Subtle floating effect */
.herocss-hero-visual img:hover {
  transform: translateY(-6px) scale(1.01);
}

@media (max-width: 768px) {
  .herocss-hero-visual img {
    width: 100%;
  }
}



        .herocss-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: transform 0.3s;
          z-index: 10;
        }

        .herocss-card:hover {
          transform: scale(1.05);
        }

        .herocss-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .herocss-tab-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .herocss-tab-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          color: #4b5563;
          cursor: pointer;
          font-weight: 500;
        }

        .herocss-tab-btn:hover {
          color: #0d9488;
        }

        .herocss-dot-indicators {
          display: flex;
          gap: 0.25rem;
        }

        .herocss-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 9999px;
        }

        .herocss-dot-teal { background-color: #0d9488; }
        .herocss-dot-blue { background-color: #3b82f6; }
        .herocss-dot-red { background-color: #ef4444; }

        .herocss-signature-canvas {
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 1rem;
          background-color: #f9fafb;
          height: 6rem;
        }

        .herocss-signature-svg {
          width: 100%;
          height: 100%;
        }

        .herocss-signature-path {
          fill: none;
          stroke: #0d9488;
          stroke-width: 2;
          stroke-linecap: round;
        }

        .herocss-canvas-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          color: #9ca3af;
        }

        .herocss-control-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
        }

        .herocss-control-btn:hover { color: #0d9488; }
        .herocss-delete-btn:hover { color: #ef4444; }

        .herocss-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .herocss-business-person {
          display: flex;
          justify-content: center;
          z-index: 20;
          position: relative;
        }

        .herocss-person-container {
          position: relative;
        }

        .herocss-person-card {
          width: 16rem;
          height: 20rem;
          background: linear-gradient(135deg, #1f2937, #111827);
          border-radius: 0.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overflow: hidden;
        }

        .herocss-person-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8rem;
          background: linear-gradient(to bottom, #374151, transparent);
        }

        .herocss-person-details {
          position: relative;
          z-index: 10;
          margin-bottom: 2rem;
        }

        .herocss-person-head {
          width: 8rem;
          height: 8rem;
          background-color: #4b5563;
          border-radius: 9999px;
          margin: 0 auto 1rem;
        }

        .herocss-person-body {
          width: 12rem;
          height: 6rem;
          background: linear-gradient(135deg, #1e3a8a, #1e40af);
          border-radius: 9999px 9999px 0 0;
        }

        .herocss-tablet-overlay {
          position: absolute;
          bottom: 4rem;
          right: 1rem;
          width: 5rem;
          height: 7rem;
          background-color: #d1d5db;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          transform: rotate(12deg);
        }

        .herocss-arrow-left, .herocss-arrow-right {
          position: absolute;
          top: 50%;
          width: 6rem;
          height: 6rem;
          color: #5eead4;
          stroke-width: 3;
          transform: translateY(-50%);
        }

        .herocss-arrow-left {
          left: -5rem;
        }

        .herocss-arrow-right {
          right: -5rem;
        }

        .herocss-documents-section {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: transform 0.3s;
          z-index: 10;
        }

        .herocss-documents-section:hover {
          transform: scale(1.05);
        }

        .herocss-document-card {
          background-color: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .herocss-document-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .herocss-document-lines {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .herocss-line {
          height: 0.5rem;
          background-color: #e5e7eb;
          border-radius: 0.25rem;
        }

        .herocss-line-full { width: 100%; }
        .herocss-line-four-fifths { width: 80%; }
        .herocss-line-three-fourths { width: 75%; }

        .herocss-signature-preview {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #d1d5db;
        }

        .herocss-preview-svg {
          width: 6rem;
          height: 2.5rem;
        }

        .herocss-signature-badge {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 30;
          transition: transform 0.3s;
        }

        .herocss-signature-badge:hover {
          transform: scale(1.1);
        }

        .herocss-badge-text {
          font-weight: 700;
          font-size: 1.25rem;
          color: #1f2937;
        }

        .herocss-badge-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #0d9488;
        }

        @media (max-width: 768px) {
          .herocss-main-heading {
            font-size: 3rem;
          }
          
          .herocss-signature-badge {
            right: 1rem;
          }
          
          .herocss-arrow-left, .herocss-arrow-right {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .herocss-main-heading {
            font-size: 2.5rem;
          }
          
          .herocss-container {
            padding: 3rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroCard;





// {/* Hero Visual Section */}
//         <div className="herocss-hero-visual">
//           {/* Teal Background Band */}
//           <div className="herocss-teal-band"></div>
          
//           <div className="herocss-cards-grid">
//             {/* Left Card - Drawing Signature */}
//             <div className="herocss-card">
//               <div className="herocss-card-header">
//                 <div className="herocss-tab-buttons">
//                   <button className="herocss-tab-btn">Draw</button>
//                   <button className="herocss-tab-btn">Type</button>
//                   <button className="herocss-tab-btn">Upload</button>
//                 </div>
//                 <div className="herocss-dot-indicators">
//                   <div className="herocss-dot herocss-dot-teal"></div>
//                   <div className="herocss-dot herocss-dot-blue"></div>
//                   <div className="herocss-dot herocss-dot-red"></div>
//                 </div>
//               </div>
              
//               <div className="herocss-signature-canvas">
//                 <svg viewBox="0 0 200 80" className="herocss-signature-svg">
//                   <path
//                     className="herocss-signature-path"
//                     d="M 20 60 Q 30 20, 50 40 T 90 50 Q 110 30, 130 45 T 180 40"
//                   />
//                 </svg>
//               </div>
              
//               <div className="herocss-canvas-controls">
//                 <button className="herocss-control-btn">
//                   <svg className="herocss-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
//                   </svg>
//                 </button>
//                 <button className="herocss-control-btn herocss-delete-btn">
//                   <svg className="herocss-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                   </svg>
//                 </button>
//                 <button className="herocss-control-btn">
//                   <svg className="herocss-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                   </svg>
//                 </button>
//               </div>
//             </div>

//             {/* Center - Business Person */}
//             <div className="herocss-business-person">
//               <div className="herocss-person-container">
//                 <div className="herocss-person-card">
//                   <div className="herocss-person-glow"></div>
//                   <div className="herocss-person-details">
//                     <div className="herocss-person-head"></div>
//                     <div className="herocss-person-body"></div>
//                   </div>
//                   {/* Tablet overlay */}
//                   <div className="herocss-tablet-overlay"></div>
//                 </div>
                
//                 {/* Arrow from left */}
//                 <svg className="herocss-arrow-left" viewBox="0 0 60 80" fill="none" stroke="currentColor">
//                   <path d="M 0 40 Q 30 60, 60 40" strokeLinecap="round" />
//                   <path d="M 50 30 L 60 40 L 50 50" strokeLinecap="round" strokeLinejoin="round" />
//                 </svg>
                
//                 {/* Arrow to right */}
//                 <svg className="herocss-arrow-right" viewBox="0 0 60 80" fill="none" stroke="currentColor">
//                   <path d="M 0 40 Q 30 20, 60 40" strokeLinecap="round" />
//                   <path d="M 50 30 L 60 40 L 50 50" strokeLinecap="round" strokeLinejoin="round" />
//                 </svg>
//               </div>
//             </div>

//             {/* Right Card - Documents */}
//             <div className="herocss-documents-section">
//               <div className="herocss-document-card">
//                 <h3 className="herocss-document-title">Agreement</h3>
//                 <div className="herocss-document-lines">
//                   <div className="herocss-line herocss-line-full"></div>
//                   <div className="herocss-line herocss-line-four-fifths"></div>
//                   <div className="herocss-line herocss-line-full"></div>
//                 </div>
//               </div>
              
//               <div className="herocss-document-card">
//                 <h3 className="herocss-document-title">Final Statement</h3>
//                 <div className="herocss-document-lines">
//                   <div className="herocss-line herocss-line-full"></div>
//                   <div className="herocss-line herocss-line-three-fourths"></div>
//                   <div className="herocss-line herocss-line-full"></div>
//                 </div>
                
//                 <div className="herocss-signature-preview">
//                   <svg viewBox="0 0 120 40" className="herocss-preview-svg">
//                     <path
//                       className="herocss-signature-path"
//                       d="M 10 25 Q 20 10, 35 20 T 60 25 Q 75 15, 90 22 T 110 20"
//                     />
//                   </svg>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Signature Badge */}
//           <div className="herocss-signature-badge">
//             <span className="herocss-badge-text">Signature</span>
//             <svg className="herocss-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//             </svg>
//           </div>
//         </div>