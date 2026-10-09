import { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';

export default function RegistrationForm({ open, workshop, onClose, onRegister }) {
  const [form] = Form.useForm();
  useEffect(() => { if (open) form.resetFields(); }, [open, form]);
  return (
    <Modal title={`Register Attendee — ${workshop?.title || ''}`} open={open} onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={onRegister}>
        <Form.Item name="attendeeName" label="Attendee Name" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
        <Form.Item name="attendeeEmail" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
      </Form>
    </Modal>
  );
}
