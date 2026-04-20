import React, { useState, useRef } from 'react';

const API_BASE = 'http://localhost:8000';

export default function RAGPanel({ isOpen, onClose }) {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentFilename, setCurrentFilename] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      alert('PDF uploaded successfully!');
      setCurrentSessionId(data.session_id);
      setCurrentFilename(data.filename);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessages([]);
      
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const sendQuestion = async () => {
    if (!question.trim() || !currentSessionId) return;

    const userQ = question.trim();
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setQuestion('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, question: userQ })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Failed to get answer");

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer
      }]);
      
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${err.message}` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '350px',
      height: '100%',
      background: '#1e1e1e',
      borderLeft: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#252525'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>📚 Document Assistant</h3>
        <button onClick={onClose} style={{
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: 'pointer'
        }}>
          Close
        </button>
      </div>

      {/* Upload Section */}
      <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          hidden
          onChange={handleFileSelect}
        />
        
        {selectedFile ? (
          <div>
            <div style={{
              padding: '8px',
              background: '#2a2a2a',
              borderRadius: '4px',
              marginBottom: '8px',
              fontSize: '12px'
            }}>
              📄 {selectedFile.name}
            </div>
            <button
              onClick={processFile}
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '10px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isUploading ? '⏳ Processing...' : '🚀 Upload PDF'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '30px',
              background: '#2a2a2a',
              border: '2px dashed #555',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#aaa'
            }}
          >
            📤 Click to Upload PDF
          </button>
        )}
      </div>

      {/* Current Document Name */}
      {currentFilename && (
        <div style={{
          padding: '12px 16px',
          background: '#2a4a2a',
          fontSize: '12px',
          borderBottom: '1px solid #333'
        }}>
          ✅ Active: {currentFilename}
        </div>
      )}

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        fontSize: '13px'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
            Upload a PDF and start asking questions!
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: '12px',
            padding: '10px',
            background: msg.role === 'user' ? '#1a4d2e' : '#2a2a2a',
            borderRadius: '8px',
            borderLeft: `4px solid ${msg.role === 'user' ? '#4CAF50' : '#2196F3'}`
          }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#888',
              marginBottom: '6px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {msg.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
            </div>
            <div style={{ lineHeight: '1.5' }}>{msg.content}</div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ 
            padding: '10px',
            background: '#2a2a2a',
            borderRadius: '8px',
            color: '#888'
          }}>
            🤖 AI is thinking...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #333',
        background: '#252525'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendQuestion();
            }}
            placeholder="Ask about the document..."
            disabled={!currentSessionId || isTyping}
            style={{
              flex: 1,
              padding: '12px',
              background: '#1e1e1e',
              border: '1px solid #444',
              borderRadius: '6px',
              color: 'white',
              fontSize: '13px'
            }}
          />
          <button
            onClick={sendQuestion}
            disabled={!currentSessionId || isTyping || !question.trim()}
            style={{
              padding: '12px 20px',
              background: currentSessionId && !isTyping && question.trim() ? '#2196F3' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentSessionId && !isTyping ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}