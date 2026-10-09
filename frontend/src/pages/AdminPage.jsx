import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Button, Select, Space, Typography, message } from 'antd';
import { api, errorMessage } from '../services/api.js';
import UserForm from '../components/UserForm.jsx';

export default function AdminPage({ user }) {
  const [users, setUsers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) { message.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function updateRole(id, role) {
    try {
      await api.patch(`/users/${id}/role`, { role });
      message.success('User role updated');
      await loadUsers();
    } catch (error) { message.error(errorMessage(error)); }
  }

  async function createUser(values) {
    try {
      await api.post('/users', values);
      message.success('User created');
      setFormOpen(false);
      await loadUsers();
    } catch (error) { message.error(errorMessage(error)); }
  }

  return (
    <>
      <Card>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>User Administration</Typography.Title>
          <Button type="primary" onClick={() => setFormOpen(true)}>Create User</Button>
        </Space>
        <Table rowKey="id" dataSource={users} loading={loading} scroll={{ x: 650 }} columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Role', dataIndex: 'role', render: (role, record) => (
            <Select value={role} style={{ width: 140 }} disabled={record.id === user.id}
              options={[{ label: 'Admin', value: 'ADMIN' }, { label: 'Manager', value: 'MANAGER' }, { label: 'Staff', value: 'STAFF' }]}
              onChange={(value) => updateRole(record.id, value)} />
          ) },
        ]} />
      </Card>
      <UserForm open={formOpen} onClose={() => setFormOpen(false)} onCreate={createUser} />
    </>
  );
}
