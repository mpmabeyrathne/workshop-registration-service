import { Table, Button, Space, Tag } from 'antd';
import dayjs from 'dayjs';

export default function WorkshopTable({ workshops, loading, isManager, onViewRegistrations, onEdit }) {
  const columns = [
    { title: 'Code', dataIndex: 'code' },
    { title: 'Workshop', dataIndex: 'title' },
    { title: 'Instructor', dataIndex: 'instructor' },
    { title: 'Date', dataIndex: 'startsAt', render: (v) => dayjs(v).format('DD MMM YYYY, hh:mm A') },
    { title: 'Location', dataIndex: 'location' },
    { title: 'Seats', render: (_, r) => <Tag color={r.availableSeats > 0 ? 'green' : 'red'}>{r.availableSeats}/{r.capacity}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v}</Tag> },
    { title: 'Actions', render: (_, r) => <Space wrap><Button onClick={() => onViewRegistrations(r)}>Attendees</Button>{isManager && <Button onClick={() => onEdit(r)}>Edit</Button>}</Space> },
  ];
  return <Table rowKey="id" columns={columns} dataSource={workshops} loading={loading} scroll={{ x: 950 }} />;
}
