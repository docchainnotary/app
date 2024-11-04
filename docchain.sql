-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    passwd VARCHAR(64) NOT NULL, -- Store hashed passwords (e.g., SHA-256)
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    owner VARCHAR(50) NOT NULL, -- Reference to users.username
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner) REFERENCES users(username) ON DELETE CASCADE
);

-- Documents table
CREATE TABLE documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    hash CHAR(64) NOT NULL, -- SHA-256 hash of document content
    title VARCHAR(255) NOT NULL,
    creator_id VARCHAR(50) NOT NULL, -- Reference to users.username
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signers JSON NOT NULL -- List of required signer usernames
);

-- Document versions table
CREATE TABLE document_versions (
    version_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL, -- Reference to documents.document_id
    hash CHAR(64) NOT NULL, -- SHA-256 hash of version content
    title VARCHAR(255) NOT NULL,
    creator_id VARCHAR(50) NOT NULL, -- Reference to users.username
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    FOREIGN KEY (parent_id) REFERENCES documents(document_id) ON DELETE CASCADE
);

-- Signatures table
CREATE TABLE signatures (
    signature_id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL, -- Reference to document_versions.version_id
    signer_id VARCHAR(50) NOT NULL, -- Reference to users.username
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signature_data TEXT NOT NULL, -- Digital signature data
    claim_reference VARCHAR(255), -- Optional reference for identity claims
    FOREIGN KEY (document_id) REFERENCES document_versions(version_id) ON DELETE CASCADE
);
