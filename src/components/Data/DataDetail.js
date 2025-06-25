import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Security as SecurityIcon,
  Link as LinkIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import dataService from '../../services/dataService';
import blockchainService from '../../services/blockchainService';
import relationshipService from '../../services/relationshipService';
import { toast } from 'react-toastify';

const DataDetail = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certifying, setCertifying] = useState(false);
  const [relationships, setRelationships] = useState([]);
  const [relatedEntities, setRelatedEntities] = useState([]);
  const [children, setChildren] = useState([]);
  const [showCertifyDialog, setShowCertifyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      blockchainType: 'ETHEREUM',
      description: '',
    },
  });

  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dataResponse, childrenResponse, relationshipsResponse] = await Promise.all([
        dataService.findDataById(id),
        dataService.findChildren(id),
        relationshipService.getRelationshipsByOwner(id),
      ]);

      console.log('[DataDetail] Loaded data:', dataResponse);
      setData(dataResponse);

      console.log('[DataDetail] Loaded children:', childrenResponse);
      setChildren(childrenResponse.nodes || []);

      console.log('[DataDetail] Loaded relationships:', relationshipsResponse);
      const relationships = Array.isArray(relationshipsResponse) ? relationshipsResponse : [];
      setRelationships(relationships);

      const relatedIds = new Set();
      relationships.forEach(rel => {
        if (rel.from !== parseInt(id)) relatedIds.add(rel.from);
        if (rel.to !== parseInt(id)) relatedIds.add(rel.to);
      });

      console.log(`[DataDetail] Related IDs to load:`, Array.from(relatedIds));

      if (relatedIds.size > 0) {
        const relatedEntitiesPromises = Array.from(relatedIds).map(entityId =>
          dataService.findDataById(entityId).catch(error => {
            console.error(`[DataDetail] Error loading entity ${entityId}:`, error);
            return null; // Return null if an entity fails to load
          })
        );
        const loadedEntities = await Promise.all(relatedEntitiesPromises);
        const validEntities = loadedEntities.filter(entity => entity !== null);
        setRelatedEntities(validEntities);
        console.log(`[DataDetail] Set related entities (${validEntities.length}):`, validEntities);
      } else {
        setRelatedEntities([]);
      }

    } catch (error) {
      console.error('Error loading data details:', error);
      toast.error('Errore nel caricamento dei dettagli dell\'entità.');
      navigate('/data');
    } finally {
      setLoading(false);
    }
  };

  const loadDataDetail = async () => {
    try {
      const response = await dataService.findDataById(id);
      console.log('[DataDetail] Loaded data:', response);
      setData(response);
    } catch (error) {
      console.error('Error loading data detail:', error);
      toast.error('Errore nel caricamento dei dettagli');
      navigate('/data');
    }
  };

  const handleCertify = async (formData) => {
    try {
      setCertifying(true);
      
      const blockchainRequest = {
        id: parseInt(id),
        blockchain: formData.blockchainType, // Corretto da blockchainType a blockchain
        description: formData.description || `Certificazione entità: ${data.name}`,
      };
      
      await blockchainService.certifyData(blockchainRequest);
      toast.success('Entità certificata con successo su blockchain');
      
      // Reload data to show updated certification status
      await loadDataDetail();
      setShowCertifyDialog(false);
      reset();
    } catch (error) {
      console.error('Error certifying data:', error);
      toast.error('Errore durante la certificazione');
    } finally {
      setCertifying(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dataService.deleteData(id);
      toast.success('Entità eliminata con successo');
      navigate('/data');
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Errore durante l\'eliminazione');
    }
    setShowDeleteDialog(false);
  };

  const handlePublish = async () => {
    try {
      await dataService.publishData(id);
      toast.success('Entità pubblicata con successo');
      await loadDataDetail();
    } catch (error) {
      console.error('Error publishing data:', error);
      toast.error('Errore durante la pubblicazione');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChip = () => {
    if (!data) return null;
    
    const isCertified = data.blockchainInfoEntities && data.blockchainInfoEntities.length > 0;
    return (
      <Chip
        icon={<VerifiedIcon />}
        label={isCertified ? 'Certificato' : 'Non Certificato'}
        color={isCertified ? 'success' : 'warning'}
        size="medium"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="error">
        Entità non trovata
      </Alert>
    );
  }

  const isCertified = data.blockchainInfoEntities && data.blockchainInfoEntities.length > 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/data')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flexGrow={1}>
          <Typography variant="h4" gutterBottom>
            {data.name}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Categoria: {data.categoryName}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {getStatusChip()}

          {!isCertified && children.length === 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setShowDeleteDialog(true)}
            >
              Elimina
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni Generali
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Data Creazione
                </Typography>
                <Typography variant="body1">
                  {formatDate(data.creationDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Ultimo Aggiornamento
                </Typography>
                <Typography variant="body1">
                  {formatDate(data.lastUpdateDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Stato
                </Typography>
                <Typography variant="body1">
                  {data.public ? 'Pubblico' : 'Privato'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  ID Azienda
                </Typography>
                <Typography variant="body1">
                  {data.companyId || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Fields */}
          {data.fields && Object.keys(data.fields).length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Campi Dati
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(data.fields).map(([key, value], index) => {
                  return (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="primary">
                            {key}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {String(value)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })} 
              </Grid>
            </Paper>
          )}

          {/* Related Entities */}
          {relatedEntities.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Entità Correlate
              </Typography>
              <List>
                {relatedEntities.map((entity, index) => (
                  <React.Fragment key={entity.id}>
                    <ListItem
                      button
                      onClick={() => navigate(`/data/${entity.id}`)}
                    >
                      <ListItemText
                        primary={entity.name}
                        secondary={`Categoria: ${entity.categoryName}`}
                      />
                      <IconButton size="small">
                        <LinkIcon />
                      </IconButton>
                    </ListItem>
                    {index < relatedEntities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Azioni
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {!isCertified && (
                <Button
                  variant="contained"
                  startIcon={<SecurityIcon />}
                  onClick={() => setShowCertifyDialog(true)}
                  fullWidth
                >
                  Certifica su Blockchain
                </Button>
              )}

              <Button
                variant="outlined"
                onClick={() => navigate('/graph', { state: { focusId: id } })}
                fullWidth
              >
                Visualizza nel Grafo
              </Button>
            </Box>
          </Paper>

          {/* Blockchain Certifications */}
          {isCertified && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Certificazioni Blockchain
              </Typography>

              {/* Blocco di Debug -- da rimuovere in produzione */}
              <Box component="pre" sx={{ my: 2, p: 2, border: '1px dashed grey', borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem', backgroundColor: '#f5f5f5' }}>
                <strong>Dati di certificazione (debug):</strong>
                <br />
                {JSON.stringify(data.blockchainInfoEntities, null, 2)}
              </Box>

              {data.blockchainInfoEntities.map((cert, index) => {
                console.log(`[DataDetail] Dati per certificazione #${index}:`, cert);
                const address = cert.address || cert.smartContractAddress;

                return (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Certificazione #{index + 1}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Tipo Blockchain:</strong> {cert.blockchain || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Hash Transazione:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                            {cert.hash || cert.transactionHash || 'N/A'}
                          </Typography>
                        </Grid>
                        {cert.blockNumber && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Blocco:</strong> {cert.blockNumber}
                            </Typography>
                          </Grid>
                        )}
                        {cert.certificationDate && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Data Certificazione:</strong> {formatDate(cert.certificationDate)}
                            </Typography>
                          </Grid>
                        )}
                        {cert.description && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Descrizione:</strong> {cert.description}
                            </Typography>
                          </Grid>
                        )}
                        {cert.networkId && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Network ID:</strong> {cert.networkId}
                            </Typography>
                          </Grid>
                        )}
                        {address && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Indirizzo Smart Contract:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                              {address}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {address && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LinkIcon />}
                            href={`https://sepolia.etherscan.io/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visualizza su Etherscan
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Certify Dialog */}
      <Dialog open={showCertifyDialog} onClose={() => setShowCertifyDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(handleCertify)}>
          <DialogTitle>Certifica su Blockchain</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tipo Blockchain</InputLabel>
                <Select
                  label="Tipo Blockchain"
                  {...register('blockchainType')}
                  defaultValue="ETHEREUM"
                >
                  <MenuItem value="ETHEREUM">Ethereum</MenuItem>
                  <MenuItem value="BITCOIN">Bitcoin</MenuItem>
                  <MenuItem value="HYPERLEDGER">Hyperledger</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Descrizione (opzionale)"
                multiline
                rows={3}
                {...register('description')}
                placeholder="Descrizione della certificazione..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCertifyDialog(false)}>Annulla</Button>
            <Button type="submit" variant="contained" disabled={certifying}>
              {certifying ? <CircularProgress size={20} /> : 'Certifica'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare l'entità "{data.name}"? Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Annulla</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataDetail;