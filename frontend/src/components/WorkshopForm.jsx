import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';

export default function WorkshopForm({ open, workshop, onClose, onSave }) {
  const [form] = Form.useForm();
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (workshop) form.setFieldsValue({ ...workshop, startsAt: dayjs(workshop.startsAt) });
    else form.setFieldsValue({ status: 'SCHEDULED', capacity: 20 });
  }, [open, workshop, form]);

  return (
    <Modal title={workshop ? 'Edit Workshop' : 'Create Workshop'} open={open} onCancel={onClose} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item name="code" label="Workshop Code" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
        <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
        <Form.Item name="instructor" label="Instructor" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
        <Form.Item name="startsAt" label="Date and Time" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="location" label="Location" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
        <Form.Item name="status" label="Status"><Select options={[
          { value: 'SCHEDULED', label: 'Scheduled' }, { value: 'CANCELLED', label: 'Cancelled' }, { value: 'COMPLETED', label: 'Completed' },
        ]} /></Form.Item>
      </Form>
    </Modal>
  );
}
