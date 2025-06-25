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
} from '@mui/material';
import {
  Add as AddIcon,
  Verified as VerifiedIcon,
  Category as CategoryIcon,
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
        icon={<VerifiedIcon />}
        label={isCertified ? 'Certificata' : 'Non Certificata'}
        color={isCertified ? 'success' : 'default'}
        size="small"
      />
    );
  };

  const renderFields = (fields) => {
    if (!fields || fields.length === 0) {
      return <Typography variant="body2" color="textSecondary">Nessun campo definito</Typography>;
    }

    return (
      <Box>
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
        <Typography variant="h4" gutterBottom>
          Categorie
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Categorie
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
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
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CategoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h2">
                      {category.name}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    {getCertificationStatus(category)}
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
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleCreateEntity(category.id)}
                    fullWidth
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