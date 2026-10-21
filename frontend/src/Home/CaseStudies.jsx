import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { setPageTitle } from "../utils/pageTitle";
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Search,
  Filter,
  Building,
  Heart,
  Shield,
  FileText,
  Zap,
  Target,
  Award,
  BarChart,
  ExternalLink,
  Calendar,
  ChevronDown,
  Star,
  Download,
  Share2,
  BookOpen,
  Globe,
  Briefcase,
  UserCheck
} from 'lucide-react';

const CaseStudies = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);

  useEffect(() => {
    setPageTitle(
      "Customer Case Studies & Enterprise Stories",
      "Explore how enterprise organizations accelerate document execution, save hours, and reduce costs with Esigniva."
    );
  }, []);

  const getIndustrySlug = (industry) => {
    const map = {
      'Legal Services': 'legal',
      'Real Estate': 'real-estate',
      'Healthcare': 'healthcare',
      'Financial Services': 'finance',
      'Technology': 'technology',
      'Insurance': 'insurance'
    };
    return map[industry] || industry.toLowerCase().replace(/\s+/g, '-');
  };

  const metrics = [
    { icon: <Clock size={20} />, label: 'Avg. Signing Time', value: '98% faster' },
    { icon: <DollarSign size={20} />, label: 'Cost Savings', value: '$1.2M saved' },
    { icon: <Users size={20} />, label: 'Active Users', value: '50,000+' },
    { icon: <CheckCircle size={20} />, label: 'Customer Satisfaction', value: '99%' }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'COO, LegalTech Solutions',
      quote: 'Esigniva reduced our contract turnaround from 5 days to 15 minutes. The ROI was immediate and substantial.',
      company: 'LegalTech Solutions',
      industry: 'Legal Services'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Director of Operations, HealthFirst',
      quote: 'Implementing Esigniva saved us over $400K annually in paper, printing, and courier costs alone.',
      company: 'HealthFirst',
      industry: 'Healthcare'
    },
    {
      name: 'David Wilson',
      role: 'VP of Compliance, SecureBank',
      quote: 'The audit trail features gave our compliance team complete confidence. Esigniva is now our standard.',
      company: 'SecureBank',
      industry: 'Financial Services'
    }
  ];

  const caseStudies = [
    {
      id: 1,
      title: 'Global Law Firm Transforms Contract Management',
      company: 'Prestige Legal Partners',
      industry: 'Legal Services',
      logo: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
      challenge: 'Manual contract signing processes causing delays and compliance risks across 15 international offices.',
      solution: 'Implemented Esigniva with custom workflows, cryptographic seals, and enterprise security features.',
      results: [
        { metric: 'Signing Time Reduced', value: 'From 7 days to 15 minutes', icon: <Clock size={16} /> },
        { metric: 'Cost Savings', value: '$850K annually', icon: <DollarSign size={16} /> },
        { metric: 'Compliance Rate', value: '100% audit trail compliance', icon: <CheckCircle size={16} /> }
      ],
      featured: true,
      readTime: '8 min read',
      published: '2025-01-15',
      tags: ['Legal', 'Enterprise', 'Compliance']
    },
    {
      id: 2,
      title: 'Real Estate Agency Accelerates Property Transactions',
      company: 'Metro Properties Group',
      industry: 'Real Estate',
      logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
      challenge: 'Paper-based signing process delaying property closings and frustrating clients.',
      solution: 'Deployed Esigniva with mobile-first signing capabilities and template library.',
      results: [
        { metric: 'Transaction Speed', value: '2x faster closings', icon: <Zap size={16} /> },
        { metric: 'Client Satisfaction', value: '95% positive feedback', icon: <Heart size={16} /> },
        { metric: 'Paper Reduction', value: '15K+ pages saved monthly', icon: <FileText size={16} /> }
      ],
      featured: false,
      readTime: '6 min read',
      published: '2025-01-10',
      tags: ['Real Estate', 'Mobile', 'Efficiency']
    },
    {
      id: 3,
      title: 'Healthcare Provider Secures Patient Documentation',
      company: 'MediCare Solutions',
      industry: 'Healthcare',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop',
      challenge: 'HIPAA compliance requirements for patient consent forms and medical records.',
      solution: 'Esigniva with enhanced security features, encrypted storage, and HIPAA-compliant workflows.',
      results: [
        { metric: 'Compliance Rate', value: '100% HIPAA compliant', icon: <Shield size={16} /> },
        { metric: 'Processing Time', value: '85% reduction', icon: <Clock size={16} /> },
        { metric: 'Error Rate', value: 'Near-zero errors', icon: <CheckCircle size={16} /> }
      ],
      featured: false,
      readTime: '7 min read',
      published: '2025-01-05',
      tags: ['Healthcare', 'Security', 'Compliance']
    },
    {
      id: 4,
      title: 'Financial Institution Modernizes Client Onboarding',
      company: 'GlobalTrust Bank',
      industry: 'Financial Services',
      logo: 'https://images.unsplash.com/photo-1551836026-d5c2c5af78e4?w=600&h=400&fit=crop',
      challenge: 'Lengthy client onboarding process causing customer drop-off.',
      solution: 'Integrated Esigniva with existing CRM systems for seamless onboarding and KYC verification.',
      results: [
        { metric: 'Onboarding Time', value: 'From 2 weeks to 2 days', icon: <Clock size={16} /> },
        { metric: 'Client Acquisition', value: '40% increase', icon: <Users size={16} /> },
        { metric: 'Operational Costs', value: '65% reduction', icon: <DollarSign size={16} /> }
      ],
      featured: false,
      readTime: '9 min read',
      published: '2024-12-20',
      tags: ['Finance', 'Onboarding', 'Integration']
    },
    {
      id: 5,
      title: 'Tech Startup Scales Document Operations',
      company: 'InnovateAI',
      industry: 'Technology',
      logo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
      challenge: 'Rapid growth overwhelming manual document and NDA processes.',
      solution: 'Esigniva with developer API integration, webhooks, and automated signing workflows.',
      results: [
        { metric: 'Document Volume', value: '10x increase handled', icon: <FileText size={16} /> },
        { metric: 'Team Efficiency', value: '300 hours saved monthly', icon: <Users size={16} /> },
        { metric: 'Scalability', value: 'Seamless growth to 200+ employees', icon: <TrendingUp size={16} /> }
      ],
      featured: false,
      readTime: '5 min read',
      published: '2024-12-15',
      tags: ['Technology', 'Scale', 'Automation']
    },
    {
      id: 6,
      title: 'Insurance Company Streamlines Claims Processing',
      company: 'SecureGuard Insurance',
      industry: 'Insurance',
      logo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
      challenge: 'Paper-based claims creating bottlenecks, slow turnaround, and customer complaints.',
      solution: 'Esigniva implementation with custom claims processing workflows and immediate audit trails.',
      results: [
        { metric: 'Processing Speed', value: '75% faster claims', icon: <Zap size={16} /> },
        { metric: 'Customer Satisfaction', value: '4.8/5 rating', icon: <Star size={16} /> },
        { metric: 'Cost Per Claim', value: '60% reduction', icon: <DollarSign size={16} /> }
      ],
      featured: false,
      readTime: '8 min read',
      published: '2024-12-10',
      tags: ['Insurance', 'Claims', 'Customer Experience']
    },
    {
      id: 7,
      title: 'Apex Litigation Associates Digitizes Cross-Border Filings',
      company: 'Apex Litigation Associates',
      industry: 'Legal Services',
      logo: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&h=400&fit=crop',
      challenge: 'Multi-jurisdictional evidentiary documents required tamper-evident timestamps and verified witness sign-offs.',
      solution: 'Adopted Esigniva Qualified Electronic Signature (QES) workflows with cryptographic certificates.',
      results: [
        { metric: 'Filing Turnaround', value: 'Under 1 hour across 6 nations', icon: <Clock size={16} /> },
        { metric: 'Judicial Acceptance', value: '100% admissible in court', icon: <Shield size={16} /> },
        { metric: 'Courier Costs Saved', value: '$320K saved in Year 1', icon: <DollarSign size={16} /> }
      ],
      featured: false,
      readTime: '6 min read',
      published: '2024-11-28',
      tags: ['Legal', 'Court Admissible', 'Litigation']
    },
    {
      id: 8,
      title: 'Skyline Urban Realty Streamlines High-Rise Lease Agreements',
      company: 'Skyline Urban Realty',
      industry: 'Real Estate',
      logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
      challenge: 'Commercial tenant lease agreements experienced 12-day turnaround lags, leading to lost deposits.',
      solution: 'Deployed Esigniva In-Person and Mobile SMS Signing links with automated reminder schedules.',
      results: [
        { metric: 'Lease Closing Rate', value: '94% completed in 24 hours', icon: <Zap size={16} /> },
        { metric: 'Tenant Retention', value: '35% higher re-signing rate', icon: <Heart size={16} /> },
        { metric: 'Administrative Hours', value: '45 hours saved per agent/month', icon: <Clock size={16} /> }
      ],
      featured: false,
      readTime: '5 min read',
      published: '2024-11-14',
      tags: ['Real Estate', 'Commercial Leases', 'Mobile SMS']
    },
    {
      id: 9,
      title: 'BioHealth Diagnostics Accelerates Clinical Trial Consent',
      company: 'BioHealth Diagnostics',
      industry: 'Healthcare',
      logo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&h=400&fit=crop',
      challenge: 'Patient consent collection in multinational clinical studies was hampered by paper tracking errors.',
      solution: 'Implemented 21 CFR Part 11 compliant digital consent workflows with signer identity verification.',
      results: [
        { metric: 'Consent Compliance', value: 'Zero audit discrepancies', icon: <CheckCircle size={16} /> },
        { metric: 'Study Launch Speed', value: '3 weeks faster clinical trial enrollment', icon: <TrendingUp size={16} /> },
        { metric: 'Patient Dropout', value: 'Reduced by 60%', icon: <Users size={16} /> }
      ],
      featured: false,
      readTime: '7 min read',
      published: '2024-10-30',
      tags: ['Healthcare', 'Clinical Trials', 'FDA Compliance']
    },
    {
      id: 10,
      title: 'Vanguard Wealth Management Automates Portfolio Authorizations',
      company: 'Vanguard Wealth Management',
      industry: 'Financial Services',
      logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      challenge: 'High-net-worth investors required instant, multi-party authorization for high-volume transactions.',
      solution: 'Configured Esigniva Sequential Envelopes with real-time biometric signatures and audit logs.',
      results: [
        { metric: 'Execution Velocity', value: 'Instant execution upon signature', icon: <Zap size={16} /> },
        { metric: 'Client Security', value: 'Bank-grade 256-bit AES encryption', icon: <Shield size={16} /> },
        { metric: 'Assets Protected', value: '$4.2B authorized safely', icon: <DollarSign size={16} /> }
      ],
      featured: false,
      readTime: '8 min read',
      published: '2024-10-18',
      tags: ['Finance', 'Wealth Management', 'Security']
    },
    {
      id: 11,
      title: 'CloudScale Systems Embeds E-Signatures in SaaS Platform',
      company: 'CloudScale Systems',
      industry: 'Technology',
      logo: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
      challenge: 'Needed white-labeled e-signatures inside their enterprise SaaS application via API.',
      solution: 'Integrated the Esigniva REST API and webhooks in 3 days using the official JavaScript SDK.',
      results: [
        { metric: 'Time to Market', value: 'Live in production in 72 hours', icon: <Clock size={16} /> },
        { metric: 'API Reliability', value: '99.99% uptime with 0 dropouts', icon: <CheckCircle size={16} /> },
        { metric: 'Volume Handled', value: '500,000+ contracts signed annually', icon: <FileText size={16} /> }
      ],
      featured: false,
      readTime: '6 min read',
      published: '2024-09-25',
      tags: ['Technology', 'API', 'Developer SDK']
    },
    {
      id: 12,
      title: 'Zenith Risk & Assurance Automates Policy Renewals',
      company: 'Zenith Risk & Assurance',
      industry: 'Insurance',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
      challenge: 'Annual commercial policy renewals required multiple broker endorsements and manual follow-ups.',
      solution: 'Automated renewal batch packets with dynamic merge fields and auto-reminders via Esigniva.',
      results: [
        { metric: 'Renewal Speed', value: '14 days reduced to 48 hours', icon: <Zap size={16} /> },
        { metric: 'Policyholder Retention', value: '92% renewal completion', icon: <Users size={16} /> },
        { metric: 'Operational Overhead', value: 'Saved $540K in manual processing', icon: <DollarSign size={16} /> }
      ],
      featured: false,
      readTime: '7 min read',
      published: '2024-09-12',
      tags: ['Insurance', 'Renewals', 'Batch Processing']
    }
  ];

  const filters = [
    { id: 'all', label: 'All Industries', count: caseStudies.length },
    { id: 'legal', label: 'Legal Services', count: caseStudies.filter(s => getIndustrySlug(s.industry) === 'legal').length },
    { id: 'real-estate', label: 'Real Estate', count: caseStudies.filter(s => getIndustrySlug(s.industry) === 'real-estate').length },
    { id: 'healthcare', label: 'Healthcare', count: caseStudies.filter(s => getIndustrySlug(s.industry) === 'healthcare').length },
    { id: 'finance', label: 'Financial Services', count: caseStudies.filter(s => getIndustrySlug(s.industry) === 'finance').length },
    { id: 'technology', label: 'Technology', count: caseStudies.filter(s => getIndustrySlug(s.industry) === 'technology').length },
    { id: 'insurance', label: 'Insurance', count: caseStudies.filter(s => getIndustrySlug(s.industry) === 'insurance').length }
  ];

  const filteredCaseStudies = caseStudies.filter(study => {
    const matchesFilter = activeFilter === 'all' || getIndustrySlug(study.industry) === activeFilter;
    const matchesSearch = searchQuery === '' || 
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const featuredStudy = caseStudies.find(study => study.featured) || caseStudies[0];

  const handleViewStudy = (study) => {
    setSelectedCaseStudy(study);
  };

  const closeModal = () => {
    setSelectedCaseStudy(null);
  };

  const handleShare = async (study) => {
    const targetStudy = study || featuredStudy;
    const url = window.location.origin + '/case-studies?study=' + (targetStudy ? targetStudy.id : '');
    const title = targetStudy ? `${targetStudy.title} | Esigniva Success Story` : 'Esigniva Case Studies';
    const text = targetStudy ? `Read how ${targetStudy.company} achieved ${targetStudy.results[0]?.value} with Esigniva.` : 'Check out customer success stories on Esigniva.';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled or clipboard fallback
      }
    }
    await navigator.clipboard.writeText(url);
    Swal.fire({
      icon: 'success',
      title: 'Link Copied!',
      text: `Case study link for ${targetStudy.company} has been copied to your clipboard.`,
      timer: 1800,
      showConfirmButton: false
    });
  };

  const handleDownloadPDF = (study) => {
    const targetStudy = study || featuredStudy;
    if (!targetStudy) return;

    const reportContent = `============================================================
ESIGNIVA ENTERPRISE SUCCESS STORY
============================================================

Title: ${targetStudy.title}
Company: ${targetStudy.company}
Industry: ${targetStudy.industry}
Published: ${targetStudy.published}
Read Time: ${targetStudy.readTime}

------------------------------------------------------------
THE CHALLENGE
------------------------------------------------------------
${targetStudy.challenge}

------------------------------------------------------------
THE SOLUTION
------------------------------------------------------------
${targetStudy.solution}

------------------------------------------------------------
KEY RESULTS & ACHIEVEMENTS
------------------------------------------------------------
${targetStudy.results.map(r => `• ${r.metric}: ${r.value}`).join('\n')}

------------------------------------------------------------
TAGS & COMPLIANCE
------------------------------------------------------------
${targetStudy.tags.join(', ')}

============================================================
Downloaded from Esigniva: https://esigniva.devopstrio.co.uk
Verified Legally Binding E-Signature Platform
============================================================
`;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Esigniva_CaseStudy_${targetStudy.company.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Report Downloaded!',
      text: `Case study report for ${targetStudy.company} has been downloaded successfully.`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleViewSimilarCases = (study) => {
    const slug = getIndustrySlug(study.industry);
    setActiveFilter(slug);
    setSelectedCaseStudy(null);
    setTimeout(() => {
      const grid = document.getElementById('case-studies-grid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="safe-case-studies">
      {/* Hero Section */}
      <section className="safe-cs-hero">
        <div className="safe-cs-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <Award size={20} />
              <span>Success Stories</span>
            </div>
            <h1 className="safe-hero-title">Real Results with Esigniva</h1>
            <p className="safe-hero-subtitle">
              Discover how leading companies transformed their document workflows and achieved remarkable results with Esigniva
            </p>
            
            {/* Metrics */}
            <div className="safe-hero-metrics">
              {metrics.map((metric, index) => (
                <div key={index} className="safe-metric-card">
                  <div className="safe-metric-icon">
                    {metric.icon}
                  </div>
                  <div className="safe-metric-content">
                    <div className="safe-metric-value">{metric.value}</div>
                    <div className="safe-metric-label">{metric.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      {featuredStudy && (
        <section className="safe-featured-study">
          <div className="safe-cs-container">
            <div className="safe-featured-content">
              <div className="safe-featured-text">
                <div className="safe-featured-badge">
                  <Star size={16} />
                  <span>Featured Case Study</span>
                </div>
                <h2 className="safe-featured-title">{featuredStudy.title}</h2>
                <div className="safe-featured-company">
                  <Building size={18} />
                  <span>{featuredStudy.company}</span>
                  <span className="safe-company-industry">• {featuredStudy.industry}</span>
                </div>
                <p className="safe-featured-challenge">{featuredStudy.challenge}</p>
                
                <div className="safe-featured-results">
                  {featuredStudy.results.map((result, index) => (
                    <div key={index} className="safe-result-item">
                      {result.icon}
                      <div className="safe-result-content">
                        <div className="safe-result-metric">{result.metric}</div>
                        <div className="safe-result-value">{result.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="safe-featured-actions">
                  <button 
                    className="safe-btn-primary"
                    onClick={() => handleViewStudy(featuredStudy)}
                  >
                    Read Full Case Study
                    <ArrowRight size={18} />
                  </button>
                  <button 
                    className="safe-btn-secondary"
                    onClick={() => handleDownloadPDF(featuredStudy)}
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <button 
                    className="safe-btn-secondary"
                    onClick={() => handleShare(featuredStudy)}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>
              
              <div className="safe-featured-image">
                <img 
                  src={featuredStudy.logo} 
                  alt={featuredStudy.company} 
                  onError={(e) => { 
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'; 
                  }} 
                />
                <div className="safe-image-overlay">
                  <div className="safe-overlay-content">
                    <h3>Key Achievement</h3>
                    <p>{featuredStudy.results[0].value} {featuredStudy.results[0].metric}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="safe-cs-testimonials">
        <div className="safe-cs-container">
          <div className="safe-testimonials-header">
            <UserCheck size={28} />
            <h2 className="safe-section-title">Trusted by Industry Leaders</h2>
          </div>
          
          <div className="safe-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="safe-testimonial-card">
                <div className="safe-testimonial-quote">"</div>
                <p className="safe-testimonial-text">{testimonial.quote}</p>
                <div className="safe-testimonial-author">
                  <div className="safe-author-info">
                    <div className="safe-author-name">{testimonial.name}</div>
                    <div className="safe-author-role">{testimonial.role}</div>
                  </div>
                  <div className="safe-author-company">
                    <span className="safe-company-name">{testimonial.company}</span>
                    <span className="safe-company-industry">{testimonial.industry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="safe-cs-filters">
        <div className="safe-cs-container">
          <div className="safe-filters-content">
            <div className="safe-search-section">
              <Search className="safe-search-icon" />
              <input
                type="text"
                placeholder="Search case studies by company, industry, or results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
            </div>
            
            <div className="safe-filters-section">
              <button 
                className="safe-filters-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
                Filter by Industry
                <ChevronDown className={`safe-filter-arrow ${showFilters ? 'safe-arrow-open' : ''}`} />
              </button>
              
              {showFilters && (
                <div className="safe-filters-dropdown">
                  <div className="safe-filters-grid">
                    {filters.map(filter => (
                      <button
                        key={filter.id}
                        className={`safe-filter-btn ${activeFilter === filter.id ? 'safe-filter-active' : ''}`}
                        onClick={() => {
                          setActiveFilter(filter.id);
                          setShowFilters(false);
                        }}
                      >
                        <span className="safe-filter-label">{filter.label}</span>
                        <span className="safe-filter-count">{filter.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="safe-active-filters">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    className={`safe-filter-chip ${activeFilter === filter.id ? 'safe-chip-active' : ''}`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.label}
                    <span className="safe-chip-count">{filter.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="safe-cs-grid-section" id="case-studies-grid">
        <div className="safe-cs-container">
          <div className="safe-grid-header">
            <h2 className="safe-section-title">Browse Case Studies</h2>
            <div className="safe-results-count">
              {filteredCaseStudies.length} case studies found
            </div>
          </div>
          
          {filteredCaseStudies.length > 0 ? (
            <div className="safe-case-studies-grid">
              {filteredCaseStudies.map(study => (
                <div key={study.id} className="safe-case-study-card">
                  {study.featured && (
                    <div className="safe-featured-tag">
                      <Star size={14} />
                      Featured
                    </div>
                  )}
                  
                  <div className="safe-study-image">
                    <img 
                      src={study.logo} 
                      alt={study.company}
                      onError={(e) => { 
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'; 
                      }}
                    />
                    <div className="safe-study-industry">
                      <Building size={14} />
                      {study.industry}
                    </div>
                  </div>
                  
                  <div className="safe-study-content">
                    <h3 className="safe-study-title">{study.title}</h3>
                    <div className="safe-study-meta">
                      <div className="safe-study-company">
                        <span className="safe-company-name">{study.company}</span>
                        <span className="safe-study-date">
                          <Calendar size={14} />
                          {study.published}
                        </span>
                      </div>
                    </div>
                    
                    <p className="safe-study-challenge">{study.challenge}</p>
                    
                    <div className="safe-study-results">
                      <div className="safe-results-header">
                        <TrendingUp size={16} />
                        <span>Key Results</span>
                      </div>
                      <div className="safe-results-list">
                        {study.results.slice(0, 2).map((result, index) => (
                          <div key={index} className="safe-study-result">
                            {result.icon}
                            <span>{result.metric}: <strong>{result.value}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="safe-study-tags">
                      {study.tags.map((tag, index) => (
                        <span key={index} className="safe-tag">{tag}</span>
                      ))}
                    </div>
                    
                    <div className="safe-study-actions">
                      <button 
                        className="safe-read-btn"
                        onClick={() => handleViewStudy(study)}
                      >
                        <BookOpen size={16} />
                        Read Case Study
                      </button>
                      <button 
                        className="safe-share-btn"
                        onClick={() => handleShare(study)}
                      >
                        <Share2 size={16} />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="safe-no-results">
              <Search size={48} />
              <h3>No case studies found</h3>
              <p>Try adjusting your search or filter criteria</p>
              <button 
                className="safe-reset-filters"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="safe-cs-cta">
        <div className="safe-cs-container">
          <div className="safe-cta-content">
            <div className="safe-cta-text">
              <h2 className="safe-cta-title">Ready to Transform Your Document Workflow?</h2>
              <p className="safe-cta-subtitle">
                Join thousands of companies that have revolutionized their operations with Esigniva
              </p>
            </div>
            <div className="safe-cta-actions">
              <button 
                className="safe-cta-btn-primary"
                onClick={() => navigate('/register')}
              >
                Start Free Trial
                <ArrowRight size={18} />
              </button>
              <button 
                className="safe-cta-btn-secondary"
                onClick={() => navigate('/contactus?subject=Schedule%20a%20Demo')}
              >
                <UserCheck size={18} />
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Modal */}
      {selectedCaseStudy && (
        <div className="safe-study-modal">
          <div className="safe-modal-overlay" onClick={closeModal} />
          <div className="safe-modal-content">
            <div className="safe-modal-header">
              <div className="safe-modal-title-section">
                <h2 className="safe-modal-title">{selectedCaseStudy.title}</h2>
                <div className="safe-modal-subtitle">
                  <Building size={18} />
                  <span>{selectedCaseStudy.company}</span>
                  <span className="safe-modal-industry">• {selectedCaseStudy.industry}</span>
                </div>
              </div>
              <button className="safe-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            
            <div className="safe-modal-body">
              <div className="safe-modal-hero">
                <img 
                  src={selectedCaseStudy.logo} 
                  alt={selectedCaseStudy.company}
                  onError={(e) => { 
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'; 
                  }}
                />
                <div className="safe-modal-hero-content">
                  <div className="safe-modal-stats">
                    {selectedCaseStudy.results.map((result, index) => (
                      <div key={index} className="safe-modal-stat">
                        <div className="safe-stat-icon">{result.icon}</div>
                        <div className="safe-stat-content">
                          <div className="safe-stat-value">{result.value}</div>
                          <div className="safe-stat-label">{result.metric}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="safe-modal-sections">
                <div className="safe-modal-section">
                  <h3 className="safe-section-heading">
                    <Target size={20} />
                    The Challenge
                  </h3>
                  <p className="safe-section-content">{selectedCaseStudy.challenge}</p>
                </div>
                
                <div className="safe-modal-section">
                  <h3 className="safe-section-heading">
                    <Zap size={20} />
                    The Solution
                  </h3>
                  <p className="safe-section-content">{selectedCaseStudy.solution}</p>
                </div>
                
                <div className="safe-modal-section">
                  <h3 className="safe-section-heading">
                    <BarChart size={20} />
                    The Results
                  </h3>
                  <div className="safe-results-grid">
                    {selectedCaseStudy.results.map((result, index) => (
                      <div key={index} className="safe-result-card">
                        <div className="safe-result-icon">{result.icon}</div>
                        <div className="safe-result-details">
                          <div className="safe-result-metric">{result.metric}</div>
                          <div className="safe-result-value">{result.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="safe-modal-footer">
                <div className="safe-modal-tags">
                  {selectedCaseStudy.tags.map((tag, index) => (
                    <span key={index} className="safe-modal-tag">{tag}</span>
                  ))}
                </div>
                <div className="safe-modal-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    className="safe-modal-btn-primary"
                    onClick={() => handleDownloadPDF(selectedCaseStudy)}
                  >
                    <Download size={18} />
                    Download PDF Report
                  </button>
                  <button 
                    className="safe-modal-btn-secondary"
                    onClick={() => handleViewSimilarCases(selectedCaseStudy)}
                  >
                    <ExternalLink size={18} />
                    View Similar Cases ({selectedCaseStudy.industry})
                  </button>
                  <button 
                    className="safe-modal-btn-secondary"
                    onClick={() => handleShare(selectedCaseStudy)}
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Base Styles */
        .safe-case-studies {
          min-height: 100vh;
          background: #ffffff;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          color: #111827;
        }

        .safe-cs-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section */
        .safe-cs-hero {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          padding: 4rem 0;
          position: relative;
          overflow: hidden;
        }

        .safe-hero-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
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
          font-size: 3rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1rem;
          line-height: 1.2;
          letter-spacing: -0.025em;
        }

        .safe-hero-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.95);
          margin: 0 0 3rem;
          line-height: 1.6;
        }

        /* Metrics */
        .safe-hero-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }

        @media (min-width: 768px) {
          .safe-hero-metrics {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .safe-metric-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          backdrop-filter: blur(8px);
          transition: all 0.3s;
        }

        .safe-metric-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.15);
        }

        .safe-metric-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          margin: 0 auto 1rem;
          color: white;
        }

        .safe-metric-content {
          text-align: center;
        }

        .safe-metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
        }

        .safe-metric-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Featured Case Study */
        .safe-featured-study {
          padding: 4rem 0;
          background: #f9fafb;
        }

        .safe-featured-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .safe-featured-content {
            grid-template-columns: 1fr 1fr;
          }
        }

        .safe-featured-text {
          padding-right: 2rem;
        }

        .safe-featured-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef3c7;
          color: #92400e;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .safe-featured-title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
          line-height: 1.3;
        }

        .safe-featured-company {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          color: #4b5563;
          margin-bottom: 1.5rem;
        }

        .safe-company-industry {
          color: #9ca3af;
        }

        .safe-featured-challenge {
          font-size: 1.125rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 2rem;
        }

        .safe-featured-results {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .safe-result-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
        }

        .safe-result-content {
          flex: 1;
        }

        .safe-result-metric {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .safe-result-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }

        .safe-featured-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .safe-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-btn-primary:hover {
          background: #0f766e;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }

        .safe-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: white;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-btn-secondary:hover {
          background: #f9fafb;
          border-color: #0f766e;
          color: #0f766e;
        }

        .safe-featured-image {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .safe-featured-image img {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .safe-image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          padding: 2rem;
          color: white;
        }

        .safe-overlay-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .safe-overlay-content p {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        /* Testimonials */
        .safe-cs-testimonials {
          padding: 4rem 0;
          background: white;
        }

        .safe-testimonials-header {
          text-align: center;
          margin-bottom: 3rem;
          color: #0f766e;
        }

        .safe-section-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin: 1rem 0;
        }

        .safe-testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .safe-testimonials-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .safe-testimonial-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 2rem;
          position: relative;
          transition: all 0.3s;
        }

        .safe-testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
          border-color: #0f766e;
        }

        .safe-testimonial-quote {
          font-size: 3rem;
          color: #0f766e;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 1rem;
        }

        .safe-testimonial-text {
          font-size: 1rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        .safe-testimonial-author {
          border-top: 1px solid #e5e7eb;
          padding-top: 1.5rem;
        }

        .safe-author-info {
          margin-bottom: 0.5rem;
        }

        .safe-author-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .safe-author-role {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .safe-author-company {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #9ca3af;
        }

        /* Filters Section */
        .safe-cs-filters {
          padding: 2rem 0;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .safe-filters-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .safe-filters-content {
            flex-direction: row;
            align-items: center;
          }
        }

        .safe-search-section {
          flex: 1;
          position: relative;
        }

        .safe-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .safe-search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          background: white;
          outline: none;
          transition: all 0.2s;
        }

        .safe-search-input:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .safe-filters-section {
          position: relative;
        }

        .safe-filters-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: white;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-filters-toggle:hover {
          border-color: #0f766e;
          color: #0f766e;
        }

        .safe-filter-arrow {
          transition: transform 0.2s;
        }

        .safe-arrow-open {
          transform: rotate(180deg);
        }

        .safe-filters-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 0.75rem;
          min-width: 250px;
          z-index: 100;
        }

        .safe-filters-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }

        .safe-filter-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 0.75rem;
          background: #f9fafb;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-filter-btn:hover {
          background: #f3f4f6;
        }

        .safe-filter-active {
          background: #0f766e;
          color: white;
        }

        .safe-filter-count {
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.125rem 0.5rem;
          border-radius: 1rem;
        }

        .safe-active-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .safe-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: white;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-filter-chip:hover {
          border-color: #0f766e;
          color: #0f766e;
        }

        .safe-chip-active {
          background: #0f766e;
          color: white;
          border-color: #0f766e;
        }

        .safe-chip-count {
          font-size: 0.625rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.125rem 0.375rem;
          border-radius: 1rem;
        }

        /* Case Studies Grid */
        .safe-cs-grid-section {
          padding: 4rem 0;
          background: white;
        }

        .safe-grid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .safe-results-count {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .safe-case-studies-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .safe-case-studies-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .safe-case-study-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
          transition: all 0.3s;
        }

        .safe-case-study-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
          border-color: #0f766e;
        }

        .safe-featured-tag {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #fef3c7;
          color: #92400e;
          padding: 0.375rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 2;
        }

        .safe-study-image {
          position: relative;
          height: 200px;
        }

        .safe-study-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .safe-study-industry {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: rgba(255, 255, 255, 0.9);
          color: #111827;
          padding: 0.375rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
          backdrop-filter: blur(4px);
        }

        .safe-study-content {
          padding: 1.5rem;
        }

        .safe-study-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem;
          line-height: 1.3;
        }

        .safe-study-meta {
          margin-bottom: 1rem;
        }

        .safe-study-company {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .safe-company-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4b5563;
        }

        .safe-study-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .safe-study-challenge {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .safe-study-results {
          background: #f9fafb;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .safe-results-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75rem;
        }

        .safe-results-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-study-result {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #4b5563;
        }

        .safe-study-result strong {
          color: #111827;
          font-weight: 600;
        }

        .safe-study-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .safe-tag {
          padding: 0.25rem 0.75rem;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .safe-study-actions {
          display: flex;
          gap: 0.75rem;
        }

        .safe-read-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-read-btn:hover {
          background: #0f766e;
        }

        .safe-share-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.625rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-share-btn:hover {
          background: #e5e7eb;
        }

        .safe-no-results {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .safe-no-results h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 1rem 0 0.5rem;
        }

        .safe-reset-filters {
          margin-top: 1.5rem;
          padding: 0.75rem 1.5rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-reset-filters:hover {
          background: #0f766e;
        }

        /* CTA Section */
        .safe-cs-cta {
          padding: 4rem 0;
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          color: white;
        }

        .safe-cta-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .safe-cta-title {
          font-size: 2.25rem;
          font-weight: 700;
          margin: 0 0 1rem;
        }

        .safe-cta-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 2rem;
          line-height: 1.6;
        }

        .safe-cta-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .safe-cta-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: white;
          color: #0f766e;
          border: none;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-cta-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .safe-cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-cta-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
        }

        /* Modal */
        .safe-study-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .safe-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .safe-modal-content {
          position: relative;
          background: white;
          border-radius: 1rem;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          animation: safe-modal-slide 0.3s ease;
        }

        @keyframes safe-modal-slide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .safe-modal-header {
          position: sticky;
          top: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          z-index: 10;
        }

        .safe-modal-title-section {
          flex: 1;
        }

        .safe-modal-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-modal-subtitle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          color: #4b5563;
        }

        .safe-modal-industry {
          color: #9ca3af;
        }

        .safe-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-modal-close:hover {
          color: #ef4444;
          background: #fef2f2;
        }

        .safe-modal-body {
          padding: 2rem;
        }

        .safe-modal-hero {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .safe-modal-hero img {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .safe-modal-hero-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          padding: 2rem;
        }

        .safe-modal-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .safe-modal-stats {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .safe-modal-stat {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.9);
          padding: 1rem;
          border-radius: 0.75rem;
          backdrop-filter: blur(4px);
        }

        .safe-stat-icon {
          color: #0f766e;
        }

        .safe-stat-content {
          flex: 1;
        }

        .safe-stat-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.125rem;
        }

        .safe-stat-label {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-modal-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .safe-modal-section {
          background: #f9fafb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-section-heading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
        }

        .safe-section-content {
          font-size: 1rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }

        .safe-results-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .safe-results-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .safe-result-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.25rem;
          text-align: center;
        }

        .safe-result-icon {
          color: #0f766e;
          margin-bottom: 0.75rem;
        }

        .safe-result-details {
          flex: 1;
        }

        .safe-result-metric {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .safe-result-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
        }

        .safe-modal-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 2rem;
        }

        .safe-modal-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .safe-modal-tag {
          padding: 0.5rem 1rem;
          background: #0f766e;
          color: white;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .safe-modal-actions {
          display: flex;
          gap: 1rem;
        }

        .safe-modal-btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-modal-btn-primary:hover {
          background: #0f766e;
        }

        .safe-modal-btn-secondary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-modal-btn-secondary:hover {
          background: #e5e7eb;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .safe-hero-title {
            font-size: 2.25rem;
          }
          
          .safe-section-title {
            font-size: 1.75rem;
          }
          
          .safe-cta-title {
            font-size: 1.75rem;
          }
          
          .safe-modal-stats,
          .safe-results-grid {
            grid-template-columns: 1fr;
          }
          
          .safe-modal-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 640px) {
          .safe-cs-container {
            padding: 0 1rem;
          }
          
          .safe-hero-title {
            font-size: 1.875rem;
          }
          
          .safe-featured-actions,
          .safe-study-actions,
          .safe-cta-actions {
            flex-direction: column;
          }
          
          .safe-featured-title {
            font-size: 1.5rem;
          }
          
          .safe-modal-title {
            font-size: 1.25rem;
          }
        }

        /* Print Styles */
        @media print {
          .safe-btn-primary,
          .safe-btn-secondary,
          .safe-modal-close,
          .safe-study-actions,
          .safe-cta-actions {
            display: none !important;
          }
          
          .safe-cs-hero {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CaseStudies;
