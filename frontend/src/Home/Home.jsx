// import React, { useState } from 'react';
// import { useNavigate } from "react-router-dom";

// import { 
//   ArrowRight, 
//   Shield, 
//   Clock, 
//   Users, 
//   CheckCircle,
//   Star,
//   Play,
//   FileText,
//   Zap,
//   Globe,
//   Lock,
//   BarChart,
//   Download,
//   Upload,
//   Send,
//   PenTool,
//   Eye,
//   Calendar,
//   Search,
//   Filter,
//   ChevronDown,
//   Menu,
//   X,
//   Award,
//   ThumbsUp,
//   Target,
//   Cloud,
//   Smartphone,
//   Tablet,
//   Laptop,
//   Server,
//   Code,
//   GitBranch,
//   ShieldCheck,
//   FileCheck,
//   Users as UsersIcon,
//   Building,
//   CreditCard,
//   HelpCircle,
//   BookOpen,
//   MessageCircle,
//   Phone,
//   Mail,
//   MapPin
// } from 'lucide-react';
// import "../style/Home.css"; 

// const Home = () => {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const navigate = useNavigate();

//   const industries = [
//     { name: 'Real Estate', icon: <Building size={24} />, count: '50K+' },
//     { name: 'Healthcare', icon: <UsersIcon size={24} />, count: '30K+' },
//     { name: 'Legal', icon: <FileCheck size={24} />, count: '25K+' },
//     { name: 'Finance', icon: <CreditCard size={24} />, count: '40K+' },
//     { name: 'Education', icon: <BookOpen size={24} />, count: '20K+' },
//     { name: 'Technology', icon: <Code size={24} />, count: '35K+' }
//   ];

//   const features = [
//     {
//       category: "Security & Compliance",
//       items: [
//         {
//           icon: <ShieldCheck className="feature-icon" />,
//           title: "Bank-Level Security",
//           description: "256-bit SSL encryption, SOC 2 Type II compliant, GDPR ready with advanced audit trails",
//           details: ["SOC 2 Compliant", "GDPR Ready", "HIPAA Compatible", "eIDAS Compliant"]
//         },
//         {
//           icon: <Lock className="feature-icon" />,
//           title: "Advanced Authentication",
//           description: "Multi-factor authentication, SMS verification, and knowledge-based verification",
//           details: ["2FA & MFA", "SMS Verification", "Email Verification", "KBA Options"]
//         }
//       ]
//     },
//     {
//       category: "Productivity",
//       items: [
//         {
//           icon: <Zap className="feature-icon" />,
//           title: "Bulk Send",
//           description: "Send multiple documents for signature simultaneously with custom routing",
//           details: ["Mass sending", "Parallel signing", "Sequential routing", "Template reuse"]
//         },
//         {
//           icon: <BarChart className="feature-icon" />,
//           title: "Advanced Analytics",
//           description: "Track document status, completion rates, and team performance in real-time",
//           details: ["Real-time tracking", "Performance metrics", "Completion analytics", "Team insights"]
//         }
//       ]
//     },
//     {
//       category: "Integration",
//       items: [
//         {
//           icon: <GitBranch className="feature-icon" />,
//           title: "API & Webhooks",
//           description: "RESTful API with comprehensive documentation and real-time webhook notifications",
//           details: ["REST API", "Webhooks", "SDKs available", "Custom workflows"]
//         },
//         {
//           icon: <Cloud className="feature-icon" />,
//           title: "Cloud Storage",
//           description: "Seamless integration with Google Drive, Dropbox, OneDrive, and Box",
//           details: ["Google Drive", "Dropbox", "OneDrive", "Box Integration"]
//         }
//       ]
//     }
//   ];

//   const useCases = [
//     {
//       title: "Sales Contracts",
//       description: "Close deals faster with electronic signatures on proposals, quotes, and contracts",
//       image: "📄",
//       benefits: ["Faster deal closure", "Reduce paperwork", "Mobile signing", "Automated reminders"]
//     },
//     {
//       title: "HR Documents",
//       description: "Streamline employee onboarding with digital offer letters, NDAs, and policy agreements",
//       image: "👥",
//       benefits: ["Faster onboarding", "Compliance tracking", "Digital archives", "Employee self-service"]
//     },
//     {
//       title: "Legal Agreements",
//       description: "Execute legal documents with court-admissible electronic signatures and timestamps",
//       image: "⚖️",
//       benefits: ["Legal compliance", "Audit trails", "Court-admissible", "Secure storage"]
//     }
//   ];

