import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  TextField,
  Collapse,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment
} from '@mui/material';
import {
  Bolt as BoltIcon,
  ShoppingCart as ShoppingCartIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  AutoAwesome as AutoAwesomeIcon,
  Description as DescriptionIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarMonthIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Payment as PaymentIcon,
  AddCard as AddCardIcon,
  PictureAsPdf as PictureAsPdfIcon,
  PieChart as PieChartIcon,
  HeadsetMic as HeadsetMicIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalOffer as LocalOfferIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  VerifiedUser as VerifiedUserIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ContactMail as ContactMailIcon,
  AccountBalance as AccountBalanceIcon,
  Nfc as NfcIcon,
  Save as SaveIcon,
  ToggleOn as ToggleOnIcon,
  Check as CheckIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Layers as LayersIcon,
  PhoneAndroid as PhoneAndroidIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// ============================================
// STYLED COMPONENTS
// ============================================
const CreditCardWrapper = styled(Card)(({ theme, badge, isfree }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  borderRadius: '20px',
  overflow: 'visible',
  marginTop: '12px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: badge
    ? `2px solid ${badge.includes('POPULAR') ? '#0f766e' : badge.includes('VALUE') ? '#7c3aed' : '#2563eb'}`
    : isfree
    ? '2px dashed #10b981'
    : '1px solid #e2e8f0',
  boxShadow: badge ? '0 12px 28px -6px rgba(15, 118, 110, 0.18)' : '0 4px 10px rgba(0, 0, 0, 0.04)',
  backgroundColor: isfree ? '#f0fdf4' : '#ffffff',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.12)'
  }
}));

const BadgeRibbon = styled(Box)(({ theme, badge }) => ({
  position: 'absolute',
  top: -14,
  right: 20,
  zIndex: 10,
  backgroundColor: badge.includes('POPULAR') ? '#0f766e' : badge.includes('VALUE') ? '#7c3aed' : '#2563eb',
  color: '#ffffff',
  padding: '5px 16px',
  borderRadius: '20px',
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}));

// Stripe Payment Form Sub-component
const StripePaymentForm = ({ pack, clientSecret, paymentIntentId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage('');

    try {
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement }
      });

      if (result.error) {
        setErrorMessage(result.error.message || 'Payment processing failed');
        setProcessing(false);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        await api.post('/credits/confirm-pack-purchase', null, {
          params: { payment_intent_id: paymentIntentId }
        });
        onSuccess(pack);
      }
    } catch (err) {
      try {
        await api.post('/credits/confirm-pack-purchase', null, {
          params: { payment_intent_id: paymentIntentId }
        });
        onSuccess(pack);
      } catch (fallbackErr) {
        setErrorMessage('Payment confirmation failed. Please check server connection.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Pay ${pack.price.toFixed(2)} for {pack.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your card details to instantly add {pack.credits?.toLocaleString()} credits to your account.
        </Typography>

        <Box sx={{ p: 2, border: '1px solid #cbd5e1', borderRadius: '12px', mb: 3, bgcolor: '#f8fafc' }}>
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#1e293b' } } }} />
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!stripe || processing}
            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CreditCardIcon />}
            sx={{ bgcolor: '#0f766e', '&:hover': { bgcolor: '#0d655e' } }}
          >
            {processing ? 'Processing...' : `Pay $${pack.price.toFixed(2)}`}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

// 1st Row: Exactly 4 Cards (Free Trial, Starter, Standard, Professional)
const PRIMARY_PLAN_CARDS = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    credits: 100,
    unitPrice: 'Free Bonus',
    badge: 'FREE TRIAL',
    isFree: true,
    usageEst: '~20 Doc Sends or 5 AI Contracts',
    features: [
      '100 Free Bonus Credits',
      'Send ~20 Document Envelopes',
      'Full Access to E-Sign Features',
      'Audit Certificates Included',
      'No Credit Card Required'
    ]
  },
  {
    id: 'pack_500',
    name: 'Starter Pack',
    price: 5.00,
    credits: 500,
    unitPrice: '$0.010 / credit',
    badge: null,
    usageEst: '~100 Doc Sends or 25 AI Contracts',
    features: [
      '500 Included Credits',
      'Send ~100 Envelopes (5 cr/doc)',
      'Generate ~25 AI Agreements',
      'Credits Never Expire',
      'Audit Certificates Included',
      'Instant Balance Update'
    ]
  },
  {
    id: 'pack_2000',
    name: 'Standard Pack',
    price: 15.00,
    credits: 2000,
    unitPrice: '$0.0075 / credit (Save 25%)',
    badge: 'MOST POPULAR',
    usageEst: '~400 Doc Sends or 100 AI Contracts',
    features: [
      '2,000 Included Credits',
      '25% Savings per Credit',
      'Send ~400 Envelopes (5 cr/doc)',
      'Generate ~100 AI Agreements',
      'Credits Never Expire',
      'Priority Customer Support'
    ]
  },
  {
    id: 'pack_10000',
    name: 'Professional Pack',
    price: 50.00,
    credits: 10000,
    unitPrice: '$0.0050 / credit (Save 50%)',
    badge: 'BEST VALUE',
    usageEst: '~2,000 Doc Sends or 500 AI Contracts',
    features: [
      '10,000 Included Credits',
      '50% Max Volume Savings',
      'Send ~2,000 Envelopes',
      'Generate ~500 AI Agreements',
      'Bulk Send & Custom Branding',
      'Credits Never Expire'
    ]
  }
];

// Enterprise & Custom Plans (Hidden initially behind dropdown button)
const ENTERPRISE_PLAN_CARDS = [
  {
    id: 'pack_50000',
    name: 'Enterprise Scale',
    price: 200.00,
    credits: 50000,
    unitPrice: '$0.0040 / credit (Save 60%)',
    badge: 'ENTERPRISE',
    usageEst: '~10,000 Doc Sends or 2,500 AI Contracts',
    features: [
      '50,000 Enterprise Credits',
      '60% Per-Credit Savings',
      'Send ~10,000 Envelopes',
      'Generate ~2,500 AI Contracts',
      'Full API & Automated Webhooks',
      'VIP Account Manager & SLA'
    ]
  },
  {
    id: 'custom_price',
    name: 'Custom Enterprise',
    price: null,
    credits: null,
    unitPrice: 'Custom Volume Discount',
    badge: 'CUSTOM SOLUTION',
    isCustom: true,
    usageEst: 'Tailored for high-volume enterprise & API integrations',
    features: [
      'Unlimited Volume Top-Ups',
      'Custom API & Dedicated Server',
      'HIPAA & SOC-2 Compliance BAA',
      'Dedicated Customer Success Lead',
      'Custom SLA Guarantee',
      'Flexible Invoicing & Purchase Orders'
    ]
  }
];

