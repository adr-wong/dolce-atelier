import { v2 as cloudinary } from 'cloudinary';

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export { getCloudinary };

export async function subirImagen(buffer: Buffer, folder: string = 'dolce-atelier'): Promise<string> {
  const cloud = getCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('No se recibió respuesta de Cloudinary'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function subirReceta(buffer: Buffer, nombreArchivo: string): Promise<string> {
  const cloud = getCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloud.uploader.upload_stream(
      {
        folder: 'dolce-atelier/recetas',
        resource_type: 'raw',
        public_id: nombreArchivo.replace(/\.[^.]+$/, ''),
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('No se recibió respuesta de Cloudinary'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function eliminarImagen(publicId: string): Promise<boolean> {
  const cloud = getCloudinary();
  const result = await cloud.uploader.destroy(publicId);
  return result.result === 'ok';
}

export function extraerPublicId(url: string): string | null {
  const match = url.match(/\/upload\/v\d+\/(.+)\.\w+$/);
  if (!match) return null;
  return match[1];
}