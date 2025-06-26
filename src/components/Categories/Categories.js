import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Verified as VerifiedIcon,
  Category as CategoryIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import categoryService from '../../services/categoryService';
import { toast } from 'react-toastify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await categoryService.getCategories(0, 50);
      setCategories(response.content || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Errore nel caricamento delle categorie');
      toast.error('Errore nel caricamento delle categorie');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntity = (categoryId) => {
    navigate('/data/new', { state: { categoryId } });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCertificationStatus = (category) => {
    const isCertified = category.blockchainInfoEntities && category.blockchainInfoEntities.length > 0;
    return (
      <Chip
        icon={isCertified ? <VerifiedIcon /> : <PendingIcon />}
        label={isCertified ? 'Certificata' : 'In attesa'}
        color={isCertified ? 'success' : 'warning'}
        size="small"
        className="status-chip"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const renderFields = (fields) => {
    if (!fields || fields.length === 0) {
      return <Typography variant="body2" color="textSecondary">Nessun campo definito</Typography>;
    }

    return (
      <Box className="fade-in">
        <Typography variant="subtitle2" gutterBottom>
          Campi disponibili:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {fields.slice(0, 5).map((field, index) => (
            <Chip
              key={index}
              label={typeof field === 'object' ? field.fieldName || field.name || 'Campo' : field}
              size="small"
              variant="outlined"
            />
          ))}
          {fields.length > 5 && (
            <Chip
              label={`+${fields.length - 5} altri`}
              size="small"
              variant="outlined"
              color="primary"
            />
          )}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h3" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
          Categorie
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Categorie
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, opacity: 0.8 }}>
            Seleziona una categoria per creare una nuova entità
          </Typography>
        </Box>
      </Box>

      {categories.length === 0 ? (
        <Alert severity="info">
          Nessuna categoria disponibile. Contatta l'amministratore per configurare le categorie.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card className="modern-card"
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #2196f3, #1976d2)', boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)', mr: 2 }}><CategoryIcon /></Avatar>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                      {category.name}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>{getCertificationStatus(category)}</Box>
                  </Box>

                  <Box mb={2}>
                    {renderFields(category.fields)}
                  </Box>

                  <Typography variant="caption" color="textSecondary">
                    Creata: {formatDate(category.creationDate)}
                  </Typography>
                  {category.lastUpdateDate && category.lastUpdateDate !== category.creationDate && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      Aggiornata: {formatDate(category.lastUpdateDate)}
                    </Typography>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleCreateEntity(category.id)}
                    fullWidth
                    className="modern-button"
                  >
                    Crea Entità
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Categories;