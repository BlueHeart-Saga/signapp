// TermsDialog.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  Paper,
  Chip,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close as CloseIcon,
  VerifiedUser as VerifiedIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Article as ArticleIcon,
  Policy as PolicyIcon,
  AccountBalance as AccountBalanceIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  DataUsage as DataUsageIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Fingerprint as FingerprintIcon,
  Cloud as CloudIcon,
  Backup as BackupIcon,
  Code as CodeIcon,
  Schedule as ScheduleIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

const TermsDialog = ({
  open,
  onAccept,
  onDecline,
  recipientInfo,
  documentInfo,
  signingInfo,
  required = true
}) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [acceptedSections, setAcceptedSections] = useState({
    terms: false,
    privacy: false,
    consent: false,
    legal: false,
    security: false,
    retention: false
  });
  const [expandedSections, setExpandedSections] = useState({
    terms: true,
    privacy: true,
    consent: true,
    legal: true,
    security: true,
    retention: true
  });
  const contentRef = useRef(null);
  const [declineReason, setDeclineReason] = useState('');

  const handleScroll = () => {
    if (!contentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrollPosition = scrollTop + clientHeight;
    
    setHasScrolled(true);
    setIsScrolledToBottom(scrollHeight - scrollPosition < 10);
  };

  const allSectionsAccepted = Object.values(acceptedSections).every(val => val);

  // Handle individual checkbox changes
  const handleSectionChange = (section) => (event) => {
    const newAcceptedSections = {
      ...acceptedSections,
      [section]: event.target.checked
    };
    setAcceptedSections(newAcceptedSections);
  };

  // Handle Accept All button
  const handleAcceptAll = () => {
    setAcceptedSections({
      terms: true,
      privacy: true,
      consent: true,
      legal: true,
      security: true,
      retention: true
    });
  };

  const handleAccept = () => {
    if (required && !allSectionsAccepted) {
      return;
    }
    onAccept();
  };

  const handleDecline = () => {
    if (declineReason.trim() === '') {
      alert('Please provide a reason for declining');
      return;
    }
    onDecline(declineReason);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (open) {
      setHasScrolled(false);
      setIsScrolledToBottom(false);
      setAcceptedSections({
        terms: false,
        privacy: false,
        consent: false,
        legal: false,
        security: false,
        retention: false
      });
      setExpandedSections({
        terms: true,
        privacy: true,
        consent: true,
        legal: true,
        security: true,
        retention: true
      });
      setDeclineReason('');
    }
  }, [open]);

  // Scroll to bottom when all sections are accepted
  useEffect(() => {
    if (allSectionsAccepted && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [allSectionsAccepted]);

  const sectionDetails = {
    terms: {
      icon: <GavelIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />,
      title: "Terms of Service",
      content: [
        "This agreement governs your use of the electronic signature services provided by SafeSign. By accepting these terms, you acknowledge that electronic signatures carry the same legal weight and enforceability as traditional handwritten signatures under applicable laws including the Electronic Signatures in Global and National Commerce Act (ESIGN), Uniform Electronic Transactions Act (UETA), and eIDAS Regulation in the European Union.",
        "You warrant that you have the legal capacity and authority to execute this document on behalf of yourself or the entity you represent. The document signer represents that they are authorized to bind the party for whom they are signing.",
        "All transactions conducted through this platform are subject to the laws and regulations of the jurisdiction where the document is executed. The platform provider shall not be liable for any disputes arising from the content or execution of signed documents.",
        "You agree that the electronic record of this transaction, including timestamps, IP addresses, and audit trails, constitutes legally admissible evidence of the signing process."
      ]
    },
    privacy: {
      icon: <SecurityIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />,
      title: "Privacy & Data Protection",
      content: [
        "We collect and process personal data in accordance with applicable data protection regulations including GDPR, CCPA, PIPEDA, and other regional privacy laws. The types of data collected include: name, email address, IP address, device information, and signing behavior patterns.",
        "Documents and associated metadata are encrypted using AES-256 encryption both in transit (TLS 1.3) and at rest. Data is stored in ISO 27001, SOC 2 Type II, and HIPAA compliant data centers located in secure jurisdictions.",
        "We implement data minimization principles, collecting only information necessary for identity verification, fraud prevention, and service delivery. Data retention periods vary by document type and jurisdiction but typically range from 7 to 10 years for legal and compliance purposes.",
        "Third-party service providers are bound by strict data processing agreements and may only access data for specific service delivery purposes. International data transfers comply with adequacy decisions, standard contractual clauses, or other approved transfer mechanisms."
      ]
    },
    consent: {
      icon: <AssignmentIcon sx={{ fontSize: '1rem', color: '#ff9800' }} />,
      title: "E-Signature Consent Declaration",
      content: [
        `I, ${recipientInfo?.name || 'the signer'}, hereby explicitly consent to conduct this transaction electronically and confirm the following declarations under penalty of perjury:`,
        "I understand that electronic signatures have the same legal effect as handwritten signatures and are legally binding and enforceable.",
        "I confirm that I have the authority and capacity to sign this document on behalf of myself or the entity I represent.",
        "I have read and understand all terms and conditions presented in this agreement.",
        "I consent to receive notices, disclosures, and other communications electronically at the email address provided.",
        "I have the necessary hardware and software to access, download, and print electronic records, and I am able to retain electronic copies of documents for my records.",
        "I understand that I may withdraw consent to electronic transactions at any time by providing written notice, though such withdrawal will not affect the legal validity of previously executed electronic documents."
      ]
    },
    legal: {
      icon: <AccountBalanceIcon sx={{ fontSize: '1rem', color: '#9c27b0' }} />,
      title: "Legal Compliance & Jurisdiction",
      content: [
        "This electronic signing process complies with international standards and regulations including: ESIGN Act (US), eIDAS Regulation (EU), Electronic Transactions Act (Canada), and Electronic Communications Act (UK).",
        "The governing law for this agreement shall be the laws of the jurisdiction specified in the underlying document, or if none specified, the laws of the State of Delaware, United States.",
        "Any disputes arising from or related to this electronic signing process shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, unless otherwise prohibited by applicable law.",
        "The parties waive any right to trial by jury in any action, proceeding, or counterclaim arising out of or relating to this agreement.",
        "Severability: If any provision of these terms is found to be unenforceable, the remaining provisions will remain in full force and effect."
      ]
    },
    security: {
      icon: <FingerprintIcon sx={{ fontSize: '1rem', color: '#2196f3' }} />,
      title: "Security & Authentication Measures",
      content: [
        "Multi-factor authentication is implemented throughout the signing process. This includes: email verification, one-time passwords, IP address tracking, device fingerprinting, and behavioral analysis.",
        "All cryptographic operations use industry-standard algorithms: RSA-2048 for digital signatures, SHA-256 for hashing, and AES-256-GCM for document encryption.",
        "Audit trails include comprehensive metadata: exact timestamp (UTC), geolocation data (when permitted), device information, browser details, IP address, and user actions during the signing process.",
        "Documents are protected with digital watermarks and tamper-evident seals. Any alteration to signed documents is automatically detected and reported.",
        "Regular security audits are conducted by independent third-party security firms. Security incident response procedures are ISO 27001 compliant with 24/7 monitoring."
      ]
    },
    retention: {
      icon: <HistoryIcon sx={{ fontSize: '1rem', color: '#607d8b' }} />,
      title: "Document Retention & Accessibility",
      content: [
        "Signed documents are retained for a minimum period of 7 years in compliance with various record-keeping regulations including: IRS requirements, SEC regulations, FINRA rules, and industry-specific retention mandates.",
        "Documents are stored in multiple geographically dispersed data centers with real-time replication to ensure high availability and disaster recovery capabilities.",
        "Access to signed documents is available 24/7 through secure portals. Download options include: PDF with embedded signatures, XML with full metadata, and printable versions with visible audit trails.",
        "Archival format ensures long-term readability and compliance with PDF/A standards. Digital preservation strategies include format migration planning and regular integrity checks.",
        "Data export functionality allows users to download their documents and associated metadata at any time. Data portability rights are respected in accordance with applicable regulations."
      ]
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '85vh',
          maxHeight: '95vh',
          borderRadius: 1,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#0d9488', 
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        py: 1.5,
        borderBottom: '1px solid #0d9488'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VerifiedIcon fontSize="small" />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Terms & Conditions Agreement
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                Complete legal acceptance required for electronic signing
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label="ISO 27001" 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                color: 'white',
                fontSize: '0.6rem',
                height: 20
              }}
            />
            <Chip 
              label="GDPR Compliant" 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                color: 'white',
                fontSize: '0.6rem',
                height: 20
              }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent 
        dividers 
        ref={contentRef} 
        onScroll={handleScroll}
        sx={{ 
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
          '&::-webkit-scrollbar-thumb': { background: '#90a4ae', borderRadius: '4px' }
        }}
      >
        {/* Document Info Header */}
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          mb: 2, 
          bgcolor: '#e3f2fd', 
          borderRadius: 0.5,
          border: '1px solid #bbdefb'
        }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', fontWeight: 500 }}>
                DOCUMENT FOR SIGNATURE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <DescriptionIcon sx={{ fontSize: '0.9rem', color: '#1976d2' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {documentInfo?.filename || 'Untitled Document'}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                <strong>Recipient:</strong> {recipientInfo?.name} • <strong>Role:</strong> {recipientInfo?.role} • <strong>Email:</strong> {recipientInfo?.email}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', color: '#666' }}>
                <strong>Document ID:</strong> {documentInfo?.id || 'DOC-' + Math.random().toString(36).substr(2, 8).toUpperCase()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: '0.7rem', color: '#666' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666' }}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                UTC: {new Date().toISOString()}
              </Typography>
              <Chip 
                label="ESIGN Compliant" 
                size="small"
                sx={{ 
                  mt: 0.5,
                  fontSize: '0.6rem',
                  height: 18
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Important Notice */}

        {/* Re-acceptance Notice */}
{signingInfo?.terms_status === 'declined' && (
  <Alert severity="info" sx={{ mb: 2, border: '1px solid #2196f3' }}>
    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
      <strong>Previous Decline:</strong> You had previously declined these terms. 
      You can now review and re-accept the terms to proceed with signing.
    </Typography>
  </Alert>
)}
        
        <Alert severity="warning" sx={{ 
          mb: 2, 
          py: 0.75,
          '& .MuiAlert-icon': { padding: 0 },
          fontSize: '0.8rem',
          border: '1px solid #ffb74d'
        }}>
          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.4, fontWeight: 500 }}>
            <WarningIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle', mr: 0.5 }} />
            LEGAL NOTICE: This document constitutes a binding legal agreement. By accepting these terms, you acknowledge that electronic signatures are legally enforceable under applicable laws worldwide.
          </Typography>
        </Alert>

        {/* Introduction */}
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: '#f5f5f5', borderRadius: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.6, color: '#424242' }}>
            Dear <strong>{recipientInfo?.name}</strong>, you are about to electronically sign <strong>{documentInfo?.filename}</strong>. This agreement outlines the terms governing the use of electronic signatures through our secure platform. Please carefully review each section below. Your acceptance of all sections is required to proceed with the signing process.
          </Typography>
        </Paper>

        {/* Terms Sections */}
        <Box sx={{ mb: 3 }}>
          {Object.entries(sectionDetails).map(([key, section]) => (
            <Paper 
              key={key}
              elevation={0} 
              sx={{ 
                mb: 1.5, 
                border: `1px solid ${acceptedSections[key] ? '#4caf50' : '#e0e0e0'}`,
                borderRadius: 0.5,
                overflow: 'hidden',
                transition: 'border-color 0.2s'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  p: 1.5,
                  bgcolor: acceptedSections[key] ? '#e8f5e9' : '#fafafa',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: acceptedSections[key] ? '#e8f5e9' : '#f5f5f5'
                  }
                }}
                onClick={() => toggleSection(key)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  {section.icon}
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {section.title}
                  </Typography>
                  {acceptedSections[key] && (
                    <CheckIcon sx={{ fontSize: '0.8rem', color: '#4caf50', ml: 0.5 }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={acceptedSections[key]}
                        onChange={handleSectionChange(key)}
                        size="small"
                        sx={{ 
                          '& .MuiSvgIcon-root': { fontSize: '0.85rem' },
                          p: 0.5 
                        }}
                      />
                    }
                    label={
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        Accept
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    {expandedSections[key] ? 
                      <ExpandLessIcon sx={{ fontSize: '0.9rem' }} /> : 
                      <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
                    }
                  </IconButton>
                </Box>
              </Box>
              {expandedSections[key] && (
  <Fade in timeout={200}>
                <Box sx={{ p: 1.5, borderTop: '1px solid #f0f0f0' }}>
                  {section.content.map((paragraph, index) => (
                    <Typography 
                      key={index}
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.72rem', 
                        lineHeight: 1.7,
                        color: '#555',
                        mb: index === section.content.length - 1 ? 0 : 1.5
                      }}
                    >
                      {paragraph}
                    </Typography>
                  ))}
                  
                  {/* Additional details for each section */}
                  {key === 'terms' && (
                    <Box sx={{ mt: 1.5, p: 1, bgcolor: '#f9f9f9', borderRadius: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500, display: 'block', mb: 0.5 }}>
                        Applicable Laws:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip label="ESIGN Act" size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                        <Chip label="UETA" size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                        <Chip label="eIDAS" size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                        <Chip label="PIPEDA" size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                      </Box>
                    </Box>
                  )}
                  
                  {key === 'security' && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500, display: 'block', mb: 0.5 }}>
                        Security Certifications:
                      </Typography>
                      <List dense sx={{ py: 0 }}>
                        <ListItem sx={{ py: 0.25, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <LockIcon sx={{ fontSize: '0.7rem' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="AES-256 Encryption" 
                            primaryTypographyProps={{ fontSize: '0.68rem' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.25, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <FingerprintIcon sx={{ fontSize: '0.7rem' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Multi-Factor Authentication" 
                            primaryTypographyProps={{ fontSize: '0.68rem' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.25, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <CloudIcon sx={{ fontSize: '0.7rem' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="SOC 2 Type II Certified" 
                            primaryTypographyProps={{ fontSize: '0.68rem' }}
                          />
                        </ListItem>
                      </List>
                    </Box>
                  )}
                </Box>
              </Fade>
              )}
            </Paper>
          ))}
        </Box>

        {/* Technical Specifications */}
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          mb: 2, 
          bgcolor: '#f0f4ff', 
          borderRadius: 0.5,
          border: '1px solid #d1d9ff'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <CodeIcon sx={{ fontSize: '0.8rem', color: '#3f51b5' }} />
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#3f51b5' }}>
              Technical Specifications & Compliance
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                Encryption Standard
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                AES-256-GCM
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                Hashing Algorithm
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                SHA-256
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                Key Exchange
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                ECDHE-RSA
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                Audit Trail
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                ISO 27001 Compliant
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Acceptance Summary */}
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          mb: 2, 
          bgcolor: '#f8f9fa', 
          borderRadius: 0.5,
          border: '1px solid #e9ecef'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#333', display: 'block' }}>
                Acceptance Progress
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>
                {Object.values(acceptedSections).filter(v => v).length} of {Object.keys(acceptedSections).length} sections accepted
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {allSectionsAccepted ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: '0.9rem', color: '#2e7d32' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#2e7d32' }}>
                    Complete
                  </Typography>
                </>
              ) : (
                <>
                  <WarningIcon sx={{ fontSize: '0.9rem', color: '#ed6c02' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#ed6c02' }}>
                    Incomplete
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {Object.entries(acceptedSections).map(([key, accepted]) => (
                <Chip
                  key={key}
                  label={sectionDetails[key].title}
                  size="small"
                  icon={accepted ? <CheckIcon /> : <CancelIcon />}
                  color={accepted ? "success" : "default"}
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: 20 }}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Decline Section */}
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          mb: 2, 
          bgcolor: '#fff8e1', 
          borderRadius: 0.5,
          border: '1px solid #ffe57f'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
            <WarningIcon sx={{ fontSize: '0.9rem', color: '#ed6c02', mt: 0.25 }} />
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#ed6c02' }}>
                Decline Terms & Conditions
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#ed6c02', display: 'block' }}>
                Important: Declining will cancel the signing process
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ 
            fontSize: '0.7rem', 
            lineHeight: 1.4,
            color: '#666',
            display: 'block',
            mb: 1
          }}>
            If you cannot accept these terms, you must provide a detailed reason below. This action will terminate the signing session and notify all parties involved.
          </Typography>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Provide detailed reason for declining terms (required)..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              borderRadius: '3px',
              border: '1px solid #ffcc80',
              fontSize: '0.75rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              backgroundColor: 'white',
              lineHeight: '1.5'
            }}
          />
          <Typography variant="caption" sx={{ 
            fontSize: '0.65rem', 
            color: '#666',
            display: 'block',
            mt: 0.5
          }}>
            Note: Your decline reason will be recorded in the audit trail and shared with the document sender.
          </Typography>
        </Paper>

        {/* Contact Information */}
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          mb: 2, 
          bgcolor: '#e8f5e9', 
          borderRadius: 0.5,
          border: '1px solid #c8e6c9'
        }}>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#2e7d32', display: 'block', mb: 0.5 }}>
            Need Assistance?
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                <MailIcon sx={{ fontSize: '0.7rem', verticalAlign: 'middle', mr: 0.5 }} />
                Support Email
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                legal@safe-sign.com
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                <PhoneIcon sx={{ fontSize: '0.7rem', verticalAlign: 'middle', mr: 0.5 }} />
                Legal Support
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                +1 (800) 123-4567
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Scroll Indicator */}
        {!isScrolledToBottom && (
          <Fade in={!isScrolledToBottom}>
            <Box sx={{ 
              position: 'sticky', 
              bottom: 0, 
              bgcolor: 'rgba(255,255,255,0.95)', 
              py: 1, 
              textAlign: 'center',
              borderTop: '1px solid #e0e0e0',
              mt: 2,
              backdropFilter: 'blur(4px)'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                <ExpandMoreIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '0.7rem' }} />
                Continue scrolling to review all terms
              </Typography>
            </Box>
          </Fade>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 1.5,
        borderTop: '1px solid #e0e0e0',
        bgcolor: '#f8f9fa'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          {/* Left side actions */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Print Terms">
              <Button
                size="small"
                startIcon={<PrintIcon sx={{ fontSize: '0.8rem' }} />}
                sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </Tooltip>
            <Tooltip title="Download PDF">
              <Button
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: '0.8rem' }} />}
                sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
              >
                Save
              </Button>
            </Tooltip>
          </Box>

          {/* Center - Accept All Button */}
          <Zoom in={!allSectionsAccepted}>
            <Button
              variant="contained"
              color="success"
              onClick={handleAcceptAll}
              disabled={allSectionsAccepted}
              size="small"
              startIcon={<CheckCircleIcon sx={{ fontSize: '0.8rem' }} />}
              sx={{
                fontSize: '0.75rem',
                py: 0.5,
                px: 2,
                minWidth: '140px',
                fontWeight: 500,
                bgcolor: allSectionsAccepted ? '#81c784' : '#4caf50',
                '&:hover': {
                  bgcolor: '#388e3c'
                }
              }}
            >
              ACCEPT ALL
            </Button>
          </Zoom>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDecline}
              disabled={!declineReason.trim()}
              size="small"
              startIcon={<CloseIcon sx={{ fontSize: '0.8rem' }} />}
              sx={{
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                minWidth: '110px'
              }}
            >
              DECLINE
            </Button>
            
            <Button
              variant="contained"
              onClick={handleAccept}
              disabled={required && !allSectionsAccepted}
              size="small"
              startIcon={<VerifiedIcon sx={{ fontSize: '0.8rem' }} />}
              sx={{
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                minWidth: '110px',
                fontWeight: 500,
                bgcolor: allSectionsAccepted ? '#1b5e20' : '#bdbdbd',
                '&:hover': {
                  bgcolor: allSectionsAccepted ? '#0d3c13' : '#9e9e9e'
                },
                '&.Mui-disabled': {
                  bgcolor: '#e0e0e0',
                  color: '#9e9e9e'
                }
              }}
            >
              CONTINUE
            </Button>
          </Box>
        </Box>
      </DialogActions>

      {/* Acceptance Status Footer */}
      <Box sx={{ 
        bgcolor: allSectionsAccepted ? '#e8f5e9' : '#fff3e0',
        borderTop: '1px solid',
        borderTopColor: allSectionsAccepted ? '#c8e6c9' : '#ffccbc',
        p: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: 'md',
          mx: 'auto'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {allSectionsAccepted ? (
              <>
                <CheckCircleIcon sx={{ fontSize: '0.8rem', color: '#2e7d32' }} />
                <Typography variant="caption" sx={{ 
                  fontSize: '0.7rem',
                  color: '#2e7d32',
                  fontWeight: 500
                }}>
                  ✓ All terms accepted - Ready to proceed
                </Typography>
              </>
            ) : (
              <>
                <WarningIcon sx={{ fontSize: '0.8rem', color: '#f57c00' }} />
                <Typography variant="caption" sx={{ 
                  fontSize: '0.7rem',
                  color: '#f57c00',
                  fontWeight: 500
                }}>
                  Review and accept all {Object.keys(acceptedSections).length} sections above
                </Typography>
              </>
            )}
          </Box>
          <Typography variant="caption" sx={{ 
            fontSize: '0.65rem',
            color: '#666'
          }}>
            Session ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TermsDialog;