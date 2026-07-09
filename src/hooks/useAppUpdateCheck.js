import { useState, useEffect, useCallback } from 'react';
import * as Application from 'expo-application';
import { getUpdateInfo } from '../services/appUpdate.service';
import { isVersionOutdated } from '../utils/versionUtils';

/**
 * Chequea una vez al montar si hay una actualización disponible y activa.
 * La versión instalada se lee de Application.nativeApplicationVersion (versión
 * real del binario nativo instalado), no del bundle JS — así el chequeo sigue
 * siendo válido aunque en el futuro se sirvan actualizaciones OTA.
 */
export function useAppUpdateCheck() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const installedVersion = Application.nativeApplicationVersion;

  useEffect(() => {
    getUpdateInfo().then(setUpdateInfo);
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  const shouldShowUpdate = Boolean(
    !dismissed &&
    updateInfo?.active &&
    updateInfo?.latestVersion &&
    installedVersion &&
    isVersionOutdated(installedVersion, updateInfo.latestVersion)
  );

  return {
    shouldShowUpdate,
    title: updateInfo?.title ?? '',
    message: updateInfo?.message ?? '',
    downloadUrl: updateInfo?.downloadUrl ?? '',
    dismiss,
  };
}
