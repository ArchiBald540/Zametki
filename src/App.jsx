import './App.css'
import { useEffect, useState, useMemo, useRef } from "react"

// ---------- Color helper utilities ----------
// These are used to automatically pick a readable / matching toolbar color
// for ANY note color or theme accent color chosen from the palette.
function hexToRgb(hex) {
  let clean = (hex || "#f5f5f0").replace('#', '')
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('')
  const num = parseInt(clean, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')}`
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

function getReadableTextColor(hex) {
  return getRelativeLuminance(hex) > 0.55 ? "#1a1a2e" : "#ffffff"
}

function adjustColorBrightness(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r + amount, g + amount, b + amount)
}

// Given ANY color from the palette, pick a matching toolbar (header/footer) color
function getToolbarColors(hex) {
  const base = hex || "#f5f5f0"
  const lum = getRelativeLuminance(base)
  const bg = lum > 0.5 ? adjustColorBrightness(base, -22) : adjustColorBrightness(base, 34)
  return { backgroundColor: bg, color: getReadableTextColor(bg) }
}

// Theme toggle button color, derived from the app accent color + current theme
function getThemeButtonColors(isDark) {
  const accent = "#8b5cf6"
  const bg = isDark ? adjustColorBrightness(accent, 45) : adjustColorBrightness(accent, -15)
  return { backgroundColor: bg, color: getReadableTextColor(bg) }
}

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
  const [newNoteImages, setNewNoteImages] = useState([])
  const [newNoteTableData, setNewNoteTableData] = useState([["", ""], ["", ""]])
  
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteTitle, setEditNoteTitle] = useState("")
  const [editNoteText, setEditNoteText] = useState("")
  const [editNoteType, setEditNoteType] = useState("regular")
  const [editNotePriority, setEditNotePriority] = useState(3)
  const [editNoteColor, setEditNoteColor] = useState("#f5f5f0")
  const [editNoteTags, setEditNoteTags] = useState([])
  const [editNoteCurrentTag, setEditNoteCurrentTag] = useState("")
  const [editNoteTodoItems, setEditNoteTodoItems] = useState([])
  const [editNoteImages, setEditNoteImages] = useState([])
  const [editNoteTableData, setEditNoteTableData] = useState([["", ""], ["", ""]])
  
  const [sortType, setSortType] = useState("dateNew")
  const [filterByNoteType, setFilterByNoteType] = useState("all")
  const [tagSearchText, setTagSearchText] = useState("")

  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [folderPath, setFolderPath] = useState([])
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [movingNoteId, setMovingNoteId] = useState(null)

  const [showArchive, setShowArchive] = useState(false)
  const [archiveNotes, setArchiveNotes] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const availableColors = ["#f5f5f0", "#f5e0e0", "#f5e6d3", "#f5f0d3", "#d3f5d3", "#d3e8f5", "#e6d3f5", "#f5d3e8", "#ffd6d6", "#ffe8b3", "#c9f5c9", "#b3e0ff", "#d9c2f0", "#ffc2e0", "#c2f0e0", "#e8e8e8"]

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system")
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  )
  const isDarkMode = theme === "dark" || (theme === "system" && systemPrefersDark)
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  const newNoteFileInputRef = useRef(null)
  const editNoteFileInputRef = useRef(null)

  useEffect(() => {
    const savedNotes = localStorage.getItem("notes")
    if (savedNotes) {
      setAllNotes(JSON.parse(savedNotes))
    }
    const savedArchive = localStorage.getItem("archiveNotes")
    if (savedArchive) {
      setArchiveNotes(JSON.parse(savedArchive))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(allNotes))
    localStorage.setItem("archiveNotes", JSON.stringify(archiveNotes))
  }, [allNotes, archiveNotes])

  useEffect(() => {
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    if (!window.matchMedia) return
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e) => setSystemPrefersDark(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  function cycleTheme() {
    setTheme(prev => prev === "light" ? "dark" : prev === "dark" ? "system" : "light")
  }

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (editingNoteId) {
          setEditingNoteId(null)
        } else if (openedNote) {
          setOpenedNote(null)
        } else if (isCreatingNewNote) {
          setIsCreatingNewNote(false)
        } else if (isCreatingNewFolder) {
          setIsCreatingNewFolder(false)
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(null)
        }
      }
    }
    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [editingNoteId, openedNote, isCreatingNewNote, isCreatingNewFolder, showDeleteConfirm])

  function moveToArchive(noteId) {
    const noteToArchive = allNotes.find(n => n.id === noteId)
    if (noteToArchive) {
      const archivedNote = { ...noteToArchive, archivedAt: new Date().toISOString() }
      setArchiveNotes(prev => [archivedNote, ...prev])
      setAllNotes(prev => prev.filter(n => n.id !== noteId))
      if (openedNote?.id === noteId) setOpenedNote(null)
    }
    setShowDeleteConfirm(null)
  }

  function restoreFromArchive(noteId) {
    const noteToRestore = archiveNotes.find(n => n.id === noteId)
    if (noteToRestore) {
      const { archivedAt, ...restoredNote } = noteToRestore
      setAllNotes(prev => [restoredNote, ...prev])
      setArchiveNotes(prev => prev.filter(n => n.id !== noteId))
    }
  }

  function deleteForever(noteId) {
    setArchiveNotes(prev => prev.filter(n => n.id !== noteId))
    setShowDeleteConfirm(null)
  }

  function getCurrentItems() {
    if (currentFolderId === null) {
      return allNotes.filter(item => !item.parentFolderId)
    }
    return allNotes.filter(item => item.parentFolderId === currentFolderId)
  }

  function updateFolderPath() {
    const newPath = []
    let currentId = currentFolderId
    while (currentId !== null) {
      const folder = allNotes.find(n => n.id === currentId && n.type === "folder")
      if (folder) {
        newPath.unshift({ id: folder.id, name: folder.title })
        currentId = folder.parentFolderId
      } else {
        break
      }
    }
    setFolderPath(newPath)
  }

  useEffect(() => {
    updateFolderPath()
  }, [currentFolderId, allNotes])

  function createFolder() {
    if (!newFolderName.trim()) {
      alert("Введите название папки")
      return
    }
    
    const newFolder = {
      id: Date.now(),
      type: "folder",
      title: newFolderName.trim(),
      parentFolderId: currentFolderId,
      isPinned: false,
      createdAt: new Date().toISOString()
    }
    
    setAllNotes(prev => [...prev, newFolder])
    setNewFolderName("")
    setIsCreatingNewFolder(false)
  }

  function deleteFolder(folderId) {
    setAllNotes(prev => prev.filter(item => item.id !== folderId))
    if (currentFolderId === folderId) {
      setCurrentFolderId(null)
    }
  }

  function openFolder(folderId) {
    setCurrentFolderId(folderId)
  }

  function navigateToFolder(index) {
    if (index === -1) {
      setCurrentFolderId(null)
    } else {
      setCurrentFolderId(folderPath[index].id)
    }
  }

  function moveNoteToFolder(noteId, targetFolderId) {
    setAllNotes(prev =>
      prev.map(note =>
        note.id === noteId ? { ...note, parentFolderId: targetFolderId } : note
      )
    )
    setMovingNoteId(null)
  }

  function getAllFoldersList() {
    return allNotes.filter(item => item.type === "folder")
  }

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

  function handleImageFilesSelected(fileList, isEditing) {
    const files = Array.from(fileList || [])
    files.forEach(file => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target.result
        if (isEditing) {
          setEditNoteImages(prev => [...prev, dataUrl])
        } else {
          setNewNoteImages(prev => [...prev, dataUrl])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function removeNewNoteImage(index) {
    setNewNoteImages(prev => prev.filter((_, i) => i !== index))
  }

  function removeEditNoteImage(index) {
    setEditNoteImages(prev => prev.filter((_, i) => i !== index))
  }

  // ----- Table note helpers -----
  function updateTableCell(isEditing, rowIndex, colIndex, value) {
    const updater = (table) => table.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell) : row
    )
    if (isEditing) {
      setEditNoteTableData(prev => updater(prev))
    } else {
      setNewNoteTableData(prev => updater(prev))
    }
  }

  function addTableRow(isEditing) {
    if (isEditing) {
      setEditNoteTableData(prev => [...prev, prev[0].map(() => "")])
    } else {
      setNewNoteTableData(prev => [...prev, prev[0].map(() => "")])
    }
  }

  function addTableColumn(isEditing) {
    if (isEditing) {
      setEditNoteTableData(prev => prev.map(row => [...row, ""]))
    } else {
      setNewNoteTableData(prev => prev.map(row => [...row, ""]))
    }
  }

  function removeTableRow(isEditing, rowIndex) {
    const setter = isEditing ? setEditNoteTableData : setNewNoteTableData
    setter(prev => prev.length > 1 ? prev.filter((_, i) => i !== rowIndex) : prev)
  }

  function removeTableColumn(isEditing, colIndex) {
    const setter = isEditing ? setEditNoteTableData : setNewNoteTableData
    setter(prev => prev[0].length > 1 ? prev.map(row => row.filter((_, i) => i !== colIndex)) : prev)
  }

  function createNewNote() {
    const hasTitle = newNoteTitle.trim() !== ""
    const hasText = newNoteText.trim() !== ""
    
    if (!hasTitle && !hasText && newNoteType === "regular" && newNoteImages.length === 0) {
      alert("Заполните хотя бы одно поле: название, текст или добавьте картинку")
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
        images: newNoteImages,
        priority: newNotePriority,
        color: newNoteColor,
        tags: newNoteTags,
        isPinned: false,
        parentFolderId: currentFolderId,
        createdAt: new Date().toISOString()
      }
    } else if (newNoteType === "todo") {
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
        images: newNoteImages,
        priority: newNotePriority,
        color: newNoteColor,
        tags: newNoteTags,
        isPinned: false,
        parentFolderId: currentFolderId,
        createdAt: new Date().toISOString()
      }
    } else {
      createdNote = {
        id: Date.now(),
        type: "table",
        title: finalTitle,
        tableData: newNoteTableData,
        images: newNoteImages,
        priority: newNotePriority,
        color: newNoteColor,
        tags: newNoteTags,
        isPinned: false,
        parentFolderId: currentFolderId,
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
    setNewNoteImages([])
    setNewNoteTableData([["", ""], ["", ""]])
  }

  function deleteNoteById(noteId) {
    setShowDeleteConfirm(noteId)
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
      let editedText = note.text
      if (editedText === "Текст заметки") {
        editedText = ""
      }
      setEditNoteText(editedText)
      setEditNoteTableData([["", ""], ["", ""]])
    } else if (note.type === "todo") {
      setEditNoteType("todo")
      setEditNoteTodoItems(note.todoItems.map(item => ({ ...item, id: Date.now() + Math.random() })))
      setEditNoteTableData([["", ""], ["", ""]])
    } else {
      setEditNoteType("table")
      setEditNoteTodoItems([])
      setEditNoteTableData(note.tableData ? note.tableData.map(row => [...row]) : [["", ""], ["", ""]])
    }
    setEditNoteImages(note.images || [])
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
    
    if (!hasTitle && !hasText && editNoteType === "regular" && editNoteImages.length === 0) {
      alert("Заполните хотя бы одно поле: название, текст или добавьте картинку")
      return
    }
    
    let finalTitle = editNoteTitle.trim()
    if (finalTitle === "") {
      finalTitle = "Название"
    } else {
      finalTitle = finalTitle.replace(/\s+/g, ' ')
    }

    let bailedOut = false

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
              images: editNoteImages,
              priority: editNotePriority,
              color: editNoteColor,
              tags: editNoteTags
            }
          } else if (editNoteType === "todo") {
            const validTodoItems = editNoteTodoItems.filter(item => item.text.trim() !== "")
            if (validTodoItems.length === 0 && !hasTitle) {
              alert("Добавьте хотя бы один пункт в список или укажите название")
              bailedOut = true
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
              images: editNoteImages,
              priority: editNotePriority,
              color: editNoteColor,
              tags: editNoteTags
            }
          } else {
            return {
              ...note,
              type: "table",
              title: finalTitle,
              tableData: editNoteTableData,
              images: editNoteImages,
              priority: editNotePriority,
              color: editNoteColor,
              tags: editNoteTags
            }
          }
        }
        return note
      })
    )

    if (bailedOut) return

    if (openedNote?.id === editingNoteId) {
      setOpenedNote(prev => ({
        ...prev,
        title: finalTitle,
        type: editNoteType,
        ...(editNoteType === "regular"
          ? { text: editNoteText.trim() === "" ? "" : editNoteText }
          : editNoteType === "todo"
            ? { todoItems: editNoteTodoItems.filter(item => item.text.trim() !== "") }
            : { tableData: editNoteTableData }),
        images: editNoteImages,
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
    setEditNoteImages([])
    setEditNoteTableData([["", ""], ["", ""]])
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

  function deleteTagEverywhere(tagToDelete) {
    setAllNotes(prevNotes =>
      prevNotes.map(note =>
        note.tags ? { ...note, tags: note.tags.filter(tag => tag !== tagToDelete) } : note
      )
    )
    setArchiveNotes(prevNotes =>
      prevNotes.map(note =>
        note.tags ? { ...note, tags: note.tags.filter(tag => tag !== tagToDelete) } : note
      )
    )
    if (tagSearchText.trim().toLowerCase() === tagToDelete.toLowerCase()) {
      setTagSearchText("")
    }
  }

  function getAllExistingTags() {
    const allTags = new Set()
    allNotes.forEach(note => {
      if (note.type !== "folder" && note.tags) {
        note.tags.forEach(tag => allTags.add(tag))
      }
    })
    return Array.from(allTags)
  }

  function getFilteredAndSortedNotes() {
    let currentItems = getCurrentItems()
    let notes = currentItems.filter(item => item.type !== "folder")
    
    if (filterByNoteType !== "all") {
      notes = notes.filter(note => note.type === filterByNoteType)
    }
    
    if (tagSearchText.trim()) {
      const searchTags = tagSearchText.toLowerCase().split(',').map(tag => tag.trim()).filter(tag => tag)
      notes = notes.filter(note => {
        if (!note.tags || note.tags.length === 0) return false
        return searchTags.some(searchTag => 
          note.tags.some(noteTag => noteTag.toLowerCase().includes(searchTag))
        )
      })
    }

    const pinnedNotes = notes.filter(note => note.isPinned)
    const unpinnedNotes = notes.filter(note => !note.isPinned)

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

  function renderNotePreviewContent(note) {
    if (note.type === "regular") {
      return note.text ? note.text.slice(0, 100) : ""
    } else if (note.type === "todo") {
      return `${note.todoItems.filter(item => item.completed).length}/${note.todoItems.length} выполнено`
    } else if (note.type === "table") {
      const rows = note.tableData ? note.tableData.length : 0
      const cols = note.tableData && note.tableData[0] ? note.tableData[0].length : 0
      return `📊 Таблица ${rows}×${cols}`
    }
    return ""
  }

  const currentItems = getCurrentItems()
  const folders = currentItems.filter(item => item.type === "folder")
  const notes = getFilteredAndSortedNotes()
  const allExistingTags = getAllExistingTags()
  const allFolders = getAllFoldersList()
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode])

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
          + Создать заметку
        </button>

        <button 
          style={{...styles.createNoteButton, backgroundColor: "#6b7280"}}
          onClick={() => {
            setIsCreatingNewFolder(true)
            setNewFolderName("")
          }}
        >
          📁 Создать папку
        </button>

        <button 
          style={{...styles.createNoteButton, backgroundColor: "#8b5cf6", marginTop: "0"}}
          onClick={() => setShowArchive(!showArchive)}
        >
          📦 Архив ({archiveNotes.length})
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
          <button
            onClick={() => setFilterByNoteType("table")}
            style={{
              ...styles.filterButton,
              ...(filterByNoteType === "table" && styles.activeFilterButton)
            }}
          >
            📊 Таблицы
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
              {allExistingTags.map(tag => (
                <span key={tag} style={styles.quickTagChip}>
                  <button
                    onClick={() => setTagSearchText(tag)}
                    style={styles.quickTagButton}
                    title="Найти заметки с этим тегом"
                  >
                    #{tag}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`Удалить тег "#${tag}" со всех заметок?`)) {
                        deleteTagEverywhere(tag)
                      }
                    }}
                    style={styles.quickTagDeleteButton}
                    title="Удалить тег отовсюду"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.mainContent}>
        {showArchive ? (
          <>
            <div style={styles.breadcrumbs}>
              <button onClick={() => setShowArchive(false)} style={styles.breadcrumbButton}>← Назад</button>
              <span style={{marginLeft: "10px"}}>📦 Архив ({archiveNotes.length})</span>
            </div>
            {archiveNotes.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>📦</div>
                <div style={styles.emptyStateText}>Архив пуст</div>
              </div>
            ) : (
              <div style={styles.notesGrid}>
                {archiveNotes.map(note => (
                  <div
                    key={note.id}
                    style={{
                      ...styles.noteCard,
                      backgroundColor: note.color || "#f5f5f0",
                      opacity: 0.8
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.cardStars}>{renderPriorityStars(note.priority || 3)}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          restoreFromArchive(note.id)
                        }}
                        style={styles.restoreButton}
                        title="Восстановить"
                      >
                        ↩️
                      </button>
                    </div>
                    <div onClick={() => setOpenedNote(note)}>
                      <h3 style={styles.cardTitle} title={note.title}>{note.title}</h3>
                      <div style={styles.cardPreview}>
                        {renderNotePreviewContent(note)}
                      </div>
                      {note.images && note.images.length > 0 && (
                        <div style={styles.cardImageBadge}>🖼️ {note.images.length}</div>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div style={styles.cardTags}>
                          {note.tags.slice(0, 3).map(tag => (
                            <span key={tag} style={styles.cardTag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div style={styles.cardDate}>
                        В архиве: {new Date(note.archivedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={styles.breadcrumbs}>
              <button onClick={() => navigateToFolder(-1)} style={styles.breadcrumbButton}>📁 Главная</button>
              {folderPath.map((folder, index) => (
                <span key={folder.id}>
                  <span style={styles.breadcrumbSeparator}> / </span>
                  <button onClick={() => navigateToFolder(index)} style={styles.breadcrumbButton}>{folder.name}</button>
                </span>
              ))}
            </div>

            {folders.length > 0 && (
              <>
                <div style={styles.divider}>📁 Папки</div>
                <div style={styles.foldersList}>
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      style={styles.folderRow}
                      onClick={() => openFolder(folder.id)}
                    >
                      <span style={styles.folderRowIcon}>📁</span>
                      <div style={styles.folderRowContent}>
                        <div style={styles.folderRowTitle}>{folder.title}</div>
                        <div style={styles.folderRowMeta}>
                          {new Date(folder.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.folderRowActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMovingNoteId(folder.id)
                          }}
                          style={styles.folderMoveButton}
                          title="Переместить"
                        >
                          📂
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFolder(folder.id)
                          }}
                          style={styles.folderDeleteButton}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                      <span style={styles.folderRowArrow}>→</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {notes.length > 0 && folders.length > 0 && (
              <div style={styles.divider}>📝 Заметки</div>
            )}

            <div style={styles.notesGridContainer}>
              <div style={styles.notesGrid}>
                {notes.map(note => (
                  <div
                    key={note.id}
                    style={{
                      ...styles.noteCard,
                      backgroundColor: note.color || "#f5f5f0",
                      ...(note.type === "todo" && isAllTodoItemsCompleted(note.todoItems) && styles.completedNoteCard)
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.cardStars}>{renderPriorityStars(note.priority || 3)}</div>
                      <div style={styles.cardActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMovingNoteId(note.id)
                          }}
                          style={styles.moveButton}
                          title="Переместить"
                        >
                          📂
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleNotePinned(note.id)
                          }}
                          style={styles.cardPinButton}
                        >
                          {note.isPinned ? "📌" : "📍"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNoteById(note.id)
                          }}
                          style={styles.deleteItemButton}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div onClick={() => setOpenedNote(note)}>
                      <h3 style={styles.cardTitle} title={note.title}>{note.title}</h3>
                      <div style={styles.cardPreview}>
                        {renderNotePreviewContent(note)}
                      </div>
                      {note.images && note.images.length > 0 && (
                        <div style={styles.cardImageBadge}>🖼️ {note.images.length}</div>
                      )}
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
                  </div>
                ))}
              </div>
              {folders.length === 0 && notes.length === 0 && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyStateIcon}>📁</div>
                  <div style={styles.emptyStateText}>
                    Пустая папка<br />Создайте заметку или папку
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div style={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h2>Что сделать с заметкой?</h2>
                <button onClick={() => setShowDeleteConfirm(null)} style={styles.closeButton}>×</button>
              </div>
              <div style={{...styles.modalBody, display: "flex", gap: "12px", justifyContent: "center"}}>
                <button onClick={() => moveToArchive(showDeleteConfirm)} style={{...styles.saveButton, backgroundColor: "#8b5cf6"}}>
                  📦 В архив
                </button>
                <button onClick={() => {
                  setAllNotes(prev => prev.filter(n => n.id !== showDeleteConfirm))
                  if (openedNote?.id === showDeleteConfirm) setOpenedNote(null)
                  setShowDeleteConfirm(null)
                }} style={{...styles.deleteModalButton}}>
                  🗑️ Удалить навсегда
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {movingNoteId && (
        <div style={styles.modalOverlay} onClick={() => setMovingNoteId(null)}>
          <div style={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h2>Переместить</h2>
                <button onClick={() => setMovingNoteId(null)} style={styles.closeButton}>×</button>
              </div>
              <div style={styles.modalBody}>
                <button onClick={() => moveNoteToFolder(movingNoteId, null)} style={styles.folderSelectButton}>📁 Главная</button>
                {allFolders.filter(f => f.id !== movingNoteId).map(folder => (
                  <button key={folder.id} onClick={() => moveNoteToFolder(movingNoteId, folder.id)} style={styles.folderSelectButton}>
                    {folder.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatingNewFolder && (
        <div style={styles.modalOverlay} onClick={() => setIsCreatingNewFolder(false)}>
          <div style={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h2>Создание папки</h2>
                <button onClick={() => setIsCreatingNewFolder(false)} style={styles.closeButton}>×</button>
              </div>
              <div style={styles.modalBody}>
                <input
                  type="text"
                  placeholder="Название папки"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  style={styles.modalInput}
                  autoFocus
                />
              </div>
              <div style={styles.modalFooter}>
                <button onClick={createFolder} style={styles.saveButton}>📁 Создать</button>
                <button onClick={() => setIsCreatingNewFolder(false)} style={styles.cancelButton}>❌ Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(openedNote || isCreatingNewNote) && (
        <div style={styles.modalOverlay} onClick={() => {
          setOpenedNote(null)
          setIsCreatingNewNote(false)
          setEditingNoteId(null)
        }}>
          <div style={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            {isCreatingNewNote ? (
              <div style={{...styles.modalContent, backgroundColor: newNoteColor}}>
                <div style={{...styles.modalHeader, ...getToolbarColors(newNoteColor)}}>
                  <h2>Создание заметки</h2>
                  <button onClick={() => setIsCreatingNewNote(false)} style={{...styles.closeButton, color: getToolbarColors(newNoteColor).color}}>×</button>
                </div>
                
                <div style={styles.modalBody}>
                  <input
                    type="text"
                    placeholder="Название (необязательно, если есть текст)"
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
                      <label style={styles.customColorSwatch} title="Выбрать любой цвет">
                        <input type="color" value={newNoteColor} onChange={(e) => setNewNoteColor(e.target.value)} style={styles.customColorInput} />
                        🎨
                      </label>
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
                      <button onClick={() => setNewNoteType("table")} style={{...styles.typeButton, ...(newNoteType === "table" && styles.activeTypeButton)}}>📊 Таблица</button>
                    </div>
                  </div>
                  
                  {newNoteType === "regular" ? (
                    <textarea placeholder="Текст (необязательно, если есть название)" value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} style={styles.modalTextarea} />
                  ) : newNoteType === "todo" ? (
                    <div>
                      {newNoteTodoItems.map((item, index) => (
                        <input key={item.id} type="text" placeholder={`Пункт ${index + 1}`} value={item.text} onChange={(e) => updateNewNoteTodoItem(item.id, e.target.value)} style={styles.todoInput} />
                      ))}
                      <button onClick={addTodoItemToNewNote} style={styles.addTodoButton}>+ Добавить пункт</button>
                    </div>
                  ) : (
                    <div>
                      <div style={styles.tableEditWrapper}>
                        {newNoteTableData.map((row, rIdx) => (
                          <div key={rIdx} style={styles.tableEditRow}>
                            {row.map((cell, cIdx) => (
                              <input
                                key={cIdx}
                                type="text"
                                value={cell}
                                onChange={(e) => updateTableCell(false, rIdx, cIdx, e.target.value)}
                                style={styles.tableEditCell}
                                placeholder={rIdx === 0 ? `Кол. ${cIdx + 1}` : ""}
                              />
                            ))}
                            <button onClick={() => removeTableRow(false, rIdx)} style={styles.tableRemoveButton} title="Удалить строку">×</button>
                          </div>
                        ))}
                        <div style={styles.tableEditRow}>
                          {newNoteTableData[0].map((_, cIdx) => (
                            <button key={cIdx} onClick={() => removeTableColumn(false, cIdx)} style={styles.tableColRemoveButton} title="Удалить столбец">🗑</button>
                          ))}
                        </div>
                      </div>
                      <div style={styles.tableButtonsRow}>
                        <button onClick={() => addTableRow(false)} style={styles.addTodoButton}>+ Строка</button>
                        <button onClick={() => addTableColumn(false)} style={styles.addTodoButton}>+ Столбец</button>
                      </div>
                    </div>
                  )}

                  <div style={styles.formField}>
                    <label>Картинки</label>
                    <div style={styles.imagesGrid}>
                      {newNoteImages.map((img, idx) => (
                        <div key={idx} style={styles.imageThumbWrapper}>
                          <img src={img} alt="" style={styles.imageThumb} />
                          <button onClick={() => removeNewNoteImage(idx)} style={styles.imageRemoveButton}>×</button>
                        </div>
                      ))}
                      <button onClick={() => newNoteFileInputRef.current?.click()} style={styles.imageAddButton}>+ 🖼️</button>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={newNoteFileInputRef}
                        onChange={(e) => { handleImageFilesSelected(e.target.files, false); e.target.value = "" }}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{...styles.modalFooter, ...getToolbarColors(newNoteColor)}}>
                  <button onClick={createNewNote} style={styles.saveButton}>💾 Сохранить</button>
                  <button onClick={() => setIsCreatingNewNote(false)} style={styles.cancelButton}>❌ Отмена</button>
                </div>
              </div>
            ) : openedNote && editingNoteId === openedNote.id ? (
              <div style={{...styles.modalContent, backgroundColor: editNoteColor}}>
                <div style={{...styles.modalHeader, ...getToolbarColors(editNoteColor)}}>
                  <h2>Редактирование</h2>
                  <button onClick={() => setEditingNoteId(null)} style={{...styles.closeButton, color: getToolbarColors(editNoteColor).color}}>×</button>
                </div>
                
                <div style={styles.modalBody}>
                  <input type="text" value={editNoteTitle} onChange={(e) => setEditNoteTitle(e.target.value)} style={styles.modalInput} maxLength={100} placeholder="Название (необязательно, если есть текст)" />
                  
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
                      <label style={styles.customColorSwatch} title="Выбрать любой цвет">
                        <input type="color" value={editNoteColor} onChange={(e) => setEditNoteColor(e.target.value)} style={styles.customColorInput} />
                        🎨
                      </label>
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
                      <button onClick={() => setEditNoteType("table")} style={{...styles.typeButton, ...(editNoteType === "table" && styles.activeTypeButton)}}>📊 Таблица</button>
                    </div>
                  </div>
                  
                  {editNoteType === "regular" ? (
                    <textarea value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} style={styles.modalTextarea} placeholder="Текст (необязательно, если есть название)" />
                  ) : editNoteType === "todo" ? (
                    <div>
                      {editNoteTodoItems.map((item, index) => (
                        <input key={item.id} type="text" placeholder={`Пункт ${index + 1}`} value={item.text} onChange={(e) => updateEditingNoteTodoItem(item.id, e.target.value)} style={styles.todoInput} />
                      ))}
                      <button onClick={addTodoItemToEditingNote} style={styles.addTodoButton}>+ Добавить пункт</button>
                    </div>
                  ) : (
                    <div>
                      <div style={styles.tableEditWrapper}>
                        {editNoteTableData.map((row, rIdx) => (
                          <div key={rIdx} style={styles.tableEditRow}>
                            {row.map((cell, cIdx) => (
                              <input
                                key={cIdx}
                                type="text"
                                value={cell}
                                onChange={(e) => updateTableCell(true, rIdx, cIdx, e.target.value)}
                                style={styles.tableEditCell}
                                placeholder={rIdx === 0 ? `Кол. ${cIdx + 1}` : ""}
                              />
                            ))}
                            <button onClick={() => removeTableRow(true, rIdx)} style={styles.tableRemoveButton} title="Удалить строку">×</button>
                          </div>
                        ))}
                        <div style={styles.tableEditRow}>
                          {editNoteTableData[0].map((_, cIdx) => (
                            <button key={cIdx} onClick={() => removeTableColumn(true, cIdx)} style={styles.tableColRemoveButton} title="Удалить столбец">🗑</button>
                          ))}
                        </div>
                      </div>
                      <div style={styles.tableButtonsRow}>
                        <button onClick={() => addTableRow(true)} style={styles.addTodoButton}>+ Строка</button>
                        <button onClick={() => addTableColumn(true)} style={styles.addTodoButton}>+ Столбец</button>
                      </div>
                    </div>
                  )}

                  <div style={styles.formField}>
                    <label>Картинки</label>
                    <div style={styles.imagesGrid}>
                      {editNoteImages.map((img, idx) => (
                        <div key={idx} style={styles.imageThumbWrapper}>
                          <img src={img} alt="" style={styles.imageThumb} />
                          <button onClick={() => removeEditNoteImage(idx)} style={styles.imageRemoveButton}>×</button>
                        </div>
                      ))}
                      <button onClick={() => editNoteFileInputRef.current?.click()} style={styles.imageAddButton}>+ 🖼️</button>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={editNoteFileInputRef}
                        onChange={(e) => { handleImageFilesSelected(e.target.files, true); e.target.value = "" }}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{...styles.modalFooter, ...getToolbarColors(editNoteColor)}}>
                  <button onClick={saveEditedNote} style={styles.saveButton}>💾 Сохранить</button>
                  <button onClick={cancelEditing} style={styles.cancelButton}>❌ Отмена</button>
                </div>
              </div>
            ) : openedNote && (
              <div style={{...styles.modalContent, backgroundColor: openedNote.color || "#f5f5f0"}}>
                <div style={{...styles.modalHeader, ...getToolbarColors(openedNote.color || "#f5f5f0")}}>
                  <div>
                    <div style={styles.modalStars}>{renderPriorityStars(openedNote.priority || 3)}</div>
                    <h2 style={{color: getToolbarColors(openedNote.color || "#f5f5f0").color}}>{openedNote.title}</h2>
                    {openedNote.tags && openedNote.tags.length > 0 && (
                      <div style={styles.modalTags}>
                        {openedNote.tags.map(tag => <span key={tag} style={styles.modalTag}>#{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <div>
                    <button onClick={() => startEditingNote(openedNote)} style={{...styles.editModalButton, color: getToolbarColors(openedNote.color || "#f5f5f0").color}}>✏️</button>
                    <button onClick={() => moveToArchive(openedNote.id)} style={{...styles.editModalButton, color: getToolbarColors(openedNote.color || "#f5f5f0").color, marginRight: "8px"}} title="В архив">📦</button>
                    <button onClick={() => setOpenedNote(null)} style={{...styles.closeButton, color: getToolbarColors(openedNote.color || "#f5f5f0").color}}>×</button>
                  </div>
                </div>
                <div style={styles.modalBody}>
                  {openedNote.type === "regular" ? (
                    <p style={styles.modalText}>{openedNote.text ? formatTextWithLineBreaks(openedNote.text) : ""}</p>
                  ) : openedNote.type === "todo" ? (
                    <div>
                      {openedNote.todoItems.map((item) => (
                        <label key={item.id} style={{...styles.modalTodoItem, ...(item.completed && styles.completedModalTodoItem)}}>
                          <input type="checkbox" checked={item.completed} onChange={() => toggleTodoItemInOpenedNote(item.id)} style={styles.modalCheckbox} />
                          <span style={item.completed ? styles.completedModalTodoText : styles.modalTodoText}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.tableViewWrapper}>
                      <table style={styles.tableView}>
                        <tbody>
                          {openedNote.tableData && openedNote.tableData.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                rIdx === 0
                                  ? <th key={cIdx} style={styles.tableViewHeaderCell}>{cell}</th>
                                  : <td key={cIdx} style={styles.tableViewCell}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {openedNote.images && openedNote.images.length > 0 && (
                    <div style={styles.viewImagesGrid}>
                      {openedNote.images.map((img, idx) => (
                        <img key={idx} src={img} alt="" style={styles.viewImage} />
                      ))}
                    </div>
                  )}
                  <div style={styles.modalDate}>Создано: {new Date(openedNote.createdAt).toLocaleString()}</div>
                </div>
                <div style={{...styles.modalFooter, ...getToolbarColors(openedNote.color || "#f5f5f0")}}>
                  <button onClick={() => toggleNotePinned(openedNote.id)} style={{...styles.pinModalButton, backgroundColor: openedNote.isPinned ? "#fbbf24" : "#8b5cf6"}}>
                    📌 {openedNote.isPinned ? "Открепить" : "Закрепить"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={styles.themeToggleWrapper}>
        {showThemeMenu && (
          <div style={styles.themeMenu}>
            <button style={{...styles.themeMenuItem, ...(theme === "light" && styles.themeMenuItemActive)}} onClick={() => { setTheme("light"); setShowThemeMenu(false) }}>☀️ Светлая</button>
            <button style={{...styles.themeMenuItem, ...(theme === "dark" && styles.themeMenuItemActive)}} onClick={() => { setTheme("dark"); setShowThemeMenu(false) }}>🌙 Тёмная</button>
            <button style={{...styles.themeMenuItem, ...(theme === "system" && styles.themeMenuItemActive)}} onClick={() => { setTheme("system"); setShowThemeMenu(false) }}>💻 Как в системе</button>
          </div>
        )}
        <button
          onClick={() => setShowThemeMenu(prev => !prev)}
          style={{...styles.themeToggleButton, ...getThemeButtonColors(isDarkMode)}}
          title="Сменить тему"
        >
          {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}
        </button>
      </div>
    </div>
  )
}

function getStyles(isDark) {
  const colors = isDark
    ? {
        appBg: "#0f0f1a",
        panelBg: "#15151f",
        panelBorder: "#2d2d3f",
        mainBg: "#0f0f1a",
        cardBg: "#1e1e2e",
        cardBorder: "#2d2d3f",
        cardShadow: "0 1px 3px rgba(0,0,0,0.4)",
        text: "#f0f0f5",
        textMuted: "#9ca3af",
        border: "#2d2d3f",
        inputBg: "#1e1e2e",
        inputBorder: "#3a3a4a",
        white: "#1a1a2e",
        overlayHeaderFooter: "rgba(20,20,30,0.55)",
        emptyText: "#7a7a8a"
      }
    : {
        appBg: "#f3f4f6",
        panelBg: "#1a1a2e",
        panelBorder: "#2d2d3f",
        mainBg: "#f3f4f6",
        cardBg: "#ffffff",
        cardBorder: "#e5e7eb",
        cardShadow: "0 1px 3px rgba(0,0,0,0.1)",
        text: "#111827",
        textMuted: "#6b7280",
        border: "#e5e7eb",
        inputBg: "#ffffff",
        inputBorder: "#e5e7eb",
        white: "#ffffff",
        overlayHeaderFooter: "rgba(255,255,255,0.5)",
        emptyText: "#a0a0b0"
      }

  return {
  appContainer: {
    display: "flex",
    height: "100vh",
    width: "100%",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: colors.appBg
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
    gap: "6px",
    maxHeight: "140px",
    overflowY: "auto",
    paddingRight: "2px"
  },

  quickTagButton: {
    padding: "4px 4px 4px 8px",
    backgroundColor: "transparent",
    color: "#8b5cf6",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "10px"
  },

  mainContent: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    backgroundColor: colors.mainBg
  },

  breadcrumbs: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "5px",
    marginBottom: "20px",
    padding: "10px 15px",
    backgroundColor: colors.cardBg,
    borderRadius: "10px",
    boxShadow: colors.cardShadow
  },

  breadcrumbButton: {
    background: "none",
    border: "none",
    color: "#8b5cf6",
    cursor: "pointer",
    fontSize: "14px",
    padding: "5px 10px",
    borderRadius: "6px"
  },

  breadcrumbSeparator: {
    color: colors.textMuted,
    fontSize: "14px"
  },

  foldersList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "24px"
  },

  folderRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: colors.cardBg,
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: colors.cardShadow,
    border: `1px solid ${colors.cardBorder}`
  },

  folderRowIcon: {
    fontSize: "24px"
  },

  folderRowContent: {
    flex: 1
  },

  folderRowTitle: {
    fontSize: "16px",
    fontWeight: "500",
    margin: 0,
    color: colors.text
  },

  folderRowMeta: {
    fontSize: "11px",
    color: colors.textMuted,
    marginTop: "4px"
  },

  folderRowActions: {
    display: "flex",
    gap: "8px"
  },

  folderMoveButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    color: "#6b7280"
  },

  folderDeleteButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    color: "#ef4444"
  },

  folderRowArrow: {
    fontSize: "18px",
    color: "#9ca3af"
  },

  divider: {
    margin: "16px 0 12px 0",
    fontSize: "13px",
    fontWeight: "500",
    color: colors.textMuted,
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: "8px"
  },

  notesGridContainer: {
    width: "100%"
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

  cardActions: {
    display: "flex",
    gap: "8px"
  },

  cardPinButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px"
  },

  moveButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px"
  },

  deleteItemButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px",
    color: "#ef4444"
  },

  restoreButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
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
    color: colors.emptyText,
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
    borderRadius: "16px",
    backgroundColor: colors.cardBg,
    color: colors.text
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.overlayHeaderFooter,
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
    color: colors.textMuted
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
    border: `2px solid ${colors.inputBorder}`,
    borderRadius: "8px",
    marginBottom: "16px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: colors.inputBg,
    color: colors.text
  },

  modalTextarea: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: `2px solid ${colors.inputBorder}`,
    borderRadius: "8px",
    minHeight: "200px",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: colors.inputBg,
    color: colors.text
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
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    backgroundColor: colors.overlayHeaderFooter,
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

  folderSelectButton: {
    width: "100%",
    padding: "10px",
    marginBottom: "8px",
    backgroundColor: isDark ? "#25253a" : "#f3f4f6",
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
    color: colors.text
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
  },

  customColorSwatch: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    border: "1px dashed #9ca3af",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)"
  },

  customColorInput: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
    border: "none",
    padding: 0
  },

  imagesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },

  imageThumbWrapper: {
    position: "relative",
    width: "70px",
    height: "70px"
  },

  imageThumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },

  imageRemoveButton: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
    lineHeight: "20px",
    padding: 0
  },

  imageAddButton: {
    width: "70px",
    height: "70px",
    borderRadius: "8px",
    border: "1px dashed #9ca3af",
    backgroundColor: "#f3f4f6",
    cursor: "pointer",
    fontSize: "13px",
    color: "#6b7280"
  },

  viewImagesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px"
  },

  viewImage: {
    width: "140px",
    height: "140px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "1px solid rgba(0,0,0,0.1)",
    cursor: "pointer"
  },

  tableEditWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "10px"
  },

  tableEditRow: {
    display: "flex",
    gap: "6px",
    alignItems: "center"
  },

  tableEditCell: {
    flex: 1,
    minWidth: 0,
    padding: "8px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none"
  },

  tableRemoveButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 6px",
    flexShrink: 0
  },

  tableColRemoveButton: {
    flex: 1,
    background: "none",
    border: "1px dashed #e5e7eb",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "11px",
    borderRadius: "4px",
    padding: "2px"
  },

  tableButtonsRow: {
    display: "flex",
    gap: "8px"
  },

  tableViewWrapper: {
    overflowX: "auto"
  },

  tableView: {
    borderCollapse: "collapse",
    width: "100%",
    fontSize: "13px"
  },

  tableViewHeaderCell: {
    border: "1px solid rgba(0,0,0,0.15)",
    padding: "8px 10px",
    backgroundColor: "rgba(0,0,0,0.06)",
    textAlign: "left",
    fontWeight: "600"
  },

  tableViewCell: {
    border: "1px solid rgba(0,0,0,0.15)",
    padding: "8px 10px",
    textAlign: "left"
  },

  cardImageBadge: {
    fontSize: "10px",
    color: colors.textMuted,
    marginBottom: "6px"
  },

  quickTagChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    backgroundColor: "#2a2a3a",
    borderRadius: "12px",
    paddingRight: "4px"
  },

  quickTagDeleteButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 4px",
    lineHeight: 1
  },

  themeToggleWrapper: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 2000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px"
  },

  themeToggleButton: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: "22px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)"
  },

  themeMenu: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: colors.cardBg,
    color: colors.text,
    borderRadius: "10px",
    padding: "6px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    border: `1px solid ${colors.cardBorder}`
  },

  themeMenuItem: {
    background: "none",
    border: "none",
    textAlign: "left",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: colors.text,
    whiteSpace: "nowrap"
  },

  themeMenuItemActive: {
    backgroundColor: "#8b5cf6",
    color: "white"
  }
  }
}

export default App