# QR File Share 📦

A modern, UI-based application for sharing large files completely offline using QR codes. Perfect for scenarios where you need to transfer files between devices without internet connectivity.

## Features ✨

- **File Splitting**: Automatically splits large files into manageable chunks
- **QR Code Generation**: Creates QR codes for each chunk with automatic error correction
- **Dual Interface**: Separate sender (generator) and receiver (scanner) modes
- **Offline Transfer**: Works completely offline once QR codes are generated
- **Data Integrity**: Built-in SHA-256 checksums for file validation
- **Web-Based UI**: No installation required, works in any modern browser
- **Print Support**: Print all QR codes at once for physical transfer
- **Manual Input**: Fallback option to manually enter QR data if camera isn't available
- **Responsive Design**: Works on desktop and mobile devices

## How It Works 🔄

### Sender Side:
1. Upload your file
2. Configure chunk size (smaller = better error correction, more QR codes)
3. Generate QR codes
4. Print or display QR codes
5. Share QR codes with receiver (print, photo, or display)

### Receiver Side:
1. Scan QR codes with camera or enter manually
2. QR codes are progressively validated
3. Once all chunks received, reassemble the file
4. Download the original file with integrity verification

## Installation 🚀

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/saurabhji001/qr-file-share.git
cd qr-file-share

# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:5000`

## Usage 📱

### For Senders:

1. Open http://localhost:5000 in your browser
2. Click the **"Send File"** tab
3. Drag and drop or select your file
4. Adjust chunk size if needed (default: 1024 bytes)
5. Click **"Generate QR Codes"**
6. Print or take screenshots of the QR codes
7. Share with the receiver

### For Receivers:

1. Open http://localhost:5000 in your browser (can be offline)
2. Click the **"Receive File"** tab
3. Either:
   - Click **"Start Camera"** and scan each QR code, or
   - Manually paste each QR code's JSON data
4. Track progress as chunks are received
5. Click **"Reassemble & Download"** when complete
6. Original file is downloaded with integrity check

## Configuration ⚙️

### Chunk Size
- **512 bytes**: Maximum QR density, best error correction
- **1024 bytes**: Balanced (default)
- **2048+ bytes**: Fewer QR codes, less error correction

### QR Code Settings
- Error Correction Level: **High (30%)**
- QR Version: **Auto-sized**
- Data Format: **JSON with Base64 encoding**

## Technical Details 🔧

### Backend
- **Framework**: Express.js
- **QR Generation**: qrcode npm package
- **File Processing**: Node.js fs module
- **Hashing**: SHA-256 (Node.js crypto)

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern responsive design
- **Vanilla JavaScript**: No dependencies
- **Camera API**: getUserMedia for QR scanning

### API Endpoints

**POST /api/generate-qr**
- Upload file and generate QR codes
- Request: multipart/form-data with file
- Response: Array of QR code data URLs

**POST /api/reassemble**
- Reassemble file from chunks
- Request: JSON with chunks array, fileName, fileHash
- Response: File blob for download

**GET /api/qr/:sessionId**
- Retrieve saved QR session data
- Response: Session metadata

## File Transfer Limits 📊

| Chunk Size | File Size | Approx QR Count |
|-----------|-----------|------------------|
| 512 B     | 1 MB      | ~2000            |
| 1024 B    | 1 MB      | ~1000            |
| 2048 B    | 1 MB      | ~500             |
| 1024 B    | 100 MB    | ~100,000         |

**Recommended**: Use 1024-2048 bytes for optimal balance

## Security Considerations 🔒

- ✅ SHA-256 checksums for data integrity
- ✅ Each chunk independently verifiable
- ✅ No server storage of files (temporary only)
- ✅ Chunk data embedded in QR codes
- ⚠️ QR codes are visible data - don't use for sensitive files without encryption

## Future Enhancements 🚀

- [ ] AES encryption for sensitive files
- [ ] Audio encoding for offline transfer
- [ ] Support for multiple file formats
- [ ] Batch QR code PDF generation
- [ ] OCR-based QR scanning
- [ ] WebRTC P2P transfer support
- [ ] Progressive Web App (PWA) support
- [ ] Mobile app versions

## Troubleshooting 🐛

### Camera not working
- Check browser permissions (Settings > Privacy)
- Use HTTPS (camera requires secure context)
- Fallback: Use manual QR input method

### QR codes not scanning
- Ensure good lighting
- Try higher chunk sizes for simpler QR codes
- Use print preview for better quality

### File checksum mismatch
- Re-scan all QR codes
- Check for missing or corrupted chunks
- Verify QR code quality

## Performance Tips ⚡

1. **Large Files**: Use larger chunk sizes (2048+) to reduce QR count
2. **Printing**: Use high-quality printers for better scanning
3. **Scanning**: Good lighting is crucial for fast scanning
4. **Mobile**: Modern phones scan faster than older devices

## Contributing 🤝

Contributions are welcome! Please feel free to submit issues and pull requests.

## License 📄

MIT License - feel free to use this project however you like!

## Support 💬

If you encounter any issues or have questions, please open an issue on GitHub.

## Roadmap 🗺️

- v1.1: Encryption support
- v1.2: Audio encoding option
- v1.3: Desktop app (Electron)
- v2.0: Mobile native apps

---

**Made with ❤️ by saurabhji001**
