import React from 'react';
import { Upload, Users, Send, FolderOpen, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import ValuesSection from './ValuesSection';


export default function PlatformOverview() {
  const features = [
  {
    icon: <Upload className="w-6 h-6" />,
    title: "Build / Upload",
    description: "Easily upload or create documents ready for signing",
    path: "/e-signature"
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Choose Recipient",
    description: "Assign signers and set the signing order effortlessly",
    path: "/document-management"
  },
  {
    icon: <Send className="w-6 h-6" />,
    title: "Send Document",
    description: "Deliver secure signature requests straight to inboxes",
    path: "/templates"
  },
  {
    icon: <FolderOpen className="w-6 h-6" />,
    title: "Track & Manage",
    description: "Track, organize, and download signed documents in one place",
    path: "/workflow-automation"
  }
];


const navigate = useNavigate();


  const useCases = [
  {
    image: "/images/Union1.png",
    title: "Human Resources",
    description:
      "Use SafeSign to digitally sign offer letters, onboarding documents, and HR policies with secure, legally valid e-signatures",
  },
  {
    image: "/images/Union2.png",
    title: "Legal",
    description:
      "SafeSign enables law teams to execute contracts, NDAs, and compliance documents with tamper-proof digital signatures",
  },
  {
    image: "/images/Union3.png",
    title: "Marketing",
    description:
      "With SafeSign, marketing teams can instantly approve creative briefs, contracts, and vendor agreements online",
  },
  {
    image: "/images/Union4.png",
    title: "Sales",
    description:
      "Close deals faster using SafeSign by allowing clients to sign proposals and sales contracts anytime, anywhere",
  },
  {
    image: "/images/Union5.png",
    title: "Finance",
    description:
      "SafeSign helps finance teams securely approve invoices, purchase orders, and financial agreements digitally",
  },
  {
    image: "/images/Union6.png",
    title: "Real Estate",
    description:
      "Sign lease agreements, property documents, and closing paperwork remotely using SafeSign e-signature workflows",
  },
  {
    image: "/images/Union7.png",
    title: "Healthcare",
    description:
      "SafeSign enables secure digital signing of patient consent forms, agreements, and healthcare documentation",
  },
  {
    image: "/images/Union8.png",
    title: "Education",
    description:
      "Educational institutions use SafeSign to digitally sign enrollment forms, consent documents, and approvals",
  },
  {
    image: "/images/Union9.png",
    title: "Procurement",
    description:
      "Speed up vendor onboarding and contract approvals with SafeSign’s secure digital signature platform",
  },
  {
    image: "/images/Union10.png",
    title: "IT & Operations",
    description:
      "Authorize internal policies, access requests, and operational documents using SafeSign e-signatures",
  },
  {
    image: "/images/Union11.png",
    title: "Customer Support",
    description:
      "Finalize service agreements and customer documents faster with SafeSign’s online signing experience",
  },
  {
    image: "/images/Union12.png",
    title: "Startups",
    description:
      "Startups rely on SafeSign to sign founder agreements, investor documents, and employee contracts digitally",
  },
  {
    image: "/images/Union13.png",
    title: "Government",
    description:
      "SafeSign helps government bodies digitize approvals, citizen forms, and official documentation securely",
  },
  {
    image: "/images/Union14.png",
    title: "Freelancers & Agencies",
    description:
      "Send, sign, and manage client contracts and statements of work using SafeSign’s simple e-signature tools",
  }
];


  const scrollingUseCases = [...useCases, ...useCases];

  const compliance = [
    { name: "GDPR", icon: <Shield className="w-8 h-8" /> },
    { name: "AICPA SOC", icon: <Shield className="w-8 h-8" /> },
    { name: "eSIGN & UETA", icon: <Shield className="w-8 h-8" /> },
    { name: "eIDAS", icon: <Shield className="w-8 h-8" /> },
    { name: "HIPAA", icon: <Shield className="w-8 h-8" /> },
    { name: "21 CFR", icon: <Shield className="w-8 h-8" /> }
  ];


  const scrollRef = React.useRef(null);

  React.useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  const onWheel = (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  el.addEventListener("wheel", onWheel, { passive: false });
  return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="platform-overview">
      {/* Templates Section */}
      <section className="templates-section1">
        <div className="container">
          <h2 className="section-title1">
            Intelligent Agreement Templates & Automated Management
          </h2>
          <p className="section-subtitle">
            Standardize your workflows with AI-optimized agreement templates. Automate drafting, approvals, 
            and signatures while ensuring every document stays accurate, secure, and legally compliant.
          </p>

          <div className="templates-grid">
            {/* Left Side - Prepare/Upload Visualization */}
            <div className="templates-visual">
              <h3 className="visual-title">Prepare / Upload</h3>
              <div className="document-preview">
                <div className="doc-upload-box">
                  <Upload className="upload-icon" />
                  <p>Upload Document</p>
                </div>
                <div className="doc-thumbnails">
                  <div className="doc-thumb">
                    <div className="thumb-lines">
                      <div className="line"></div>
                      <div className="line"></div>
                      <div className="line"></div>
                    </div>
                  </div>
                  <div className="doc-thumb">
                    <div className="thumb-lines">
                      <div className="line"></div>
                      <div className="line"></div>
                      <div className="line"></div>
                    </div>
                  </div>
                  <div className="doc-thumb">
                    <div className="thumb-lines">
                      <div className="line"></div>
                      <div className="line"></div>
                      <div className="line"></div>
                    </div>
                  </div>
                </div>
                <div className="form-preview">
                  <div className="form-field"></div>
                  <div className="form-field"></div>
                  <div className="form-field short"></div>
                  <div className="form-label">Candidate Signature</div>
                  <div className="signature-line"></div>
                  <div className="form-label">Candidate Name</div>
                  <div className="signature-line"></div>
                  <div className="form-label">Date</div>
                  <div className="signature-line short"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Features List */}
            <div className="features-list">
              {features.map((feature, index) => (
                <div
  key={index}
  className="feature-card"
  // onClick={() => navigate(feature.path)}
  // style={{ cursor: "pointer" }}
>
  <div className="feature-icon">{feature.icon}</div>
  <div className="feature-content">
    <h4 className="feature-title">{feature.title}</h4>
    <p className="feature-description">{feature.description}</p>
  </div>
</div>

              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
  <div className="container1">
    <h2 className="section-title1">Where SafeSign Delivers the Most Impact</h2>

    <div className="use-cases-marquee">
      <div className="use-cases-track">
        {scrollingUseCases.map((useCase, index) => (
          <div key={index} className="use-case-card">
            <div className="use-case-image-wrapper">
              <img
                src={useCase.image}
                alt={useCase.title}
                className="use-case-image"
              />
            </div>
            <div className="use-case-content">
              <h3 className="use-case-title">{useCase.title}</h3>
              <p className="use-case-description">{useCase.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>


      {/* Compliance Section */}
      {/* <section className="compliance-section">
  <div className="compliance-container">
    <h2 className="compliance-title">
      Trusted and compliant<br/>for every business
    </h2>

    <div className="compliance-badges">
      <div className="badge">
        <img src="/images/gdpr.png" alt="GDPR"/>
        <span>GDPR</span>
      </div>

      <div className="badge">
        <img src="/images/aicpa.png" alt="AICPA SOC"/>
        <span>AICPA SOC</span>
      </div>

      <div className="badge">
        <img src="/images/esign.png" alt="ESIGN"/>
        <span>eSIGN & UETA</span>
      </div>

      <div className="badge">
        <img src="/images/eidas.png" alt="eIDAS"/>
        <span>eIDAS</span>
      </div>

      <div className="badge">
        <img src="/images/hipaa.png" alt="HIPAA"/>
        <span>HIPAA</span>
      </div>

      <div className="badge">
        <img src="/images/fda.png" alt="21 CFR"/>
        <span>21 CFR</span>
      </div>
    </div>
  </div>
</section>



<ValuesSection />

 */}

      <style>{`
        .platform-overview {
          width: 100%;
        }

        .container1 {
          
          margin: 0 auto;
        }

        /* Templates Section */
        .templates-section1 {
        max-width: 1000px;
          margin: 0 auto;
          
        }

        .section-title1 {
          font-size: 30px;
          font-weight: 700;
          text-align: center;
          color: #0f766e;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .section-subtitle {
          font-size: 18px;
          text-align: center;
          color: #6b7280;
          max-width: 900px;
          margin: 0 auto 60px;
          line-height: 1.6;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }

        /* Left Visual */
        .templates-visual {
          
          border-radius: 16px;
          padding: 40px;
        }

        .visual-title {
          font-size: 24px;
          font-weight: 600;
          color: #0f766e;
          text-align: center;
          margin-bottom: 30px;
        }

        .document-preview {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .doc-upload-box {
          border: 2px dashed #0f766e;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          background: white;
        }

        .upload-icon {
          width: 40px;
          height: 40px;
          color: #0f766e;
          margin: 0 auto 10px;
        }

        .doc-thumbnails {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .doc-thumb {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          aspect-ratio: 3/4;
        }

        .thumb-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: 100%;
        }

        .line {
          height: 3px;
          background: #d1d5db;
          border-radius: 2px;
        }

        .form-preview {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .form-field {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .form-field.short {
          width: 60%;
        }

        .form-label {
          font-size: 11px;
          color: #6b7280;
          margin-top: 15px;
          margin-bottom: 5px;
        }

        .signature-line {
          height: 2px;
          background: #93c5fd;
          margin-bottom: 8px;
        }

        .signature-line.short {
          width: 40%;
        }

        /* Right Features */
        .features-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #0f766e;
        }

        .feature-content {
          flex: 1;
        }

        .feature-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .feature-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        /* Use Cases Section */
        .use-cases-section {
          padding: 20px 0;
          background: white;
        }

        /* Horizontal smooth scroll */
.use-cases-scroll {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 20px;
  margin-top: 60px;
}

/* Hide scrollbar (Chrome, Edge, Safari) */
.use-cases-scroll::-webkit-scrollbar {
  height: 8px;
}

.use-cases-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.use-cases-scroll::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 10px;
}

/* Firefox */
.use-cases-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.2) transparent;
}

/* Card sizing for horizontal scroll */
.use-cases-scroll .use-case-card {
  min-width: 300px;
  max-width: 300px;
  flex-shrink: 0;
}


        .use-cases-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 60px;
        }

        .use-case-card {
          background: white;
          border-radius: 40px;
          overflow: hidden;
          

          transition: all 0.3s ease;
          
        }

        .use-case-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        /* Auto-scrolling Use Cases */
.use-cases-marquee {
  width: 100%;
  overflow: hidden;
  margin-top: 60px;
  position: relative;
}

.use-cases-track {
  display: flex;
  gap: 32px;
  width: max-content;
  animation: usecase-scroll 40s linear infinite;
}

/* Pause on hover (premium UX) */
.use-cases-marquee:hover .use-cases-track {
  animation-play-state: paused;
}

/* Card sizing */
.use-case-card {
  min-width: 320px;
  max-width: 320px;
  flex-shrink: 0;
  background: white;
  border-radius: 40px;
  overflow: hidden;
  
 
  transition: transform 0.3s ease;
}

.use-case-card:hover {
  transform: translateY(-8px);
}

/* Animation */
@keyframes usecase-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}


        .use-case-image-wrapper {
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .use-case-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .use-case-card:hover .use-case-image {
          transform: scale(1.05);
        }

        .use-case-content {
          padding: 24px;
          
        }

        .use-case-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
        }

        .use-case-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .use-case-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #0f766e;
          text-decoration: none;
          transition: gap 0.3s ease;
        }

        .use-case-link:hover {
          gap: 12px;
        }

        .link-arrow {
          width: 16px;
          height: 16px;
        }

        /* Compliance Section */
        .compliance-section {
  background: #0f766e; 
  padding: 50px 0;
}

.compliance-container {
  max-width: 1200px;
  margin: auto;
  display: flex;
  align-items: center;
  gap: 50px;
  justify-content: space-between;
}

.compliance-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
}

.compliance-badges {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
}

.badge {
  width: 95px;
  height: 95px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0,0,0,.15);
  transition: transform .25s ease;
}

.badge:hover {
  transform: translateY(-6px);
}

.badge img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.badge span {
  font-size: 11px;
  font-weight: 600;
  margin-top: 6px;
}

        /* Responsive */
        @media (max-width: 1024px) {
          .templates-grid {
            grid-template-columns: 1fr;
          }

          .use-cases-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .compliance-content {
            flex-direction: column;
            text-align: center;
          }

          .compliance-badges {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .section-title {
            font-size: 28px;
          }

          .section-subtitle {
            font-size: 16px;
          }

          .use-cases-grid {
            grid-template-columns: 1fr;
          }

          .compliance-badges {
            grid-template-columns: repeat(2, 1fr);
          }

          .templates-section,
          .use-cases-section {
            padding: 40px 0;
          }
        }
      `}</style>
    </div>
  );
}
