/**
 * File Service
 * 
 * Handles file uploads, downloads, and management
 */

const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

/**
 * Handle file uploads
 */
async function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }
    
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/api/bridge/files/download/${file.filename}`
    }));
    
    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * List uploaded files
 */
async function listFiles(req, res) {
  try {
    const { folder, type } = req.query;
    let filesDir = config.uploads.directory;
    
    // If folder is specified, check if it exists
    if (folder) {
      const folderPath = path.join(config.uploads.directory, folder);
      if (fs.existsSync(folderPath)) {
        filesDir = folderPath;
      } else {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }
    
    // Get all files in the directory and subdirectories
    const files = await getAllFiles(filesDir);
    
    // Filter by file type if specified
    let filteredFiles = files;
    if (type) {
      const mimeType = type.includes('/') ? type : `image/${type}`;
      filteredFiles = files.filter(file => file.mimetype === mimeType);
    }
    
    // Format the response
    const formattedFiles = filteredFiles.map(file => ({
      filename: path.basename(file.path),
      originalname: file.originalname || path.basename(file.path),
      mimetype: file.mimetype,
      size: file.size,
      created: file.created,
      url: `/api/bridge/files/download/${path.basename(file.path)}`
    }));
    
    res.json({
      success: true,
      count: formattedFiles.length,
      files: formattedFiles
    });
  } catch (error) {
    console.error('File listing error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Download a file
 */
async function downloadFile(req, res) {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    // Find the file in the uploads directory or subdirectories
    const file = await findFile(config.uploads.directory, filename);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalname || filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Delete a file
 */
async function deleteFile(req, res) {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    // Find the file in the uploads directory or subdirectories
    const file = await findFile(config.uploads.directory, filename);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete the file
    await fs.unlink(file.path);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      filename
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

/**
 * Helper function to get all files in a directory and its subdirectories
 */
async function getAllFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else {
      const stats = await fs.stat(fullPath);
      files.push({
        path: fullPath,
        mimetype: getMimeType(entry.name),
        size: stats.size,
        created: stats.birthtime
      });
    }
  }
  
  return files;
}

/**
 * Helper function to find a file by filename
 */
async function findFile(dir, filename) {
  const allFiles = await getAllFiles(dir);
  return allFiles.find(file => path.basename(file.path) === filename);
}

/**
 * Helper function to get MIME type from filename
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile
};