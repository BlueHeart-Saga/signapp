// import React, { useState } from 'react';
// import { 
//   FaUser, 
//   FaEnvelope, 
//   FaPlus, 
//   FaTimes, 
//   FaCheck,
//   FaUserPlus,
//   FaFileAlt,
//   FaArrowRight,
//   FaEdit,
//   FaTrash,
//   FaCopy,
//   FaUsers
// } from 'react-icons/fa';

// export default function RecipientSelect() {
//   const [recipients, setRecipients] = useState([
//     {
//       id: 1,
//       name: 'John Smith',
//       email: 'john.smith@company.com',
//       role: 'Signer',
//       color: '#3B82F6',
//       order: 1
//     },
//     {
//       id: 2,
//       name: 'Sarah Johnson',
//       email: 'sarah.j@company.com',
//       role: 'Approver',
//       color: '#10B981',
//       order: 2
//     }
//   ]);

//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newRecipient, setNewRecipient] = useState({
//     name: '',
//     email: '',
//     role: 'Signer'
//   });

//   const roles = [
//     { value: 'Signer', label: 'Needs to Sign', icon: <FaEdit />, color: '#3B82F6' },
//     { value: 'Approver', label: 'Needs to Approve', icon: <FaCheck />, color: '#10B981' },
//     { value: 'CC', label: 'Receives a Copy', icon: <FaCopy />, color: '#6B7280' },
//     { value: 'Viewer', label: 'View Only', icon: <FaUser />, color: '#8B5CF6' }
//   ];

//   const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

//   const handleAddRecipient = () => {
//     if (newRecipient.name && newRecipient.email) {
//       const roleColor = roles.find(r => r.value === newRecipient.role)?.color || '#3B82F6';
//       setRecipients([
//         ...recipients,
//         {
//           id: Date.now(),
//           ...newRecipient,
//           color: roleColor,
//           order: recipients.length + 1
//         }
//       ]);
//       setNewRecipient({ name: '', email: '', role: 'Signer' });
//       setShowAddForm(false);
//     }
//   };

//   const handleRemoveRecipient = (id) => {
//     setRecipients(recipients.filter(r => r.id !== id));
//   };

//   const handleRoleChange = (id, newRole) => {
//     const roleColor = roles.find(r => r.value === newRole)?.color || '#3B82F6';
//     setRecipients(recipients.map(r => 
//       r.id === id ? { ...r, role: newRole, color: roleColor } : r
//     ));
//   };

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       padding: '40px 20px',
//       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
//     }}>
//       <div style={{
//         maxWidth: '900px',
//         margin: '0 auto'
//       }}>
//         {/* Header */}
//         <div style={{
//           textAlign: 'center',
//           marginBottom: '40px'
//         }}>
//           <div style={{
//             display: 'inline-flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             width: '64px',
//             height: '64px',
//             background: 'rgba(255, 255, 255, 0.2)',
//             backdropFilter: 'blur(10px)',
//             borderRadius: '16px',
//             marginBottom: '16px'
//           }}>
//             <FaUsers size={28} color="white" />
//           </div>
//           <h1 style={{
//             fontSize: '32px',
//             fontWeight: '700',
//             color: 'white',
//             margin: '0 0 8px',
//             textShadow: '0 2px 10px rgba(0,0,0,0.1)'
//           }}>
//             Add Recipients
//           </h1>
//           <p style={{
//             fontSize: '16px',
//             color: 'rgba(255, 255, 255, 0.9)',
//             margin: 0
//           }}>
//             Add people who need to sign or review this document
//           </p>
//         </div>

//         {/* Main Card */}
//         <div style={{
//           background: 'white',
//           borderRadius: '16px',
//           boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
//           overflow: 'hidden'
//         }}>
//           {/* Document Info Banner */}
//           <div style={{
//             background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
//             padding: '20px 24px',
//             borderBottom: '1px solid #e5e7eb',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '16px'
//           }}>
//             <div style={{
//               width: '48px',
//               height: '48px',
//               background: 'white',
//               borderRadius: '12px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
//             }}>
//               <FaFileAlt size={20} color="#667eea" />
//             </div>
//             <div style={{ flex: 1 }}>
//               <div style={{
//                 fontSize: '16px',
//                 fontWeight: '600',
//                 color: '#1f2937',
//                 marginBottom: '4px'
//               }}>
//                 Contract_Agreement_2024.pdf
//               </div>
//               <div style={{
//                 fontSize: '13px',
//                 color: '#6b7280'
//               }}>
//                 12 pages • 2.4 MB
//               </div>
//             </div>
//           </div>

