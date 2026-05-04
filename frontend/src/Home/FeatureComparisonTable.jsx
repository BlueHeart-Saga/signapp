import React from 'react';
import { Check, X } from 'lucide-react';

function FeatureComparisonTable() {
  const features = [
    {
      category: 'DOCUMENT FEATURES',
      items: [
        {
          name: 'Monthly Envelopes',
          basic: 'Unlimited',
          standard: 'Unlimited',
          enterprise: 'Unlimited'
        },
        {
          name: 'Templates',
          basic: 'Basic (5)',
          standard: 'Unlimited',
          enterprise: 'Advanced Library'
        },
        {
          name: 'Reusable Fields',
          basic: <Check size={16} color="#10b981" />,
          standard: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'AI Document Parsing',
          basic: <X size={16} color="#ef4444" />,
          standard: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        }
      ]
    },
    {
      category: 'SECURITY & COMPLIANCE',
      items: [
        {
          name: 'Real-time Audit Trails',
          basic: <Check size={16} color="#10b981" />,
          standard: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'SOC2 Compliance',
          basic: <Check size={16} color="#10b981" />,
          standard: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'Two-Factor Authentication',
          basic: <Check size={16} color="#10b981" />,
          standard: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'SSO Integration (SAML)',
          basic: <X size={16} color="#ef4444" />,
          standard: <X size={16} color="#ef4444" />,
          enterprise: <Check size={16} color="#10b981" />
        }
      ]
    },
    {
      category: 'WORKFLOW & INTEGRATION',
      items: [
        {
          name: 'Bulk Send',
          basic: <X size={16} color="#ef4444" />,
          standard: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'Custom Branding (Logos)',
          basic: <X size={16} color="#ef4444" />,
          standard: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'API Access',
          basic: <X size={16} color="#ef4444" />,
          standard: <X size={16} color="#ef4444" />,
          enterprise: <Check size={16} color="#10b981" />
        }
      ]
    },
    {
      category: 'SUPPORT',
      items: [
        {
          name: 'Customer Support',
          basic: 'Standard Email',
          standard: 'Priority Chat',
          enterprise: 'Dedicated Manager'
        },
        {
          name: 'Response Time',
          basic: '48 Hours',
          standard: '24 Hours',
          enterprise: '< 1 Hour'
        },
        {
          name: 'SLA Guarantee',
          basic: <X size={16} color="#ef4444" />,
          standard: <X size={16} color="#ef4444" />,
          enterprise: <Check size={16} color="#10b981" />
        }
      ]
    }
  ];

  return (
    <div style={{
      width: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '60px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          overflowX: 'auto',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '800px'
          }}>
            {/* Table Header */}
            <thead>
              <tr style={{
                background: '#f9fafb'
              }}>
                <th style={{
                  padding: '20px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  textAlign: 'left',
                  borderBottom: '2px solid #e5e7eb',
                  width: '25%'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>FEATURE</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '400'
                  }}>Compare all plans</div>
                </th>
                <th style={{
                  padding: '20px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#ff6a34',
                  textAlign: 'center',
                  borderBottom: '2px solid #e5e7eb',
                  width: '25%'
                }}>
                  BASIC
                </th>
                <th style={{
                  padding: '20px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#1e6afb',
                  textAlign: 'center',
                  borderBottom: '2px solid #e5e7eb',
                  width: '25%'
                }}>
                  STANDARD
                </th>
                <th style={{
                  padding: '20px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#00c25a',
                  textAlign: 'center',
                  borderBottom: '2px solid #e5e7eb',
                  width: '25%'
                }}>
                  ENTERPRISE
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {features.map((category, categoryIndex) => (
                <React.Fragment key={categoryIndex}>
                  {/* Category Separator */}
                  {categoryIndex > 0 && (
                    <tr>
                      <td colSpan="4" style={{
                        padding: '16px 0',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          height: '1px',
                          background: '#e5e7eb',
                          width: '100%'
                        }}></div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Category Header */}
                  <tr style={{
                    background: '#f9fafb'
                  }}>
                    <td colSpan="4" style={{
                      padding: '16px 24px',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#111827',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {category.category}
                    </td>
                  </tr>

                  {/* Category Items */}
                  {category.items.map((item, itemIndex) => (
                    <tr 
                      key={itemIndex}
                      style={{
                        borderBottom: itemIndex === category.items.length - 1 
                          ? '2px solid #e5e7eb' 
                          : '1px solid #f3f4f6',
                        background: itemIndex % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}
                    >
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        {item.name}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#4b5563',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {item.basic}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#4b5563',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {item.standard}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#4b5563',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {item.enterprise}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <div style={{
          marginTop: '24px',
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          <p>● = Included, — = Not included</p>
        </div>
      </div>
    </div>
  );
}

export default FeatureComparisonTable;
