import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertCircle, 
  FileText, 
  Folder, 
  UserCircle, 
  Settings, 
  Hash, 
  PenTool, 
  Share2, 
  Save
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Main App Component
const DocumentNotaryApp = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch projects on mount
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('api.php?x=projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchDocuments = async (projectId) => {
    try {
      const response = await fetch(`api.php?x=documents&project=${projectId}`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Sidebar Component
  const Sidebar = () => (
    <div className="w-1/4 min-h-screen bg-gray-100 p-4 border-r">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button variant="ghost" size="icon">
            <Folder className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.project_id}
              className={`p-2 rounded cursor-pointer hover:bg-gray-200 ${
                activeProject?.project_id === project.project_id ? 'bg-gray-200' : ''
              }`}
              onClick={() => {
                setActiveProject(project);
                fetchDocuments(project.project_id);
              }}
            >
              <Folder className="h-4 w-4 inline mr-2" />
              {project.title}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <Button variant="ghost" size="icon">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className={`p-2 rounded cursor-pointer hover:bg-gray-200 ${
                activeDocument?.document_id === doc.document_id ? 'bg-gray-200' : ''
              }`}
              onClick={() => setActiveDocument(doc)}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              {doc.title}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-1/4 p-4 border-t">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="w-full text-left">
            <UserCircle className="h-4 w-4 mr-2" />
            Account
          </Button>
          <Button variant="ghost" className="w-full text-left">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );

  // Document Viewer Component
  const DocumentViewer = () => {
    const [documentHash, setDocumentHash] = useState('');

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target.result;
          try {
            const response = await fetch('api.php?x=createDocument', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content,
                title: file.name,
                user: user?.username,
                signers: [],
              }),
            });
            const data = await response.json();
            setDocumentHash(data.hash);
            fetchDocuments(activeProject.project_id);
          } catch (error) {
            console.error('Error creating document:', error);
          }
        };
        reader.readAsText(file);
      }
    };

    return (
      <div className="w-3/4 p-4">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" onClick={() => document.getElementById('fileUpload').click()}>
            <Hash className="h-4 w-4 mr-2" />
            Hash Document
          </Button>
          <Input
            type="file"
            id="fileUpload"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline">
            <PenTool className="h-4 w-4 mr-2" />
            Sign
          </Button>
          <Button variant="outline">
            <AlertCircle className="h-4 w-4 mr-2" />
            Annotate
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Commit
          </Button>
        </div>

        {activeDocument ? (
          <Card>
            <CardHeader>
              <CardTitle>{activeDocument.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <strong>Document Hash:</strong> {activeDocument.hash}
              </div>
              <div className="mb-4">
                <strong>Created:</strong> {new Date(activeDocument.created_at).toLocaleString()}
              </div>
              <div className="mb-4">
                <strong>Creator:</strong> {activeDocument.creator_id}
              </div>
              {/* Document preview would go here */}
              <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Document Preview</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select a document to view its contents
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <DocumentViewer />
    </div>
  );
};

export default DocumentNotaryApp;
