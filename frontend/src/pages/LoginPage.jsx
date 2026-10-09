import { useState } from 'react';
import { Layout, Card, Typography, Form, Input, Button, message } from 'antd';
import { api, errorMessage } from '../services/api.js';

export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  async function submit(values) {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', values);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
      message.success('Login successful');
    } catch (error) { message.error(errorMessage(error)); }
    finally { setLoading(false); }
  }
  return (
    <Layout style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Card style={{ width: 380, maxWidth: '95vw' }}>
        <Typography.Title level={3}>Workshop Registration</Typography.Title>
        <Typography.Text type="secondary">Staff sign in</Typography.Text>
        <Form layout="vertical" onFinish={submit} style={{ marginTop: 24 }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>Sign In</Button>
        </Form>
      </Card>
    </Layout>
  );
}
