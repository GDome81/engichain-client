import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import authService from '../../services/authService';

const schema = yup.object({
  email: yup
    .string()
    .email('Inserisci un email valida')
    .required('Email è richiesta'),
  password: yup
    .string()
    .min(6, 'La password deve essere di almeno 6 caratteri')
    .required('Password è richiesta'),
});

const Login = ({ onAuthChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      await authService.signIn(data.email, data.password);
      onAuthChange(true);
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.message || 'Errore durante il login. Verifica le credenziali.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <Container component="main" maxWidth="sm">
        <Paper className="login-card fade-in" elevation={0}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Logo/Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              }}
            >
              <SecurityIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>

            <Typography 
              component="h1" 
              variant="h3" 
              className="gradient-text"
              sx={{ mb: 1, fontWeight: 800 }}
            >
              Engichain
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary', 
                mb: 4,
                fontWeight: 400,
                opacity: 0.8
              }}
            >
              Engichain
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: '12px',
                  '& .MuiAlert-message': {
                    fontSize: '0.95rem'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: '100%' }}
            >
              <Box className="form-field">
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Indirizzo Email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      }
                    }
                  }}
                />
              </Box>

              <Box className="form-field">
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      }
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                className="modern-button"
                sx={{
                  mt: 3,
                  mb: 3,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                  },
                  '&:disabled': {
                    background: 'rgba(102, 126, 234, 0.5)',
                    transform: 'none',
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} color="inherit" />
                    Accesso in corso...
                  </Box>
                ) : (
                  'Accedi al Sistema'
                )}
              </Button>
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 3,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                🔐 Accesso sicuro con AWS Cognito
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Certificazione blockchain per la tracciabilità dei dati
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default Login;