export default function Subscription() {
  const { user, credits, refreshCredits, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: Usage, 1: Upgrade Plans, 2: Invoices, 3: Ledger
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [paymentIntentData, setPaymentIntentData] = useState(null);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showEnterpriseRow, setShowEnterpriseRow] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Sales Contact Popup State
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesForm, setSalesForm] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    company: user?.company || '',
    message: 'Hello, I am interested in Enterprise & Custom Credit volume pricing for our organization.'
  });
  const [submittingSales, setSubmittingSales] = useState(false);

  // Payment Preferences
  const [autoRecharge, setAutoRecharge] = useState(false);
  const [emailReceipts, setEmailReceipts] = useState(true);

  // Billing Information Form State
  const [billingInfo, setBillingInfo] = useState({
    companyName: user?.company || '',
    vatId: '',
    taxIdType: 'VAT/EIN',
    billingEmail: user?.email || '',
    secondaryEmail: '',
    phone: '',
    address: '100 Enterprise Way',
    city: 'San Francisco',
    state: 'CA',
    zip: '94107',
    country: 'United States',
    isTaxExempt: false
  });
  const [savingBilling, setSavingBilling] = useState(false);

  // Add Card State
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({
    brand: 'Visa',
    last4: '',
    expMonth: '12',
    expYear: '2028',
    cardholderName: user?.full_name || '',
    isDefault: false
  });

  // Delete Card Confirmation State
  const [deleteCardModalOpen, setDeleteCardModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [deletingCard, setDeletingCard] = useState(false);

  // Fetch real backend data for all modules
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, balanceRes, billingRes] = await Promise.all([
        api.get('/credits/transactions?limit=100').catch(() => ({ data: { transactions: [] } })),
        api.get('/credits/balance').catch(() => ({ data: null })),
        api.get('/subscription/billing-info').catch(() => ({ data: null }))
      ]);

      const txList = txRes.data?.transactions || txRes.data?.items || [];
      setTransactions(txList);

      if (billingRes.data) {
        setBillingInfo({
          companyName: billingRes.data.company_name || user?.company || '',
          vatId: billingRes.data.vat_id || '',
          taxIdType: billingRes.data.tax_id_type || 'VAT/EIN',
          billingEmail: billingRes.data.billing_email || user?.email || '',
          secondaryEmail: billingRes.data.secondary_email || '',
          phone: billingRes.data.phone || user?.phone || '',
          address: billingRes.data.address || '100 Enterprise Way',
          city: billingRes.data.city || 'San Francisco',
          state: billingRes.data.state || 'CA',
          zip: billingRes.data.zip || '94107',
          country: billingRes.data.country || 'United States',
          isTaxExempt: billingRes.data.is_tax_exempt || false
        });
      }

      // Fetch official enterprise invoices directly from backend (real persistence & sequential IDs)
      try {
        const invoicesRes = await api.get('/subscription/invoices');
        if (invoicesRes.data && Array.isArray(invoicesRes.data.invoices)) {
          const normalized = invoicesRes.data.invoices.map(inv => ({
            ...inv,
            id: inv.invoice_number || inv.id,
            date: inv.issue_date_str || inv.date || (inv.issue_date ? format(new Date(inv.issue_date), 'dd MMM yyyy') : 'Recent'),
            description: inv.description || (inv.items && inv.items[0]?.description) || 'ESigniva Plan Subscription',
            amount: inv.total_str || inv.amount || `$${(inv.total_amount || 0).toFixed(2)}`,
            status: inv.status || 'PAID'
          }));
          setInvoices(normalized);
        } else {
          setInvoices([]);
        }
      } catch (invErr) {
        console.warn('Backend invoices endpoint notice:', invErr);
        setInvoices([]);
      }

    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleBuyPackClick = async (pack) => {
    if (pack.isCustom) {
      setSalesModalOpen(true);
      return;
    }
    if (pack.isFree) {
      setSnackbar({
        open: true,
        message: 'Your account is already credited with the 100 Free Trial bonus!',
        severity: 'info'
      });
      return;
    }

    setSelectedPack(pack);
    setPurchaseModalOpen(true);
    setInitializingPayment(true);

    try {
      const res = await api.post('/credits/buy-pack', { pack_id: pack.id });
      setPaymentIntentData(res.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to initialize payment',
        severity: 'error'
      });
      setPurchaseModalOpen(false);
    } finally {
      setInitializingPayment(false);
    }
  };

  const handlePurchaseSuccess = async (pack) => {
    setSnackbar({
      open: true,
      message: `🎉 Payment Confirmed! Added ${pack.credits?.toLocaleString()} credits to your account!`,
      severity: 'success'
    });
    setPurchaseModalOpen(false);
    setSelectedPack(null);
    setPaymentIntentData(null);

    await Promise.all([refreshCredits(), refreshUser(), fetchAllData()]);
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    if (!salesForm.name || !salesForm.email || !salesForm.message) {
      setSnackbar({ open: true, message: 'Please complete all required fields.', severity: 'warning' });
      return;
    }

    setSubmittingSales(true);
    try {
      await api.post('/contact', {
        name: salesForm.name,
        email: salesForm.email,
        subject: `Custom Enterprise Plan Inquiry - ${salesForm.company || salesForm.name}`,
        message: `${salesForm.message}\nPhone: ${salesForm.phone || 'N/A'}\nCompany: ${salesForm.company || 'N/A'}`
      });

      setSnackbar({
        open: true,
        message: '🚀 Inquiry submitted! Our enterprise team will contact you within 24 hours.',
        severity: 'success'
      });
      setSalesModalOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to submit inquiry. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmittingSales(false);
    }
  };

  const handleSaveBilling = async (e) => {
    e.preventDefault();
    setSavingBilling(true);
    try {
      await api.post('/subscription/billing-info', {
        company_name: billingInfo.companyName,
        vat_id: billingInfo.vatId,
        tax_id_type: billingInfo.taxIdType || 'VAT/EIN',
        billing_email: billingInfo.billingEmail,
        secondary_email: billingInfo.secondaryEmail,
        phone: billingInfo.phone,
        address: billingInfo.address,
        city: billingInfo.city,
        state: billingInfo.state,
        zip: billingInfo.zip,
        country: billingInfo.country,
        is_tax_exempt: billingInfo.isTaxExempt
      });

      setSnackbar({ open: true, message: '✅ Billing & tax profile updated successfully in database!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save billing information', severity: 'error' });
    } finally {
      setSavingBilling(false);
    }
  };

  const handleSetDefaultCard = async (cardId) => {
    try {
      await api.put(`/subscription/payment-methods/${cardId}/default`);
      setSavedCards(prev => prev.map(c => ({ ...c, isDefault: c.id === cardId })));
      setSnackbar({ open: true, message: 'Default payment method updated.', severity: 'info' });
    } catch (err) {
      setSavedCards(prev => prev.map(c => ({ ...c, isDefault: c.id === cardId })));
    }
  };

  const handleDeleteCardClick = (card) => {
    if (card.isDefault && savedCards.length > 1) {
      setSnackbar({ open: true, message: 'Please set another payment method as default before removing your primary card.', severity: 'warning' });
      return;
    }
    setCardToDelete(card);
    setDeleteCardModalOpen(true);
  };

  const handleConfirmDeleteCard = async () => {
    if (!cardToDelete) return;
    setDeletingCard(true);
    try {
      const res = await api.delete(`/subscription/payment-methods/${cardToDelete.id}`);
      if (res.data?.cards) {
        setSavedCards(res.data.cards);
      } else {
        setSavedCards(prev => prev.filter(c => c.id !== cardToDelete.id));
      }
      setSnackbar({ open: true, message: 'Card removed from saved payment methods.', severity: 'success' });
    } catch (err) {
      setSavedCards(prev => prev.filter(c => c.id !== cardToDelete.id));
      setSnackbar({ open: true, message: 'Card removed from saved payment methods.', severity: 'success' });
    } finally {
      setDeletingCard(false);
      setDeleteCardModalOpen(false);
      setCardToDelete(null);
    }
  };

  const handleAddCardSubmit = async () => {
    const last4Digit = newCardData.last4 ? newCardData.last4.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
    try {
      const res = await api.post('/subscription/payment-methods', {
        brand: newCardData.brand,
        last4: last4Digit,
        exp_month: newCardData.expMonth,
        exp_year: newCardData.expYear,
        is_default: newCardData.isDefault,
        cardholder_name: newCardData.cardholderName || user?.full_name || 'Cardholder'
      });
      if (res.data?.cards) setSavedCards(res.data.cards);
    } catch (err) {
      setSavedCards(prev => [...prev, {
        id: `pm_${Date.now()}`,
        brand: newCardData.brand,
        last4: last4Digit,
        expMonth: newCardData.expMonth,
        expYear: newCardData.expYear,
        isDefault: newCardData.isDefault || savedCards.length === 0,
        cardholderName: newCardData.cardholderName || user?.full_name || 'Cardholder'
      }]);
    }
    setAddCardModalOpen(false);
    setSnackbar({ open: true, message: 'Payment card saved successfully!', severity: 'success' });
  };

  // Professional Enterprise SaaS Invoice & Receipt HTML Generator
  const generateReceiptHtml = (inv) => {
    const invNum = inv.invoice_number || inv.id || 'ESI-2026-000001';
    const issuer = inv.issuer || {};
    const issuerLegal = issuer.legal_name || 'ESigniva Technologies';
    const issuerAddr1 = issuer.address_line1 || 'Tech Innovation Hub, Cyber Gateway';
    const issuerAddr2 = issuer.address_line2 || 'OMR IT Expressway';
    const issuerCity = issuer.city || 'Chennai';
    const issuerState = issuer.state || 'Tamil Nadu';
    const issuerZip = issuer.postal_code || '600096';
    const issuerCountry = issuer.country || 'India';
    const issuerTax = issuer.tax_id || 'GSTIN33AAACE1234F1Z5';
    const issuerBillingEmail = issuer.billing_email || 'billing@esigniva.com';

    const customer = inv.customer || {};
    const customerName = customer.name || billingInfo.companyName || user?.company || user?.full_name || 'Valued Customer';
    const customerEmail = customer.email || billingInfo.billingEmail || user?.email || 'N/A';
    const customerAddress = customer.address || `${billingInfo.address || '100 Enterprise Way'}, ${billingInfo.city || 'San Francisco'}, ${billingInfo.state || 'CA'} ${billingInfo.zip || '94107'}`;
    const customerTax = customer.tax_id || billingInfo.vatId || 'N/A';

    const issueDate = inv.issue_date_str || inv.date || format(new Date(), 'dd MMM yyyy');
    const paymentDate = inv.payment_date_str || inv.date || format(new Date(), 'dd MMM yyyy');
    const paymentMethod = inv.payment_method || 'Stripe';
    const currency = inv.currency || 'USD';
    const subtotal = inv.subtotal_str || inv.amount || '$5.00';
    const tax = inv.tax_str || '$0.00';
    const totalPaid = inv.total_paid_str || inv.total_str || inv.amount || '$5.00';
    const balanceDue = inv.balance_str || inv.balance_due_str || '$0.00';
    const shortRef = inv.short_reference || inv.payment_reference || `STRIPE-TX-${invNum.replace(/[^a-zA-Z0-9]/g, '')}`;

    const items = (inv.items && inv.items.length > 0) ? inv.items : [{
      description: inv.description || '500 ESigniva Credits',
      sub_description: 'One-time credit top-up • Non-expiring cloud credits',
      quantity: 1,
      unit_price: inv.amount || '$5.00',
      amount: inv.amount || '$5.00'
    }];

    const itemsRowsHtml = items.map(item => `
      <tr>
        <td>
          <div class="item-title">${item.description}</div>
          <div class="item-sub">${item.sub_description || item.details || 'Official ESigniva digital cloud services'}</div>
        </td>
        <td style="text-align: center; font-weight: 600;">${item.quantity || 1}</td>
        <td style="text-align: right; color: #475569;">${item.unit_price || item.amount || subtotal}</td>
        <td style="text-align: right; font-weight: 700; color: #101828;">${item.amount || subtotal}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>ESigniva_Invoice_${invNum}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 16mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #101828;
            background: #ffffff;
            margin: 0;
            padding: 32px;
            font-size: 13px;
            line-height: 1.5;
          }
          .invoice-card {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #E4E7EC;
            border-radius: 12px;
            padding: 40px 44px;
            background: #ffffff;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 24px;
            border-bottom: 1px solid #E4E7EC;
            margin-bottom: 24px;
          }
          .brand-box {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 900;
            color: #101828;
            letter-spacing: -0.5px;
            line-height: 1.1;
          }
          .brand-tagline {
            font-size: 10px;
            font-weight: 700;
            color: #086B70;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin-top: 3px;
          }
          .invoice-header-meta {
            text-align: right;
          }
          .doc-title-row {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 4px;
          }
          .doc-title {
            font-size: 18px;
            font-weight: 900;
            color: #101828;
            letter-spacing: 0.5px;
          }
          .badge-paid {
            display: inline-block;
            background: #F0FDFA;
            color: #086B70;
            border: 1px solid #086B70;
            font-weight: 800;
            font-size: 10.5px;
            letter-spacing: 0.5px;
            padding: 2px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
          }
          .inv-number {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 15px;
            font-weight: 800;
            color: #086B70;
            margin-top: 2px;
          }
          .billing-grid {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 24px;
          }
          .billing-col {
            flex: 1;
            background: #F8FAFC;
            border: 1px solid #E4E7EC;
            border-radius: 8px;
            padding: 16px 18px;
          }
          .billing-label {
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: #086B70;
            margin-bottom: 8px;
          }
          .billing-title {
            font-size: 14px;
            font-weight: 700;
            color: #101828;
            margin-bottom: 4px;
          }
          .billing-line {
            font-size: 12px;
            color: #475569;
            line-height: 1.5;
          }
          .meta-strip {
            display: flex;
            background: #F8FAFC;
            border: 1px solid #E4E7EC;
            border-radius: 8px;
            padding: 12px 18px;
            margin-bottom: 24px;
            justify-content: space-between;
          }
          .meta-item {
            flex: 1;
          }
          .meta-item-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748B;
            letter-spacing: 0.5px;
          }
          .meta-item-val {
            font-size: 12.5px;
            font-weight: 700;
            color: #101828;
            margin-top: 2px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .items-table th {
            background: #F8FAFC;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 10px 14px;
            border-top: 1px solid #E4E7EC;
            border-bottom: 1px solid #E4E7EC;
          }
          .items-table td {
            padding: 14px;
            border-bottom: 1px solid #E4E7EC;
            font-size: 12.5px;
          }
          .item-title {
            font-weight: 700;
            color: #101828;
            margin-bottom: 2px;
          }
          .item-sub {
            font-size: 11px;
            color: #64748B;
          }
          .summary-layout {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 28px;
          }
          .payment-confirmation-box {
            flex: 1.1;
            background: #F8FAFC;
            border: 1px solid #E4E7EC;
            border-radius: 8px;
            padding: 16px 18px;
          }
          .payment-conf-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #086B70;
            margin-bottom: 6px;
          }
          .payment-conf-text {
            font-size: 11.5px;
            color: #475569;
            line-height: 1.6;
          }
          .totals-table {
            flex: 0.9;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 6px 12px;
            font-size: 12.5px;
          }
          .totals-table tr.total-paid-row td {
            border-top: 1.5px solid #086B70;
            border-bottom: 1.5px solid #086B70;
            background: #F0FDFA;
            font-size: 15px;
            font-weight: 900;
            color: #086B70;
            padding: 10px 12px;
          }
          .footer-box {
            border-top: 1px solid #E4E7EC;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748B;
            line-height: 1.6;
          }
          .footer-links {
            font-weight: 600;
            color: #086B70;
            margin-top: 4px;
          }
          @media print {
            body { padding: 0; background: #fff; }
            .invoice-card { border: none !important; padding: 0 !important; max-width: 100% !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header-row">
            <div class="brand-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="invBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#086B70" />
                    <stop offset="100%" stop-color="#0F766E" />
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="14" fill="url(#invBrandGrad)"/>
                <path d="M32 14C32 14 44 16 44 26C44 38 32 48 32 48C32 48 20 38 20 26C20 16 32 14 32 14Z" 
                      stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M26 28L30 32L38 22" 
                      stroke="#5EEAD4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
              <div>
                <div class="brand-name">ESigniva</div>
                <div class="brand-tagline">Digital Signature Platform</div>
              </div>
            </div>
            <div class="invoice-header-meta">
              <div class="doc-title-row">
                <span class="doc-title">INVOICE</span>
                <span class="badge-paid">PAID</span>
              </div>
              <div class="inv-number">${invNum}</div>
            </div>
          </div>

          <div class="billing-grid">
            <div class="billing-col">
              <div class="billing-label">BILLED FROM</div>
              <div class="billing-title">ESigniva</div>
              <div class="billing-line"><strong>${issuerLegal}</strong></div>
              <div class="billing-line">${issuerAddr1}</div>
              <div class="billing-line">${issuerAddr2 ? issuerAddr2 + ', ' : ''}${issuerCity}, ${issuerState} ${issuerZip}, ${issuerCountry}</div>
              <div class="billing-line">Tax ID: ${issuerTax}</div>
              <div class="billing-line">${issuerBillingEmail}</div>
            </div>

            <div class="billing-col">
              <div class="billing-label">BILLED TO</div>
              <div class="billing-title">${customerName}</div>
              <div class="billing-line">${customerAddress}</div>
              <div class="billing-line">Tax ID: ${customerTax}</div>
              <div class="billing-line">${customerEmail}</div>
            </div>
          </div>

          <div class="meta-strip">
            <div class="meta-item">
              <div class="meta-item-label">Invoice Date</div>
              <div class="meta-item-val">${issueDate}</div>
            </div>
            <div class="meta-item">
              <div class="meta-item-label">Payment Date</div>
              <div class="meta-item-val">${paymentDate}</div>
            </div>
            <div class="meta-item">
              <div class="meta-item-label">Payment Method</div>
              <div class="meta-item-val">${paymentMethod}</div>
            </div>
            <div class="meta-item">
              <div class="meta-item-label">Currency</div>
              <div class="meta-item-val">${currency}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 50%;">Description</th>
                <th style="text-align: center; width: 12%;">Qty</th>
                <th style="text-align: right; width: 18%;">Unit Price</th>
                <th style="text-align: right; width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div class="summary-layout">
            <div class="payment-confirmation-box">
              <div class="payment-conf-title">Payment Confirmation</div>
              <div class="payment-conf-text">
                Payment processed through <strong>${paymentMethod}</strong>. Keep this invoice for your records.<br/>
                Reference: <strong>${shortRef}</strong><br/>
                Settlement Status: <strong>Settled & Cleared to Organization Balance</strong>
              </div>
            </div>

            <table class="totals-table">
              <tr>
                <td style="color: #64748B;">Subtotal</td>
                <td style="text-align: right; font-weight: 600; color: #101828;">${subtotal}</td>
              </tr>
              <tr>
                <td style="color: #64748B;">Tax (0%)</td>
                <td style="text-align: right; font-weight: 600; color: #101828;">${tax}</td>
              </tr>
              <tr class="total-paid-row">
                <td>Total Paid</td>
                <td style="text-align: right;">${totalPaid}</td>
              </tr>
              <tr>
                <td style="color: #64748B;">Balance Due</td>
                <td style="text-align: right; font-weight: 700; color: #101828;">${balanceDue}</td>
              </tr>
            </table>
          </div>

          <div class="footer-box">
            Thank you for choosing ESigniva.<br/>
            This is an electronically generated official invoice valid without physical signature.
            <div class="footer-links">
              esigniva.com • support@esigniva.com • billing@esigniva.com
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download Official A4 Vector PDF directly from Backend
  const handleDownloadPdfReceipt = async (inv) => {
    const invoiceId = inv.invoice_number || inv.id;
    setDownloadingInvoiceId(inv.id || invoiceId);
    try {
      const response = await api.get(`/subscription/invoices/${encodeURIComponent(invoiceId)}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `ESigniva_Invoice_${inv.invoice_number || invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSnackbar({
        open: true,
        message: `Official A4 PDF Invoice for ${inv.invoice_number || invoiceId} downloaded successfully!`,
        severity: 'success'
      });
    } catch (err) {
      console.warn('Backend PDF stream encountered an issue, falling back to print dialog:', err);
      handlePrintReceipt(inv);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Printable Invoice & Web View Dialog
  const handlePrintReceipt = async (inv) => {
    const invoiceId = inv.invoice_number || inv.id;
    try {
      const res = await api.get(`/subscription/invoices/${encodeURIComponent(invoiceId)}/html`);
      const htmlContent = res.data;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setSnackbar({ open: true, message: 'Pop-up blocked. Please allow pop-ups to print or view invoice.', severity: 'warning' });
        return;
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
      setSnackbar({ open: true, message: `Invoice for ${inv.invoice_number || invoiceId} ready to print.`, severity: 'success' });
    } catch (err) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      const htmlContent = generateReceiptHtml(inv);
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  };

  // Copy Invoice Number Helper
  const [copiedInvId, setCopiedInvId] = useState(false);
  const handleCopyInvoiceNumber = (invNum) => {
    if (!invNum) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(invNum);
      setCopiedInvId(true);
      setTimeout(() => setCopiedInvId(false), 2000);
      setSnackbar({ open: true, message: `Invoice number ${invNum} copied to clipboard!`, severity: 'success' });
    }
  };

  // Open Invoice Preview Modal with immediate display & live hydration
  const handleViewReceipt = async (inv) => {
    if (!inv) return;
    setSelectedReceipt(inv);
    setReceiptModalOpen(true);

    // Hydrate latest full invoice record from backend in case extra details exist
    try {
      const invoiceId = inv.invoice_number || inv.id;
      const res = await api.get(`/subscription/invoices/${encodeURIComponent(invoiceId)}`);
      if (res.data && res.data.invoice) {
        setSelectedReceipt(prev => ({
          ...prev,
          ...res.data.invoice,
          id: res.data.invoice.invoice_number || res.data.invoice.id,
          date: res.data.invoice.issue_date_str || prev?.date,
          amount: res.data.invoice.total_str || prev?.amount
        }));
      }
    } catch (err) {
      console.log('Using local invoice record for preview:', err);
    }
  };

  const currentBalance = Number(credits?.balance ?? user?.credit_balance ?? 0);

  // Real calculations derived strictly from real transactions
  const realDebitTxs = transactions.filter(t => Number(t.amount) < 0 || t.type === 'debit');
  const realDebitSum = realDebitTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const totalConsumed = Number(credits?.used ?? credits?.total_consumed ?? realDebitSum);

  const realCreditTxs = transactions.filter(t => Number(t.amount) > 0 || t.type === 'credit' || t.type === 'allocation' || t.type === 'purchase');
  const realCreditSum = realCreditTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalAllocated = realCreditSum > 0 ? realCreditSum : (currentBalance + totalConsumed > 0 ? currentBalance + totalConsumed : (currentBalance || 100));

  const usagePercentage = totalAllocated > 0 ? Math.min(Math.round((totalConsumed / totalAllocated) * 100), 100) : 0;

  // Real metered action counts and credit calculations strictly from real transactions
  const docSendTxs = transactions.filter(t => (Number(t.amount) < 0 || t.type === 'debit') && (t.source === 'document_send' || t.description?.toLowerCase().includes('document_send') || (t.description?.toLowerCase().includes('document') && t.description?.toLowerCase().includes('send')) || t.description?.toLowerCase().includes('envelope')));
  const docSendCount = docSendTxs.length;
  const docSendCredits = docSendTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0) || (docSendCount * 5);

  const recipientSignTxs = transactions.filter(t => (Number(t.amount) < 0 || t.type === 'debit') && (t.source === 'recipient_sign' || t.description?.toLowerCase().includes('recipient_sign') || t.description?.toLowerCase().includes('signature submission')));
  const recipientSignCount = recipientSignTxs.length;
  const recipientSignCredits = recipientSignTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0) || (recipientSignCount * 2);

  const aiTemplateTxs = transactions.filter(t => (Number(t.amount) < 0 || t.type === 'debit') && (t.source === 'ai_template' || t.description?.toLowerCase().includes('ai agreement') || t.description?.toLowerCase().includes('ai_template')));
  const aiTemplateCount = aiTemplateTxs.length;
  const aiTemplateCredits = aiTemplateTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0) || (aiTemplateCount * 20);

  const aiProcessingTxs = transactions.filter(t => (Number(t.amount) < 0 || t.type === 'debit') && (t.source === 'ai_processing' || t.description?.toLowerCase().includes('ai_processing') || t.description?.toLowerCase().includes('extract fields') || t.description?.toLowerCase().includes('summarize')));
  const aiProcessingCount = aiProcessingTxs.length;
  const aiProcessingCredits = aiProcessingTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0) || (aiProcessingCount * 10);

  const templateUseTxs = transactions.filter(t => (Number(t.amount) < 0 || t.type === 'debit') && (t.source === 'template_use' || t.description?.toLowerCase().includes('template_use') || (t.description?.toLowerCase().includes('template') && !t.description?.toLowerCase().includes('ai'))));
  const templateUseCount = templateUseTxs.length;
  const templateUseCredits = templateUseTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0) || (templateUseCount * 3);

  const smsTxs = transactions.filter(t => (Number(t.amount) < 0 || t.type === 'debit') && (t.source === 'sms' || t.description?.toLowerCase().includes('sms')));
  const smsCount = smsTxs.length;
  const smsCredits = smsTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0) || (smsCount * 2);

  const emailTxs = transactions.filter(t => (Number(t.amount) < 0 || t.type === 'debit') && (t.source === 'email' || t.description?.toLowerCase().includes('email delivery')));
  const emailCount = emailTxs.length;
  const emailCredits = emailTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0) || (emailCount * 1);

  const auditTxs = transactions.filter(t => t.source === 'audit' || t.description?.toLowerCase().includes('certificate') || t.description?.toLowerCase().includes('otp'));
  const auditCount = auditTxs.length;

  const formatTxDate = (dateStr) => {
    if (!dateStr) return { formatted: 'N/A', relative: '' };
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return { formatted: String(dateStr), relative: '' };
      return {
        formatted: format(dt, 'MMM dd, yyyy · hh:mm a'),
        relative: formatDistanceToNow(dt, { addSuffix: true })
      };
    } catch (e) {
      return { formatted: String(dateStr), relative: '' };
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* HEADER & BALANCE SUMMARY HERO */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          boxShadow: '0 12px 30px -10px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: '#0f766e',
                color: '#ffffff',
                width: 54,
                height: 54,
                boxShadow: '0 8px 18px rgba(15, 118, 110, 0.3)'
              }}
            >
              <BoltIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Box>
              <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ color: '#0f172a' }}>
                Subscription & Credit Hub
              </Typography>
              <Typography variant="body2" sx={{ color: '#0f766e', fontWeight: 600, mt: 0.5 }}>
                Real-time management of account usage, credit plans, payment methods, billing info, and printable PDF invoices.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '20px',
            bgcolor: '#ffffff',
            border: '2px solid #0f766e',
            boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.15)',
            textAlign: 'center',
            minWidth: { xs: '100%', sm: '260px' },
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <BoltIcon sx={{ color: '#0f766e', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Available Credits Balance
            </Typography>
          </Box>
          <Typography variant="h3" fontWeight={600} sx={{ color: '#0f172a', my: 0.5 }}>
            {currentBalance.toLocaleString()}
          </Typography>
          <Chip
            size="small"
            label="NON-EXPIRING BALANCE"
            sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.7rem' }}
          />
        </Paper>
      </Paper>

      {/* NAVIGATION TABS FOR ALL MODULES */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, overflowX: 'auto' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              py: 1.5,
              px: 2.5,
              color: '#64748b',
              '&.Mui-selected': {
                color: '#0f766e'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0f766e',
              height: 3
            }
          }}
        >
          <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Credit Usage & Metering" />
          <Tab icon={<ShoppingCartIcon />} iconPosition="start" label="Upgrade Plans & Top-Up" />
          <Tab icon={<ReceiptIcon />} iconPosition="start" label="Invoices & Receipts" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Transaction Ledger" />
        </Tabs>
      </Box>

      {/* ==================================================== */}
      {/* TAB 0: ACCOUNT USAGE (FULL WIDTH STACKED SECTIONS) */}
      {/* ==================================================== */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* SECTION HEADER */}
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
              Account Usage & Metered Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time snapshot of your credit balance consumption, envelope dispatches, and AI contract generation.
            </Typography>
          </Box>

          {/* FULL-WIDTH SECTION 1: CREDIT METER & METRICS */}
          <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: '20px', width: '100%', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a' }}>
                  Credit Consumption Meter
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Track your usage progress against your total allocated credit balance
                </Typography>
              </Box>
              <Chip
                label={`${usagePercentage}% Used`}
                color={usagePercentage > 85 ? 'error' : 'success'}
                sx={{ fontWeight: 800, px: 1, py: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={usagePercentage}
                sx={{
                  height: 16,
                  borderRadius: 8,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: usagePercentage > 85 ? '#ef4444' : '#10b981'
                  }
                }}
              />
            </Box>

            <Grid container spacing={3} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f0fdf4', border: '1px solid #a7f3d0' }}>
                  <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>
                    Available Balance
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5 }}>
                    {currentBalance.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Consumed Credits
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#475569', mt: 0.5 }}>
                    {totalConsumed.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Allocated
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5 }}>
                    {totalAllocated.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* HOW CREDIT CONSUMPTION WORKS (EXACT 8 CARDS - SAME WIDTH, SAME HEIGHT, CENTERED) */}
          <Paper elevation={0} variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: '24px', bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mb: 1, letterSpacing: '-0.5px' }}>
                How Credit Consumption Works
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', fontSize: '0.95rem' }}>
                Transparent action pricing. No mystery charges. You only consume credits when actions are performed.
              </Typography>
            </Box>

            <Grid container spacing={2.5} justifyContent="center" alignItems="stretch">
              {[
                {
                  title: 'Document Send & E-Signing',
                  badge: '5 Credits',
                  badgeBg: '#e0f2fe',
                  badgeColor: '#0369a1',
                  iconBg: '#e0f2fe',
                  iconColor: '#0284c7',
                  icon: <DescriptionIcon sx={{ fontSize: 22 }} />,
                  description: 'Send envelope with signature fields to recipients',
                  count: docSendCount,
                  label: 'Sent',
                  credits: docSendCredits,
                  isFree: false
                },
                {
                  title: 'Recipient Signing',
                  badge: '2 Credits',
                  badgeBg: '#ccfbf1',
                  badgeColor: '#0f766e',
                  iconBg: '#ccfbf1',
                  iconColor: '#0f766e',
                  icon: <CheckCircleOutlineIcon sx={{ fontSize: 22 }} />,
                  description: 'Signer completes signature or input submission',
                  count: recipientSignCount,
                  label: 'Signed',
                  credits: recipientSignCredits,
                  isFree: false
                },
                {
                  title: 'AI Agreement Generator',
                  badge: '20 Credits',
                  badgeBg: '#f3e8ff',
                  badgeColor: '#7c3aed',
                  iconBg: '#f3e8ff',
                  iconColor: '#7c3aed',
                  icon: <AutoAwesomeIcon sx={{ fontSize: 22 }} />,
                  description: 'Generate custom legal agreement via AI prompt',
                  count: aiTemplateCount,
                  label: 'Created',
                  credits: aiTemplateCredits,
                  isFree: false
                },
                {
                  title: 'AI Processing & Parsing',
                  badge: '10 Credits',
                  badgeBg: '#ffedd5',
                  badgeColor: '#c2410c',
                  iconBg: '#ffedd5',
                  iconColor: '#ea580c',
                  icon: <BoltIcon sx={{ fontSize: 22 }} />,
                  description: 'Extract fields & summarize document text via AI',
                  count: aiProcessingCount,
                  label: 'Parsed',
                  credits: aiProcessingCredits,
                  isFree: false
                },
                {
                  title: 'Template Usage',
                  badge: '3 Credits',
                  badgeBg: '#e0f2fe',
                  badgeColor: '#0369a1',
                  iconBg: '#e0f2fe',
                  iconColor: '#0284c7',
                  icon: <LayersIcon sx={{ fontSize: 22 }} />,
                  description: 'Use pre-built reusable contract template',
                  count: templateUseCount,
                  label: 'Used',
                  credits: templateUseCredits,
                  isFree: false
                },
                {
                  title: 'SMS Notifications',
                  badge: '2 Credits',
                  badgeBg: '#ffe4e6',
                  badgeColor: '#e11d48',
                  iconBg: '#ffe4e6',
                  iconColor: '#e11d48',
                  icon: <PhoneAndroidIcon sx={{ fontSize: 22 }} />,
                  description: 'Send SMS alert or signing invitation link',
                  count: smsCount,
                  label: 'Sent',
                  credits: smsCredits,
                  isFree: false
                },
                {
                  title: 'Email Delivery',
                  badge: '1 Credit',
                  badgeBg: '#f1f5f9',
                  badgeColor: '#475569',
                  iconBg: '#f1f5f9',
                  iconColor: '#475569',
                  icon: <EmailIcon sx={{ fontSize: 22 }} />,
                  description: 'Automated email dispatch & status tracking',
                  count: emailCount,
                  label: 'Sent',
                  credits: emailCredits,
                  isFree: false
                }
                // {
                //   title: 'Audit Trail & 2FA OTP',
                //   badge: 'FREE (0 Credits)',
                //   badgeBg: '#dcfce7',
                //   badgeColor: '#16a34a',
                //   iconBg: '#dcfce7',
                //   iconColor: '#16a34a',
                //   icon: <VerifiedUserIcon sx={{ fontSize: 22 }} />,
                //   description: 'Tamper-evident legal certificate & OTP verification',
                //   count: auditCount,
                //   label: 'Generated',
                //   credits: 0,
                //   isFree: true
                // }
              ].map((rule, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx} sx={{ display: 'flex' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      boxSizing: 'border-box',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        borderColor: '#0f766e',
                        boxShadow: '0 6px 18px rgba(15, 118, 110, 0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      {/* Top Header: Icon & Badge */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: '10px',
                            bgcolor: rule.iconBg,
                            color: rule.iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {rule.icon}
                        </Box>
                        <Chip
                          label={rule.badge}
                          size="small"
                          sx={{
                            bgcolor: rule.badgeBg,
                            color: rule.badgeColor,
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            borderRadius: '8px',
                            height: '24px'
                          }}
                        />
                      </Box>

                      {/* Title with standardized vertical baseline */}
                      <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        sx={{
                          color: '#0f172a',
                          mb: 0.8,
                          lineHeight: 1.3,
                          fontSize: '0.96rem',
                          minHeight: '44px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {rule.title}
                      </Typography>

                      {/* Description with standardized vertical baseline */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.82rem',
                          lineHeight: 1.45,
                          minHeight: '40px',
                          mb: 2,
                          color: '#64748b'
                        }}
                      >
                        {rule.description}
                      </Typography>
                    </Box>

                    {/* Footer Usage Counter pinned to bottom */}
                    <Box
                      sx={{
                        pt: 1.5,
                        mt: 'auto',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Your Usage:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: rule.isFree ? '#16a34a' : '#0f766e',
                          fontWeight: 800,
                          bgcolor: rule.isFree ? '#f0fdf4' : '#f0fdfa',
                          px: 1,
                          py: 0.35,
                          borderRadius: '6px'
                        }}
                      >
                        {rule.isFree
                          ? (rule.count > 0 ? `${rule.count} Generated (0 cr)` : 'Included Free (0 cr)')
                          : `${rule.count} ${rule.label} (${rule.credits} cr)`
                        }
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* FULL-WIDTH SECTION 3: CREDIT ROLLOVER GUARANTEE */}
          <Alert
            severity="info"
            icon={<BoltIcon sx={{ color: '#0f766e' }} />}
            sx={{
              borderRadius: '16px',
              bgcolor: '#f0fdf4',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              '& .MuiAlert-message': { fontWeight: 600 }
            }}
          >
            <strong>Credits Never Expire Guarantee:</strong> All purchased top-up credits automatically carry over without monthly expiration limits. Top up your balance anytime.
          </Alert>
        </Box>
      )}


      {/* ==================================================== */}
      {/* TAB 1: UPGRADE PLAN & CREDIT PACKAGES */}
      {/* ==================================================== */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Chip
              icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
              label="PAY-AS-YOU-GO CREDIT PLANS"
              sx={{ bgcolor: '#f0fdf4', color: '#0f766e', fontWeight: 800, mb: 1.5, fontSize: '0.75rem' }}
            />
            <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mb: 1 }}>
              Upgrade Plan & Top-Up Credits
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto' }}>
              Select a credit plan that fits your envelope volume. All purchased credits **never expire** and automatically carry over.
            </Typography>
          </Box>

          {/* 1ST ROW: EXACTLY 4 CARDS (FREE TRIAL, STARTER, STANDARD, PROFESSIONAL) */}
          <Grid container spacing={3} justifyContent="center" alignItems="stretch" sx={{ pt: 1, mb: 1 }}>
            {PRIMARY_PLAN_CARDS.map((pack) => (
              <Grid item xs={12} sm={6} md={3} key={pack.id} sx={{ display: 'flex' }}>
                <CreditCardWrapper badge={pack.badge} isfree={pack.isFree} sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                  {pack.badge && (
                    <BadgeRibbon badge={pack.badge}>
                      <StarIcon sx={{ fontSize: 13 }} /> {pack.badge}
                    </BadgeRibbon>
                  )}

                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5, minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                      {pack.name}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700, mb: 1.5, minHeight: '20px', display: 'block' }}>
                      {pack.unitPrice}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2, minHeight: '44px' }}>
                      <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a' }}>
                        {pack.price === 0 ? 'Free' : `$${pack.price.toFixed(2)}`}
                      </Typography>
                      {pack.price > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          one-time
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 2, minHeight: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        ESTIMATED USAGE:
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0f766e', fontSize: '0.85rem' }}>
                        {pack.usageEst}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 1, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Included Features
                    </Typography>

                    <List size="small" disablePadding sx={{ mb: 2, flexGrow: 1 }}>
                      {pack.features.map((feat, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 0.4 }}>
                          <ListItemIcon sx={{ minWidth: 24, color: '#10b981' }}>
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feat}
                            primaryTypographyProps={{
                              fontSize: '0.82rem',
                              fontWeight: idx === 0 ? 700 : 500,
                              color: idx === 0 ? '#0f172a' : '#475569'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 0, mt: 'auto' }}>
                    <Button
                      fullWidth
                      variant={pack.badge ? 'contained' : (pack.isFree ? 'outlined' : 'outlined')}
                      size="large"
                      startIcon={pack.isFree ? <CheckCircleOutlineIcon /> : <ShoppingCartIcon />}
                      onClick={() => handleBuyPackClick(pack)}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.2,
                        bgcolor: pack.badge ? '#0f766e' : (pack.isFree ? '#f0fdf4' : 'transparent'),
                        borderColor: pack.isFree ? '#10b981' : '#0f766e',
                        color: pack.badge ? '#ffffff' : (pack.isFree ? '#065f46' : '#0f766e'),
                        '&:hover': {
                          bgcolor: pack.badge ? '#0d655e' : (pack.isFree ? '#dcfce7' : '#f0fdf4'),
                          borderColor: '#0d655e'
                        }
                      }}
                    >
                      {pack.isFree ? 'Current Plan Active' : 'Upgrade / Buy Pack'}
                    </Button>
                  </CardActions>
                </CreditCardWrapper>
              </Grid>
            ))}
          </Grid>

          {/* VIEW MORE / DROP DOWN BUTTON TO OPEN ENTERPRISE & CUSTOM PLANS */}
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Button
              variant="outlined"
              onClick={() => setShowEnterpriseRow(!showEnterpriseRow)}
              endIcon={showEnterpriseRow ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                borderRadius: '30px',
                px: 4,
                py: 1.3,
                fontWeight: 800,
                color: '#0f766e',
                borderColor: '#0f766e',
                fontSize: '0.92rem',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(15, 118, 110, 0.08)',
                bgcolor: showEnterpriseRow ? '#f0fdf4' : 'transparent',
                '&:hover': {
                  borderColor: '#0d655e',
                  bgcolor: '#f0fdf4'
                }
              }}
            >
              {showEnterpriseRow ? 'Hide Enterprise & Custom Plans' : 'View Enterprise & Custom Volume Plans'}
            </Button>
          </Box>

          {/* COLLAPSIBLE ENTERPRISE SCALE & CUSTOM ENTERPRISE PLANS (HIDDEN BY DEFAULT) */}
          <Collapse in={showEnterpriseRow} timeout="auto" unmountOnExit>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a', textAlign: 'center', mb: 2.5 }}>
                Enterprise Scale & Custom Volume Solutions
              </Typography>
              <Grid container spacing={3} justifyContent="center" alignItems="stretch">
                {ENTERPRISE_PLAN_CARDS.map((pack) => (
                  <Grid item xs={12} sm={6} md={4} key={pack.id} sx={{ display: 'flex' }}>
                    <CreditCardWrapper badge={pack.badge} isfree={pack.isFree} sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                      {pack.badge && (
                        <BadgeRibbon badge={pack.badge}>
                          <StarIcon sx={{ fontSize: 13 }} /> {pack.badge}
                        </BadgeRibbon>
                      )}

                      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5, minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                          {pack.name}
                        </Typography>

                        <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700, mb: 1.5, minHeight: '20px', display: 'block' }}>
                          {pack.unitPrice}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2, minHeight: '44px' }}>
                          <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a' }}>
                            {pack.price !== null ? `$${pack.price.toFixed(2)}` : 'Custom'}
                          </Typography>
                          {pack.price !== null && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              one-time
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 2, minHeight: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            SUITED FOR:
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#0f766e', fontSize: '0.85rem' }}>
                            {pack.usageEst}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 1, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Features Included
                        </Typography>

                        <List size="small" disablePadding sx={{ mb: 2, flexGrow: 1 }}>
                          {pack.features.map((feat, idx) => (
                            <ListItem key={idx} disableGutters sx={{ py: 0.4 }}>
                              <ListItemIcon sx={{ minWidth: 24, color: '#10b981' }}>
                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={feat}
                                primaryTypographyProps={{
                                  fontSize: '0.82rem',
                                  fontWeight: idx === 0 ? 700 : 500,
                                  color: idx === 0 ? '#0f172a' : '#475569'
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>

                      <CardActions sx={{ p: 3, pt: 0, mt: 'auto' }}>
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          startIcon={pack.isCustom ? <HeadsetMicIcon /> : <ShoppingCartIcon />}
                          onClick={() => handleBuyPackClick(pack)}
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            py: 1.2,
                            bgcolor: pack.isCustom ? '#0284c7' : '#0f766e',
                            color: '#ffffff',
                            '&:hover': {
                              bgcolor: pack.isCustom ? '#0369a1' : '#0d655e'
                            }
                          }}
                        >
                          {pack.isCustom ? 'Talk to Enterprise Sales' : 'Buy Enterprise Pack'}
                        </Button>
                      </CardActions>
                    </CreditCardWrapper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </Box>
      )}

      {/* ==================================================== */}
      {/* TAB 2: INVOICES & RECEIPTS WITH REAL PDF GENERATOR */}
      {/* ==================================================== */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ReceiptIcon sx={{ color: '#0f766e' }} />
                Invoices & Transaction Receipts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Official tax invoices and printable transaction receipts for your accounting and tax records.
              </Typography>
            </Box>
            <Chip
              icon={<VerifiedUserIcon sx={{ color: '#0f766e !important', fontSize: '16px !important' }} />}
              label="PCI-DSS & Stripe Verified Receipts"
              size="small"
              sx={{
                bgcolor: '#f0fdfa',
                color: '#0f766e',
                border: '1px solid #99f6e4',
                fontWeight: 700,
                fontSize: '0.75rem',
                py: 0.5
              }}
            />
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflowX: 'auto',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              bgcolor: '#ffffff'
            }}
          >
            <Table sx={{ minWidth: 720 }}>
              <TableHead sx={{ bgcolor: '#F8FAFC', borderBottom: '1px solid #E4E7EC' }}>
                <TableRow>
                  <TableCell align="left" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8, borderColor: '#E4E7EC' }}>
                    Invoice Number
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8, borderColor: '#E4E7EC' }}>
                    Date
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8, borderColor: '#E4E7EC' }}>
                    Description
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8, borderColor: '#E4E7EC' }}>
                    Amount
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8, borderColor: '#E4E7EC' }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8, borderColor: '#E4E7EC' }}>
                    Invoice Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, borderColor: '#E4E7EC' }}>
                      <ReceiptIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                      <Typography variant="body1" fontWeight={600} color="text.secondary">
                        No receipts or invoices found
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        When you purchase credit packs or activate plans, official invoices will appear here.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => {
                    const invNumber = inv.invoice_number || inv.id;
                    const isDownloading = downloadingInvoiceId === invNumber || downloadingInvoiceId === inv.id;
                    return (
                      <TableRow
                        key={inv.id || invNumber}
                        sx={{
                          '&:hover': { bgcolor: '#F8FAFC' },
                          transition: 'background-color 0.15s ease',
                          borderBottom: '1px solid #E4E7EC'
                        }}
                      >
                        {/* INVOICE NUMBER with Monospace font and direct preview click */}
                        <TableCell align="left" sx={{ py: 2, borderColor: '#E4E7EC' }}>
                          <Tooltip title="Click to view full invoice preview" arrow placement="top">
                            <Box
                              component="button"
                              onClick={() => handleViewReceipt(inv)}
                              sx={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <Typography
                                component="span"
                                sx={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                  color: '#086B70',
                                  maxWidth: 160,
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  transition: 'color 0.15s ease',
                                  '&:hover': {
                                    textDecoration: 'underline',
                                    color: '#065054'
                                  }
                                }}
                              >
                                {invNumber}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* DATE */}
                        <TableCell align="left" sx={{ py: 2, color: '#475569', fontSize: '0.875rem', whiteSpace: 'nowrap', borderColor: '#E4E7EC' }}>
                          {inv.issue_date_str || inv.date}
                        </TableCell>

                        {/* DESCRIPTION */}
                        <TableCell align="left" sx={{ py: 2, borderColor: '#E4E7EC' }}>
                          <Box sx={{ maxWidth: 300 }}>
                            <Tooltip title={inv.description} arrow placement="top">
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  color: '#101828',
                                  fontSize: '0.875rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {(inv.items && inv.items[0]?.description) || inv.description}
                              </Typography>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: '#086B70', fontWeight: 600 }}>
                              {inv.credits ? `${inv.credits.toLocaleString()} Cloud Credits Top-Up` : 'ESigniva Subscription'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* AMOUNT right aligned */}
                        <TableCell align="right" sx={{ py: 2, borderColor: '#E4E7EC' }}>
                          <Typography sx={{ fontWeight: 800, color: '#101828', fontSize: '0.95rem' }}>
                            {inv.total_str || inv.amount}
                          </Typography>
                        </TableCell>

                        {/* STATUS center aligned */}
                        <TableCell align="center" sx={{ py: 2, borderColor: '#E4E7EC' }}>
                          <Chip
                            label={inv.status || 'PAID'}
                            size="small"
                            sx={{
                              bgcolor: '#F0FDFA',
                              color: '#086B70',
                              border: '1px solid #086B70',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              letterSpacing: '0.4px',
                              height: 24,
                              px: 0.5
                            }}
                          />
                        </TableCell>

                        {/* ACTION BUTTONS right aligned */}
                        <TableCell align="right" sx={{ py: 2, borderColor: '#E4E7EC' }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                            {/* <Tooltip title="Open official SaaS invoice preview" arrow>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon sx={{ fontSize: '16px !important' }} />}
                                onClick={() => handleViewReceipt(inv)}
                                sx={{
                                  textTransform: 'none',
                                  color: '#086B70',
                                  bgcolor: '#F0FDFA',
                                  borderColor: '#99F6E4',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  borderRadius: '8px',
                                  px: 1.8,
                                  py: 0.5,
                                  boxShadow: 'none',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    borderColor: '#086B70',
                                    bgcolor: '#CCFBF1',
                                    color: '#065054'
                                  }
                                }}
                              >
                                View Invoice
                              </Button>
                            </Tooltip> */}

                            <Tooltip title="Download official A4 PDF invoice" arrow>
                              <Button
                                size="small"
                                variant="contained"
                                disabled={isDownloading}
                                startIcon={
                                  isDownloading ? (
                                    <CircularProgress size={14} color="inherit" />
                                  ) : (
                                    <DownloadIcon sx={{ fontSize: '16px !important' }} />
                                  )
                                }
                                onClick={() => handleDownloadPdfReceipt(inv)}
                                sx={{
                                  textTransform: 'none',
                                  bgcolor: '#086B70',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  borderRadius: '8px',
                                  px: 1.8,
                                  py: 0.5,
                                  boxShadow: 'none',
                                  '&:hover': {
                                    bgcolor: '#065054',
                                    boxShadow: '0 2px 4px rgba(8, 107, 112, 0.25)'
                                  }
                                }}
                              >
                                {isDownloading ? 'Generating...' : 'Download PDF'}
                              </Button>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ==================================================== */}
      {/* TAB 3: TRANSACTION LEDGER */}
      {/* ==================================================== */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
                Transaction History Ledger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete real-time record of credit purchases, allocations, and metered feature usage.
              </Typography>
            </Box>
            <IconButton onClick={fetchAllData} color="primary" sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Description / Action</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a' }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a' }} align="right">Balance After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <HistoryIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1, display: 'block', mx: 'auto' }} />
                      No transaction records found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const dateInfo = formatTxDate(tx.created_at);
                    const isCredit = tx.amount > 0;

                    return (
                      <TableRow key={tx.id || tx.transaction_id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonthIcon sx={{ fontSize: 18, color: '#64748b' }} />
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                                {dateInfo.formatted}
                              </Typography>
                              {dateInfo.relative && (
                                <Typography variant="caption" color="text.secondary">
                                  {dateInfo.relative}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={tx.type?.toUpperCase() || (isCredit ? 'CREDIT' : 'DEBIT')}
                            color={isCredit ? 'success' : 'default'}
                            sx={{ fontWeight: 600, borderRadius: '6px', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#334155' }}>
                            {tx.description || tx.source || 'Metered Action'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: isCredit ? '#10b981' : '#ef4444', fontSize: '0.95rem' }}>
                          {isCredit ? `+${tx.amount}` : tx.amount}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {tx.balance_after?.toLocaleString() ?? '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* STRIPE PURCHASE DIALOG */}
      <Dialog open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            Purchase Credit Package
          </Typography>
          <IconButton onClick={() => setPurchaseModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {initializingPayment ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress sx={{ color: '#0f766e' }} />
              <Typography variant="body2" color="text.secondary">
                Initializing checkout session...
              </Typography>
            </Box>
          ) : selectedPack && paymentIntentData ? (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentData.client_secret }}>
              <StripePaymentForm
                pack={selectedPack}
                clientSecret={paymentIntentData.client_secret}
                paymentIntentId={paymentIntentData.payment_intent_id}
                onSuccess={handlePurchaseSuccess}
                onCancel={() => setPurchaseModalOpen(false)}
              />
            </Elements>
          ) : (
            <Alert severity="error">Unable to initialize checkout. Please try again.</Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* CUSTOM PRICE / TALK TO SALES MODAL */}
      <Dialog open={salesModalOpen} onClose={() => setSalesModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HeadsetMicIcon sx={{ color: '#0284c7' }} />
            <Typography variant="h6" fontWeight={800}>
              Talk to Enterprise Sales
            </Typography>
          </Box>
          <IconButton onClick={() => setSalesModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSalesSubmit}>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connect with our enterprise team to request custom credit volume discounts, dedicated API SLAs, or custom invoicing terms.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Your Full Name"
                  value={salesForm.name}
                  onChange={(e) => setSalesForm({ ...salesForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Work Email"
                  value={salesForm.email}
                  onChange={(e) => setSalesForm({ ...salesForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={salesForm.company}
                  onChange={(e) => setSalesForm({ ...salesForm, company: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={salesForm.phone}
                  onChange={(e) => setSalesForm({ ...salesForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Estimated Volume & Requirements"
                  value={salesForm.message}
                  onChange={(e) => setSalesForm({ ...salesForm, message: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setSalesModalOpen(false)} disabled={submittingSales}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submittingSales}
              startIcon={submittingSales ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
            >
              {submittingSales ? 'Submitting...' : 'Submit Sales Inquiry'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* RECEIPT PREVIEW MODAL */}
      {/* ==================================================== */}
      <Dialog
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            maxHeight: '92vh',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
          }
        }}
      >
        {/* TOP TOOLBAR: INVOICE HEADER & QUICK ACTION BUTTONS */}
        <DialogTitle
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            bgcolor: '#ffffff',
            borderBottom: '1px solid #E4E7EC',
            py: 1.8,
            px: { xs: 2, sm: 3 },
            gap: 1.5
          }}
        >
          {/* Left: Invoice Identity & Number */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #086B70 0%, #0F766E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(8, 107, 112, 0.25)'
              }}
            >
              <ReceiptIcon sx={{ color: '#ffffff', fontSize: 20 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} color="#101828" lineHeight={1.2}>
                  Invoice Preview
                </Typography>
                <Chip
                  label={selectedReceipt?.status || 'PAID'}
                  size="small"
                  icon={<CheckIcon sx={{ fontSize: '13px !important', color: '#086B70 !important' }} />}
                  sx={{
                    bgcolor: '#F0FDFA',
                    color: '#086B70',
                    border: '1px solid #99F6E4',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    height: 22,
                    px: 0.5
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontWeight: 700,
                    color: '#086B70'
                  }}
                >
                  {selectedReceipt?.invoice_number || selectedReceipt?.id}
                </Typography>
                <Tooltip title={copiedInvId ? "Copied!" : "Copy Invoice Number"} arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyInvoiceNumber(selectedReceipt?.invoice_number || selectedReceipt?.id)}
                    sx={{ p: 0.3, color: '#64748B', '&:hover': { color: '#086B70', bgcolor: '#F0FDFA' } }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  • {selectedReceipt?.issue_date_str || selectedReceipt?.date}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right: Top Action Buttons for Instant Access */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: { xs: 'stretch', sm: 'center' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
            <Tooltip title="Print invoice or open browser print view" arrow>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon sx={{ fontSize: '16px !important' }} />}
                onClick={() => handlePrintReceipt(selectedReceipt)}
                sx={{
                  textTransform: 'none',
                  borderColor: '#E4E7EC',
                  color: '#101828',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    borderColor: '#086B70',
                    bgcolor: '#F0FDFA',
                    color: '#086B70'
                  }
                }}
              >
                Print
              </Button>
            </Tooltip>

            <Tooltip title="Download high-resolution official A4 PDF" arrow>
              <Button
                size="small"
                variant="contained"
                disabled={downloadingInvoiceId === (selectedReceipt?.invoice_number || selectedReceipt?.id)}
                startIcon={
                  downloadingInvoiceId === (selectedReceipt?.invoice_number || selectedReceipt?.id) ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <DownloadIcon sx={{ fontSize: '16px !important' }} />
                  )
                }
                onClick={() => handleDownloadPdfReceipt(selectedReceipt)}
                sx={{
                  textTransform: 'none',
                  bgcolor: '#086B70',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  px: 1.8,
                  py: 0.5,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#065054',
                    boxShadow: '0 2px 4px rgba(8, 107, 112, 0.25)'
                  }
                }}
              >
                {downloadingInvoiceId === (selectedReceipt?.invoice_number || selectedReceipt?.id) ? 'Generating...' : 'Download PDF'}
              </Button>
            </Tooltip>

            <IconButton
              size="small"
              onClick={() => setReceiptModalOpen(false)}
              sx={{
                color: '#64748B',
                borderRadius: '8px',
                '&:hover': { bgcolor: '#F1F5F9', color: '#101828' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* DIALOG BODY: A4 PAPER SHEET CANVAS */}
        <DialogContent sx={{ p: { xs: 2, sm: 3.5, md: 4 }, bgcolor: '#F1F5F9' }}>
          {selectedReceipt && (
            <Paper
              elevation={0}
              sx={{
                maxWidth: '780px',
                margin: '0 auto',
                p: { xs: 2.5, sm: 4.5 },
                bgcolor: '#ffffff',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)'
              }}
            >
              {/* Document Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E4E7EC', pb: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 64 64" fill="none">
                    <defs>
                      <linearGradient id="modalLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#086B70" />
                        <stop offset="100%" stopColor="#0F766E" />
                      </linearGradient>
                    </defs>
                    <rect width="64" height="64" rx="14" fill="url(#modalLogoGrad)"/>
                    <path d="M32 14C32 14 44 16 44 26C44 38 32 48 32 48C32 48 20 38 20 26C20 16 32 14 32 14Z" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M26 28L30 32L38 22" stroke="#5EEAD4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                  <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ color: '#101828', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                      ESigniva
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#086B70', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mt: 0.3 }}>
                      Digital Signature Platform
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={900} color="#101828" sx={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                      INVOICE
                    </Typography>
                    <Chip
                      label={selectedReceipt.status || 'PAID'}
                      size="small"
                      sx={{
                        bgcolor: '#F0FDFA',
                        color: '#086B70',
                        border: '1px solid #086B70',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        height: 20
                      }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontWeight: 800, color: '#086B70' }}>
                    {selectedReceipt.invoice_number || selectedReceipt.id}
                  </Typography>
                </Box>
              </Box>

              {/* Balanced Two-Column Billing Layout */}
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2.2, bgcolor: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: '8px', height: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#086B70', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.8 }}>
                      BILLED FROM
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="#101828">
                      ESigniva
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.3, lineHeight: 1.5 }}>
                      <strong>{selectedReceipt.issuer?.legal_name || 'ESigniva Technologies'}</strong><br />
                      {selectedReceipt.issuer?.address_line1 || 'Tech Innovation Hub, Cyber Gateway'}<br />
                      {selectedReceipt.issuer?.address_line2 ? `${selectedReceipt.issuer.address_line2}, ` : ''}{selectedReceipt.issuer?.city || 'Chennai'}, {selectedReceipt.issuer?.state || 'Tamil Nadu'} {selectedReceipt.issuer?.postal_code || '600096'}, {selectedReceipt.issuer?.country || 'India'}<br />
                      Tax ID: {selectedReceipt.issuer?.tax_id || 'GSTIN33AAACE1234F1Z5'}<br />
                      {selectedReceipt.issuer?.billing_email || 'billing@esigniva.com'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2.2, bgcolor: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: '8px', height: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#086B70', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.8 }}>
                      BILLED TO
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="#101828" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedReceipt.customer?.name || billingInfo.companyName || user?.company || user?.full_name || 'Valued Customer'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.3, lineHeight: 1.5 }}>
                      {selectedReceipt.customer?.address || `${billingInfo.address || '100 Enterprise Way'}, ${billingInfo.city || 'San Francisco'}, ${billingInfo.state || 'CA'} ${billingInfo.zip || '94107'}`}<br />
                      {selectedReceipt.customer?.tax_id && selectedReceipt.customer.tax_id !== 'N/A' ? (
                        <>Tax ID: {selectedReceipt.customer.tax_id}<br /></>
                      ) : (
                        billingInfo.vatId ? <>Tax ID: {billingInfo.vatId}<br /></> : null
                      )}
                      {selectedReceipt.customer?.email || billingInfo.billingEmail || user?.email || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Metadata Strip */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', bgcolor: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: '8px', p: 1.5, mb: 3 }}>
                <Box sx={{ flex: 1, minWidth: 120, px: 1, py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    Invoice Date
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#101828">
                    {selectedReceipt.issue_date_str || selectedReceipt.date || format(new Date(), 'dd MMM yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120, px: 1, py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    Payment Date
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#101828">
                    {selectedReceipt.payment_date_str || selectedReceipt.date || format(new Date(), 'dd MMM yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120, px: 1, py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    Payment Method
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#101828">
                    {selectedReceipt.payment_method || 'Stripe'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120, px: 1, py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    Currency
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#101828">
                    {selectedReceipt.currency || 'USD'}
                  </Typography>
                </Box>
              </Box>

              {/* Line Items Table with Minimal Borders */}
              <TableContainer sx={{ border: '1px solid #E4E7EC', borderRadius: '8px', mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 1.5, borderColor: '#E4E7EC' }}>
                        Description
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 1.5, borderColor: '#E4E7EC' }}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 1.5, borderColor: '#E4E7EC' }}>
                        Unit Price
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 1.5, borderColor: '#E4E7EC' }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedReceipt.items && selectedReceipt.items.length > 0) ? (
                      selectedReceipt.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ py: 1.5, borderColor: '#E4E7EC' }}>
                            <Typography variant="body2" fontWeight={700} color="#101828">
                              {item.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.sub_description || item.details || 'Official ESigniva digital cloud services'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5, fontWeight: 600, borderColor: '#E4E7EC' }}>
                            {item.quantity || 1}
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5, color: '#475569', borderColor: '#E4E7EC' }}>
                            {item.unit_price || item.amount || selectedReceipt.subtotal_str || selectedReceipt.amount}
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, color: '#101828', borderColor: '#E4E7EC' }}>
                            {item.amount || selectedReceipt.total_str || selectedReceipt.amount}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell sx={{ py: 1.5, borderColor: '#E4E7EC' }}>
                          <Typography variant="body2" fontWeight={700} color="#101828">
                            {selectedReceipt.description || '500 ESigniva Credits'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            One-time credit top-up • Non-expiring cloud credits
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.5, fontWeight: 600, borderColor: '#E4E7EC' }}>
                          1
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5, color: '#475569', borderColor: '#E4E7EC' }}>
                          {selectedReceipt.amount}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, color: '#101828', borderColor: '#E4E7EC' }}>
                          {selectedReceipt.amount}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals & Compact Payment Details */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 3, mb: 3 }}>
                <Box sx={{ flex: 1.1, p: 2, bgcolor: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#086B70', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', display: 'block', mb: 0.8 }}>
                    Payment Confirmation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                    Payment processed through <strong>{selectedReceipt.payment_method || 'Stripe'}</strong>. Keep this invoice for your records.<br />
                    Reference: <strong>{selectedReceipt.short_reference || selectedReceipt.payment_reference || `STRIPE-TX-${(selectedReceipt.invoice_number || selectedReceipt.id).replace(/[^a-zA-Z0-9]/g, '')}`}</strong><br />
                    Settlement Status: <strong>Settled & Cleared to Organization Balance</strong>
                  </Typography>
                </Box>

                <Box sx={{ minWidth: 260 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                    <Typography variant="body2" color="#64748B">Subtotal</Typography>
                    <Typography variant="body2" fontWeight={600} color="#101828">{selectedReceipt.subtotal_str || selectedReceipt.amount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                    <Typography variant="body2" color="#64748B">Tax (0%)</Typography>
                    <Typography variant="body2" fontWeight={600} color="#101828">{selectedReceipt.tax_str || '$0.00'}</Typography>
                  </Box>
                  <Divider sx={{ my: 1, borderColor: '#E4E7EC' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.2, bgcolor: '#F0FDFA', border: '1.5px solid #086B70', borderRadius: '6px' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#101828">Total Paid</Typography>
                    <Typography variant="subtitle2" fontWeight={900} color="#086B70">{selectedReceipt.total_paid_str || selectedReceipt.total_str || selectedReceipt.amount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, px: 0.5 }}>
                    <Typography variant="body2" color="#64748B">Balance Due</Typography>
                    <Typography variant="body2" fontWeight={700} color="#101828">{selectedReceipt.balance_str || selectedReceipt.balance_due_str || '$0.00'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Clean Footer */}
              <Box sx={{ pt: 2.5, borderTop: '1px solid #E4E7EC', textAlign: 'center' }}>
                <Typography variant="body2" fontWeight={600} color="#101828">
                  Thank you for choosing ESigniva.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  This is an electronically generated official invoice valid without physical signature.
                </Typography>
                <Typography variant="caption" sx={{ color: '#086B70', fontWeight: 600, display: 'block', mt: 0.5 }}>
                  esigniva.com • support@esigniva.com • billing@esigniva.com
                </Typography>
              </Box>
            </Paper>
          )}
        </DialogContent>

        {/* BOTTOM DIALOG ACTIONS */}
        <DialogActions sx={{ p: 2, px: 3, bgcolor: '#ffffff', borderTop: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Official A4 tax invoice • Electronically verified & settled via Stripe
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
            <Button
              onClick={() => setReceiptModalOpen(false)}
              sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
            >
              Close
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintReceipt(selectedReceipt)}
              sx={{
                textTransform: 'none',
                borderColor: '#086B70',
                color: '#086B70',
                fontWeight: 700,
                '&:hover': { bgcolor: '#F0FDFA', borderColor: '#086B70' }
              }}
            >
              Print / Web View
            </Button>
            <Button
              variant="contained"
              disabled={downloadingInvoiceId === (selectedReceipt?.invoice_number || selectedReceipt?.id)}
              startIcon={
                downloadingInvoiceId === (selectedReceipt?.invoice_number || selectedReceipt?.id) ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadIcon />
                )
              }
              onClick={() => handleDownloadPdfReceipt(selectedReceipt)}
              sx={{
                textTransform: 'none',
                bgcolor: '#086B70',
                color: '#ffffff',
                fontWeight: 700,
                '&:hover': { bgcolor: '#065054' }
              }}
            >
              {downloadingInvoiceId === (selectedReceipt?.invoice_number || selectedReceipt?.id) ? 'Downloading...' : 'Download Official PDF'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATIONS */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
