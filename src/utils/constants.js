import path from 'path';

export const __tempManifestPath = path.resolve(__dirname, 'temp-manifest.js');
export const __manifestTemplatePath = path.resolve(__dirname, 'templates', 'manifest.js');
export const __certificateKeyPath = path.join(__dirname, 'certificates', 'server.key');
export const __certificateCertPath = path.join(__dirname, 'certificates', 'server.cert');
export const __manifestOutputTempPath = path.resolve(__dirname, 'temp');
export const __manifestOutputPath = path.resolve(__dirname, 'temp/manifest.js');
export const __manifestPlaceholder = '<<MANIFEST>>';
