import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export default function AIDocumentEditor() {
  const navigate = useNavigate();
  const abortRef = useRef(null);

  // ----------------------------
  // State
  // ----------------------------
  const [prompt, setPrompt] = useState("");
  const [documentType, setDocumentType] = useState("Agreement");
  const [country, setCountry] = useState("India");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ----------------------------
  // TipTap Editor
  // ----------------------------
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p></p>",
  });

  // ----------------------------
  // AI STREAMING GENERATION (FIXED)
  // ----------------------------
  const generateDocument = async () => {
    if (!prompt.trim()) {
      setSnackbar({
        open: true,
        message: "Please describe the document",
        severity: "warning",
      });
      return;
    }

    if (!editor) return;

    setLoading(true);
    editor.commands.clearContent();
    editor.commands.focus();

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/ai/generate-stream-temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          document_type: documentType,
          country,
          language,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });

          // ✅ Insert RAW HTML safely
          editor.commands.insertContent(chunk);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setSnackbar({
          open: true,
          message: "AI generation failed",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // SAVE → PREPARE
  // ----------------------------
  const saveAndPrepare = async () => {
    if (!editor || !editor.getText().trim()) {
      setSnackbar({
        open: true,
        message: "Document is empty",
        severity: "warning",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/ai/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: documentType,
          content_html: editor.getHTML(),
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      navigate("/user/prepare-send", {
        state: {
          document: data.document,
          fromAI: true,
        },
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to save document",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------
  // REWRITE SELECTION
  // ----------------------------
  const rewriteSelection = async (action) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) {
      setSnackbar({
        open: true,
        message: "Select text to rewrite",
        severity: "info",
      });
      return;
    }

    const text = editor.state.doc.textBetween(from, to);

    try {
      const res = await fetch(`${API_BASE}/ai/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text }),
      });

      const data = await res.json();
      editor.commands.insertContentAt({ from, to }, data.content_html);
    } catch {
      setSnackbar({
        open: true,
        message: "Rewrite failed",
        severity: "error",
      });
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 24 }}>
      <h2>AI Document Generator</h2>

      <TextField
        label="Describe your document"
        fullWidth
        multiline
        minRows={2}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 2 }}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <TextField select label="Type" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
          <MenuItem value="Agreement">Agreement</MenuItem>
          <MenuItem value="NDA">NDA</MenuItem>
          <MenuItem value="Offer Letter">Offer Letter</MenuItem>
          <MenuItem value="Custom">Custom</MenuItem>
        </TextField>

        <TextField select label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
          <MenuItem value="India">India</MenuItem>
          <MenuItem value="USA">USA</MenuItem>
        </TextField>

        <TextField select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <MenuItem value="English">English</MenuItem>
          <MenuItem value="Tamil">Tamil</MenuItem>
        </TextField>

        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={generateDocument}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Generate (Live)"}
        </Button>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12, minHeight: 420 }}>
        <EditorContent editor={editor} />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => rewriteSelection("simplify")}>
          Simplify
        </Button>

        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => rewriteSelection("formal")}>
          Make Legal
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          onClick={saveAndPrepare}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save & Prepare"}
        </Button>
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
