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
  AlertTitle,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Avatar,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Snackbar,
  useTheme,
  useMediaQuery,
  TextField
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  SwapHoriz as SwapHorizIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faCrown, faDiamond } from '@fortawesome/free-solid-svg-icons';
import { styled } from '@mui/material/styles';
import { format, differenceInDays, parseISO, isAfter, isBefore, differenceInSeconds } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// ============================================
// STYLED COMPONENTS
// ============================================
const StyledCard = styled(Card)(({ theme, ispopular, iscurrent }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[12]
  },
  ...(ispopular && {
    border: `2px solid ${theme.palette.primary.main}`,
    transform: 'scale(1.02)',
    '&:hover': {
      transform: 'scale(1.02) translateY(-8px)'
    }
  }),
  ...(iscurrent && {
    border: `2px solid ${theme.palette.success.main}`,
    backgroundColor: `${theme.palette.success.light}10`
  })
}));

const PopularBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: -12,
  right: 20,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  zIndex: 1,
  '& .MuiChip-label': {
    padding: '0 12px'
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const colors = {
    active: {
      bg: theme.palette.success.light,
      color: theme.palette.success.dark,
      border: theme.palette.success.main
    },
    expired: {
      bg: theme.palette.error.light,
      color: theme.palette.error.dark,
      border: theme.palette.error.main
    },
    cancelled: {
      bg: theme.palette.warning.light,
      color: theme.palette.warning.dark,
      border: theme.palette.warning.main
    },
    pending: {
      bg: theme.palette.info.light,
      color: theme.palette.info.dark,
      border: theme.palette.info.main
    }
  };

  const colorConfig = colors[status] || colors.pending;

  return {
    backgroundColor: colorConfig.bg,
    color: colorConfig.color,
    borderColor: colorConfig.border,
    fontWeight: 600,
    '& .MuiChip-icon': {
      color: colorConfig.color
    }
  };
});

const CountdownBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.primary.contrastText,
  '& .countdown-item': {
    textAlign: 'center',
    '& .value': {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1
    },
    '& .label': {
      fontSize: '0.75rem',
      opacity: 0.8
    }
  }
}));

const PlanPrice = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2, 0),
  '& .currency': {
    fontSize: '1.5rem',
    verticalAlign: 'super',
    color: theme.palette.text.secondary
  },
  '& .amount': {
    fontSize: '3.5rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
    lineHeight: 1
  },
  '& .period': {
    fontSize: '1rem',
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(0.5)
  }
}));

const FeatureList = styled(List)({
  padding: 0,
  '& .MuiListItem-root': {
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    '&:last-child': {
      borderBottom: 'none'
    }
  }
});

const PricingCard = styled(Card)(({ theme, accentcolor }) => ({
  width: '100%',
  maxWidth: 320,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '24px',
  overflow: 'hidden',
  position: 'relative',
  border: 'none',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
  }
}));

const CardHeader = styled(Box)(({ accentcolor }) => ({
  backgroundColor: accentcolor,
  height: '160px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '20px',
  position: 'relative',
  color: 'white',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: 'white',
    clipPath: 'ellipse(70% 100% at 50% 100%)',
  }
}));

const PriceBox = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '70px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '180px',
  padding: '20px 10px',
  borderRadius: '16px',
  textAlign: 'center',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  zIndex: 2,
  backgroundColor: 'white',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '40px',
    height: '40px',
    backgroundColor: 'white',
    borderRadius: '16px 0 24px 0',
    zIndex: -1
  }
}));

// ============================================
// TAB PANEL COMPONENT
// ============================================
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subscription-tabpanel-${index}`}
      aria-labelledby={`subscription-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// ============================================
// COUNTDOWN COMPONENT
// ============================================
const CountdownTimer = ({ expiryDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!expiryDate) return;

      const now = new Date();
      const expiry = new Date(expiryDate);
      const difference = differenceInSeconds(expiry, now);

      if (difference > 0) {
        const days = Math.floor(difference / (3600 * 24));
        const hours = Math.floor((difference % (3600 * 24)) / 3600);
        const minutes = Math.floor((difference % 3600) / 60);
        const seconds = difference % 60;

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiryDate, onExpire]);

  return (
    <CountdownBox>
      <Box className="countdown-item">
        <div className="value">{timeLeft.days}</div>
        <div className="label">Days</div>
      </Box>
      <Box className="countdown-item">
        <div className="value">{timeLeft.hours}</div>
        <div className="label">Hours</div>
      </Box>
      <Box className="countdown-item">
        <div className="value">{timeLeft.minutes}</div>
        <div className="label">Mins</div>
      </Box>
      <Box className="countdown-item">
        <div className="value">{timeLeft.seconds}</div>
        <div className="label">Secs</div>
      </Box>
    </CountdownBox>
  );
};