//   const testimonials = [
//     {
//       name: "Jennifer Martinez",
//       position: "COO, TechGrowth Inc.",
//       text: "SignApp reduced our contract signing process from 2 weeks to just 2 days. The ROI was immediate and substantial.",
//       rating: 5,
//       avatar: "JM",
//       stats: "85% faster signing process"
//     },
//     {
//       name: "David Kim",
//       position: "Legal Director, Global Partners LLP",
//       text: "The security features and compliance certifications gave our legal team complete confidence in moving to digital signatures.",
//       rating: 5,
//       avatar: "DK",
//       stats: "100% compliance adherence"
//     },
//     {
//       name: "Sarah Thompson",
//       position: "HR Director, Enterprise Solutions",
//       text: "Onboarding new employees became seamless with SignApp. We eliminated paperwork and improved the candidate experience dramatically.",
//       rating: 5,
//       avatar: "ST",
//       stats: "90% reduction in onboarding time"
//     }
//   ];

//   const pricingPlans = [
//     {
//       name: "Professional",
//       price: "$15",
//       period: "per user/month",
//       description: "Perfect for small teams and individual professionals",
//       features: [
//         "Unlimited signatures",
//         "5 templates",
//         "Basic fields",
//         "Email support",
//         "Mobile app access",
//         "Standard security"
//       ],
//       cta: "Start Free Trial",
//       popular: false
//     },
//     {
//       name: "Business",
//       price: "$35",
//       period: "per user/month",
//       description: "Advanced features for growing businesses",
//       features: [
//         "Everything in Professional",
//         "Unlimited templates",
//         "Advanced fields",
//         "Priority support",
//         "Bulk send",
//         "Custom branding",
//         "Advanced analytics"
//       ],
//       cta: "Start Free Trial",
//       popular: true
//     },
//     {
//       name: "Enterprise",
//       price: "Custom",
//       period: "contact sales",
//       description: "Full customization for large organizations",
//       features: [
//         "Everything in Business",
//         "Single sign-on (SSO)",
//         "API access",
//         "Dedicated support",
//         "Custom workflows",
//         "Advanced security",
//         "SLA guarantee"
//       ],
//       cta: "Contact Sales",
//       popular: false
//     }
//   ];

//   const integrations = [
//     { name: "Salesforce", logo: "SF", category: "CRM" },
//     { name: "Google Workspace", logo: "GW", category: "Productivity" },
//     { name: "Microsoft 365", logo: "M365", category: "Productivity" },
//     { name: "Dropbox", logo: "DB", category: "Storage" },
//     { name: "Box", logo: "BX", category: "Storage" },
//     { name: "Slack", logo: "SL", category: "Communication" },
//     { name: "Zoom", logo: "ZM", category: "Communication" },
//     { name: "QuickBooks", logo: "QB", category: "Accounting" }
//   ];

//   const renderStars = (count) => {
//     return Array.from({ length: count }, (_, i) => (
//       <Star key={i} className="star-icon" size={16} fill="currentColor" />
//     ));
//   };

//   return (
//     <div className="home-container">
//       {/* Header */}
//       <header className="header">
//         <div className="container">
//           <div className="header-content">
//             <div className="logo">
//               <Shield size={32} className="logo-icon" />
//               <span className="logo-text">SignApp</span>
//             </div>

//             <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
//               <div className="nav-main">
//                 <a href="#features">Features</a>
//                 <a href="#solutions">Solutions</a>
//                 <a href="#integrations">Integrations</a>
//                 <a href="#pricing">Pricing</a>
//                 <a href="#resources">Resources</a>
//               </div>
//               <div className="nav-actions">
//                 <a href="/login" className="nav-link">Sign In</a>
//                 <a className="btn btn-primary btn-sm" href="/register">Start Free Trial</a>
//               </div>
//             </nav>

