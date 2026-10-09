import { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';

export default function UserForm({ open, onClose, onCreate }) {
  const [form] = Form.useForm();
  useEffect(() => { if (open) form.resetFields(); }, [open, form]);
  return (
    <Modal title="Create User" open={open} onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={onCreate}>
        <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
        <Form.Item name="role" label="Role" rules={[{ required: true }]}><Select options={[
          { value: 'ADMIN', label: 'Admin' }, { value: 'MANAGER', label: 'Manager' }, { value: 'STAFF', label: 'Staff' },
        ]} /></Form.Item>
      </Form>
    </Modal>
  );
}
