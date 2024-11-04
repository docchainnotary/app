# DocChain Digital Notary Application

DocChain is a blockchain-based digital notary service that enables secure, efficient, and verifiable document notarization. By leveraging the immutability and transparency of blockchain technology, DocChain ensures that your documents are tamper-proof and easily verifiable.

## Features

- **Secure Document Notarization**: Utilize blockchain technology to notarize documents, ensuring their authenticity and integrity.
- **E-Signature Integration**: Facilitate electronic signatures, streamlining the signing process for all parties involved.
- **User-Friendly Interface**: Access a straightforward platform for uploading, managing, and verifying documents.
- **Audit Trail**: Maintain a comprehensive record of all notarization activities for compliance and transparency.

## Getting Started

To set up the DocChain application locally, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/docchainnotary/app.git
   ```

2. **Navigate to the Project Directory**:

   ```bash
   cd app
   ```

3. **Install Dependencies**:

   ```bash
   npm install
   ```

4. **Configure Environment Variables**:

   Create a `.env` file in the root directory with the following content:

   ```
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_NAME=docchain
   JWT_SECRET=your_jwt_secret
   ```

   Replace `your_db_user`, `your_db_password`, and `your_jwt_secret` with your actual database credentials and a secure JWT secret.

5. **Initialize the Database**:

   Ensure that your MySQL database is running and execute the provided SQL scripts to set up the necessary tables.

6. **Start the Application**:

   ```bash
   npm start
   ```

   The application will be accessible at `http://localhost:3000`.

## Usage

- **User Registration and Authentication**: Create an account and log in to access the notarization services.
- **Document Upload**: Upload documents to be notarized and signed electronically.
- **Notarization Process**: The application generates a unique hash of the document and records it on the blockchain, providing a verifiable proof of authenticity.
- **Verification**: Verify the authenticity of any notarized document through the platform.

## Contributing

We welcome contributions to enhance the DocChain application. To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with clear and descriptive messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.

Please ensure that your code adheres to our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please open an issue on GitHub or contact us at support@docchain.com.

We appreciate your interest in DocChain and look forward to your contributions! 
