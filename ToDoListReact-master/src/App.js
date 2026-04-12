import React, { useEffect, useState } from 'react';
import service from './service.js';
import Swal from 'sweetalert2';
import './App.css'; // הקישור לקובץ ה-CSS החיצוני

function App() {
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [user, setUser] = useState(!!localStorage.getItem("token"));
  const [authData, setAuthData] = useState({ username: "", password: "", isLogin: true });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  async function loadData() {
    if (!user) return;
    try {
        const [tasksList, categoriesList] = await Promise.all([
            service.getTasks(),
            service.getCategories()
        ]);
        setTodos(tasksList);
        setCategories(categoriesList);
    } catch (e) { console.error("Failed to fetch data", e); }
  }

  useEffect(() => { loadData(); }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        if (authData.isLogin) {
            await service.login(authData.username, authData.password);
            setUser(true);
            Swal.fire({ icon: 'success', title: 'ברוכים הבאים!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        } else {
            await service.register(authData.username, authData.password);
            Swal.fire({ icon: 'success', title: 'נרשמת בהצלחה!', text: 'עכשיו אפשר להתחבר' });
            setAuthData({ ...authData, isLogin: true });
        }
    } catch (err) { Swal.fire({ icon: 'error', title: 'שגיאה', text: 'פרטים לא נכונים' }); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if(!newTodo) return;
    try {
        const addedTask = await service.addTask(newTodo, selectedCategory);
        setTodos([...todos, addedTask]);
        setNewTodo("");
    } catch (e) { Swal.fire({ icon: 'error', text: 'ההוספה נכשלה' }); }
  };

  const handleDeleteTask = async (id) => {
    const original = [...todos];
    setTodos(todos.filter(t => t.id !== id));
    try { await service.deleteTask(id); } catch (e) {
        setTodos(original);
        Swal.fire({ icon: 'error', text: 'המחיקה נכשלה' });
    }
  };

  const handleToggleComplete = async (todo, isComplete) => {
    const original = [...todos];
    setTodos(todos.map(t => t.id === todo.id ? {...t, isComplete} : t));
    try { await service.setCompleted(todo.id, isComplete, todo.name); } catch (e) { setTodos(original); }
  };

  const handleAddCategory = async () => {
    if(!newCategoryName) return;
    try {
        const newCat = await service.addCategory(newCategoryName);
        setCategories([...categories, newCat]);
        setNewCategoryName("");
    } catch (e) { Swal.fire({ icon: 'error', text: 'נכשל' }); }
  };

  if (!user) {
    return (
      <div className="authContainer">
        <div className="authCard">
          <h2>{authData.isLogin ? "ברוכים הבאים" : "יצירת חשבון"}</h2>
          <form onSubmit={handleAuth} className="authForm">
            <input className="authInput" placeholder="שם משתמש" onChange={e => setAuthData({...authData, username: e.target.value})} />
            <input className="authInput" type="password" placeholder="סיסמה" onChange={e => setAuthData({...authData, password: e.target.value})} />
            <button className="authButton">{authData.isLogin ? "כניסה" : "הרשמה"}</button>
          </form>
          <p className="authToggle" onClick={() => setAuthData({...authData, isLogin: !authData.isLogin})}>
            {authData.isLogin ? "עוד לא רשום? צור חשבון" : "כבר רשום? התחבר כאן"}
          </p>
        </div>
      </div>
    );
  }

  const filteredTodos = selectedCategory ? todos.filter(t => t.categoryId === selectedCategory) : todos;

  return (
    <div className="appLayout">
      <aside className="sidebar">
        <div style={{ flex: 1, overflowY: 'auto' }}>
            <h2 className="sidebarTitle">נושאים</h2>
            <ul className="categoryList">
                <li 
                    className="categoryItem"
                    style={{ backgroundColor: selectedCategory === null ? '#D6CCC2' : 'transparent' }}
                    onClick={() => setSelectedCategory(null)}
                >📂 כל המשימות</li>
                {categories.map(cat => (
                    <li 
                        key={cat.id} 
                        className="categoryItem"
                        style={{ backgroundColor: selectedCategory === cat.id ? '#D6CCC2' : 'transparent' }}
                        onClick={() => setSelectedCategory(cat.id)}
                    >🏷️ {cat.name}</li>
                ))}
            </ul>
        </div>
        <div className="sidebarFooter">
            <div className="addCategoryWrapper">
                <input className="smallInput" placeholder="נושא חדש..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                <button className="addBtn" onClick={handleAddCategory}>+</button>
            </div>
            <button onClick={() => { service.logout(); setUser(false); }} className="logoutBtn">התנתק</button>
        </div>
      </aside>

      <main className="mainContent">
        <div className="contentWrapper">
            <header className="mainHeader"><h1 className="mainTitle">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "כל המשימות"}</h1></header>
            <form className="addTodoForm" onSubmit={handleAddTask}>
                <input className="mainInput" placeholder="הוסף משימה..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
            </form>
            <div className="todoContainer">
                {filteredTodos.map(todo => (
                    <div key={todo.id} className="todoCard">
                        <button className="deleteBtn" onClick={() => handleDeleteTask(todo.id)}>❎</button>
                        <span className="todoText" style={{ textDecoration: todo.isComplete ? 'line-through' : 'none', opacity: todo.isComplete ? 0.6 : 1 }}>{todo.name}</span>
                        <input type="checkbox" checked={todo.isComplete || false} className="checkbox" onChange={(e) => handleToggleComplete(todo, e.target.checked)} />
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