//           {/* Recipients List */}
//           <div style={{ padding: '24px' }}>
//             <div style={{
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//               marginBottom: '20px'
//             }}>
//               <h3 style={{
//                 fontSize: '18px',
//                 fontWeight: '600',
//                 color: '#1f2937',
//                 margin: 0
//               }}>
//                 Recipients ({recipients.length})
//               </h3>
//               <button
//                 onClick={() => setShowAddForm(true)}
//                 style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '8px',
//                   padding: '8px 16px',
//                   background: '#667eea',
//                   color: 'white',
//                   border: 'none',
//                   borderRadius: '8px',
//                   fontSize: '14px',
//                   fontWeight: '600',
//                   cursor: 'pointer',
//                   transition: 'all 0.2s'
//                 }}
//                 onMouseEnter={(e) => {
//                   e.target.style.background = '#5568d3';
//                   e.target.style.transform = 'translateY(-2px)';
//                 }}
//                 onMouseLeave={(e) => {
//                   e.target.style.background = '#667eea';
//                   e.target.style.transform = 'translateY(0)';
//                 }}
//               >
//                 <FaPlus size={12} />
//                 Add Recipient
//               </button>
//             </div>

//             {/* Recipient Cards */}
//             <div style={{
//               display: 'flex',
//               flexDirection: 'column',
//               gap: '12px',
//               marginBottom: '20px'
//             }}>
//               {recipients.map((recipient, index) => (
//                 <div
//                   key={recipient.id}
//                   style={{
//                     background: '#f9fafb',
//                     border: '2px solid #e5e7eb',
//                     borderRadius: '12px',
//                     padding: '16px',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '16px',
//                     transition: 'all 0.2s'
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.borderColor = recipient.color;
//                     e.currentTarget.style.background = '#ffffff';
//                     e.currentTarget.style.boxShadow = `0 4px 12px ${recipient.color}20`;
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.borderColor = '#e5e7eb';
//                     e.currentTarget.style.background = '#f9fafb';
//                     e.currentTarget.style.boxShadow = 'none';
//                   }}
//                 >
//                   {/* Order Number */}
//                   <div style={{
//                     width: '32px',
//                     height: '32px',
//                     background: recipient.color,
//                     color: 'white',
//                     borderRadius: '8px',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     fontSize: '14px',
//                     fontWeight: '700',
//                     flexShrink: 0
//                   }}>
//                     {index + 1}
//                   </div>

//                   {/* Avatar */}
//                   <div style={{
//                     width: '48px',
//                     height: '48px',
//                     background: `${recipient.color}15`,
//                     color: recipient.color,
//                     borderRadius: '12px',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     fontSize: '18px',
//                     fontWeight: '600',
//                     flexShrink: 0
//                   }}>
//                     {recipient.name.split(' ').map(n => n[0]).join('')}
//                   </div>

