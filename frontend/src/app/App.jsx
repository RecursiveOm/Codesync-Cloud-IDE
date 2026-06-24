import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

function App() {
  const editorRef = useRef(null)

  const params = new URLSearchParams(window.location.search)

  const [username, setUsername] = useState(() => {
    return params.get("username") || ""
  })

  const [room, setRoom] = useState(() => {
    return params.get("room") || ""
  })

  const [inputUsername, setInputUsername] = useState(username)
  const [inputRoom, setInputRoom] = useState(room)

  const [users, setUsers] = useState([])

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current])
    )
  }

  useEffect(() => {
    if (!username || !room) return

    const provider = new SocketIOProvider(
      "http://localhost:3000",
      room,
      ydoc,
      { autoConnect: true }
    )

    provider.awareness.setLocalStateField("user", {
      username
    })

    const updateUsers = () => {
      const states = Array.from(
        provider.awareness.getStates().values()
      )

      setUsers(
        states
          .filter(state => state.user && state.user.username)
          .map(state => state.user)
      )
    }

    updateUsers()

    provider.awareness.on(
      "change",
      updateUsers
    )

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField(
        "user",
        null
      )
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    )

    return () => {
      provider.disconnect()

      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      )
    }

  }, [username, room])



  const handleJoin = (e) => {
    e.preventDefault()

    if (!inputUsername.trim() || !inputRoom.trim()) {
      return
    }

    setUsername(inputUsername)
    setRoom(inputRoom)

    window.history.pushState(
      {},
      "",
      `?room=${inputRoom}&username=${inputUsername}`
    )
  }



  if (!username || !room) {
    return (
      <main className="h-screen w-full bg-[#1e1e1e] flex items-center justify-center">

        <form
          onSubmit={handleJoin}
          className="bg-[#252526] p-6 rounded-md flex flex-col gap-4"
        >

          <h1 className="text-gray-200 text-xl font-semibold">
            CodeSync
          </h1>

          <input
            placeholder="Room ID"
            value={inputRoom}
            onChange={(e) => setInputRoom(e.target.value)}
            className="bg-[#333333] text-gray-200 p-2 rounded outline-none"
          />

          <input
            placeholder="Username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            className="bg-[#333333] text-gray-200 p-2 rounded outline-none"
          />

          <button className="bg-gray-200 text-black p-2 rounded">
            Join Room
          </button>

        </form>

      </main>
    )
  }



  return (
    <main className="h-screen w-full bg-[#1e1e1e] flex gap-2 p-2">

      <aside className="h-full w-48 bg-[#252526] rounded-md p-3">

        <h2 className="text-sm text-gray-300 font-semibold mb-2">
          CodeSync
        </h2>

        <p className="text-xs text-gray-500 mb-4">
          Room: {room}
        </p>


        <p className="text-xs text-gray-400 mb-3">
          Developers ({users.length})
        </p>


        <ul className="space-y-2">

          {users.map((user, index) => (

            <li
              key={index}
              className="flex items-center gap-2 text-sm text-gray-300"
            >

              <span className="h-2 w-2 bg-green-500 rounded-full"></span>

              {
                user.username === username
                  ? "You"
                  : user.username
              }

            </li>

          ))}

        </ul>

      </aside>


      <section className="flex-1 bg-[#252526] rounded-md overflow-hidden">

        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// start coding..."
          theme="vs-dark"
          onMount={handleMount}
        />

      </section>

    </main>
  )
}

export default App