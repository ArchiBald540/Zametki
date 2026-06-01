import { useEffect, useState } from "react"

function App() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editText, setEditText] = useState("")

  useEffect(() => {
    const savedNotes = localStorage.getItem("notes")

    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes))
  }, [notes])

  function addNote() {
    let titleValue = title.trim() === "" ? "Заголовок заметки" : title
    let textValue = text.trim() === "" ? "Текст заметки" : text

    const newNote = {
      id: Date.now(),
      title: titleValue,
      text: textValue
    }

    setNotes(prevNotes => [newNote, ...prevNotes])

    setTitle("")
    setText("")
  }

  function deleteNote(id) {
    setNotes(prevNotes =>
      prevNotes.filter(note => note.id !== id)
    )
  }

  function startEdit(note) {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditText(note.text)
  }

  function saveEdit() {
    let titleValue = editTitle.trim() === "" ? "Заголовок заметки" : editTitle
    let textValue = editText.trim() === "" ? "Текст заметки" : editText

    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === editingId
          ? { ...note, title: titleValue, text: textValue }
          : note
      )
    )

    setEditingId(null)
    setEditTitle("")
    setEditText("")
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle("")
    setEditText("")
  }

  function formatText(text) {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>
        Заметки онлайн
      </h1>

      <div style={styles.form}>
        <input
          type="text"
          placeholder="Название заметки"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />

        <textarea
          placeholder="Текст заметки"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.textarea}
        />

        <button
          onClick={addNote}
          style={styles.button}
        >
          Добавить заметку
        </button>
      </div>

      <div style={styles.notesGrid}>
        {notes.map(note => (
          <div
            key={note.id}
            style={styles.noteCard}
          >
            {editingId === note.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={styles.editInput}
                  placeholder="Название заметки"
                />
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={styles.editTextarea}
                  placeholder="Текст заметки"
                />
                <div style={styles.editButtons}>
                  <button
                    onClick={saveEdit}
                    style={styles.saveButton}
                  >
                    💾 Сохранить
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={styles.cancelButton}
                  >
                    ❌ Отмена
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{note.title}</h2>
                <p style={styles.noteText}>
                  {formatText(note.text)}
                </p>
                <div style={styles.actionButtons}>
                  <button
                    onClick={() => startEdit(note)}
                    style={styles.editButton}
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={styles.deleteButton}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#2d5c82",
    color: "white",
    padding: "40px",
    fontFamily: "Arial",

    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  heading: {
    fontSize: "48px",
    marginBottom: "30px"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxWidth: "500px",
    width: "100%"
  },

  input: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px"
  },

  textarea: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px",
    minHeight: "120px"
  },

  button: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "white",
    fontSize: "16px",
    cursor: "pointer"
  },

  notesGrid: {
    marginTop: "40px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    maxWidth: "1200px",
    width: "100%"
  },

  noteCard: {
    backgroundColor: "#1f2937",
    padding: "20px",
    borderRadius: "16px",
    wordBreak: "break-word",
    overflowWrap: "break-word"
  },

  noteText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: "10px 0",
    lineHeight: "1.5"
  },

  actionButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "20px"
  },

  editButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer"
  },

  deleteButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#dc2626",
    color: "white",
    cursor: "pointer"
  },

  editInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
    marginBottom: "10px",
    boxSizing: "border-box"
  },

  editTextarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
    minHeight: "100px",
    marginBottom: "10px",
    boxSizing: "border-box"
  },

  editButtons: {
    display: "flex",
    gap: "10px"
  },

  saveButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#10b981",
    color: "white",
    cursor: "pointer"
  },

  cancelButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#6b7280",
    color: "white",
    cursor: "pointer"
  }
}

export default App