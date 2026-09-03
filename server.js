import express from 'express';
import cors from 'cors';
import multer from 'multer';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// Helper functions
function calculateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function splitFileIntoChunks(fileBuffer, chunkSize = 1024) {
  const chunks = [];
  for (let i = 0; i < fileBuffer.length; i += chunkSize) {
    chunks.push(fileBuffer.slice(i, i + chunkSize));
  }
  return chunks;
}

async function generateQRCodesForChunks(chunks, fileName, fileHash) {
  const qrCodes = [];
  const totalChunks = chunks.length;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkHash = calculateHash(chunk);
    
    const payload = {
      file: fileName,
      chunk: i + 1,
      total: totalChunks,
      data: chunk.toString('base64'),
      checksum: chunkHash,
      fileHash: fileHash
    };

    try {
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      qrCodes.push({
        chunk: i + 1,
        total: totalChunks,
        qrDataUrl,
        size: chunk.length
      });
    } catch (err) {
      console.error(`Error generating QR for chunk ${i + 1}:`, err);
    }
  }

  return qrCodes;
}

// Routes

// Generate QR codes from file
app.post('/api/generate-qr', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const chunkSize = parseInt(req.body.chunkSize) || 1024;

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = calculateHash(fileBuffer);

    // Split into chunks
    const chunks = splitFileIntoChunks(fileBuffer, chunkSize);

    // Generate QR codes
    const qrCodes = await generateQRCodesForChunks(chunks, fileName, fileHash);

    // Store session info
    const sessionId = Date.now().toString();
    const sessionDir = path.join(__dirname, 'sessions', sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Save session metadata
    fs.writeFileSync(
      path.join(sessionDir, 'metadata.json'),
      JSON.stringify({
        fileName,
        fileHash,
        totalChunks: chunks.length,
        chunkSize,
        fileSize: fileBuffer.length,
        generatedAt: new Date().toISOString()
      }, null, 2)
    );

    // Save chunks for later retrieval
    chunks.forEach((chunk, index) => {
      fs.writeFileSync(
        path.join(sessionDir, `chunk_${index + 1}.bin`),
        chunk
      );
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      sessionId,
      fileName,
      fileHash,
      totalChunks: chunks.length,
      fileSize: fileBuffer.length,
      qrCodes
    });
  } catch (error) {
    console.error('Error generating QR codes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reassemble file from QR data
app.post('/api/reassemble', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { chunks, fileName, fileHash } = req.body;

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ error: 'No chunks provided' });
    }

    // Sort chunks by order
    const sortedChunks = chunks.sort((a, b) => a.chunk - b.chunk);

    // Reassemble file
    const buffers = sortedChunks.map(c => Buffer.from(c.data, 'base64'));
    const reassembledBuffer = Buffer.concat(buffers);

    // Verify hash
    const calculatedHash = calculateHash(reassembledBuffer);
    if (calculatedHash !== fileHash) {
      return res.status(400).json({ error: 'File integrity check failed' });
    }

    // Send file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(reassembledBuffer);
  } catch (error) {
    console.error('Error reassembling file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get QR codes from session
app.get('/api/qr/:sessionId', (req, res) => {
  try {
    const sessionDir = path.join(__dirname, 'sessions', req.params.sessionId);
    const metadataPath = path.join(sessionDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    res.json({
      success: true,
      metadata
    });
  } catch (error) {
    console.error('Error fetching QR data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 QR File Share server running on http://localhost:${PORT}`);
});
