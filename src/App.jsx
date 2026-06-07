import './App.css'
import { useEffect, useState } from "react"

function App() {
  const [allNotes, setAllNotes] = useState([])
  const [openedNote, setOpenedNote] = useState(null)
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false)
  
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteText, setNewNoteText] = useState("")
  const [newNoteType, setNewNoteType] = useState("regular")
  const [newNotePriority, setNewNotePriority] = useState(3)
  const [newNoteColor, setNewNoteColor] = useState("#f5f5f0")
  const [newNoteTags, setNewNoteTags] = useState([])
  const [newNoteCurrentTag, setNewNoteCurrentTag] = useState("")
  const [newNoteTodoItems, setNewNoteTodoItems] = useState([{ id: Date.now(), text: "", completed: false }])
  
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteTitle, setEditNoteTitle] = useState("")
  const [editNoteText, setEditNoteText] = useState("")
  const [editNoteType, setEditNoteType] = useState("regular")
  const [editNotePriority, setEditNotePriority] = useState(3)
  const [editNoteColor, setEditNoteColor] = useState("#f5f5f0")
  const [editNoteTags, setEditNoteTags] = useState([])
  const [editNoteCurrentTag, setEditNoteCurrentTag] = useState("")
  const [editNoteTodoItems, setEditNoteTodoItems] = useState([])
  
  const [sortType, setSortType] = useState("dateNew")
  const [filterByNoteType, setFilterByNoteType] = useState("all")
  const [tagSearchText, setTagSearchText] = useState("")

  const availableColors = ["#f5f5f0", "#f5e0e0", "#f5e6d3", "#f5f0d3", "#d3f5d3", "#d3e8f5", "#e6d3f5", "#f5d3e8"]

  useEffect(() => {
    const savedNotes = localStorage.getItem("notes")
    if (savedNotes) {
      setAllNotes(JSON.parse(savedNotes))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(allNotes))
  }, [allNotes])

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (editingNoteId) {
          setEditingNoteId(null)
        } else if (openedNote) {
          setOpenedNote(null)
        } else if (isCreatingNewNote) {
          setIsCreatingNewNote(false)
        }
      }
    }
    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [editingNoteId, openedNote, isCreatingNewNote])

  function addTagToNewNote() {
    const trimmedTag = newNoteCurrentTag.trim()
    if (trimmedTag && !newNoteTags.includes(trimmedTag)) {
      setNewNoteTags([...newNoteTags, trimmedTag])
      setNewNoteCurrentTag("")
    }
  }

  function removeTagFromNewNote(tagToRemove) {
    setNewNoteTags(newNoteTags.filter(tag => tag !== tagToRemove))
  }

  function addTagToEditingNote() {
    const trimmedTag = editNoteCurrentTag.trim()
    if (trimmedTag && !editNoteTags.includes(trimmedTag)) {
      setEditNoteTags([...editNoteTags, trimmedTag])
      setEditNoteCurrentTag("")
    }
  }

  function removeTagFromEditingNote(tagToRemove) {
    setEditNoteTags(editNoteTags.filter(tag => tag !== tagToRemove))
  }

  function addTodoItemToNewNote() {
    setNewNoteTodoItems([...newNoteTodoItems, { id: Date.now(), text: "", completed: false }])
  }

  function updateNewNoteTodoItem(itemId, newText) {
    setNewNoteTodoItems(newNoteTodoItems.map(item =>
      item.id === itemId ? { ...item, text: newText } : item
    ))
  }

  function addTodoItemToEditingNote() {
    setEditNoteTodoItems([...editNoteTodoItems, { id: Date.now(), text: "", completed: false }])
  }

  function updateEditingNoteTodoItem(itemId, newText) {
    setEditNoteTodoItems(editNoteTodoItems.map(item =>
      item.id === itemId ? { ...item, text: newText } : item
    ))
  }

  function createNewNote() {
    const hasTitle = newNoteTitle.trim() !== ""
    const hasText = newNoteText.trim() !== ""
    
    if (!hasTitle && !hasText && newNoteType === "regular") {
      alert("Заполните хотя бы одно поле: название или текст")
      return
    }
    
    let finalTitle = newNoteTitle.trim()
    if (finalTitle === "") {
      finalTitle = "Название"
    } else {
      finalTitle = finalTitle.replace(/\s+/g, ' ')
    }
    
    let createdNote
    if (newNoteType === "regular") {
      let finalText = newNoteText.trim() === "" ? "" : newNoteText
      createdNote = {
        id: Date.now(),
        type: "regular",
        title: finalTitle,
        text: finalText,
        priority: newNotePriority,
        color: newNoteColor,
        tags: newNoteTags,
        isPinned: false,
        createdAt: new Date().toISOString()
      }
    } else {
      const validTodoItems = newNoteTodoItems.filter(item => item.text.trim() !== "")
      if (validTodoItems.length === 0 && !hasTitle) {
        alert("Добавьте хотя бы один пункт в список или укажите название")
        return
      }
      if (validTodoItems.length === 0) {
        validTodoItems.push({ id: Date.now(), text: "Новый пункт", completed: false })
      }
      createdNote = {
        id: Date.now(),
        type: "todo",
        title: finalTitle,
        todoItems: validTodoItems,
        priority: newNotePriority,
        color: newNoteColor,
        tags: newNoteTags,
        isPinned: false,
        createdAt: new Date().toISOString()
      }
    }

    setAllNotes(prevNotes => [createdNote, ...prevNotes])
    resetNewNoteForm()
    setIsCreatingNewNote(false)
  }

  function resetNewNoteForm() {
    setNewNoteTitle("")
    setNewNoteText("")
    setNewNoteTags([])
    setNewNoteTodoItems([{ id: Date.now(), text: "", completed: false }])
    setNewNoteType("regular")
    setNewNotePriority(3)
    setNewNoteColor("#f5f5f0")
  }

  function deleteNoteById(noteId) {
    setAllNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))
    if (openedNote?.id === noteId) setOpenedNote(null)
  }

  function toggleNotePinned(noteId) {
    setAllNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
      )
    )
  }

  function startEditingNote(note) {
    setEditingNoteId(note.id)
    let editedTitle = note.title
    if (editedTitle === "Название") {
      editedTitle = ""
    }
    setEditNoteTitle(editedTitle)
    setEditNotePriority(note.priority || 3)
    setEditNoteColor(note.color || "#f5f5f0")
    setEditNoteTags(note.tags || [])
    if (note.type === "regular") {
      setEditNoteType("regular")
      setEditNoteText(note.text)
    } else {
      setEditNoteType("todo")
      setEditNoteTodoItems(note.todoItems.map(item => ({ ...item, id: Date.now() + Math.random() })))
    }
  }

  function toggleTodoItemInOpenedNote(itemId) {
    setAllNotes(prevNotes =>
      prevNotes.map(note => {
        if (note.id === openedNote?.id && note.type === "todo") {
          const updatedTodoItems = note.todoItems.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
          return { ...note, todoItems: updatedTodoItems }
        }
        return note
      })
    )
    if (openedNote) {
      setOpenedNote(prev => ({
        ...prev,
        todoItems: prev.todoItems.map(item =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      }))
    }
  }

  function saveEditedNote() {
    const hasTitle = editNoteTitle.trim() !== ""
    const hasText = editNoteText.trim() !== ""
    
    if (!hasTitle && !hasText && editNoteType === "regular") {
      alert("Заполните хотя бы одно поле: название или текст")
      return
    }
    
    let finalTitle = editNoteTitle.trim()
    if (finalTitle === "") {
      finalTitle = "Название"
    } else {
      finalTitle = finalTitle.replace(/\s+/g, ' ')
    }

    setAllNotes(prevNotes =>
      prevNotes.map(note => {
        if (note.id === editingNoteId) {
          if (editNoteType === "regular") {
            let finalText = editNoteText.trim() === "" ? "" : editNoteText
            return {
              ...note,
              type: "regular",
              title: finalTitle,
              text: finalText,
              priority: editNotePriority,
              color: editNoteColor,
              tags: editNoteTags
            }
          } else {
            const validTodoItems = editNoteTodoItems.filter(item => item.text.trim() !== "")
            if (validTodoItems.length === 0 && !hasTitle) {
              alert("Добавьте хотя бы один пункт в список или укажите название")
              return note
            }
            if (validTodoItems.length === 0) {
              validTodoItems.push({ id: Date.now(), text: "Новый пункт", completed: false })
            }
            return {
              ...note,
              type: "todo",
              title: finalTitle,
              todoItems: validTodoItems,
              priority: editNotePriority,
              color: editNoteColor,
              tags: editNoteTags
            }
          }
        }
        return note
      })
    )

    if (openedNote?.id === editingNoteId) {
      setOpenedNote(prev => ({
        ...prev,
        title: finalTitle,
        type: editNoteType,
        ...(editNoteType === "regular" 
          ? { text: editNoteText.trim() === "" ? "" : editNoteText }
          : { todoItems: editNoteTodoItems.filter(item => item.text.trim() !== "") }),
        priority: editNotePriority,
        color: editNoteColor,
        tags: editNoteTags
      }))
    }

    resetEditingForm()
  }

  function resetEditingForm() {
    setEditingNoteId(null)
    setEditNoteTitle("")
    setEditNoteText("")
    setEditNoteTodoItems([])
    setEditNoteTags([])
    setEditNoteType("regular")
    setEditNotePriority(3)
    setEditNoteColor("#f5f5f0")
  }

  function cancelEditing() {
    setEditingNoteId(null)
  }

  function formatTextWithLineBreaks(text) {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  function isAllTodoItemsCompleted(todoItems) {
    return todoItems.length > 0 && todoItems.every(item => item.completed === true)
  }

  function renderPriorityStars(priority) {
    return "⭐".repeat(priority) + "☆".repeat(5 - priority)
  }

  function getAllExistingTags() {
    const allTags = new Set()
    allNotes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => allTags.add(tag))
      }
    })
    return Array.from(allTags)
  }

  function getFilteredAndSortedNotes() {
    let filtered = allNotes
    
    if (filterByNoteType !== "all") {
      filtered = filtered.filter(note => note.type === filterByNoteType)
    }
    
    if (tagSearchText.trim()) {
      const searchTags = tagSearchText.toLowerCase().split(',').map(tag => tag.trim()).filter(tag => tag)
      filtered = filtered.filter(note => {
        if (!note.tags || note.tags.length === 0) return false
        return searchTags.some(searchTag => 
          note.tags.some(noteTag => noteTag.toLowerCase().includes(searchTag))
        )
      })
    }

    const pinnedNotes = filtered.filter(note => note.isPinned)
    const unpinnedNotes = filtered.filter(note => !note.isPinned)

    const sortFunction = (noteA, noteB) => {
      if (sortType === "dateNew") {
        return new Date(noteB.createdAt) - new Date(noteA.createdAt)
      } else if (sortType === "dateOld") {
        return new Date(noteA.createdAt) - new Date(noteB.createdAt)
      } else if (sortType === "priority") {
        return (noteB.priority || 3) - (noteA.priority || 3)
      }
      return 0
    }

    return [...pinnedNotes.sort(sortFunction), ...unpinnedNotes.sort(sortFunction)]
  }

  const visibleNotes = getFilteredAndSortedNotes()
  const allExistingTags = getAllExistingTags()

  return (
    <div style={styles.appContainer}>
      <div style={styles.sidebarPanel}>
        <h1 style={styles.logoText}>Zametki online</h1>
        
        <button 
          style={styles.createNoteButton}
          onClick={() => {
            setIsCreatingNewNote(true)
            setOpenedNote(null)
            resetNewNoteForm()
          }}
        >
          + Создать новую заметку
        </button>

        <div style={styles.sortingSection}>
          <label style={styles.sectionLabel}>Сортировка:</label>
          <select value={sortType} onChange={(e) => setSortType(e.target.value)} style={styles.sortSelect}>
            <option value="dateNew">По дате (сначала новые)</option>
            <option value="dateOld">По дате (сначала старые)</option>
            <option value="priority">По приоритету</option>
          </select>
        </div>

        <div style={styles.filterSection}>
          <button
            onClick={() => setFilterByNoteType("all")}
            style={{
              ...styles.filterButton,
              ...(filterByNoteType === "all" && styles.activeFilterButton)
            }}
          >
            Все
          </button>
          <button
            onClick={() => setFilterByNoteType("regular")}
            style={{
              ...styles.filterButton,
              ...(filterByNoteType === "regular" && styles.activeFilterButton)
            }}
          >
            📝 Заметки
          </button>
          <button
            onClick={() => setFilterByNoteType("todo")}
            style={{
              ...styles.filterButton,
              ...(filterByNoteType === "todo" && styles.activeFilterButton)
            }}
          >
            ✓ Списки
          </button>
        </div>

        <div style={styles.tagSearchSection}>
          <label style={styles.sectionLabel}>Поиск по тегам:</label>
          <input
            type="text"
            placeholder="Введите тег... (можно несколько через запятую)"
            value={tagSearchText}
            onChange={(e) => setTagSearchText(e.target.value)}
            style={styles.tagSearchInput}
          />
          {allExistingTags.length > 0 && (
            <div style={styles.quickTagsList}>
              {allExistingTags.slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onClick={() => setTagSearchText(tag)}
                  style={styles.quickTagButton}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.notesGridContainer}>
        <div style={styles.notesGrid}>
          {visibleNotes.map(note => (
            <div
              key={note.id}
              style={{
                ...styles.noteCard,
                backgroundColor: note.color || "#f5f5f0",
                ...(note.type === "todo" && isAllTodoItemsCompleted(note.todoItems) && styles.completedNoteCard)
              }}
              onClick={() => setOpenedNote(note)}
            >
              <div style={styles.cardHeader}>
                <div style={styles.cardStars}>{renderPriorityStars(note.priority || 3)}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleNotePinned(note.id)
                  }}
                  style={styles.cardPinButton}
                >
                  {note.isPinned ? "📌" : "📍"}
                </button>
              </div>
              <h3 style={styles.cardTitle} title={note.title}>{note.title}</h3>
              <div style={styles.cardPreview}>
                {note.type === "regular" 
                  ? (note.text ? note.text.slice(0, 100) : "")
                  : `${note.todoItems.filter(item => item.completed).length}/${note.todoItems.length} выполнено`}
              </div>
              {note.tags && note.tags.length > 0 && (
                <div style={styles.cardTags}>
                  {note.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={styles.cardTag}>#{tag}</span>
                  ))}
                  {note.tags.length > 3 && <span style={styles.cardTag}>+{note.tags.length - 3}</span>}
                </div>
              )}
              <div style={styles.cardDate}>
                {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        {visibleNotes.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📝</div>
            <div style={styles.emptyStateText}>
              {tagSearchText ? (
                <>Нет заметок с тегом "{tagSearchText}"<br />Попробуйте другой поиск</>
              ) : (
                <>Нет заметок<br />Создайте первую!</>
              )}
            </div>
          </div>
        )}
      </div>

      {(openedNote || isCreatingNewNote) && (
        <div style={styles.modalOverlay} onClick={() => {
          setOpenedNote(null)
          setIsCreatingNewNote(false)
          setEditingNoteId(null)
        }}>
          <div style={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            {isCreatingNewNote ? (
              <div style={{...styles.modalContent, backgroundColor: newNoteColor}}>
                <div style={styles.modalHeader}>
                  <h2>Создание заметки</h2>
                  <button onClick={() => setIsCreatingNewNote(false)} style={styles.closeButton}>×</button>
                </div>
                
                <div style={styles.modalBody}>
                  <input
                    type="text"
                    placeholder="Название"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    style={styles.modalInput}
                    maxLength={100}
                  />
                  
                  <div style={styles.formField}>
                    <label>Приоритет</label>
                    <div style={styles.starsRow}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => setNewNotePriority(star)} style={{...styles.starButton, color: star <= newNotePriority ? "#fbbf24" : "#d1d5db"}}>★</button>
                      ))}
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label>Цвет</label>
                    <div style={styles.colorsRow}>
                      {availableColors.map(color => (
                        <button key={color} onClick={() => setNewNoteColor(color)} style={{...styles.colorCircle, backgroundColor: color, border: newNoteColor === color ? "3px solid #8b5cf6" : "1px solid #d1d5db"}} />
                      ))}
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label>Теги</label>
                    <div style={styles.tagsInputWrapper}>
                      <div style={styles.tagsList}>
                        {newNoteTags.map(tag => (
                          <span key={tag} style={styles.tagChip}>#{tag}<button onClick={() => removeTagFromNewNote(tag)} style={styles.removeTagChip}>×</button></span>
                        ))}
                      </div>
                      <div style={styles.addTagRow}>
                        <input type="text" placeholder="Новый тег" value={newNoteCurrentTag} onChange={(e) => setNewNoteCurrentTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTagToNewNote()} style={styles.tagInput} />
                        <button onClick={addTagToNewNote} style={styles.addTagButton}>+</button>
                      </div>
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label>Тип</label>
                    <div style={styles.typeSelector}>
                      <button onClick={() => setNewNoteType("regular")} style={{...styles.typeButton, ...(newNoteType === "regular" && styles.activeTypeButton)}}>📝 Обычная</button>
                      <button onClick={() => setNewNoteType("todo")} style={{...styles.typeButton, ...(newNoteType === "todo" && styles.activeTypeButton)}}>✓ Список</button>
                    </div>
                  </div>
                  
                  {newNoteType === "regular" ? (
                    <textarea placeholder="Текст" value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} style={styles.modalTextarea} />
                  ) : (
                    <div>
                      {newNoteTodoItems.map((item, index) => (
                        <input key={item.id} type="text" placeholder={`Пункт ${index + 1}`} value={item.text} onChange={(e) => updateNewNoteTodoItem(item.id, e.target.value)} style={styles.todoInput} />
                      ))}
                      <button onClick={addTodoItemToNewNote} style={styles.addTodoButton}>+ Добавить пункт</button>
                    </div>
                  )}
                </div>
                
                <div style={styles.modalFooter}>
                  <button onClick={createNewNote} style={styles.saveButton}>💾 Сохранить</button>
                  <button onClick={() => setIsCreatingNewNote(false)} style={styles.cancelButton}>❌ Отмена</button>
                </div>
              </div>
            ) : openedNote && editingNoteId === openedNote.id ? (
              <div style={{...styles.modalContent, backgroundColor: editNoteColor}}>
                <div style={styles.modalHeader}>
                  <h2>Редактирование</h2>
                  <button onClick={() => setEditingNoteId(null)} style={styles.closeButton}>×</button>
                </div>
                
                <div style={styles.modalBody}>
                  <input type="text" value={editNoteTitle} onChange={(e) => setEditNoteTitle(e.target.value)} style={styles.modalInput} maxLength={100} placeholder="Название" />
                  
                  <div style={styles.formField}>
                    <label>Приоритет</label>
                    <div style={styles.starsRow}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => setEditNotePriority(star)} style={{...styles.starButton, color: star <= editNotePriority ? "#fbbf24" : "#d1d5db"}}>★</button>
                      ))}
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label>Цвет</label>
                    <div style={styles.colorsRow}>
                      {availableColors.map(color => (
                        <button key={color} onClick={() => setEditNoteColor(color)} style={{...styles.colorCircle, backgroundColor: color, border: editNoteColor === color ? "3px solid #8b5cf6" : "1px solid #d1d5db"}} />
                      ))}
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label>Теги</label>
                    <div style={styles.tagsInputWrapper}>
                      <div style={styles.tagsList}>
                        {editNoteTags.map(tag => (
                          <span key={tag} style={styles.tagChip}>#{tag}<button onClick={() => removeTagFromEditingNote(tag)} style={styles.removeTagChip}>×</button></span>
                        ))}
                      </div>
                      <div style={styles.addTagRow}>
                        <input type="text" placeholder="Новый тег" value={editNoteCurrentTag} onChange={(e) => setEditNoteCurrentTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTagToEditingNote()} style={styles.tagInput} />
                        <button onClick={addTagToEditingNote} style={styles.addTagButton}>+</button>
                      </div>
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label>Тип</label>
                    <div style={styles.typeSelector}>
                      <button onClick={() => setEditNoteType("regular")} style={{...styles.typeButton, ...(editNoteType === "regular" && styles.activeTypeButton)}}>📝 Обычная</button>
                      <button onClick={() => setEditNoteType("todo")} style={{...styles.typeButton, ...(editNoteType === "todo" && styles.activeTypeButton)}}>✓ Список</button>
                    </div>
                  </div>
                  
                  {editNoteType === "regular" ? (
                    <textarea value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} style={styles.modalTextarea} placeholder="Текст" />
                  ) : (
                    <div>
                      {editNoteTodoItems.map((item, index) => (
                        <input key={item.id} type="text" placeholder={`Пункт ${index + 1}`} value={item.text} onChange={(e) => updateEditingNoteTodoItem(item.id, e.target.value)} style={styles.todoInput} />
                      ))}
                      <button onClick={addTodoItemToEditingNote} style={styles.addTodoButton}>+ Добавить пункт</button>
                    </div>
                  )}
                </div>
                
                <div style={styles.modalFooter}>
                  <button onClick={saveEditedNote} style={styles.saveButton}>💾 Сохранить</button>
                  <button onClick={cancelEditing} style={styles.cancelButton}>❌ Отмена</button>
                </div>
              </div>
            ) : openedNote && (
              <div style={{...styles.modalContent, backgroundColor: openedNote.color || "#f5f5f0"}}>
                <div style={styles.modalHeader}>
                  <div>
                    <div style={styles.modalStars}>{renderPriorityStars(openedNote.priority || 3)}</div>
                    <h2>{openedNote.title}</h2>
                    {openedNote.tags && openedNote.tags.length > 0 && (
                      <div style={styles.modalTags}>
                        {openedNote.tags.map(tag => <span key={tag} style={styles.modalTag}>#{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <div>
                    <button onClick={() => startEditingNote(openedNote)} style={styles.editModalButton}>✏️</button>
                    <button onClick={() => setOpenedNote(null)} style={styles.closeButton}>×</button>
                  </div>
                </div>
                <div style={styles.modalBody}>
                  {openedNote.type === "regular" ? (
                    <p style={styles.modalText}>{openedNote.text ? formatTextWithLineBreaks(openedNote.text) : ""}</p>
                  ) : (
                    <div>
                      {openedNote.todoItems.map((item) => (
                        <label key={item.id} style={{...styles.modalTodoItem, ...(item.completed && styles.completedModalTodoItem)}}>
                          <input type="checkbox" checked={item.completed} onChange={() => toggleTodoItemInOpenedNote(item.id)} style={styles.modalCheckbox} />
                          <span style={item.completed ? styles.completedModalTodoText : styles.modalTodoText}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div style={styles.modalDate}>Создано: {new Date(openedNote.createdAt).toLocaleString()}</div>
                </div>
                <div style={styles.modalFooter}>
                  <button onClick={() => toggleNotePinned(openedNote.id)} style={{...styles.pinModalButton, backgroundColor: openedNote.isPinned ? "#fbbf24" : "#8b5cf6"}}>
                    📌 {openedNote.isPinned ? "Открепить" : "Закрепить"}
                  </button>
                  <button onClick={() => deleteNoteById(openedNote.id)} style={styles.deleteModalButton}>🗑️ Удалить</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  appContainer: {
    display: "flex",
    height: "100vh",
    width: "100%",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#f3f4f6"
  },

  sidebarPanel: {
    width: "280px",
    backgroundColor: "#1a1a2e",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #2d2d3f",
    overflowY: "auto",
    position: "relative",
    zIndex: 1
  },

  logoText: {
    fontSize: "20px",
    fontWeight: "600",
    padding: "20px",
    margin: 0,
    borderBottom: "1px solid #2d2d3f",
    color: "#8b5cf6"
  },

  createNoteButton: {
    margin: "16px",
    padding: "12px 16px",
    backgroundColor: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },

  sortingSection: {
    padding: "12px 16px",
    borderBottom: "1px solid #2d2d3f"
  },

  sectionLabel: {
    fontSize: "12px",
    color: "#a0a0b0",
    marginBottom: "8px",
    display: "block"
  },

  sortSelect: {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    backgroundColor: "#2a2a3a",
    color: "white",
    border: "1px solid #3a3a4a",
    cursor: "pointer"
  },

  filterSection: {
    padding: "12px 16px",
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid #2d2d3f"
  },

  filterButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#2a2a3a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px"
  },

  activeFilterButton: {
    backgroundColor: "#8b5cf6"
  },

  tagSearchSection: {
    padding: "12px 16px",
    borderBottom: "1px solid #2d2d3f"
  },

  tagSearchInput: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "#2a2a3a",
    color: "white",
    border: "1px solid #3a3a4a",
    outline: "none",
    fontSize: "12px",
    marginBottom: "8px"
  },

  quickTagsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px"
  },

  quickTagButton: {
    padding: "4px 8px",
    backgroundColor: "#2a2a3a",
    color: "#8b5cf6",
    border: "1px solid #3a3a4a",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "10px"
  },

  notesGridContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "30px"
  },

  notesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px"
  },

  noteCard: {
    padding: "16px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative"
  },

  completedNoteCard: {
    opacity: 0.6
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },

  cardStars: {
    fontSize: "12px"
  },

  cardPinButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px"
  },

  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 8px 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },

  cardPreview: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical"
  },

  cardTags: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    marginBottom: "8px"
  },

  cardTag: {
    fontSize: "10px",
    backgroundColor: "#8b5cf6",
    color: "white",
    padding: "2px 6px",
    borderRadius: "12px"
  },

  cardDate: {
    fontSize: "10px",
    color: "#9ca3af"
  },

  emptyState: {
    textAlign: "center",
    color: "#a0a0b0",
    padding: "60px 20px"
  },

  emptyStateIcon: {
    fontSize: "64px",
    marginBottom: "16px"
  },

  emptyStateText: {
    fontSize: "16px"
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },

  modalWindow: {
    width: "90%",
    maxWidth: "600px",
    maxHeight: "85vh",
    backgroundColor: "transparent",
    borderRadius: "16px",
    overflow: "hidden"
  },

  modalContent: {
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
    borderRadius: "16px"
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "rgba(255,255,255,0.5)",
    position: "sticky",
    top: 0,
    zIndex: 1
  },

  modalStars: {
    fontSize: "14px",
    marginBottom: "8px"
  },

  modalTags: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
    flexWrap: "wrap"
  },

  modalTag: {
    fontSize: "10px",
    backgroundColor: "#8b5cf6",
    color: "white",
    padding: "2px 8px",
    borderRadius: "12px"
  },

  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666"
  },

  editModalButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    marginRight: "8px"
  },

  modalBody: {
    padding: "24px",
    overflowY: "auto"
  },

  modalInput: {
    width: "100%",
    padding: "12px",
    fontSize: "18px",
    fontWeight: "500",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "16px",
    outline: "none",
    boxSizing: "border-box"
  },

  modalTextarea: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    minHeight: "200px",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box"
  },

  modalText: {
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0
  },

  modalTodoItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px",
    cursor: "pointer"
  },

  completedModalTodoItem: {
    opacity: 0.6
  },

  modalCheckbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer"
  },

  modalTodoText: {
    fontSize: "14px"
  },

  completedModalTodoText: {
    fontSize: "14px",
    textDecoration: "line-through",
    color: "#999"
  },

  modalDate: {
    fontSize: "10px",
    color: "#999",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb"
  },

  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    backgroundColor: "rgba(255,255,255,0.5)",
    position: "sticky",
    bottom: 0
  },

  saveButton: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  },

  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  },

  pinModalButton: {
    padding: "10px 20px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  },

  deleteModalButton: {
    padding: "10px 20px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  },

  formField: {
    marginBottom: "16px"
  },

  starsRow: {
    display: "flex",
    gap: "4px"
  },

  starButton: {
    fontSize: "24px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0
  },

  colorsRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  colorCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  tagsInputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  tagsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px"
  },

  tagChip: {
    backgroundColor: "#8b5cf6",
    color: "white",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },

  removeTagChip: {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 2px"
  },

  addTagRow: {
    display: "flex",
    gap: "8px"
  },

  tagInput: {
    flex: 1,
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "12px",
    outline: "none"
  },

  addTagButton: {
    padding: "6px 12px",
    backgroundColor: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },

  typeSelector: {
    display: "flex",
    gap: "8px"
  },

  typeButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px"
  },

  activeTypeButton: {
    backgroundColor: "#8b5cf6",
    color: "white"
  },

  todoInput: {
    width: "100%",
    padding: "8px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    marginBottom: "8px",
    outline: "none",
    fontSize: "13px",
    boxSizing: "border-box"
  },

  addTodoButton: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#f3f4f6",
    border: "1px dashed #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    color: "#6b7280"
  }
}

export default App