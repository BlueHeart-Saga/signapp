import React from 'react';
import { Check, X } from 'lucide-react';

function FeatureComparisonTable() {
  const features = [
    {
      category: 'FEATURE',
      items: [
        {
          name: 'Monthly Envelopes',
          starter: '10',
          professional: 'Unlimited',
          enterprise: 'Unlimited'
        },
        {
          name: 'Templates',
          starter: 'Basic (3)',
          professional: 'Shared & Custom',
          enterprise: 'Advanced Library'
        },
        {
          name: 'Reusable Fields',
          starter: 'Limited',
          professional: 'Unlimited',
          enterprise: 'Unlimited'
        }
      ]
    },
    {
      category: 'SECURITY & COMPLIANCE',
      items: [
        {
          name: 'Real-time Audit Trails',
          starter: <Check size={16} color="#10b981" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'SOC2 / HIPAA Compliance',
          starter: <X size={16} color="#ef4444" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'Two-Factor Authentication',
          starter: <Check size={16} color="#10b981" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'SSO Integration (SAML)',
          starter: <X size={16} color="#ef4444" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        }
      ]
    },
    {
      category: 'WORKFLOW & INTEGRATION',
      items: [
        {
          name: 'Bulk Send',
          starter: <X size={16} color="#ef4444" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'Signer Attachments',
          starter: <X size={16} color="#ef4444" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'API Access',
          starter: <X size={16} color="#ef4444" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        },
        {
          name: 'CRM Integrations',
          starter: <X size={16} color="#ef4444" />,
          professional: <Check size={16} color="#10b981" />,
          enterprise: <Check size={16} color="#10b981" />
        }
      ]
    },
    {
      category: 'SUPPORT',
      items: [
        {
          name: 'Customer Support',
          starter: 'Email Support (48h)',
          professional: 'Standard',
          enterprise: 'Premium & Custom'
        },
        {
          name: 'Priority Support',
          starter: '—',
          professional: '●',
          enterprise: '●'
        },
        {
          name: 'Dedicated Success Manager',
          starter: '—',
          professional: '—',
          enterprise: '24/7 Dedicated Support'
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
                  fontWeight: '600',
                  color: '#0f766e',
                  textAlign: 'center',
                  borderBottom: '2px solid #e5e7eb',
                  width: '25%'
                }}>
                  Starter
                </th>
                <th style={{
                  padding: '20px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#10b981',
                  textAlign: 'center',
                  borderBottom: '2px solid #e5e7eb',
                  width: '25%'
                }}>
                  Professional
                </th>
                <th style={{
                  padding: '20px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f6cc36',
                  textAlign: 'center',
                  borderBottom: '2px solid #e5e7eb',
                  width: '25%'
                }}>
                  Enterprise
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
                        fontWeight: item.name.includes('SUPPORT') ? '400' : '500'
                      }}>
                        {item.starter}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#4b5563',
                        textAlign: 'center',
                        fontWeight: item.name.includes('SUPPORT') ? '400' : '500'
                      }}>
                        {item.professional}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#4b5563',
                        textAlign: 'center',
                        fontWeight: item.name.includes('SUPPORT') ? '400' : '500'
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
