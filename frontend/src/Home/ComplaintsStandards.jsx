import React, { useState } from 'react';
import { 
  Shield, Scale, FileText, ChevronDown, 
  Mail, Phone, Clock, Users, Lock, Search,
  Eye, AlertCircle, CheckCircle, ExternalLink,
  Download, Printer, ShieldCheck, Award,
  Globe, Building, Target, BookOpen,
  MessageSquare, Headphones, Zap, TrendingUp,
  FileCheck, FileSearch, Calendar, Star,
  Users2, Building2, Flag, MailWarning
} from 'lucide-react';
import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";

const ComplaintsStandards = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState('January 15, 2025');

  const complianceStandards = [
    {
      region: 'European Union',
      standards: ['eIDAS Regulation', 'EU GDPR'],
      icon: <Globe size={20} />,
      color: '#4f46e5',
      status: 'Compliant'
    },
    {
      region: 'United Kingdom',
      standards: ['UK eIDAS', 'UK GDPR', 'DPA 2018'],
      icon: <Building size={20} />,
      color: '#0f766e',
      status: 'Compliant'
    },
    {
      region: 'United States',
      standards: ['ESIGN Act', 'UETA', 'SOC 2 Type II'],
      icon: <Flag size={20} />,
      color: '#3b82f6',
      status: 'Compliant'
    },
    {
      region: 'Global',
      standards: ['ISO 27001', 'ISO 27701', 'Cloud Security'],
      icon: <Globe size={20} />,
      color: '#8b5cf6',
      status: 'Certified'
    }
  ];

  const complaintTypes = [
    {
      type: 'Service Quality',
      icon: <Headphones size={20} />,
      color: '#0f766e',
      examples: ['Platform performance issues', 'Feature malfunctions', 'Service availability'],
      resolution: '24-48 hours'
    },
    {
      type: 'Data Privacy',
      icon: <ShieldCheck size={20} />,
      color: '#3b82f6',
      examples: ['Data access requests', 'Privacy concerns', 'Data deletion issues'],
      resolution: '7 business days'
    },
    {
      type: 'Billing Issues',
      icon: <FileText size={20} />,
      color: '#f59e0b',
      examples: ['Incorrect charges', 'Refund requests', 'Subscription problems'],
      resolution: '5 business days'
    },
    {
      type: 'Compliance Concerns',
      icon: <Scale size={20} />,
      color: '#10b981',
      examples: ['Regulatory compliance', 'Audit trail questions', 'Legal requirements'],
      resolution: '10 business days'
    },
    {
      type: 'Abuse Reports',
      icon: <AlertCircle size={20} />,
      color: '#ef4444',
      examples: ['Platform misuse', 'Security threats', 'Policy violations'],
      resolution: 'Immediate investigation'
    },
    {
      type: 'General Inquiries',
      icon: <MessageSquare size={20} />,
      color: '#8b5cf6',
      examples: ['Feature requests', 'Documentation questions', 'Integration support'],
      resolution: '2 business days'
    }
  ];

  const sections = [
    {
      id: 'introduction',
      title: 'Complaints & Standards Framework',
      content: `SafeSign maintains a comprehensive framework for handling complaints and ensuring compliance with global standards. This page outlines our commitment to quality, security, and customer satisfaction.`,
      subSections: [
        {
          title: 'Our Commitment',
          content: `We are dedicated to resolving issues promptly and maintaining the highest standards of security, privacy, and service quality.`
        },
        {
          title: 'Transparency',
          content: `We believe in transparent processes and clear communication throughout the complaint resolution journey.`
        }
      ],
      icon: <Target size={20} />
    },
    {
      id: 'complaints-process',
      title: 'Complaints Handling Process',
      content: `We follow a structured process to ensure all complaints are handled fairly, efficiently, and consistently.`,
      subSections: [
        {
          title: 'Step 1: Submission',
          content: `Complaints can be submitted via email, web form, or through your account dashboard. Please provide detailed information to help us investigate effectively.`
        },
        {
          title: 'Step 2: Acknowledgment',
          content: `We acknowledge all complaints within 24 business hours and provide a reference number for tracking.`
        },
        {
          title: 'Step 3: Investigation',
          content: `Our compliance team investigates the complaint, gathering relevant information and consulting with relevant departments.`
        },
        {
          title: 'Step 4: Resolution',
          content: `We propose a resolution based on our findings and work with you to implement an appropriate solution.`
        },
        {
          title: 'Step 5: Follow-up',
          content: `We follow up to ensure the resolution is satisfactory and document the outcome for continuous improvement.`
        }
      ],
      icon: <BookOpen size={20} />
    },
    {
      id: 'compliance-standards',
      title: 'Compliance Standards',
      content: `SafeSign adheres to internationally recognized standards and regulations to ensure secure, compliant electronic signature services.`,
      icon: <Award size={20} />
    },
    {
      id: 'escalation',
      title: 'Escalation Process',
      content: `If you are unsatisfied with our initial response, you may escalate your complaint through our formal escalation channels.`,
      subSections: [
        {
          title: 'Level 1: Team Lead',
          content: `Escalate to the team lead of the department handling your complaint for additional review.`
        },
        {
          title: 'Level 2: Compliance Officer',
          content: `For unresolved issues, escalate to our Data Protection Officer or Compliance Officer.`
        },
        {
          title: 'Level 3: Executive Review',
          content: `Final escalation to executive leadership for complex or high-impact complaints.`
        }
      ],
      icon: <TrendingUp size={20} />
    },
    {
      id: 'appeals',
      title: 'Appeals Process',
      content: `If you disagree with our resolution, you may appeal the decision through our formal appeals process.`,
      subSections: [
        {
          title: 'Appeal Submission',
          content: `Submit an appeal within 30 days of receiving our resolution, providing new evidence or information.`
        },
        {
          title: 'Independent Review',
          content: `Appeals are reviewed by an independent panel not involved in the initial investigation.`
        },
        {
          title: 'Final Decision',
          content: `The appeals panel makes a final decision within 15 business days, which is binding on both parties.`
        }
      ],
      icon: <Scale size={20} />
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="safe-policy-page">
      {/* Hero Section */}
      <section className="safe-policy-hero safe-hero-standards">
        <div className="safe-policy-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <ShieldCheck size={20} />
              <span>Quality & Compliance Framework</span>
            </div>
            <h1 className="safe-hero-title">Complaints & Standards</h1>
            <p className="safe-hero-subtitle">
              Our commitment to resolving issues effectively and maintaining the highest standards of security, privacy, and service excellence
            </p>
            
            <div className="safe-hero-meta">
              <div className="safe-meta-item">
                <Clock size={16} />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="safe-meta-item">
                <FileText size={16} />
                <span>Version: 3.0</span>
              </div>
              <div className="safe-meta-item">
                <CheckCircle size={16} />
                <span>ISO 27001 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="safe-compliance-standards">
        <div className="safe-policy-container">
          <div className="safe-section-header">
            <h2 className="safe-section-title">
              <Award size={24} />
              Global Compliance Standards
            </h2>
            <p className="safe-section-subtitle">
              SafeSign adheres to internationally recognized security and privacy standards
            </p>
          </div>

          <div className="safe-compliance-grid">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="safe-compliance-card">
                <div className="safe-compliance-header">
                  <div 
                    className="safe-compliance-icon"
                    style={{ backgroundColor: standard.color + '15', color: standard.color }}
                  >
                    {standard.icon}
                  </div>
                  <div className="safe-compliance-info">
                    <h3 className="safe-compliance-region">{standard.region}</h3>
                    <div className="safe-compliance-standards">
                      {standard.standards.map((std, i) => (
                        <span key={i} className="safe-standard-tag">{std}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="safe-compliance-status">
                  <CheckCircle size={14} />
                  <span>{standard.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complaint Types */}
      <section className="safe-complaint-types">
        <div className="safe-policy-container">
          <div className="safe-section-header">
            <h2 className="safe-section-title">
              <Headphones size={24} />
              Types of Complaints We Handle
            </h2>
            <p className="safe-section-subtitle">
              Our structured approach ensures all concerns are addressed appropriately
            </p>
          </div>

          <div className="safe-complaints-grid">
            {complaintTypes.map((type, index) => (
              <div key={index} className="safe-complaint-card">
                <div className="safe-complaint-header">
                  <div 
                    className="safe-complaint-icon"
                    style={{ backgroundColor: type.color + '15', color: type.color }}
                  >
                    {type.icon}
                  </div>
                  <h3 className="safe-complaint-title">{type.type}</h3>
                  <div className="safe-complaint-timeline">
                    <Clock size={12} />
                    <span>Resolution: {type.resolution}</span>
                  </div>
                </div>
                <div className="safe-complaint-body">
                  <h4>Common Examples:</h4>
                  <ul className="safe-complaint-examples">
                    {type.examples.map((example, i) => (
                      <li key={i} className="safe-complaint-example">
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Navigation */}
      <section className="safe-policy-navigation">
        <div className="safe-policy-container">
          <div className="safe-navigation-card">
            <div className="safe-search-section">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search complaints process..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
            </div>
            
            <div className="safe-quick-links">
              {sections.map(section => (
                <a 
                  key={section.id} 
                  href={`#${section.id}`} 
                  className="safe-quick-link"
                >
                  {section.icon}
                  <span>{section.title.split(' ')[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="safe-policy-main">
        <div className="safe-policy-container">
          <div className="safe-policy-content">
            {/* Policy Sections */}
            <div className="safe-sections-container">
              {sections.map((section, index) => (
                <div 
                  key={section.id} 
                  id={section.id}
                  className="safe-policy-section-card"
                >
                  <div className="safe-section-card-header">
                    <div className="safe-section-card-header-content">
                      <div className="safe-section-icon">
                        {section.icon}
                      </div>
                      <div>
                        <h2 className="safe-section-title">
                          {section.title}
                        </h2>
                        <div className="safe-section-badge">
                          <span className="safe-section-number">Section {index + 1}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="safe-expand-btn"
                      onClick={() => toggleSection(section.id)}
                    >
                      {expandedSections[section.id] ? 'Collapse' : 'Expand'}
                      <ChevronDown className={`safe-expand-arrow ${expandedSections[section.id] ? 'safe-arrow-expanded' : ''}`} />
                    </button>
                  </div>
                  
                  <div className={`safe-section-card-content ${expandedSections[section.id] ? 'safe-content-expanded' : ''}`}>
                    <div className="safe-section-card-body">
                      <p className="safe-section-intro">{section.content}</p>
                      
                      {section.subSections && section.subSections.length > 0 && (
                        <div className="safe-sub-sections-grid">
                          {section.subSections.map((subSection, subIndex) => (
                            <div key={subIndex} className="safe-sub-section-card">
                              <h3 className="safe-sub-section-title">{subSection.title}</h3>
                              <div className="safe-sub-section-content">
                                {subSection.content.split('\n').map((line, i) => (
                                  <p key={i} className="safe-sub-section-text">{line}</p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Complaint Card */}
            <div className="safe-submit-card">
              <div className="safe-submit-card-header">
                <MessageSquare size={24} />
                <h3>Submit a Complaint</h3>
              </div>
              <div className="safe-submit-card-content">
                <div className="safe-submit-methods">
                  <div className="safe-submit-method">
                    <Mail size={20} />
                    <div>
                      <div className="safe-submit-label">Email Complaint</div>
                      <div className="safe-submit-value">complaints@safesign.devopstrio.co.uk</div>
                    </div>
                  </div>
                  <div className="safe-submit-method">
                    <Headphones size={20} />
                    <div>
                      <div className="safe-submit-label">Phone Support</div>
                      <div className="safe-submit-value">+44 (0)20 1234 5678</div>
                    </div>
                  </div>
                  <div className="safe-submit-method">
                    <FileText size={20} />
                    <div>
                      <div className="safe-submit-label">Web Form</div>
                      <div className="safe-submit-value">safesign.devopstrio.co.uk/complaints</div>
                    </div>
                  </div>
                </div>
                
                <div className="safe-submit-guidance">
                  <h4>For Effective Resolution:</h4>
                  <div className="safe-guidance-points">
                    <div className="safe-guidance-point">
                      <CheckCircle size={16} />
                      <span>Include your account information</span>
                    </div>
                    <div className="safe-guidance-point">
                      <CheckCircle size={16} />
                      <span>Describe the issue in detail</span>
                    </div>
                    <div className="safe-guidance-point">
                      <CheckCircle size={16} />
                      <span>Attach supporting documents</span>
                    </div>
                    <div className="safe-guidance-point">
                      <CheckCircle size={16} />
                      <span>State your preferred resolution</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="safe-metrics-card">
              <div className="safe-metrics-header">
                <TrendingUp size={24} />
                <h3>Complaint Resolution Performance</h3>
              </div>
              <div className="safe-metrics-grid">
                <div className="safe-metric-item">
                  <div className="safe-metric-value">98%</div>
                  <div className="safe-metric-label">First Contact Resolution</div>
                </div>
                <div className="safe-metric-item">
                  <div className="safe-metric-value">24h</div>
                  <div className="safe-metric-label">Average Response Time</div>
                </div>
                <div className="safe-metric-item">
                  <div className="safe-metric-value">4.8/5</div>
                  <div className="safe-metric-label">Customer Satisfaction</div>
                </div>
                <div className="safe-metric-item">
                  <div className="safe-metric-value">99%</div>
                  <div className="safe-metric-label">Resolved Within SLA</div>
                </div>
              </div>
            </div>

            {/* Related Policies */}
            <div className="safe-related-policies-card">
              <div className="safe-related-policies-header">
                <h3>Related Policies & Resources</h3>
                <p>Complete compliance and quality framework</p>
              </div>
              
              <div className="safe-policies-grid">
                <a href="/privacy" className="safe-policy-card">
                  <div className="safe-policy-card-header">
                    <FileText size={24} />
                    <div>
                      <h4>Privacy Policy</h4>
                      <p>Updated: January 15, 2025</p>
                    </div>
                  </div>
                  <p className="safe-policy-card-description">
                    How we collect, use, and protect your personal information.
                  </p>
                  <div className="safe-policy-card-footer">
                    <ExternalLink size={16} />
                    <span>Read Policy</span>
                  </div>
                </a>
                
                <a href="/abuse" className="safe-policy-card">
                  <div className="safe-policy-card-header">
                    <FileText size={24} />
                    <div>
                      <h4>Abuse Policy</h4>
                      <p>Updated: January 15, 2025</p>
                    </div>
                  </div>
                  <p className="safe-policy-card-description">
                    Platform misuse prevention and enforcement framework.
                  </p>
                  <div className="safe-policy-card-footer">
                    <ExternalLink size={16} />
                    <span>Read Policy</span>
                  </div>
                </a>
                
                <a href="/terms" className="safe-policy-card">
                  <div className="safe-policy-card-header">
                    <FileText size={24} />
                    <div>
                      <h4>Terms of Service</h4>
                      <p>Updated: January 15, 2025</p>
                    </div>
                  </div>
                  <p className="safe-policy-card-description">
                    Complete terms governing use of SafeSign services.
                  </p>
                  <div className="safe-policy-card-footer">
                    <ExternalLink size={16} />
                    <span>Read Terms</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        /* Base Styles */
        .safe-policy-page {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .safe-policy-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section - Standards Theme */
        .safe-hero-standards {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
        }

        .safe-policy-hero {
          padding: 5rem 0 4rem;
          text-align: center;
          color: white;
        }

        .safe-hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .safe-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(8px);
        }

        .safe-hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0 0 1rem;
          line-height: 1.1;
        }

        .safe-hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 auto 2rem;
          max-width: 700px;
          line-height: 1.6;
        }

        .safe-hero-meta {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .safe-meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Compliance Standards */
        .safe-compliance-standards {
          padding: 4rem 0;
          background: #f8fafc;
        }

        .safe-section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .safe-section-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .safe-section-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto;
        }

        .safe-compliance-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-compliance-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-compliance-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s;
        }

        .safe-compliance-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
          border-color: #0f766e;
        }

        .safe-compliance-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .safe-compliance-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safe-compliance-info {
          flex: 1;
        }

        .safe-compliance-region {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-compliance-standards {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .safe-standard-tag {
          padding: 0.25rem 0.75rem;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 0.5rem;
        }

        .safe-compliance-status {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          background: #d1fae5;
          color: #059669;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 0.5rem;
          white-space: nowrap;
        }

        /* Complaint Types */
        .safe-complaint-types {
          padding: 4rem 0;
          background: white;
        }

        .safe-complaints-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .safe-complaints-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .safe-complaints-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-complaint-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .safe-complaint-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }

        .safe-complaint-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .safe-complaint-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .safe-complaint-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-complaint-timeline {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }

        .safe-complaint-body h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin: 0 0 1rem;
        }

        .safe-complaint-examples {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-complaint-example {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.5;
          padding-left: 1rem;
          position: relative;
        }

        .safe-complaint-example:before {
          content: '•';
          position: absolute;
          left: 0;
          color: #0f766e;
          font-weight: bold;
        }

        /* Navigation */
        .safe-policy-navigation {
          padding: 1.5rem 0;
          background: white;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .safe-navigation-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-search-section {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .safe-search-section svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        .safe-search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          font-size: 0.875rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          background: white;
          outline: none;
          transition: all 0.2s;
        }

        .safe-search-input:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .safe-quick-links {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .safe-quick-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: white;
          color: #475569;
          text-decoration: none;
          border-radius: 0.75rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .safe-quick-link:hover {
          border-color: #0f766e;
          color: #0f766e;
          background: rgba(13, 148, 136, 0.05);
        }

        /* Main Content */
        .safe-policy-main {
          padding: 3rem 0 5rem;
          background: #f8fafc;
        }

        /* Policy Sections */
        .safe-policy-section-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          margin-bottom: 1.5rem;
          overflow: hidden;
          transition: all 0.3s;
        }

        .safe-policy-section-card:hover {
          border-color: #0f766e;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        .safe-section-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
        }

        .safe-section-card-header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .safe-section-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(15, 118, 110, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f766e;
        }

        .safe-section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-section-badge {
          display: inline-flex;
        }

        .safe-section-number {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          background: #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
        }

        .safe-expand-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-expand-btn:hover {
          border-color: #0f766e;
          color: #0f766e;
          background: rgba(13, 148, 136, 0.05);
        }

        .safe-expand-arrow {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-arrow-expanded {
          transform: rotate(180deg);
        }

        .safe-section-card-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-content-expanded {
          max-height: 5000px;
        }

        .safe-section-card-body {
          padding: 2rem;
        }

        .safe-section-intro {
          font-size: 1rem;
          color: #475569;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        .safe-sub-sections-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-sub-sections-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-sub-section-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .safe-sub-section-card:hover {
          border-color: #0f766e;
          background: rgba(13, 148, 136, 0.02);
        }

        .safe-sub-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem;
        }

        .safe-sub-section-content {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.6;
        }

        .safe-sub-section-text {
          margin: 0 0 0.5rem;
        }

        .safe-sub-section-text:last-child {
          margin-bottom: 0;
        }

        /* Submit Card */
        .safe-submit-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2.5rem;
          margin: 3rem 0;
        }

        .safe-submit-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .safe-submit-card-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-submit-card-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }

        @media (max-width: 768px) {
          .safe-submit-card-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .safe-submit-methods {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .safe-submit-method {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .safe-submit-method:hover {
          border-color: #0f766e;
          background: rgba(13, 148, 136, 0.05);
        }

        .safe-submit-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .safe-submit-value {
          font-size: 0.875rem;
          color: #111827;
          font-weight: 600;
        }

        .safe-submit-guidance {
          background: #f0fdfa;
          border: 1px solid #a7f3d0;
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .safe-submit-guidance h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
        }

        .safe-guidance-points {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-guidance-point {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #475569;
        }

        .safe-guidance-point svg {
          color: #10b981;
        }

        /* Metrics Card */
        .safe-metrics-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 1.5rem;
          padding: 3rem;
          margin-bottom: 3rem;
          color: white;
        }

        .safe-metrics-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .safe-metrics-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .safe-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .safe-metrics-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-metric-item {
          text-align: center;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .safe-metric-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .safe-metric-label {
          font-size: 0.875rem;
          color: #cbd5e1;
        }

        /* Related Policies */
        .safe-related-policies-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2.5rem;
        }

        .safe-related-policies-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .safe-related-policies-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-related-policies-header p {
          font-size: 1rem;
          color: #64748b;
          margin: 0;
        }

        .safe-policies-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .safe-policies-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .safe-policies-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-policy-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s;
          display: block;
        }

        .safe-policy-card:hover {
          border-color: #0f766e;
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }

        .safe-policy-card-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .safe-policy-card-header svg {
          color: #0f766e;
          margin-top: 0.25rem;
        }

        .safe-policy-card-header h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-policy-card-header p {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .safe-policy-card-description {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        .safe-policy-card-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f766e;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .safe-policy-container {
            padding: 0 1rem;
          }
          
          .safe-hero-title {
            font-size: 2.5rem;
          }
          
          .safe-section-title {
            font-size: 1.75rem;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .safe-section-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .safe-expand-btn {
            align-self: flex-start;
          }
          
          .safe-submit-card,
          .safe-metrics-card,
          .safe-related-policies-card {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .safe-hero-title {
            font-size: 2rem;
          }
          
          .safe-hero-meta {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ComplaintsStandards;
