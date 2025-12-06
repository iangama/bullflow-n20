import { useEffect, useState } from 'react'

const API_BASE = '/api'

function createEmptyPayload() {
  return {
    foo: 'bar',
    intensity: 3
  }
}

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [type, setType] = useState('demo-task')
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(createEmptyPayload(), null, 2)
  )
  const [error, setError] = useState(null)

  async function fetchTasks() {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/tasks`)
      if (!res.ok) throw new Error('Falha ao carregar tasks')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    const id = setInterval(fetchTasks, 3000)
    return () => clearInterval(id)
  }, [])

  async function handleCreateTask(e) {
    e.preventDefault()
    setError(null)

    let parsedPayload = {}
    if (payloadText.trim()) {
      try {
        parsedPayload = JSON.parse(payloadText)
      } catch (err) {
        setError('Payload precisa ser um JSON válido')
        return
      }
    }

    try {
      setCreating(true)
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, payload: parsedPayload })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao criar task')
      }
      await fetchTasks()
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">BullFlow Nível 20</h1>
          <p className="text-sm text-slate-400">
            Filas com BullMQ + Redis + Worker paralelo atualizando Postgres
          </p>
        </div>
        <span className="text-xs text-slate-500">
          Traefik SAFE · Porta 8880
        </span>
      </header>

      <main className="flex-1 px-6 py-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(0,1.4fr)]">
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
            Criar nova task
          </h2>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleCreateTask}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">
                Tipo da task
              </label>
              <input
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-400/70"
                value={type}
                onChange={e => setType(e.target.value)}
                placeholder="ex: email, relatório, processamento..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300 flex justify-between">
                <span>Payload (JSON)</span>
                <button
                  type="button"
                  className="text-[11px] text-emerald-300 hover:text-emerald-200"
                  onClick={() =>
                    setPayloadText(JSON.stringify(createEmptyPayload(), null, 2))
                  }
                >
                  Preencher exemplo
                </button>
              </label>
              <textarea
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono h-48 resize-none outline-none focus:ring-1 focus:ring-emerald-400/70"
                value={payloadText}
                onChange={e => setPayloadText(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Enfileirando...' : 'Criar task'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 mt-1">
            Cada task entra na fila no estado <span className="text-emerald-300">queued</span>,
            o worker paralelo consome do Redis e atualiza o banco até{' '}
            <span className="text-emerald-300">completed</span> ou{' '}
            <span className="text-red-300">failed</span>.
          </p>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
              Últimas tasks
            </h2>
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="text-[11px] px-3 py-1 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 disabled:opacity-60"
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Progresso</th>
                  <th className="px-3 py-2 text-left">Criada</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      Nenhuma task criada ainda.
                    </td>
                  </tr>
                )}

                {tasks.map(task => (
                  <tr
                    key={task.id}
                    className="border-t border-slate-800/70 hover:bg-slate-900/60"
                  >
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-400 max-w-[120px] truncate">
                      {task.id}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {task.type}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ' +
                          (task.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : task.status === 'failed'
                            ? 'bg-red-500/15 text-red-300'
                            : task.status === 'processing'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-slate-700/60 text-slate-200')
                        }
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 w-32">
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 ml-1">
                        {task.progress || 0}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-slate-400 whitespace-nowrap">
                      {task.created_at
                        ? new Date(task.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500">
            A atualização é feita automaticamente a cada 3 segundos. Você pode observar
            múltiplas tasks sendo processadas em paralelo (worker com{' '}
            <span className="text-emerald-300">concurrency</span> configurável).
          </p>
        </section>
      </main>
    </div>
  )
}

export default App
