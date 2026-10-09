import { useState } from 'react';
import { Layout } from 'antd';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import WorkshopPage from './pages/WorkshopPage.jsx';
import AppHeader from './components/AppHeader.jsx';

function readUser() {
  try {
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('user'));
  } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(readUser);
  if (!user) return <LoginPage onLogin={setUser} />;

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader user={user} onLogout={logout} />
      <Layout.Content style={{ padding: 24, maxWidth: 1350, width: '100%', margin: '0 auto' }}>
        {user.role === 'ADMIN' ? <AdminPage user={user} /> : <WorkshopPage user={user} />}
      </Layout.Content>
    </Layout>
  );
}
