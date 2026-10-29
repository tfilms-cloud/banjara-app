import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { apiRequest } from '@/services/api';

export type UploadFolder =
  | 'avatars'
  | 'vehicles'
  | 'hotels'
  | 'rooms'
  | 'logos'
  | 'chat'
  | 'tours'
  | 'guides'
  | 'restaurants'
  | 'payments';

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export type UploadedImage = {
  url: string;
  path: string;
  folder: UploadFolder;
  bucket?: string;
  storageRef?: string;
};

/** The backend authorizes ownership and defers deletion while a saved record still uses it. */
export async function removeImage(reference: string): Promise<{ status: 'deleted' | 'pending' | 'local' }> {
  if (!reference.startsWith('payment-file:')) {
    let url: URL;
    try { url = new URL(reference); }
    catch { return { status: 'local' }; }
    // Local camera previews and external stock photos are not managed uploads.
    if (!/^https?:$/.test(url.protocol) || !/^\/storage\/v1\/object\/(public|sign)\//.test(url.pathname)) {
      return { status: 'local' };
    }
  }
  return apiRequest({ method: 'DELETE', url: '/uploads', data: { reference } });
}

async function ensureLibraryPermission() {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

async function compressPickedAsset(asset: ImagePicker.ImagePickerAsset): Promise<PickedImage> {
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );
  return {
    uri: manipulated.uri,
    mimeType: 'image/jpeg',
    fileName: asset.fileName?.replace(/\.\w+$/, '.jpg') || `photo-${Date.now()}.jpg`,
  };
}

export async function pickImage(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<PickedImage | null> {
  const granted = await ensureLibraryPermission();
  if (!granted) {
    throw new Error('Photo library permission is required to upload images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return compressPickedAsset(result.assets[0]);
}

export async function takePhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<PickedImage | null> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  const granted =
    current.granted || (await ImagePicker.requestCameraPermissionsAsync()).granted;
  if (!granted) {
    throw new Error('Camera permission is required to photograph your CNIC.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1.6, 1],
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return compressPickedAsset(result.assets[0]);
}

/**
 * Capture/pick a full photo for CNIC without system crop —
 * the app opens its own crop UI next.
 */
export async function pickCnicSource(
  source: 'camera' | 'gallery'
): Promise<PickedImage | null> {
  if (source === 'camera') {
    return takePhoto({ allowsEditing: false });
  }
  return pickImage({ allowsEditing: false });
}

export async function pickImages(limit = 5): Promise<PickedImage[]> {
  const granted = await ensureLibraryPermission();
  if (!granted) {
    throw new Error('Photo library permission is required to upload images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.length) return [];

  const picked: PickedImage[] = [];
  for (const asset of result.assets.slice(0, limit)) {
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    picked.push({
      uri: manipulated.uri,
      mimeType: 'image/jpeg',
      fileName: asset.fileName?.replace(/\.\w+$/, '.jpg') || `photo-${Date.now()}-${picked.length}.jpg`,
    });
  }
  return picked;
}

function guessMime(uri: string, fallback = 'image/jpeg') {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  return fallback;
}

export async function uploadImage(
  uri: string,
  folder: UploadFolder,
  opts?: { mimeType?: string; fileName?: string; onProgress?: (percent: number) => void }
): Promise<UploadedImage> {
  const form = new FormData();
  const fileName = opts?.fileName || `upload-${Date.now()}.jpg`;
  const mimeType = opts?.mimeType || guessMime(uri);

  form.append('folder', folder);
  form.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  return apiRequest<UploadedImage>({
    method: 'POST',
    url: '/uploads',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(data) => data],
    timeout: 60000,
    onUploadProgress: (event) => { if (event.total) opts?.onProgress?.(Math.round(event.loaded * 100 / event.total)); },
  });
}

export async function uploadImages(
  images: PickedImage[],
  folder: UploadFolder,
  onProgress?: (percent: number) => void
): Promise<UploadedImage[]> {
  if (!images.length) return [];

  if (images.length === 1) {
    const one = await uploadImage(images[0].uri, folder, {
      mimeType: images[0].mimeType,
      fileName: images[0].fileName,
      onProgress,
    });
    return [one];
  }

  const form = new FormData();
  form.append('folder', folder);
  images.forEach((image, index) => {
    form.append('files', {
      uri: image.uri,
      name: image.fileName || `upload-${index}.jpg`,
      type: image.mimeType || 'image/jpeg',
    } as unknown as Blob);
  });

  const result = await apiRequest<{ items: UploadedImage[]; urls: string[] }>({
    method: 'POST',
    url: '/uploads/multiple',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(data) => data],
    timeout: 90000,
    onUploadProgress: (event) => { if (event.total) onProgress?.(Math.round(event.loaded * 100 / event.total)); },
  });

  return result.items ?? (result.urls ?? []).map((url) => ({ url, path: '', folder }));
}

export async function pickAndUpload(
  folder: UploadFolder,
  options?: { allowsEditing?: boolean; aspect?: [number, number] }
): Promise<UploadedImage | null> {
  const picked = await pickImage(options);
  if (!picked) return null;
  return uploadImage(picked.uri, folder, {
    mimeType: picked.mimeType,
    fileName: picked.fileName,
  });
}
