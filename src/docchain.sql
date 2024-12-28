-- MariaDB dump 10.19  Distrib 10.7.8-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: docchain
-- ------------------------------------------------------
-- Server version	10.7.8-MariaDB-1:10.7.8+maria~deb11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `document_versions`
--

DROP TABLE IF EXISTS `document_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_versions` (
  `version_id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL,
  `hash` char(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `creator_id` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected','expired') DEFAULT 'pending',
  PRIMARY KEY (`version_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `document_versions_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_versions`
--

LOCK TABLES `document_versions` WRITE;
/*!40000 ALTER TABLE `document_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `document_id` int(11) NOT NULL AUTO_INCREMENT,
  `hash` varchar(256) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL,
  `doctype` varchar(100) NOT NULL DEFAULT '',
  `creator_id` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `signers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`signers`)),
  `path` varchar(200) NOT NULL DEFAULT '',
  `filename` varchar(200) NOT NULL DEFAULT '',
  `mimetype` varchar(200) NOT NULL DEFAULT '',
  `shared` tinyint(1) NOT NULL DEFAULT 1,
  `project_id` int(11) NOT NULL DEFAULT 0,
  `project` varchar(200) NOT NULL DEFAULT '',
  `description` text DEFAULT NULL,
  PRIMARY KEY (`document_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES
(1,'','Relationship Contract','Contract','6','2024-11-05 13:01:57','[]','/uploads/cdr/','Relationship-Agreement.pdf','application/pdf',1,1,'Relationship PIP',NULL),
(2,'','Disclosure Form','Contract','6','2024-11-05 13:02:41','[]','/uploads/cdr/','Disclosure-Form.pdf','application/pdf',1,1,'Relationship PIP',NULL),
(3,'','Dishes Amendment','Contract','6','2024-11-05 13:04:20','[]','/uploads/cdr/','Dishes-Amendment.txt','application/pdf',1,1,'Relationship PIP',NULL),
(4,'','Girls Night Out Amendment','Contract','6','2024-11-05 13:04:20','[]','/uploads/cdr/','Girls-Night-Amendment.txt','text/plain',1,1,'Relationship PIP',NULL),
(5,'','Monday Night Football Amendment','Contract','6','2024-11-05 13:04:20','[]','/uploads/cdr/','Monday-Night-Football-Amendment.txt','application/pdf',1,1,'Relationship PIP',NULL),
(6,'','Loan Agreement','Contract','6','2024-11-05 13:54:17','[]','/uploads/cdr/','Loan-Agreement.pdf','',1,2,'Loan Contract','Our loan agreement'),
(7,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','test','','6','2024-11-05 19:30:28','[]','uploads/cdr/','check.pdf','',1,1,'',NULL),
(8,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','test','','6','2024-11-05 20:40:38','[]','uploads/cdr/','one.pdf','',1,1,'',NULL);
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ledger`
--

DROP TABLE IF EXISTS `ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ledger` (
  `ledger_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `document_id` int(11) DEFAULT NULL,
  `action` varchar(200) DEFAULT NULL,
  `request` longtext DEFAULT NULL,
  `result` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ledger_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ledger`
--

LOCK TABLES `ledger` WRITE;
/*!40000 ALTER TABLE `ledger` DISABLE KEYS */;
/*!40000 ALTER TABLE `ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `project_id` int(11) NOT NULL AUTO_INCREMENT,
  `owner` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`project_id`),
  KEY `owner` (`owner`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`owner`) REFERENCES `users` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES
(1,'cdr','Relationship PIP','Relationship PIP (Performance-Improvement-Plan) for couples having trouble with their relationship and need more defined requirements.','2024-11-05 10:42:07'),
(2,'cdr','Loan Contract','Loan contract for borrowing money','2024-11-05 10:42:50'),
(3,'cdr','Business Contract','Startup business documents','2024-11-05 10:43:23');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `signatures`
--

DROP TABLE IF EXISTS `signatures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `signatures` (
  `signature_id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `signer_id` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `signature_data` text NOT NULL,
  `claim_reference` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`signature_id`),
  KEY `document_id` (`document_id`),
  CONSTRAINT `signatures_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `document_versions` (`version_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `signatures`
--

LOCK TABLES `signatures` WRITE;
/*!40000 ALTER TABLE `signatures` DISABLE KEYS */;
/*!40000 ALTER TABLE `signatures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `passwd` varchar(64) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `files` varchar(200) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'testuser','4dc51428db8f30402994d5f96557733377e54ff0a90c794536eae549dac50161','newuser@example.com','New User','','2024-11-04 15:22:13'),
(2,'test2','60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752','test2@cdr2.com','Test2','','2024-11-04 15:55:56'),
(3,'test3','fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13','test3@test.com','testy tester','','2024-11-04 19:13:42'),
(4,'test5','a140c0c1eda2def2b830363ba362aa4d7d255c262960544821f556e16661b6ff','test5@example.com','Testy Tester 5','','2024-11-04 20:25:05'),
(5,'test6','ed0cb90bdfa4f93981a7d03cff99213a86aa96a6cbcf89ec5e8889871f088727','test6@gmail.com','Testy 6','','2024-11-04 20:40:34'),
(6,'cdr','bd206abdeeee87da115fa390bbe8982aa7867a56783884727451d8257c94f3ab','cdr@cdr2.com','Christopher Robison','','2024-11-05 03:39:13');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-11-05 16:47:21