// ============================================
// PAYMENT FORM COMPONENT
// ============================================
const PaymentForm = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription/success`,
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
    } else {
      // Payment successful, create subscription
      try {
        await api.post('/subscription/subscribe', {
          plan_type: plan.plan_type,
          payment_method_id: plan.paymentIntentId, // You'll need to pass this
          custom_duration_days: plan.custom_duration_days,
          custom_price: plan.custom_price
        });
        onSuccess();
      } catch (err) {
        setError('Failed to create subscription');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {loading ? 'Processing...' : `Pay $${plan.price}`}
        </Button>
      </Box>
    </form>
  );
};

// ============================================
// PAYMENT FORM WRAPPER COMPONENT
// ============================================
const PaymentFormWithElements = ({ plan, onSuccess, onCancel }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  useEffect(() => {
    const fetchClientSecret = async () => {
      if (!plan) return;

      try {
        const response = await api.post('/subscription/create-payment-intent', {
          plan_type: plan.plan_type,
          custom_price: plan.custom_price,
          custom_duration_days: plan.custom_duration_days
        });
        setClientSecret(response.data.client_secret);
        setPaymentIntentId(response.data.payment_intent_id);
      } catch (err) {
        setError('Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    fetchClientSecret();
  }, [plan]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!clientSecret) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Initializing payment form...
      </Alert>
    );
  }

  // Create a new plan object with the paymentIntentId
  const planWithPaymentIntent = {
    ...plan,
    paymentIntentId
  };

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        plan={planWithPaymentIntent}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};

// ============================================
// ENTERPRISE QUOTE FORM
// ============================================
const EnterpriseQuoteForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ px: 3, py: 2, maxWidth: 520, mx: "auto" }}>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Enterprise Contact
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Tell us about your requirements and our team will contact you shortly.
          </Typography>
        </Box>


        <Box sx={{ mb: 3, gap: 2 }}>
          {/* Name */}
          <Grid item xs={12} sx={{ mb: 3, gap: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sx={{ mb: 3, gap: 2 }}>
            <TextField
              fullWidth

              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* Company */}
          <Grid item xs={12} sx={{ mb: 3, gap: 2 }}>
            <TextField
              fullWidth
              label="Company (optional)"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} sx={{ mb: 3, gap: 2 }}>
            <TextField
              fullWidth
              label="Phone Number (optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>

          {/* Message */}
          <Grid item xs={12} sx={{ mb: 3, gap: 2 }}>
            <TextField
              fullWidth

              multiline
              rows={5}
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe your requirements..."
              required
            />
          </Grid>
        </Box>

        {/* Buttons */}
        <Box
          sx={{
            mt: 4,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2
          }}
        >
          <Button
            onClick={onCancel}
            variant="outlined"
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={<BusinessIcon />}
          >
            Request Quote
          </Button>
        </Box>

      </Box>
    </Box>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const Subscription = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [accessCheck, setAccessCheck] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [prorationInfo, setProrationInfo] = useState(null);
  const [dialogState, setDialogState] = useState({
    subscribe: false,
    cancel: false,
    renew: false,
    details: false,
    changePlan: false,
    enterprise: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [expiryProgress, setExpiryProgress] = useState(0);

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        plansRes,
        currentSubRes,
        statusRes,
        historyRes,
        paymentsRes,
        accessRes
      ] = await Promise.allSettled([
        api.get('/subscription/plans'),
        api.get('/subscription/current'),
        api.get('/subscription/status'),
        api.get('/subscription/history'),
        api.get('/subscription/payments'),
        api.get('/subscription/check-access')
      ]);

      // Handle each response
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data);
      else console.error('Failed to fetch plans:', plansRes.reason);

      if (currentSubRes.status === 'fulfilled') setCurrentSubscription(currentSubRes.value.data);
      else console.error('Failed to fetch current subscription:', currentSubRes.reason);

      if (statusRes.status === 'fulfilled') setSubscriptionStatus(statusRes.value.data);
      else console.error('Failed to fetch subscription status:', statusRes.reason);

      if (historyRes.status === 'fulfilled') setSubscriptionHistory(historyRes.value.data);
      else console.error('Failed to fetch subscription history:', historyRes.reason);

      if (paymentsRes.status === 'fulfilled') setPaymentHistory(paymentsRes.value.data);
      else console.error('Failed to fetch payment history:', paymentsRes.reason);

      if (accessRes.status === 'fulfilled') setAccessCheck(accessRes.value.data);
      else console.error('Failed to check access:', accessRes.reason);

    } catch (error) {
      showSnackbar('Failed to load subscription data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate expiry progress
  useEffect(() => {
    if (currentSubscription?.expiry_date && currentSubscription?.start_date) {
      const start = new Date(currentSubscription.start_date);
      const expiry = new Date(currentSubscription.expiry_date);
      const now = new Date();

      const totalDuration = expiry - start;
      const elapsed = now - start;
      const progress = (elapsed / totalDuration) * 100;

      setExpiryProgress(Math.min(100, Math.max(0, progress)));
    }
  }, [currentSubscription]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'free_trial':
        return <ScheduleIcon />;
      case 'monthly':
        return <ScheduleIcon />;
      case 'yearly':
        return <TrendingUpIcon />;
      case 'enterprise':
        return <BusinessIcon />;
      default:
        return <StarIcon />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon />;
      case 'expired':
        return <CancelIcon />;
      case 'cancelled':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'info';
    }
  };

  const handleExpire = () => {
    fetchAllData();
  };

  // ============================================
  // SUBSCRIPTION ACTIONS
  // ============================================
  const handleSubscribe = (plan) => {
    if (plan.plan_type === 'enterprise') {
      setDialogState({ ...dialogState, enterprise: true });
    } else {
      setSelectedPlan(plan);
      setDialogState({ ...dialogState, subscribe: true });
    }
  };

  const handleChangePlan = async (newPlan) => {
    setSelectedPlan(newPlan);
    setDialogState({ ...dialogState, changePlan: true });

    // Calculate proration if changing from existing subscription
    if (currentSubscription) {
      try {
        const response = await api.post('/subscription/calculate-proration', {
          new_plan_type: newPlan.plan_type
        });
        setProrationInfo(response.data);
      } catch (error) {
        console.error('Failed to calculate proration:', error);
      }
    }
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;

    setActionLoading(true);
    try {
      const response = await api.post('/subscription/subscribe', {
        plan_type: selectedPlan.plan_type,
        custom_duration_days: selectedPlan.custom_duration_days,
        custom_price: selectedPlan.custom_price
      });

      showSnackbar(response.data.message || 'Successfully subscribed!', 'success');
      setDialogState({ ...dialogState, subscribe: false });
      await fetchAllData();

      // Update user context
      if (updateUser) {
        updateUser({ ...user, has_active_subscription: true });
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || 'Failed to subscribe',
        'error'
      );
    } finally {
      setActionLoading(false);
      setSelectedPlan(null);
    }
  };

  const confirmChangePlan = async () => {
    if (!selectedPlan) return;

    setActionLoading(true);
    try {
      const response = await api.post('/subscription/change-plan', {
        new_plan_type: selectedPlan.plan_type,
        custom_duration_days: selectedPlan.custom_duration_days,
        custom_price: selectedPlan.custom_price
      });

      showSnackbar(response.data.message || 'Plan changed successfully!', 'success');
      setDialogState({ ...dialogState, changePlan: false });
      await fetchAllData();
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || 'Failed to change plan',
        'error'
      );
    } finally {
      setActionLoading(false);
      setSelectedPlan(null);
      setProrationInfo(null);
    }
  };

  const handleCancel = () => {
    setDialogState({ ...dialogState, cancel: true });
  };

  const confirmCancel = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/subscription/cancel');

      showSnackbar(response.data.message || 'Subscription cancelled successfully', 'success');
      setDialogState({ ...dialogState, cancel: false });
      await fetchAllData();

      if (updateUser) {
        updateUser({ ...user, has_active_subscription: false });
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || 'Failed to cancel subscription',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = () => {
    setDialogState({ ...dialogState, renew: true });
  };

  const confirmRenew = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/subscription/renew');

      showSnackbar(response.data.message || 'Subscription renewed successfully', 'success');
      setDialogState({ ...dialogState, renew: false });
      await fetchAllData();

      if (updateUser) {
        updateUser({ ...user, has_active_subscription: true });
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || 'Failed to renew subscription',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnterpriseQuote = async (formData) => {
    setActionLoading(true);
    try {
      await api.post('/subscription/enterprise-quote', formData);

      showSnackbar('Quote request submitted successfully! Our team will contact you soon.', 'success');
      setDialogState({ ...dialogState, enterprise: false });
    } catch (error) {
      showSnackbar(
        error.response?.data?.detail || 'Failed to submit quote request',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDialog = (dialogName) => {
    setDialogState({ ...dialogState, [dialogName]: false });
    setSelectedPlan(null);
    setProrationInfo(null);
  };

  // ============================================
  // RENDER SECTIONS
  // ============================================
  const renderHeader = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscription Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage your subscription plan, view billing history, and update payment methods
      </Typography>
    </Box>
  );

  const renderCountdown = () => {
    if (!currentSubscription?.expiry_date) return null;

    return (
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TimerIcon />
          <Typography variant="h6">Time Remaining on Current Plan</Typography>
        </Box>
        <CountdownTimer
          expiryDate={currentSubscription.expiry_date}
          onExpire={handleExpire}
        />
      </Paper>
    );
  };

  const renderStatusBanner = () => {
    if (!subscriptionStatus) return null;

    const { has_active_subscription, status, plan_name, days_remaining, message } = subscriptionStatus;

    let severity = 'info';
    let icon = <InfoIcon />;

    if (has_active_subscription) {
      if (days_remaining <= 3) {
        severity = 'warning';
        icon = <WarningIcon />;
      } else {
        severity = 'success';
        icon = <CheckCircleIcon />;
      }
    } else if (status === 'expired') {
      severity = 'error';
      icon = <ErrorIcon />;
    }

    return (
      <Alert
        severity={severity}
        icon={icon}
        sx={{ mb: 3 }}
        action={
          !has_active_subscription && (
            <Button
              color="inherit"
              size="small"
              onClick={() => setActiveTab(0)}
              sx={{ textTransform: 'none' }}
            >
              View Plans
            </Button>
          )
        }
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {has_active_subscription ? 'Active Subscription' : 'No Active Subscription'}
        </AlertTitle>
        {message}
        {has_active_subscription && days_remaining <= 7 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WarningIcon fontSize="small" color="warning" />
              <strong>{days_remaining} days remaining</strong> - Consider renewing soon
            </Typography>
          </Box>
        )}
      </Alert>
    );
  };

  const renderCurrentSubscription = () => {
    if (!currentSubscription) return null;

    const { plan_name, status, start_date, expiry_date, days_remaining, auto_renew, price } = currentSubscription;

    return (
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: `${getStatusColor(status)}.light`,
                  color: `${getStatusColor(status)}.main`,
                  width: 56,
                  height: 56
                }}
              >
                {getPlanIcon(currentSubscription.plan_type)}
              </Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {plan_name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <StatusChip
                    size="small"
                    icon={getStatusIcon(status)}
                    label={status.toUpperCase()}
                    status={status}
                  />
                  {auto_renew && status === 'active' && (
                    <Chip
                      size="small"
                      icon={<RefreshIcon />}
                      label="Auto-renew enabled"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    size="small"
                    icon={<PaymentIcon />}
                    label={formatCurrency(price)}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Start Date
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatDate(start_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Expiry Date
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatDate(expiry_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Days Remaining
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {days_remaining} days
                  </Typography>
                  {days_remaining <= 7 && (
                    <WarningIcon color="warning" fontSize="small" />
                  )}
                </Box>
              </Grid>
            </Grid>

            {status === 'active' && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Subscription Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(expiryProgress)}% used
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={expiryProgress}
                  color={expiryProgress > 80 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              height: '100%',
              justifyContent: 'center',
              alignItems: { xs: 'flex-start', md: 'flex-end' }
            }}>
              {status === 'active' && (
                <>
                  <Button
                    fullWidth={isMobile}
                    variant="outlined"
                    color="warning"
                    onClick={handleCancel}
                    startIcon={<CancelIcon />}
                    sx={{ minWidth: 140 }}
                  >
                    Cancel Subscription
                  </Button>
                  <Button
                    fullWidth={isMobile}
                    variant="outlined"
                    color="primary"
                    onClick={() => setActiveTab(0)}
                    startIcon={<SwapHorizIcon />}
                    sx={{ minWidth: 140 }}
                  >
                    Change Plan
                  </Button>
                  {auto_renew && (
                    <Button
                      fullWidth={isMobile}
                      variant="contained"
                      color="primary"
                      onClick={handleRenew}
                      startIcon={<RefreshIcon />}
                      sx={{ minWidth: 140 }}
                    >
                      Renew Now
                    </Button>
                  )}
                </>
              )}
              {status === 'expired' && (
                <Button
                  fullWidth={isMobile}
                  variant="contained"
                  color="primary"
                  onClick={handleRenew}
                  startIcon={<RefreshIcon />}
                  sx={{ minWidth: 140 }}
                >
                  Renew Subscription
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // ============================================
  // UPDATED RENDER PLANS - PROFESSIONAL DESIGN
  // ============================================
  // ============================================
  // UPDATED RENDER PLANS - PROFESSIONAL DESIGN (IMAGE-BASED)
  // ============================================
  const renderPlans = () => {
    // We'll define manual plans for visual consistency with the request
    // and map them to the backend plans where possible
    const planDesignData = [
      {
        type: 'monthly',
        title: 'BASIC',
        price: '24.99',
        accentColor: '#ff6a34', // Orange
        features: [
          { text: 'Unlimited Document Uploads', included: true },
          { text: 'Professional Document Builder', included: true },
          { text: 'Real-time Email Notifications', included: true },
          { text: 'Standard Audit Trails', included: true },
          { text: 'AI Template Generation', included: false },
          { text: 'Custom Branding', included: false }
        ]
      },
      {
        type: 'yearly',
        title: 'STANDARD',
        price: '49.99',
        accentColor: '#1e6afb', // Blue
        isPopular: true,
        features: [
          { text: 'Everything in Basic', included: true },
          { text: 'AI-Powered Template Generation', included: true },
          { text: 'Custom Branding (Logos)', included: true },
          { text: 'AI Field Auto-Positioning', included: true },
          { text: 'Advanced Document Analytics', included: true },
          { text: 'Priority Email & Chat Support', included: true }
        ]
      },
      {
        type: 'enterprise',
        title: 'PREMIUM',
        price: '99.99',
        accentColor: '#00c25a', // Green
        features: [
          { text: 'Everything in Standard', included: true },
          { text: 'Dedicated Account Manager', included: true },
          { text: 'Custom SLA & API Access', included: true },
          { text: 'In-person Signing Support', included: true },
          { text: 'White-label Document Portal', included: true },
          { text: 'Single Sign-On (SSO)', included: true }
        ]
      }
    ];

    return (
      <Box sx={{ py: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ mb: 2, color: '#1a202c', letterSpacing: '-0.02em' }}
          >
            Flexible Pricing Plans
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
            Choose the plan that fits your business needs. No hidden fees.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          {planDesignData.map((planInfo) => {
            // Find corresponding backend plan
            const backendPlan = plans.find(p => p.plan_type === planInfo.type) || { price: planInfo.price, plan_type: planInfo.type };
            const isCurrent = currentSubscription?.plan_type === backendPlan.plan_type;

            return (
              <Grid item xs={12} sm={6} md={4} key={planInfo.type} sx={{ display: 'flex', justifyContent: 'center' }}>
                <PricingCard accentcolor={planInfo.accentColor}>
                  {/* Color Header Section */}
                  <CardHeader accentcolor={planInfo.accentColor}>
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{ letterSpacing: '2px', mb: 1 }}
                    >
                      {planInfo.title}
                    </Typography>
                  </CardHeader>

                  {/* Overlapping Price Box */}
                  <PriceBox elevation={0}>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ color: planInfo.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Box component="span" sx={{ fontSize: '1.2rem', mt: -1.5, mr: 0.5 }}>$</Box>
                      {backendPlan.price || planInfo.price}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                      Per {planInfo.type === 'monthly' ? 'Month' : planInfo.type === 'yearly' ? 'Year' : 'User'}
                    </Typography>
                  </PriceBox>

                  {/* Content Section */}
                  <CardContent sx={{ pt: 10, px: 3, flexGrow: 1, backgroundColor: 'white' }}>
                    <FeatureList>
                      {planInfo.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {feature.included ? (
                              <CheckCircleIcon sx={{ color: planInfo.accentColor, fontSize: 18 }} />
                            ) : (
                              <CloseIcon sx={{ color: '#ff4d4d', fontSize: 18 }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.text}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: feature.included ? 500 : 400,
                              color: feature.included ? '#2d3748' : '#a0aec0'
                            }}
                          />
                        </ListItem>
                      ))}
                    </FeatureList>
                  </CardContent>

                  {/* Action Section */}
                  <Box sx={{ p: 4, pt: 0, backgroundColor: 'white', textAlign: 'center' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleSubscribe(backendPlan)}
                      disabled={isCurrent && backendPlan.plan_type !== 'enterprise'}
                      sx={{
                        backgroundColor: planInfo.accentColor,
                        color: 'white',
                        borderRadius: '12px',
                        py: 1.8,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: `0 8px 20px ${planInfo.accentColor}4D`,
                        '&:hover': {
                          backgroundColor: planInfo.accentColor,
                          opacity: 0.9,
                          boxShadow: `0 12px 25px ${planInfo.accentColor}66`,
                        },
                        '&.Mui-disabled': {
                          backgroundColor: '#cbd5e0',
                          color: '#718096',
                        }
                      }}
                    >
                      {isCurrent ? 'Current Plan' : planInfo.type === 'enterprise' ? 'Contact Us' : 'Select Plan'}
                    </Button>
                  </Box>
                </PricingCard>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderSubscriptionHistory = () => {
    if (!subscriptionHistory) return null;

    const { subscriptions, payments, statistics } = subscriptionHistory;

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Subscription History
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}
            >
              <Typography variant="h4" color="primary" fontWeight={600}>
                {statistics.total_subscriptions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Subscriptions
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}
            >
              <Typography variant="h4" color="primary" fontWeight={600}>
                {formatCurrency(statistics.total_spent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Spent
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}
            >
              <Typography variant="h4" color="primary" fontWeight={600}>
                {statistics.member_since ? format(new Date(statistics.member_since), 'MMM yyyy') : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member Since
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Days Used</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                        {getPlanIcon(sub.plan_type)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {sub.plan_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      size="small"
                      icon={getStatusIcon(sub.status)}
                      label={sub.status.toUpperCase()}
                      status={sub.status}
                    />
                  </TableCell>
                  <TableCell>{formatDate(sub.start_date)}</TableCell>
                  <TableCell>{formatDate(sub.expiry_date)}</TableCell>
                  <TableCell align="right" fontWeight={500}>
                    {formatCurrency(sub.price)}
                  </TableCell>
                  <TableCell align="right">{sub.days_used} days</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderPaymentHistory = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Payment History
      </Typography>

      {paymentHistory.length === 0 ? (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}
        >
          <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No payment history found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableCell>Date</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transaction ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>{formatDate(payment.created_at)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light' }}>
                        {getPlanIcon(payment.plan_type)}
                      </Avatar>
                      <Typography variant="body2">
                        {payment.plan_type.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" fontWeight={600}>
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={payment.payment_method}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={payment.status}
                      color={payment.status === 'completed' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={payment.transaction_id}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {payment.transaction_id?.slice(0, 8)}...
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  // ============================================
  // DIALOGS
  // ============================================
  const renderChangePlanDialog = () => (
    <Dialog
      open={dialogState.changePlan}
      onClose={() => handleCloseDialog('changePlan')}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon color="primary" />
          <Typography variant="h6">Change Plan</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {selectedPlan && (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Changing from {currentSubscription?.plan_name}</AlertTitle>
              You're switching to the {selectedPlan.name}. Your new plan will start immediately.
            </Alert>

            {prorationInfo && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.grey[50] }}>
                <Typography variant="subtitle2" gutterBottom>
                  Proration Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Credit from current plan
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      {formatCurrency(prorationInfo.credit_amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      New plan amount
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatCurrency(prorationInfo.new_amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Total due today
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(prorationInfo.total_due)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Box sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  New Plan Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Plan
                    </Typography>
                    <Typography variant="body1">
                      {selectedPlan.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {selectedPlan.duration_days} days
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <PaymentFormWithElements
              plan={selectedPlan}
              onSuccess={() => {
                handleCloseDialog('changePlan');
                fetchAllData();
                showSnackbar('Plan changed successfully!', 'success');
              }}
              onCancel={() => handleCloseDialog('changePlan')}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  // ============================================
  // ALSO UPDATE renderSubscribeDialog to use the same wrapper
  // ============================================
  const renderSubscribeDialog = () => (
    <Dialog
      open={dialogState.subscribe}
      onClose={() => handleCloseDialog('subscribe')}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            <Typography variant="h6">Complete Payment</Typography>
          </Box>
          <IconButton onClick={() => handleCloseDialog('subscribe')} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {selectedPlan && (
          <Box sx={{ mb: 3 }}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                      {getPlanIcon(selectedPlan.plan_type)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {selectedPlan.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPlan.duration_days} days access
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h5" color="primary" align="right" fontWeight={600}>
                    {formatCurrency(selectedPlan.price)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        <PaymentFormWithElements
          plan={selectedPlan}
          onSuccess={() => {
            handleCloseDialog('subscribe');
            fetchAllData();
            showSnackbar('Payment successful! Welcome to your new plan.', 'success');
          }}
          onCancel={() => handleCloseDialog('subscribe')}
        />
      </DialogContent>
    </Dialog>
  );

  const renderCancelDialog = () => (
    <Dialog
      open={dialogState.cancel}
      onClose={() => handleCloseDialog('cancel')}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
          <WarningIcon />
          <Typography variant="h6">Cancel Subscription</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Are you sure you want to cancel your subscription?
        </DialogContentText>

        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Important</AlertTitle>
          You'll continue to have access until your current billing period ends.
          After that, your account will be downgraded to free access with limited features.
        </Alert>

        {currentSubscription && (
          <Paper sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Access until
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDate(currentSubscription.expiry_date)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Days remaining
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {currentSubscription.days_remaining} days
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => handleCloseDialog('cancel')}
          disabled={actionLoading}
          variant="outlined"
        >
          Keep Subscription
        </Button>
        <Button
          onClick={confirmCancel}
          color="warning"
          variant="contained"
          disabled={actionLoading}
          startIcon={actionLoading ? <CircularProgress size={20} /> : <CancelIcon />}
        >
          {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderEnterpriseDialog = () => (
    <Dialog
      open={dialogState.enterprise}
      onClose={() => handleCloseDialog('enterprise')}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6">Request Enterprise Quote</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <EnterpriseQuoteForm
          onSubmit={handleEnterpriseQuote}
          onCancel={() => handleCloseDialog('enterprise')}
        />
      </DialogContent>
    </Dialog>
  );

  const renderRenewDialog = () => (
    <Dialog
      open={dialogState.renew}
      onClose={() => handleCloseDialog('renew')}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RefreshIcon color="primary" />
          <Typography variant="h6">Renew Subscription</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Renew your subscription to continue enjoying all premium features.
        </DialogContentText>

        {currentSubscription && (
          <Paper
            elevation={0}
            variant="outlined"
            sx={{ p: 3, bgcolor: theme.palette.grey[50], borderRadius: 2 }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                    {getPlanIcon(currentSubscription.plan_type)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {currentSubscription.plan_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New period starts today
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h5" color="primary" align="right" fontWeight={600}>
                  {formatCurrency(currentSubscription.price)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => handleCloseDialog('renew')}
          disabled={actionLoading}
          variant="outlined"
        >
          Not Now
        </Button>
        <Button
          onClick={confirmRenew}
          variant="contained"
          color="primary"
          disabled={actionLoading}
          startIcon={actionLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
        >
          {actionLoading ? 'Processing...' : 'Renew Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Loading subscription data...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {renderHeader()}
      {renderStatusBanner()}
      {renderCountdown()}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
        >
          <Tab
            icon={<StarIcon />}
            label={!isMobile && "Plans"}
            iconPosition="start"
          />
          <Tab
            icon={<HistoryIcon />}
            label={!isMobile && "History"}
            iconPosition="start"
          />
          <Tab
            icon={<PaymentIcon />}
            label={!isMobile && "Payments"}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {currentSubscription && renderCurrentSubscription()}
        {renderPlans()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderSubscriptionHistory()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderPaymentHistory()}
      </TabPanel>

      {/* Dialogs */}
      {renderSubscribeDialog()}
      {renderChangePlanDialog()}
      {renderCancelDialog()}
      {renderRenewDialog()}
      {renderEnterpriseDialog()}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Subscription;