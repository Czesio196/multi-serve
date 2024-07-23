import fs from 'fs';
import path from 'path';
import selfsigned from 'selfsigned';

export const generateCertificates = () => {
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const opts = {
        keySize: 2048,
        days: 365,
        algorithm: 'sha256',
        extensions: [{ name: 'basicConstraints', cA: true }]
    };

    const pems = selfsigned.generate(attrs, opts);

    const dirPath = path.join(__dirname, 'certificates');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(path.join(dirPath, 'server.key'), pems.private);
    fs.writeFileSync(path.join(dirPath, 'server.cert'), pems.cert);
};