//             <button 
//               className="mobile-menu-btn"
//               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             >
//               {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Enhanced Hero Section */}
//       <section className="hero-section">
//         <div className="hero-background">
//           <div className="hero-pattern"></div>
//         </div>
//         <div className="container">
//           <div className="hero-content">
//             <div className="hero-text">
//               <div className="hero-badge">
//                 <Award size={16} />
//                 <span>Trusted by 50,000+ companies worldwide</span>
//               </div>

//               <h1 className="hero-title">
//                 The Most Secure Platform for
//                 <span className="hero-gradient"> Electronic Signatures</span>
//               </h1>

//               <p className="hero-subtitle">
//                 Streamline your document workflow with legally binding e-signatures. 
//                 Join millions who trust SignApp for fast, secure, and compliant 
//                 digital transactions with enterprise-grade security.
//               </p>

//               <div className="hero-actions">
//       {/* Start Free Trial → Signup Page */}
//       <button
//         className="btn btn-primary btn-large"
//         onClick={() => navigate("/register")}
//       >
//         Start Free Trial <ArrowRight size={20} />
//       </button>

//       {/* Watch Demo → Demo Page */}
//       <button
//         className="btn btn-secondary btn-large"
//         onClick={() => navigate("/demo")}
//       >
//         <Play size={20} /> Watch Demo
//       </button>
//     </div>

//               <div className="hero-highlights">
//                 <div className="highlight-item">
//                   <CheckCircle size={20} />
//                   <span>No credit card required</span>
//                 </div>
//                 <div className="highlight-item">
//                   <CheckCircle size={20} />
//                   <span>Free 14-day trial</span>
//                 </div>
//                 <div className="highlight-item">
//                   <CheckCircle size={20} />
//                   <span>Setup in minutes</span>
//                 </div>
//               </div>
//             </div>

//             <div className="hero-visual">
//               <div className="dashboard-showcase">
//                 <div className="browser-window">
//                   <div className="browser-header">
//                     <div className="browser-controls">
//                       <div className="browser-dot red"></div>
//                       <div className="browser-dot yellow"></div>
//                       <div className="browser-dot green"></div>
//                     </div>
//                     <div className="browser-url">app.signapp.com/documents</div>
//                   </div>
//                   <div className="browser-content">
//                     <div className="document-workflow">
//                       <div className="workflow-header">
//                         <div className="workflow-title">Sales Agreement</div>
//                         <div className="workflow-status">Waiting for signature</div>
//                       </div>
//                       <div className="workflow-preview">
//                         <div className="document-pages">
//                           <div className="document-page active">
//                             <div className="page-content">
//                               <div className="signature-fields">
//                                 <div className="signature-placeholder">
//                                   <PenTool size={20} />
//                                   <span>Signature</span>
//                                 </div>
//                                 <div className="date-field">
//                                   <Calendar size={16} />
//                                   <span>Date</span>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="floating-cards">
//                   <div className="floating-card security">
//                     <ShieldCheck size={20} />
//                     <span>Enterprise Security</span>
//                   </div>
//                   <div className="floating-card mobile">
//                     <Smartphone size={20} />
//                     <span>Mobile Friendly</span>
//                   </div>
//                   <div className="floating-card compliance">
//                     <FileCheck size={20} />
//                     <span>Legal Compliance</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Trust Bar */}
//           <div className="trust-bar">
//             <div className="trust-label">Trusted by industry leaders</div>
//             <div className="trust-logos">
//               {['Microsoft', 'Google', 'Salesforce', 'IBM', 'Amazon', 'Oracle'].map((company, index) => (
//                 <div key={index} className="trust-logo">
//                   {company}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Stats Section */}
//       <section className="stats-section">
//         <div className="container">
//           <div className="stats-grid">
//             <div className="stat-card">
//               <div className="stat-number">10M+</div>
//               <div className="stat-label">Documents Signed Monthly</div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-number">99.9%</div>
//               <div className="stat-label">Uptime SLA</div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-number">150+</div>
//               <div className="stat-label">Countries Supported</div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-number">24/7</div>
//               <div className="stat-label">Customer Support</div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Industries Section */}
//       <section className="industries-section">
//         <div className="container">
//           <div className="section-header">
//             <h2>Trusted Across Industries</h2>
//             <p>SignApp meets the unique needs of every industry with specialized solutions</p>
//           </div>
//           <div className="industries-grid">
//             {industries.map((industry, index) => (
//               <div key={index} className="industry-card">
//                 <div className="industry-icon">
//                   {industry.icon}
//                 </div>
//                 <h3>{industry.name}</h3>
//                 <div className="industry-count">{industry.count} users</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Comprehensive Features */}
//       <section id="features" className="features-section">
//         <div className="container">
//           <div className="section-header">
//             <h2>Enterprise-Grade Features</h2>
//             <p>Everything you need for secure, efficient document signing at scale</p>
//           </div>

