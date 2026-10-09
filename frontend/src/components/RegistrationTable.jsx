import { Table, Button, Popconfirm, Tag } from 'antd';
import dayjs from 'dayjs';

export default function RegistrationTable({ registrations, onCancel }) {
  const columns = [
    { title: 'Name', dataIndex: 'attendeeName' },
    { title: 'Email', dataIndex: 'attendeeEmail' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag color={v === 'ACTIVE' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Registered By', render: (_, r) => r.registeredByUser?.name || r.registeredBy },
    { title: 'Registered At', dataIndex: 'registeredAt', render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '-' },
    { title: 'Cancelled By', render: (_, r) => r.cancelledByUser?.name || r.cancelledBy || '-' },
    { title: 'Cancelled At', dataIndex: 'cancelledAt', render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '-' },
    { title: 'Action', render: (_, r) => r.status === 'ACTIVE' ? <Popconfirm title="Cancel this registration?" onConfirm={() => onCancel(r.id)}><Button danger size="small">Cancel</Button></Popconfirm> : null },
  ];
  return <Table rowKey="id" columns={columns} dataSource={registrations} scroll={{ x: 1000 }} />;
}
