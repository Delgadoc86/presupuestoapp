import { useState, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuthContext } from '../context/AuthContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useAppContext } from '../context/AppContext';
import { saveBusinessProfile, completeOnboarding } from '../services/business.service';
import { uploadLogo, deleteLogo as deleteLogoFromStorage } from '../services/storage.service';
import { initDefaultTemplate } from '../services/templates.service';

const EMPTY_FORM = {
  businessName: '',
  sector: '',
  whatsapp: '',
  email: '',
  address: '',
  cuit: '',
  generalConditions: '',
  validityDays: 30,
};

export function useBusinessForm(isOnboarding = false) {
  const { user } = useAuthContext();
  const { business } = useBusinessContext();
  const { showSnackbar } = useAppContext();
  const initialized = useRef(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [logoUri, setLogoUri] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // En modo edición, pre-cargamos los datos existentes una sola vez
  useEffect(() => {
    if (!isOnboarding && business && !initialized.current) {
      setForm({
        businessName: business.businessName ?? '',
        sector: business.sector ?? '',
        whatsapp: business.whatsapp ?? '',
        email: business.email ?? '',
        address: business.address ?? '',
        cuit: business.cuit ?? '',
        generalConditions: business.generalConditions ?? '',
        validityDays: business.validityDays ?? 30,
      });
      if (business.logoUrl) setLogoUri(business.logoUrl);
      initialized.current = true;
    }
  }, [business, isOnboarding]);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  }

  async function pickLogo() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      showSnackbar('Necesitamos acceso a tu galería para subir el logo', 'info');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  }

  async function deleteLogo() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await deleteLogoFromStorage(user.uid);
      await saveBusinessProfile(user.uid, { logoUrl: null });
      setLogoUri(null);
      showSnackbar('Logo eliminado', 'success');
    } catch (error) {
      console.error('Error eliminando logo:', error);
      showSnackbar('No se pudo eliminar el logo', 'error');
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    const next = {};
    if (!form.businessName.trim()) next.businessName = 'Ingresá el nombre del negocio';
    if (!form.sector.trim()) next.sector = 'Ingresá el rubro o actividad';
    if (!form.whatsapp.trim()) next.whatsapp = 'Ingresá tu número de WhatsApp';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return false;
    if (!user?.uid) {
      showSnackbar('No hay usuario autenticado', 'error');
      return false;
    }
    setLoading(true);
    console.log('Guardando perfil para UID:', user.uid);
    try {
      // Determinar la URL del logo final
      let logoUrl = business?.logoUrl ?? null;
      if (logoUri && !logoUri.startsWith('http')) {
        // Es una imagen local nueva → subir a Storage
        logoUrl = await uploadLogo(user.uid, logoUri);
      } else if (logoUri && logoUri.startsWith('http')) {
        // Ya es una URL remota → mantenerla
        logoUrl = logoUri;
      }

      const data = { ...form, logoUrl };

      if (isOnboarding) {
        await completeOnboarding(user.uid, data);
        // Crear plantilla base del rubro si el usuario no tiene ninguna.
        // Se ejecuta en background: si falla no interrumpe el onboarding.
        initDefaultTemplate(user.uid, form.sector);
      } else {
        await saveBusinessProfile(user.uid, data);
        showSnackbar('Cambios guardados correctamente', 'success');
      }
      return true;
    } catch (error) {
      console.error('Error guardando perfil del negocio:', error);
      showSnackbar('No se pudo guardar. Revisá tu conexión.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    form,
    updateField,
    logoUri,
    setLogoUri,
    pickLogo,
    deleteLogo,
    errors,
    loading,
    save,
  };
}