//           {features.map((category, categoryIndex) => (
//             <div key={categoryIndex} className="feature-category">
//               <h3 className="category-title">{category.category}</h3>
//               <div className="features-grid">
//                 {category.items.map((feature, featureIndex) => (
//                   <div key={featureIndex} className="feature-card">
//                     <div className="feature-header">
//                       <div className="feature-icon-container">
//                         {feature.icon}
//                       </div>
//                       <h4>{feature.title}</h4>
//                     </div>
//                     <p className="feature-description">{feature.description}</p>
//                     <div className="feature-details">
//                       {feature.details.map((detail, detailIndex) => (
//                         <span key={detailIndex} className="feature-detail-tag">
//                           {detail}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Use Cases Section */}
//       <section id="solutions" className="use-cases-section">
//         <div className="container">
//           <div className="section-header">
//             <h2>Solutions for Every Business Need</h2>
//             <p>Discover how SignApp transforms document workflows across your organization</p>
//           </div>
//           <div className="use-cases-grid">
//             {useCases.map((useCase, index) => (
//               <div key={index} className="use-case-card">
//                 <div className="use-case-icon">
//                   {useCase.image}
//                 </div>
//                 <h3>{useCase.title}</h3>
//                 <p>{useCase.description}</p>
//                 <div className="use-case-benefits">
//                   {useCase.benefits.map((benefit, benefitIndex) => (
//                     <div key={benefitIndex} className="benefit-item">
//                       <CheckCircle size={16} />
//                       <span>{benefit}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <button className="btn btn-outline">Learn More</button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Testimonials Section */}
//       <section className="testimonials-section">
//         <div className="container">
//           <div className="section-header">
//             <h2>Loved by Teams Worldwide</h2>
//             <p>See how companies are transforming their document processes with SignApp</p>
//           </div>
//           <div className="testimonials-grid">
//             {testimonials.map((testimonial, index) => (
//               <div key={index} className="testimonial-card">
//                 <div className="testimonial-header">
//                   <div className="testimonial-avatar">
//                     {testimonial.avatar}
//                   </div>
//                   <div className="testimonial-info">
//                     <div className="testimonial-name">{testimonial.name}</div>
//                     <div className="testimonial-position">{testimonial.position}</div>
//                   </div>
//                 </div>
//                 <div className="testimonial-rating">
//                   {renderStars(testimonial.rating)}
//                 </div>
//                 <p className="testimonial-text">"{testimonial.text}"</p>
//                 <div className="testimonial-stats">
//                   <Target size={16} />
//                   <span>{testimonial.stats}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Integrations Section */}
//       <section id="integrations" className="integrations-section">
//         <div className="container">
//           <div className="section-header">
//             <h2>Seamless Integrations</h2>
//             <p>Connect SignApp with your favorite tools and workflows</p>
//           </div>
//           <div className="integrations-grid">
//             {integrations.map((integration, index) => (
//               <div key={index} className="integration-card">
//                 <div className="integration-logo">
//                   {integration.logo}
//                 </div>
//                 <div className="integration-info">
//                   <div className="integration-name">{integration.name}</div>
//                   <div className="integration-category">{integration.category}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Pricing Section */}
//       <section id="pricing" className="pricing-section">
//         <div className="container">
//           <div className="section-header">
//             <h2>Simple, Transparent Pricing</h2>
//             <p>Choose the plan that works best for your team</p>
//           </div>
//           <div className="pricing-grid">
//             {pricingPlans.map((plan, index) => (
//               <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
//                 {plan.popular && <div className="popular-badge">Most Popular</div>}
//                 <div className="pricing-header">
//                   <h3>{plan.name}</h3>
//                   <div className="pricing-price">
//                     <span className="price">{plan.price}</span>
//                     <span className="period">{plan.period}</span>
//                   </div>
//                   <p className="pricing-description">{plan.description}</p>
//                 </div>
//                 <div className="pricing-features">
//                   {plan.features.map((feature, featureIndex) => (
//                     <div key={featureIndex} className="pricing-feature">
//                       <CheckCircle size={16} />
//                       <span>{feature}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-full`}>
//                   {plan.cta}
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Final CTA */}
//       <section className="final-cta">
//         <div className="container">
//           <div className="cta-content">
//             <h2>Ready to Transform Your Document Workflow?</h2>
//             <p>Join 50,000+ companies that trust SignApp for their electronic signature needs</p>
//             <div className="cta-actions">
//               <button className="btn btn-primary btn-large">
//                 Start Free Trial <ArrowRight size={20} />
//               </button>
//               <button className="btn btn-secondary btn-large">
//                 Contact Sales
//               </button>
//             </div>
//             <div className="cta-guarantee">
//               <ShieldCheck size={20} />
//               <span>30-day money-back guarantee • No credit card required</span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="footer">
//         <div className="container">
//           <div className="footer-content">
//             <div className="footer-main">
//               <div className="footer-brand">
//                 <div className="logo">
//                   <Shield size={32} className="logo-icon" />
//                   <span className="logo-text">SignApp</span>
//                 </div>
//                 <p className="footer-description">
//                   The most secure platform for electronic signatures and document workflows.
//                 </p>
//                 <div className="footer-social">
//                   {/* Social icons would go here */}
//                 </div>
//               </div>

