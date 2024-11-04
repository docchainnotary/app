const crypto = require("crypto");
const fs = require("fs");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // Store this securely
const IV_LENGTH = 16;

// Encrypt file and save it at the destination path
function encryptFile(srcPath, destPath) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

    const input = fs.createReadStream(srcPath);
    const output = fs.createWriteStream(destPath);

    input.pipe(cipher).pipe(output);

    return destPath;
}

// Decrypt file to a temporary path for download
function decryptFile(encryptedPath) {
    const iv = fs.readFileSync(encryptedPath).slice(0, IV_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

    const decryptedPath = encryptedPath.replace(".enc", "_decrypted");
    const input = fs.createReadStream(encryptedPath);
    const output = fs.createWriteStream(decryptedPath);

    input.pipe(decipher).pipe(output);

    return decryptedPath;
}

module.exports = {
    encryptFile,
    decryptFile,
};