//                   {/* Info */}
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <div style={{
//                       fontSize: '15px',
//                       fontWeight: '600',
//                       color: '#1f2937',
//                       marginBottom: '4px'
//                     }}>
//                       {recipient.name}
//                     </div>
//                     <div style={{
//                       fontSize: '13px',
//                       color: '#6b7280',
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: '6px'
//                     }}>
//                       <FaEnvelope size={11} />
//                       {recipient.email}
//                     </div>
//                   </div>

//                   {/* Role Selector */}
//                   <select
//                     value={recipient.role}
//                     onChange={(e) => handleRoleChange(recipient.id, e.target.value)}
//                     style={{
//                       padding: '8px 12px',
//                       fontSize: '13px',
//                       fontWeight: '500',
//                       border: '1px solid #e5e7eb',
//                       borderRadius: '8px',
//                       background: 'white',
//                       color: recipient.color,
//                       cursor: 'pointer',
//                       outline: 'none'
//                     }}
//                   >
//                     {roles.map(role => (
//                       <option key={role.value} value={role.value}>
//                         {role.value}
//                       </option>
//                     ))}
//                   </select>

//                   {/* Remove Button */}
//                   <button
//                     onClick={() => handleRemoveRecipient(recipient.id)}
//                     style={{
//                       width: '32px',
//                       height: '32px',
//                       background: 'transparent',
//                       border: '1px solid #e5e7eb',
//                       borderRadius: '8px',
//                       color: '#6b7280',
//                       cursor: 'pointer',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       transition: 'all 0.2s',
//                       flexShrink: 0
//                     }}
//                     onMouseEnter={(e) => {
//                       e.target.style.background = '#fee2e2';
//                       e.target.style.borderColor = '#fecaca';
//                       e.target.style.color = '#ef4444';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.target.style.background = 'transparent';
//                       e.target.style.borderColor = '#e5e7eb';
//                       e.target.style.color = '#6b7280';
//                     }}
//                   >
//                     <FaTrash size={12} />
//                   </button>
//                 </div>
//               ))}
//             </div>

//             {/* Add Form */}
//             {showAddForm && (
//               <div style={{
//                 background: '#f0f9ff',
//                 border: '2px dashed #3B82F6',
//                 borderRadius: '12px',
//                 padding: '20px',
//                 marginBottom: '20px'
//               }}>
//                 <div style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '12px',
//                   marginBottom: '16px'
//                 }}>
//                   <FaUserPlus color="#3B82F6" size={18} />
//                   <h4 style={{
//                     fontSize: '15px',
//                     fontWeight: '600',
//                     color: '#1f2937',
//                     margin: 0
//                   }}>
//                     Add New Recipient
//                   </h4>
//                 </div>

//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: '1fr 1fr',
//                   gap: '12px',
//                   marginBottom: '12px'
//                 }}>
//                   <div>
//                     <label style={{
//                       display: 'block',
//                       fontSize: '13px',
//                       fontWeight: '500',
//                       color: '#374151',
//                       marginBottom: '6px'
//                     }}>
//                       Full Name
//                     </label>
//                     <input
//                       type="text"
//                       value={newRecipient.name}
//                       onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
//                       placeholder="Enter name"
//                       style={{
//                         width: '100%',
//                         padding: '10px 12px',
//                         fontSize: '14px',
//                         border: '1px solid #d1d5db',
//                         borderRadius: '8px',
//                         outline: 'none',
//                         boxSizing: 'border-box'
//                       }}
//                     />
//                   </div>
//                   <div>
//                     <label style={{
//                       display: 'block',
//                       fontSize: '13px',
//                       fontWeight: '500',
//                       color: '#374151',
//                       marginBottom: '6px'
//                     }}>
//                       Email Address
//                     </label>
//                     <input
//                       type="email"
//                       value={newRecipient.email}
//                       onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
//                       placeholder="email@example.com"
//                       style={{
//                         width: '100%',
//                         padding: '10px 12px',
//                         fontSize: '14px',
//                         border: '1px solid #d1d5db',
//                         borderRadius: '8px',
//                         outline: 'none',
//                         boxSizing: 'border-box'
//                       }}
//                     />
//                   </div>
//                 </div>

//                 <div style={{ marginBottom: '16px' }}>
//                   <label style={{
//                     display: 'block',
//                     fontSize: '13px',
//                     fontWeight: '500',
//                     color: '#374151',
//                     marginBottom: '6px'
//                   }}>
//                     Role
//                   </label>
//                   <div style={{
//                     display: 'grid',
//                     gridTemplateColumns: 'repeat(2, 1fr)',
//                     gap: '8px'
//                   }}>
//                     {roles.map(role => (
//                       <div
//                         key={role.value}
//                         onClick={() => setNewRecipient({ ...newRecipient, role: role.value })}
//                         style={{
//                           padding: '12px',
//                           border: `2px solid ${newRecipient.role === role.value ? role.color : '#e5e7eb'}`,
//                           borderRadius: '8px',
//                           background: newRecipient.role === role.value ? `${role.color}10` : 'white',
//                           cursor: 'pointer',
//                           transition: 'all 0.2s',
//                           display: 'flex',
//                           alignItems: 'center',
//                           gap: '10px'
//                         }}
//                       >
//                         <div style={{ color: role.color, fontSize: '16px' }}>
//                           {role.icon}
//                         </div>
//                         <div style={{ flex: 1 }}>
//                           <div style={{
//                             fontSize: '13px',
//                             fontWeight: '600',
//                             color: '#1f2937'
//                           }}>
//                             {role.value}
//                           </div>
//                           <div style={{
//                             fontSize: '11px',
//                             color: '#6b7280'
//                           }}>
//                             {role.label}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div style={{
//                   display: 'flex',
//                   gap: '8px',
//                   justifyContent: 'flex-end'
//                 }}>
//                   <button
//                     onClick={() => {
//                       setShowAddForm(false);
//                       setNewRecipient({ name: '', email: '', role: 'Signer' });
//                     }}
//                     style={{
//                       padding: '8px 16px',
//                       background: 'white',
//                       color: '#6b7280',
//                       border: '1px solid #d1d5db',
//                       borderRadius: '8px',
//                       fontSize: '14px',
//                       fontWeight: '600',
//                       cursor: 'pointer',
//                       transition: 'all 0.2s'
//                     }}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleAddRecipient}
//                     disabled={!newRecipient.name || !newRecipient.email}
//                     style={{
//                       padding: '8px 16px',
//                       background: newRecipient.name && newRecipient.email ? '#3B82F6' : '#d1d5db',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '8px',
//                       fontSize: '14px',
//                       fontWeight: '600',
//                       cursor: newRecipient.name && newRecipient.email ? 'pointer' : 'not-allowed',
//                       transition: 'all 0.2s'
//                     }}
//                   >
//                     Add Recipient
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Info Box */}
//             <div style={{
//               background: '#fffbeb',
//               border: '1px solid #fde68a',
//               borderRadius: '10px',
//               padding: '14px 16px',
//               fontSize: '13px',
//               color: '#92400e',
//               lineHeight: '1.5'
//             }}>
//               <strong>💡 Tip:</strong> Recipients will receive the document in order. Each person must complete their action before the next person can access it.
//             </div>
//           </div>

//           {/* Footer Actions */}
//           <div style={{
//             background: '#f9fafb',
//             padding: '20px 24px',
//             borderTop: '1px solid #e5e7eb',
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center'
//           }}>
//             <button
//               style={{
//                 padding: '10px 20px',
//                 background: 'white',
//                 color: '#6b7280',
//                 border: '1px solid #d1d5db',
//                 borderRadius: '8px',
//                 fontSize: '14px',
//                 fontWeight: '600',
//                 cursor: 'pointer',
//                 transition: 'all 0.2s'
//               }}
//               onMouseEnter={(e) => {
//                 e.target.style.borderColor = '#9ca3af';
//                 e.target.style.color = '#374151';
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.borderColor = '#d1d5db';
//                 e.target.style.color = '#6b7280';
//               }}
//             >
//               Save as Draft
//             </button>
//             <button
//               disabled={recipients.length === 0}
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '8px',
//                 padding: '12px 24px',
//                 background: recipients.length > 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '8px',
//                 fontSize: '15px',
//                 fontWeight: '600',
//                 cursor: recipients.length > 0 ? 'pointer' : 'not-allowed',
//                 transition: 'all 0.2s',
//                 boxShadow: recipients.length > 0 ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
//               }}
//               onMouseEnter={(e) => {
//                 if (recipients.length > 0) {
//                   e.target.style.transform = 'translateY(-2px)';
//                   e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 if (recipients.length > 0) {
//                   e.target.style.transform = 'translateY(0)';
//                   e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
//                 }
//               }}
//             >
//               Continue to Sign
//               <FaArrowRight size={14} />
//             </button>
//           </div>
//         </div>

//         {/* Stats */}
//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(3, 1fr)',
//           gap: '16px',
//           marginTop: '24px'
//         }}>
//           {[
//             { label: 'Total Recipients', value: recipients.length, icon: <FaUsers /> },
//             { label: 'Signers', value: recipients.filter(r => r.role === 'Signer').length, icon: <FaEdit /> },
//             { label: 'Approvers', value: recipients.filter(r => r.role === 'Approver').length, icon: <FaCheck /> }
//           ].map((stat, i) => (
//             <div
//               key={i}
//               style={{
//                 background: 'rgba(255, 255, 255, 0.15)',
//                 backdropFilter: 'blur(10px)',
//                 border: '1px solid rgba(255, 255, 255, 0.2)',
//                 borderRadius: '12px',
//                 padding: '16px',
//                 textAlign: 'center',
//                 color: 'white'
//               }}
//             >
//               <div style={{ fontSize: '20px', marginBottom: '8px' }}>
//                 {stat.icon}
//               </div>
//               <div style={{
//                 fontSize: '28px',
//                 fontWeight: '700',
//                 marginBottom: '4px'
//               }}>
//                 {stat.value}
//               </div>
//               <div style={{
//                 fontSize: '13px',
//                 opacity: 0.9
//               }}>
//                 {stat.label}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