//               <div className="footer-links">
//                 <div className="footer-column">
//                   <h4>Product</h4>
//                   <a href="#features">Features</a>
//                   <a href="#solutions">Solutions</a>
//                   <a href="#integrations">Integrations</a>
//                   <a href="#pricing">Pricing</a>
//                 </div>

//                 <div className="footer-column">
//                   <h4>Resources</h4>
//                   <a href="#documentation">Documentation</a>
//                   <a href="#blog">Blog</a>
//                   <a href="#webinars">Webinars</a>
//                   <a href="#support">Support</a>
//                 </div>

//                 <div className="footer-column">
//                   <h4>Company</h4>
//                   <a href="#about">About</a>
//                   <a href="#careers">Careers</a>
//                   <a href="#contact">Contact</a>
//                   <a href="#legal">Legal</a>
//                 </div>

//                 <div className="footer-column">
//                   <h4>Contact</h4>
//                   <div className="contact-info">
//                     <Phone size={16} />
//                     <span>1-800-SIGN-NOW</span>
//                   </div>
//                   <div className="contact-info">
//                     <Mail size={16} />
//                     <span>support@signapp.com</span>
//                   </div>
//                   <div className="contact-info">
//                     <MapPin size={16} />
//                     <span>San Francisco, CA</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="footer-bottom">
//               <div className="footer-copyright">
//                 © 2024 SignApp. All rights reserved.
//               </div>
//               <div className="footer-legal">
//                 <a href="#privacy">Privacy Policy</a>
//                 <a href="#terms">Terms of Service</a>
//                 <a href="#cookies">Cookie Policy</a>
//               </div>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Home;




import React from 'react';
import HeroCard from './HeroCard';
import IntegrationsScroll from './IntegrationsScroll';
import PlatformOverview from './PlatformOverview';
import TestimonialsAndCTA from './TestimonialsAndCTA';

import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";


const Home = () => {




  useEffect(() => {
    setPageTitle(
      "SafeSign | Enterprise E-Signature & Document Management Platform",
      "Experience the most secure enterprise-grade electronic signatures, AI-powered document management, and automated workflows. Legally binding and HIPAA compliant signing for global teams."
    );
  }, []);

  return (
    <>

      <HeroCard />

      <IntegrationsScroll />

      <PlatformOverview />

      <TestimonialsAndCTA />













    </>
  );
}
export default Home;
