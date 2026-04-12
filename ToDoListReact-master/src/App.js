import React, { useEffect, useState } from 'react';
import service from './service.js';
import Swal from 'sweetalert2';

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
    } catch (e) { console.error(e); }
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
    } catch (err) { 
        Swal.fire({ icon: 'error', title: 'שגיאה', text: 'בדקי את שם המשתמש והסיסמה' });
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if(!newTodo) return;
    try {
        const addedTask = await service.addTask(newTodo, selectedCategory);
        setTodos([...todos, addedTask]); // מהירות שיא: עדכון מיידי
        setNewTodo("");
    } catch (e) { Swal.fire({ icon: 'error', text: 'ההוספה נכשלה' }); }
  };

  const handleDeleteTask = async (id) => {
    const original = [...todos];
    setTodos(todos.filter(t => t.id !== id)); // מחיקה מיידית מהמסך
    try {
        await service.deleteTask(id);
    } catch (e) {
        setTodos(original);
        Swal.fire({ icon: 'error', text: 'המחיקה נכשלה' });
    }
  };

  const handleToggleComplete = async (todo, isComplete) => {
    const original = [...todos];
    setTodos(todos.map(t => t.id === todo.id ? {...t, isComplete} : t)); // עדכון מיידי
    try {
        await service.setCompleted(todo.id, isComplete, todo.name);
    } catch (e) { setTodos(original); }
  };

  const handleAddCategory = async () => {
    if(!newCategoryName) return;
    try {
        const newCat = await service.addCategory(newCategoryName);
        setCategories([...categories, newCat]);
        setNewCategoryName("");
    } catch (e) { Swal.fire({ icon: 'error', text: 'הוספת נושא נכשלה' }); }
  };

  if (!user) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h2 style={{ color: '#5D4F43', marginBottom: '25px' }}>{authData.isLogin ? "ברוכים הבאים" : "יצירת חשבון"}</h2>
          <form onSubmit={handleAuth} style={styles.form}>
            <input style={styles.input} placeholder="שם משתמש" onChange={e => setAuthData({...authData, username: e.target.value})} />
            <input style={styles.input} type="password" placeholder="סיסמה" onChange={e => setAuthData({...authData, password: e.target.value})} />
            <button style={styles.button}>{authData.isLogin ? "כניסה" : "הרשמה"}</button>
          </form>
          <p style={styles.toggle} onClick={() => setAuthData({...authData, isLogin: !authData.isLogin})}>
            {authData.isLogin ? "עוד לא רשום? צור חשבון" : "כבר רשום? התחבר כאן"}
          </p>
        </div>
      </div>
    );
  }

  const filteredTodos = selectedCategory ? todos.filter(t => t.categoryId === selectedCategory) : todos;

  return (
    <div style={styles.appLayout}>
      <aside style={styles.sidebar}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
            <h2 style={styles.sidebarTitle}>נושאים</h2>
            <ul style={styles.categoryList}>
                <li style={{...styles.categoryItem, backgroundColor: selectedCategory === null ? '#D6CCC2' : 'transparent'}} onClick={() => setSelectedCategory(null)}>📂 כל המשימות</li>
                {categories.map(cat => (
                    <li key={cat.id} style={{...styles.categoryItem, backgroundColor: selectedCategory === cat.id ? '#D6CCC2' : 'transparent'}} onClick={() => setSelectedCategory(cat.id)}>🏷️ {cat.name}</li>
                ))}
            </ul>
        </div>
        <div style={styles.sidebarFooter}>
            <div style={styles.addCategoryWrapper}>
                <input style={styles.smallInput} placeholder="נושא חדש..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                <button style={styles.addBtn} onClick={handleAddCategory}>+</button>
            </div>
            <button onClick={() => { service.logout(); setUser(false); }} style={styles.logoutBtn}>התנתק</button>
        </div>
      </aside>

      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
            <header style={styles.mainHeader}>
                <h1 style={styles.mainTitle}>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "כל המשימות"}</h1>
            </header>
            <form style={styles.addTodoForm} onSubmit={handleAddTask}>
                <input style={styles.mainInput} placeholder={selectedCategory ? "הוסף משימה לנושא זה..." : "בחר נושא להוספה..."} value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
            </form>
            <div style={styles.todoContainer}>
                {filteredTodos.map(todo => (
                    <div key={todo.id} style={styles.todoCard}>
                        <button style={styles.deleteBtn} onClick={() => handleDeleteTask(todo.id)}>❎</button>
                        <span style={{...styles.todoText, textDecoration: todo.isComplete ? 'line-through' : 'none', opacity: todo.isComplete ? 0.6 : 1}}>{todo.name}</span>
                        <input type="checkbox" checked={todo.isComplete || false} style={styles.checkbox} onChange={(e) => handleToggleComplete(todo, e.target.checked)} />
                    </div>
                ))}
                {filteredTodos.length === 0 && <p style={styles.emptyMsg}>אין משימות להצגה</p>}
            </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  appLayout: { display: 'flex', height: '100vh', width: '100%', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', direction: 'rtl', backgroundColor: '#F5F5F5', margin: 0, padding: 0, overflow: 'hidden' },
  sidebar: { width: '300px', minWidth: '300px', backgroundColor: '#EFEBE9', padding: '30px 20px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #D7CCC8', height: '100%', boxSizing: 'border-box' },
  sidebarTitle: { color: '#5D4037', fontSize: '1.3rem', marginBottom: '25px', borderBottom: '2px solid #D7CCC8', paddingBottom: '10px', fontWeight: 'bold' },
  categoryList: { listStyle: 'none', padding: 0, margin: 0 },
  categoryItem: { padding: '12px 15px', cursor: 'pointer', borderRadius: '12px', marginBottom: '8px', fontSize: '1rem', color: '#4E342E', transition: '0.3s' },
  sidebarFooter: { marginTop: 'auto', paddingTop: '20px' },
  addCategoryWrapper: { display: 'flex', gap: '8px', marginBottom: '15px' },
  smallInput: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #D7CCC8', outline: 'none' },
  addBtn: { width: '40px', backgroundColor: '#8D775F', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '1.2rem' },
  logoutBtn: { width: '100%', backgroundColor: '#D7CCC8', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#5D4037' },
  mainContent: { flex: 1, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' },
  contentWrapper: { width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column' },
  mainHeader: { marginBottom: '30px', textAlign: 'center' },
  mainTitle: { fontSize: '2.8rem', color: '#3E2723', margin: 0, fontWeight: '800', lineHeight: '1.2' },
  addTodoForm: { marginBottom: '30px' },
  mainInput: { width: '100%', padding: '18px 25px', borderRadius: '18px', border: '1px solid #E0E0E0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' },
  todoContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  todoCard: { backgroundColor: 'white', padding: '16px 20px', borderRadius: '15px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', border: '1px solid #F0F0F0' },
  todoText: { flex: 1, fontSize: '1.15rem', color: '#424242', margin: '0 15px', textAlign: 'right', wordBreak: 'break-word' },
  checkbox: { width: '22px', height: '22px', cursor: 'pointer', accentColor: '#8D775F' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#BDBDBD' },
  emptyMsg: { textAlign: 'center', color: '#9E9E9E', marginTop: '50px' },
  authContainer: { backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  authCard: { backgroundColor: '#E0D8D0', padding: '45px', width: '90%', maxWidth: '380px', borderRadius: '25px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  input: { padding: '14px', borderRadius: '14px', border: '1px solid #C4B9AF', outline: 'none' },
  button: { padding: '14px', backgroundColor: '#8D775F', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold' },
  toggle: { marginTop: '22px', cursor: 'pointer', fontSize: '0.95rem', textDecoration: 'underline' }
};

export default App;
