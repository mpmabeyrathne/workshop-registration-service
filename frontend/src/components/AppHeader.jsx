import { Layout, Typography, Space, Tag, Button } from 'antd';
const { Header } = Layout;

export default function AppHeader({ user, onLogout }) {
  return (
    <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #eee', paddingInline: 24, height: 'auto', minHeight: 64, gap: 12, flexWrap: 'wrap' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>Workshop Registration</Typography.Title>
      <Space wrap>
        <Tag>{user.role}</Tag>
        <Typography.Text>{user.name}</Typography.Text>
        <Button onClick={onLogout}>Logout</Button>
      </Space>
    </Header>
  );
}
