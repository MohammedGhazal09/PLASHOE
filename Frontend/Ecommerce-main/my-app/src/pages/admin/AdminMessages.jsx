import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getContactMessages({ limit: 50 });
      setMessages(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load this admin data. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const markRead = async (message) => {
    setError('');
    setNotice('');
    try {
      await adminApi.markContactMessageRead(message._id);
      setNotice('Message marked as read');
      await loadMessages();
    } catch (err) {
      setError(getErrorMessage(err, 'Message update failed.'));
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm(`Delete: message from ${message.email} cannot be undone. Continue?`)) return;
    setError('');
    setNotice('');
    try {
      await adminApi.deleteContactMessage(message._id);
      setNotice('Message deleted');
      await loadMessages();
    } catch (err) {
      setError(getErrorMessage(err, 'Message delete failed.'));
    }
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Customer support</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Messages</h2>
      </header>

      {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      {loading ? (
        <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">Loading messages...</p>
      ) : messages.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No contact messages found</h3>
          <p className="mt-2 text-sm text-gray-600">New customer messages will appear here.</p>
        </section>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <article key={message._id} className="border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark">{message.name} - {message.email}</p>
                  <p className="mt-1 text-sm text-gray-700">{message.subject || 'No subject'}</p>
                  <p className="mt-2 text-sm text-gray-600">{message.message}</p>
                  <p className="mt-2 text-xs font-semibold uppercase text-gray-500">{message.isRead ? 'read' : 'unread'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!message.isRead && (
                    <button type="button" onClick={() => markRead(message)} className="button-control button-control--secondary button-control--compact">
                      Mark as read
                    </button>
                  )}
                  <button type="button" onClick={() => deleteMessage(message)} className="button-control button-control--danger button-control--compact">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
