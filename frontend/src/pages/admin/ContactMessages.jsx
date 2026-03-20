import { useState, useEffect } from 'react'
import adminApi from '@/api/adminApi'
import { toast } from 'sonner'
import { Loader2, Mail, MailOpen, Trash2, Inbox } from 'lucide-react'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await adminApi.getContacts()
      setMessages(res.data.results || res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRead = async (id) => {
    try {
      const res = await adminApi.toggleContactRead(id)
      setMessages((prev) => prev.map((m) => (m.id === id ? res.data : m)))
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async () => {
    try {
      await adminApi.deleteContact(deleteId)
      setMessages((prev) => prev.filter((m) => m.id !== deleteId))
      toast.success('Message deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          <p className="text-muted-foreground text-sm">
            {messages.length} messages{unreadCount > 0 && ` (${unreadCount} unread)`}
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-20">
          <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No contact messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-card rounded-xl border p-5 transition-colors ${
                msg.is_read ? 'border-border' : 'border-primary/30 bg-primary/[0.02]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!msg.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <p className="font-semibold text-sm truncate">{msg.name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(msg.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{msg.email}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleRead(msg.id)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {msg.is_read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteId(msg.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this contact message?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
