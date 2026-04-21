import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, FileText, ChevronDown, 
  Mail, Phone, Clock, Users, Lock, Search,
  Eye, AlertCircle, XCircle, CheckCircle,
  ExternalLink, Download, Printer, ShieldAlert,
  FileWarning, Ban, AlertOctagon, ShieldOff,
  UserX, FileX, FileSearch, MessageSquare,
  ShieldCheck, BookOpen, Scale, Flag
} from 'lucide-react';
import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";

const AbusePolicy = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState('January 15, 2025');

  const prohibitedActivities = [
    {
      category: 'Fraud & Misrepresentation',
      icon: <UserX size={20} />,
      color: '#dc2626',
      examples: [
        'Forging signatures or impersonating others',
        'Sending documents without proper authorization',
        'Misleading signers about document purpose',
        'False representation of identity or authority'
      ]
    },
    {
      category: 'Illegal Content & Activities',
      icon: <Ban size={20} />,
      color: '#ef4444',
      examples: [
        'Documents related to illegal activities',
        'Facilitating scams or financial crime',
        'Violating local, national, or international laws',
        'Money laundering or terrorist financing'
      ]
    },
    {
      category: 'Harassment & Abuse',
      icon: <AlertOctagon size={20} />,
      color: '#f97316',
      examples: [
        'Sending threatening or harassing documents',
        'Intimidating or coercing signers',
        'Bullying or discriminatory content',
        'Invasion of privacy'
      ]
    },
    {
      category: 'Platform Misuse',
      icon: <ShieldOff size={20} />,
      color: '#8b5cf6',
      examples: [
        'Bypassing security or authentication',
        'Uploading malware or malicious code',
        'Excessive automated requests',
        'Reverse engineering or tampering'
      ]
    },
    {
      category: 'Intellectual Property Violations',
      icon: <FileX size={20} />,
      color: '#3b82f6',
      examples: [
        'Uploading unauthorized copyrighted material',
        'Infringing trademarks or patents',
        'Misappropriation of trade secrets',
        'Unauthorized distribution of proprietary content'
      ]
    }
  ];

  const sections = [
    {
      id: 'introduction',
      title: 'Policy Overview',
      content: `This Abuse Policy defines prohibited activities and our enforcement framework for maintaining a secure, lawful, and trustworthy electronic signature platform. All users must comply with this policy in addition to our Terms of Service.`,
      subSections: [
        {
          title: 'Purpose & Scope',
          content: `SafeSign is committed to providing a secure environment for electronic document signing. This policy ensures our platform is not used for illegal, harmful, or abusive purposes while protecting legitimate users.`
        },
        {
          title: 'Zero Tolerance',
          content: `We maintain a zero-tolerance policy for abuse. Violations may result in immediate account suspension, content removal, and legal reporting.`
        }
      ],
      icon: <BookOpen size={20} />
    },
    {
      id: 'prohibited-activities',
      title: 'Prohibited Activities',
      content: `The following activities are strictly prohibited on the SafeSign platform. This list is not exhaustive and may be updated as new threats emerge.`,
      icon: <Ban size={20} />
    },
    {
      id: 'reporting',
      title: 'Reporting Abuse',
      content: `We rely on our community to help identify and report abusive behavior. All reports are taken seriously and investigated promptly.`,
      subSections: [
        {
          title: 'How to Report',
          content: `Report abuse by emailing abuse@safesign.devopstrio.co.uk with detailed information including document IDs, timestamps, and supporting evidence.`
        },
        {
          title: 'Required Information',
          content: `- Description of the violation
- Relevant document or transaction details
- Screenshots or other evidence
- Your contact information (kept confidential)`
        },
        {
          title: 'Response Time',
          content: `We aim to acknowledge reports within 24 hours and complete investigations within 7 business days for standard cases.`
        }
      ],
      icon: <Flag size={20} />
    },
    {
      id: 'enforcement',
      title: 'Enforcement & Consequences',
      content: `SafeSign employs a graduated enforcement framework based on violation severity and user history.`,
      subSections: [
        {
          title: 'Enforcement Actions',
          content: `- Warning and education for minor first-time violations
- Temporary suspension for repeated violations
- Permanent account termination for serious abuse
- Content removal and data preservation for investigation
- Legal reporting to authorities`
        },
        {
          title: 'Appeal Process',
          content: `Users may appeal enforcement decisions by contacting compliance@safesign.devopstrio.co.uk within 30 days. Appeals require evidence supporting your case.`
        }
      ],
      icon: <Scale size={20} />
    },
    {
      id: 'legal',
      title: 'Legal Compliance',
      content: `We cooperate with law enforcement and regulatory authorities in accordance with applicable laws and our legal obligations.`,
      subSections: [
        {
          title: 'Law Enforcement Requests',
          content: `Valid legal requests should be submitted through proper channels. We verify all requests for authenticity and compliance with applicable laws.`
        },
        {
          title: 'Data Preservation',
          content: `We preserve relevant data for investigation purposes and may retain information as required by law or necessary for platform security.`
        }
      ],
      icon: <ShieldCheck size={20} />
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
      <section className="safe-policy-hero safe-hero-abuse">
        <div className="safe-policy-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <ShieldAlert size={20} />
              <span>Abuse Prevention & Enforcement</span>
            </div>
            <h1 className="safe-hero-title">Abuse Policy</h1>
            <p className="safe-hero-subtitle">
              Protecting our platform from misuse while ensuring a safe, compliant environment for legitimate electronic signature workflows
            </p>
            
            <div className="safe-hero-meta">
              <div className="safe-meta-item">
                <Clock size={16} />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="safe-meta-item">
                <FileText size={16} />
                <span>Version: 2.1</span>
              </div>
              <div className="safe-meta-item">
                <AlertCircle size={16} />
                <span>Zero Tolerance Policy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prohibited Activities Grid */}
      <section className="safe-prohibited-activities">
        <div className="safe-policy-container">
          <div className="safe-section-header">
            <h2 className="safe-section-title">
              <Ban size={24} />
              Strictly Prohibited Activities
            </h2>
            <p className="safe-section-subtitle">
              These activities violate our terms and may result in immediate account termination
            </p>
          </div>

          <div className="safe-prohibited-grid">
            {prohibitedActivities.map((activity, index) => (
              <div key={index} className="safe-prohibited-card">
                <div className="safe-prohibited-header">
                  <div 
                    className="safe-prohibited-icon"
                    style={{ backgroundColor: activity.color + '15', color: activity.color }}
                  >
                    {activity.icon}
                  </div>
                  <h3 className="safe-prohibited-title">{activity.category}</h3>
                </div>
                <ul className="safe-prohibited-list">
                  {activity.examples.map((example, i) => (
                    <li key={i} className="safe-prohibited-item">
                      <XCircle size={14} className="safe-prohibited-icon-item" style={{ color: activity.color }} />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
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
                placeholder="Search abuse policy..."
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

            {/* Report Abuse Card */}
            <div className="safe-report-card">
              <div className="safe-report-card-header">
                <AlertTriangle size={24} />
                <h3>Report Suspected Abuse</h3>
              </div>
              <div className="safe-report-card-content">
                <div className="safe-report-info">
                  <div className="safe-report-method">
                    <Mail size={20} />
                    <div>
                      <div className="safe-report-label">Email Report</div>
                      <div className="safe-report-value">abuse@safesign.devopstrio.co.uk</div>
                    </div>
                  </div>
                  <div className="safe-report-method">
                    <MessageSquare size={20} />
                    <div>
                      <div className="safe-report-label">Emergency Contact</div>
                      <div className="safe-report-value">emergency@safesign.devopstrio.co.uk</div>
                    </div>
                  </div>
                  <div className="safe-report-note">
                    <Eye size={16} />
                    <span>Reports are confidential and investigated promptly</span>
                  </div>
                </div>
                <div className="safe-report-requirements">
                  <h4>Include in Your Report:</h4>
                  <ul>
                    <li>Document ID or transaction reference</li>
                    <li>Detailed description of the violation</li>
                    <li>Screenshots or supporting evidence</li>
                    <li>Your contact information (confidential)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Related Policies */}
            <div className="safe-related-policies-card">
              <div className="safe-related-policies-header">
                <h3>Related Policies & Resources</h3>
                <p>Complete legal and compliance framework</p>
              </div>
              
              <div className="safe-policies-grid">
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
                
                <a href="/compliance" className="safe-policy-card">
                  <div className="safe-policy-card-header">
                    <FileText size={24} />
                    <div>
                      <h4>Compliance Standards</h4>
                      <p>Updated: January 15, 2025</p>
                    </div>
                  </div>
                  <p className="safe-policy-card-description">
                    Legal and regulatory compliance framework.
                  </p>
                  <div className="safe-policy-card-footer">
                    <ExternalLink size={16} />
                    <span>View Standards</span>
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

        /* Hero Section - Abuse Theme */
        .safe-hero-abuse {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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

        /* Prohibited Activities */
        .safe-prohibited-activities {
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

        .safe-prohibited-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-prohibited-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-prohibited-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .safe-prohibited-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }

        .safe-prohibited-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .safe-prohibited-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safe-prohibited-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-prohibited-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-prohibited-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.5;
        }

        .safe-prohibited-icon-item {
          flex-shrink: 0;
          margin-top: 0.125rem;
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
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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
          border-color: #dc2626;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.05);
        }

        /* Main Content */
        .safe-policy-main {
          padding: 3rem 0 5rem;
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
          border-color: #dc2626;
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
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
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
          border-color: #dc2626;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.05);
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
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.02);
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

        /* Report Card */
        .safe-report-card {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border-radius: 1.5rem;
          padding: 2.5rem;
          margin: 3rem 0;
          color: white;
        }

        .safe-report-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .safe-report-card-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        .safe-report-card-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }

        @media (max-width: 768px) {
          .safe-report-card-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .safe-report-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .safe-report-method {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .safe-report-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.25rem;
        }

        .safe-report-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
        }

        .safe-report-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .safe-report-requirements {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
        }

        .safe-report-requirements h4 {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: white;
        }

        .safe-report-requirements ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-report-requirements li {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          padding-left: 1.5rem;
          position: relative;
        }

        .safe-report-requirements li:before {
          content: '•';
          position: absolute;
          left: 0;
          color: white;
          font-weight: bold;
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
          border-color: #dc2626;
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
          color: #dc2626;
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
          color: #dc2626;
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
          
          .safe-report-card {
            padding: 1.5rem;
          }
          
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

export default AbusePolicy;
