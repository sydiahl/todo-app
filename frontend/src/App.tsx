import { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    const { data } = await axios.get(`${API}/tasks`);
    setTasks(data);
  };

  useEffect(() => { fetchTasks(); }, []);

  const createTask = async () => {
    if (!title.trim()) return setError('Title is required');
    setError('');
    await axios.post(`${API}/tasks`, { title, description });
    setTitle(''); setDescription('');
    fetchTasks();
  };

  const toggleComplete = async (task: Task) => {
    await axios.put(`${API}/tasks/${task.id}`, { completed: !task.completed });
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    await axios.delete(`${API}/tasks/${id}`);
    fetchTasks();
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>📝 To-Do List</h1>
      <div>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Task title *" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
        <input value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)" style={{ width: '100%', padding: 8 }} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={createTask} style={{ marginTop: 8, padding: '8px 16px' }}>Add Task</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 24 }}>
        {tasks.map(task => (
          <li key={task.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 12, marginBottom: 8, border: '1px solid #ddd', borderRadius: 4,
            background: task.completed ? '#f0f9f0' : '#fff',
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? '#888' : '#000'
          }}>
            <span onClick={() => toggleComplete(task)} style={{ cursor: 'pointer', flex: 1 }}>
              {task.completed ? '✅' : '⬜'} {task.title}
            </span>
            <button onClick={() => deleteTask(task.id)}
              style={{ background: '#e74c3c', color: '#fff', border: 'none',
                       padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

