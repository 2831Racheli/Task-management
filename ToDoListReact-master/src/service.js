import axios from 'axios';

axios.defaults.baseURL = "http://localhost:5043";

// אינטרספטור להוספת ה-Token לכל בקשה שיוצאת
axios.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// תפיסת שגיאות 401 (לא מורשה) והעברה להתחברות
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.reload(); // יקפיץ את המשתמש חזרה למסך התחברות
        }
        return Promise.reject(error);
    }
);

export default {
  getTasks: async () => {
    const result = await axios.get('/items');    
    return result.data;
  },

  addTask: async (name) => {
    const result = await axios.post('/items', { name, isComplete: false });
    return result.data;
  },

  setCompleted: async (id, isComplete, name) => {
    await axios.put(`/items/${id}`, { id, name, isComplete });
    return { id, isComplete };
  },

  deleteTask: async (id) => {
    await axios.delete(`/items/${id}`);
    return { id };
  },

  // פונקציות חדשות לאימות
  login: async (username, password) => {
    const result = await axios.post('/login', { username, password });
    if (result.data.token) {
        localStorage.setItem("token", result.data.token);
    }
    return result.data;
  },

  register: async (username, password) => {
    await axios.post('/register', { username, password });
  },

  logout: () => {
    localStorage.removeItem("token");
    window.location.reload();
  },
  // הוספה בתוך האובייקט המיוצא ב-service.js
getCategories: async () => {
    const result = await axios.get('/categories');
    return result.data;
},

addCategory: async (name) => {
    const result = await axios.post('/categories', { name });
    return result.data;
},

// עדכון פונקציית הוספת משימה הקיימת
addTask: async (name, categoryId) => {
    const result = await axios.post('/items', { 
        name, 
        isComplete: false, 
        categoryId: categoryId // שליחת ה-ID של הקטגוריה שנבחרה
    });
    return result.data;
}
  
};
