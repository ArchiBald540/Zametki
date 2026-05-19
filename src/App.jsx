import { useEffect, useState } from "react"

function App() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")

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
    if (!title.trim() || !text.trim()) return

    const newNote = {
      id: Date.now(),
      title: title,
      text: text
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
            <h2>{note.title}</h2>

            <p>{note.text}</p>

            <button
              onClick={() => deleteNote(note.id)}
              style={styles.deleteButton}
            >
              Удалить
            </button>
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
    maxWidth: "500px"
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
    gap: "20px"
  },

  noteCard: {
    backgroundColor: "#1f2937",
    padding: "20px",
    borderRadius: "16px"
  },

  deleteButton: {
    marginTop: "20px",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#dc2626",
    color: "white",
    cursor: "pointer"
  }
}

export default App