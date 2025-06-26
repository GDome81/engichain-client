import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dataService from '../../services/dataService';
import categoryService from '../../services/categoryService';
import authService from '../../services/authService';
import { toast } from 'react-toastify';


const schema = yup.object({
  name: yup.string().required('Nome è richiesto'),
  categoryId: yup.number().required('Categoria è richiesta'),
  fields: yup.array().of(
    yup.object({
      name: yup.string().required('Nome campo richiesto'),
      value: yup.string(),
    })
  ),
});

const DataForm = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      categoryId: location.state?.categoryId || '',
      fields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const watchedCategoryId = watch('categoryId');

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadDataItem();
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (watchedCategoryId && categories.length > 0) {
      const category = categories.find(c => c.id === parseInt(watchedCategoryId));
      setSelectedCategory(category);
      
      // Initialize fields based on category if not editing
      if (!isEdit && category && category.fields) {
        const categoryFields = category.fields.map(field => {
          // Handle different field structures from category
          if (typeof field === 'string') {
            return {
              name: field,
              value: '',
              type: 'text',
              isFromCategory: true,
            };
          } else {
            return {
              name: field.name || field.fieldName || field.key || 'Campo',
              value: '',
              type: field.type || field.fieldType || 'text',
              isFromCategory: true,
            };
          }
        });
        setValue('fields', categoryFields);
      }
    }
  }, [watchedCategoryId, categories, isEdit, setValue]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories(0, 100);
      setCategories(response.content || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Errore nel caricamento delle categorie');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadDataItem = async () => {
    try {
      setInitialLoading(true);
      const data = await dataService.findDataById(id);
      
      setValue('name', data.name);
      setValue('categoryId', data.categoryId);
      
      if (data.fields && Array.isArray(data.fields)) {
        // Normalize field structure for editing
        const normalizedFields = data.fields.map(field => ({
          name: field.name || field.fieldName || field.key || 'Campo',
          value: field.value || field.fieldValue || field.val || '',
          type: field.type || field.fieldType || 'text',
        }));
        setValue('fields', normalizedFields);
      }
    } catch (error) {
      console.error('Error loading data item:', error);
      toast.error('Errore nel caricamento dell\'entità');
      navigate('/data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleFileUpload = async (event, fieldName) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const uploadedFile = await dataService.uploadFile(file);

      setUploadedFiles((prev) => ({
        ...prev,
        [fieldName]: uploadedFile, // Store single file object
      }));

      toast.success(`File per ${fieldName} caricato con successo`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Errore nel caricamento del file per ${fieldName}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);


      
      const fieldsAsObject = (formData.fields || []).reduce((acc, field) => {
        const fieldType = (field.type || field.fieldType || '').toLowerCase();
        if (field.name && fieldType !== 'file') {
          acc[field.name] = field.value;
        }
        return acc;
      }, {});

      const authInfo = authService.getAuthInfo();
      const companyId = authInfo?.companyIds?.[0];

      if (!companyId) {
        toast.error("ID azienda non trovato. Impossibile creare l'entità.");
        setLoading(false);
        return;
      }

      const { name, categoryId } = formData;
      const finalFields = { ...fieldsAsObject };
      for (const fieldName in uploadedFiles) {
        if (uploadedFiles[fieldName]) {
          // Assuming the upload service returns the file path as a string.
          finalFields[fieldName] = uploadedFiles[fieldName];
        }
      }

      const dataToSubmit = {
        name,
        fields: finalFields,
        categoryId: parseInt(categoryId),
        companyId,
      };

      if (isEdit) {
        await dataService.updateData(id, dataToSubmit);
        toast.success('Entità aggiornata con successo');
      } else {
        await dataService.createData(dataToSubmit);
        toast.success('Entità creata con successo');
      }
      
      navigate('/data');
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(`Errore nel ${isEdit ? 'aggiornamento' : 'salvataggio'} dell'entità`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/data');
  };



  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="fade-in" sx={{ p: 3 }}>
      <Typography variant="h3" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
        {isEdit ? 'Modifica Entità' : 'Crea Nuova Entità'}
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, opacity: 0.8, mb: 4 }}>
        {isEdit ? 'Modifica i dati dell\'entità esistente' : 'Compila i campi per creare una nuova entità'}
      </Typography>

      <Paper className="modern-form" sx={{ p: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" className="form-section-title">
                Informazioni Base
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
              {...register('name')}
              label="Nome Entità"
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.categoryId} variant="outlined" sx={{ mb: 3 }}>
                <InputLabel>Categoria</InputLabel>
                <Select
                  label="Categoria"
                  {...register('categoryId')}
                  value={watch('categoryId') || ''}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && (
                  <Typography variant="caption" color="error">
                    {errors.categoryId.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Category Fields */}
            {selectedCategory && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" className="form-section-title">
                    Campi della Categoria: {selectedCategory.name}
                  </Typography>
                </Grid>
                
                {fields.map((field, index) => {
                  const fieldType = (field.type || field.fieldType || '').toLowerCase();
                  if (fieldType === 'file') {
                    return null;
                  }
                  return (
                    <Grid item xs={12} key={field.id}>
                      <Card className="modern-card" sx={{ mb: 2, p: 2, border: '1px solid #eee' }}>
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                              <TextField
                      {...register(`fields.${index}.name`)}
                      label="Nome Campo"
                      fullWidth
                      required
                      error={!!errors.fields?.[index]?.name}
                      helperText={errors.fields?.[index]?.name?.message}
                      variant="outlined"
                    />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                              <TextField
                      {...register(`fields.${index}.value`)}
                      label="Valore"
                      fullWidth
                      error={!!errors.fields?.[index]?.value}
                      helperText={errors.fields?.[index]?.value?.message}
                      variant="outlined"
                    />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                label="Tipo"
                                select
                                {...register(`fields.${index}.type`)}
                                defaultValue="text"
                                disabled={field.isFromCategory}
                              >
                                <MenuItem value="text">Testo</MenuItem>
                                <MenuItem value="number">Numero</MenuItem>
                                <MenuItem value="date">Data</MenuItem>
                                <MenuItem value="email">Email</MenuItem>
                                <MenuItem value="url">URL</MenuItem>
                                <MenuItem value="textarea">Testo Lungo</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                disabled={loading}
                                size="large"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
                

              </>
            )}

            {/* File Upload */}
            {selectedCategory &&
              selectedCategory.fields
                .filter(f => {
                  const fieldType = (f.type || f.fieldType || '').toLowerCase();
                  return fieldType === 'file';
                })
                .map(fileField => {
                  const fieldName = fileField.name || fileField.fieldName || fileField.key;
                  return (
                    <Grid item xs={12} key={`file-upload-${fieldName}`}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" className="form-section-title">
                        {`Allegato: ${fieldName}`}
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        disabled={loading}
                      >
                        {`Carica ${fieldName}`}
                        <input
                          type="file"
                          hidden
                          onChange={(e) => handleFileUpload(e, fieldName)}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </Button>

                      {uploadedFiles[fieldName] && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            File caricato per {fieldName}:
                          </Typography>
                          <Alert severity="success" sx={{ mt: 1 }}>
                            {/* Extract filename from path string for display */}
                            {typeof uploadedFiles[fieldName] === 'string' 
                              ? uploadedFiles[fieldName].split('/').pop() 
                              : 'File caricato'}
                          </Alert>
                        </Box>
                      )}
                    </Grid>
                  );
                })}

            {/* Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                variant="outlined"
                color="secondary"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/data')}
                disabled={loading}
                sx={{ borderRadius: '12px' }}
              >
                  Annulla
                </Button>
                <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading}
                className="modern-button"
                sx={{ mr: 2 }}
              >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    isEdit ? 'Aggiorna' : 'Crea'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default DataForm;