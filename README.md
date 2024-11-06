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

   Create a `.env.json` file in the servers root directory with the following content:

   ```
   {
      "db": {
          "host": "<<YOUR_DB_HOST>>",
          "user": "<<YOUR_DB_USER>>",
          "pass": "<<YOUR_DB_PASSWORD>>",
          "db": "docchain"
      },
      "jwt": {
          "key": "<<YOUR_JWT_SECRET>>",
          "token": "<<YOUR_JWT_TOKEN>>"
       }
   }
   ```

   Replace `<<YOUR_DB_USER>>`, `<<YOUR_DB_PASSWORD>>`, `<<YOUR_JWT_SECRET>>` and `<<YOUR_JWT_TOKEN>>` with your actual database credentials and a secure JWT secret.

5. **Initialize the Database**:

   1. Ensure that your MySQL database is running 
   2. Create the 'docchain' db:
   ```bash
   mysqladmin create docchain
   ```
   3. Execute the provided SQL setup scripts to create the necessary tables.
   ```bash
   cat src/setup.sql | mysql docchain
   ```
   4. [Optional] If you wish to populate your database with test data:
   ```bash
   cat src/docchain.sql | mysql docchain
   ```

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
