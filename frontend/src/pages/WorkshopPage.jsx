import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Typography, message } from 'antd';
import { api, errorMessage } from '../services/api.js';
import WorkshopFilters from '../components/WorkshopFilters.jsx';
import WorkshopTable from '../components/WorkshopTable.jsx';
import WorkshopForm from '../components/WorkshopForm.jsx';
import RegistrationTable from '../components/RegistrationTable.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';

export default function WorkshopPage({ user }) {
  const isManager = user.role === 'MANAGER';
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [selected, setSelected] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [workshopFormOpen, setWorkshopFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [registrationFormOpen, setRegistrationFormOpen] = useState(false);

  const loadWorkshops = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const { data } = await api.get('/workshops', { params: filters });
      setWorkshops(data);
      setSelected((current) => current ? data.find((w) => w.id === current.id) ?? current : null);
    } catch (error) { message.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadWorkshops(); }, [loadWorkshops]);

  function search(filters) {
    setActiveFilters(filters);
    loadWorkshops(filters);
  }

  async function loadRegistrations(workshop) {
    try {
      const { data } = await api.get(`/workshops/${workshop.id}/registrations`);
      setRegistrations(data);
    } catch (error) { message.error(errorMessage(error)); }
  }

  function openWorkshop(workshop = null) {
    setEditingWorkshop(workshop);
    setWorkshopFormOpen(true);
  }

  async function saveWorkshop(values) {
    try {
      const payload = { ...values, startsAt: values.startsAt.toISOString() };
      if (editingWorkshop) await api.put(`/workshops/${editingWorkshop.id}`, payload);
      else await api.post('/workshops', payload);
      message.success('Workshop saved');
      setWorkshopFormOpen(false);
      setEditingWorkshop(null);
      await loadWorkshops(activeFilters);
    } catch (error) { message.error(errorMessage(error)); }
  }

  async function register(values) {
    if (!selected) return;
    try {
      await api.post(`/workshops/${selected.id}/registrations`, values);
      message.success('Attendee registered');
      setRegistrationFormOpen(false);
      await loadRegistrations(selected);
      await loadWorkshops(activeFilters);
    } catch (error) { message.error(errorMessage(error)); }
  }

  async function cancelRegistration(id) {
    if (!selected) return;
    try {
      await api.patch(`/registrations/${id}/cancel`);
      message.success('Registration cancelled');
      await loadRegistrations(selected);
      await loadWorkshops(activeFilters);
    } catch (error) { message.error(errorMessage(error)); }
  }

  return (
    <>
      <Space wrap style={{ marginBottom: 20, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Workshops</Typography.Title>
        {isManager && <Button type="primary" onClick={() => openWorkshop()}>Add Workshop</Button>}
      </Space>
      <Card style={{ marginBottom: 20 }}><WorkshopFilters onSearch={search} /></Card>
      <Card><WorkshopTable workshops={workshops} loading={loading} isManager={isManager}
        onViewRegistrations={(w) => { setSelected(w); loadRegistrations(w); }} onEdit={openWorkshop} /></Card>
      {selected && (
        <Card style={{ marginTop: 20 }} title={`Registrations — ${selected.title}`} extra={
          <Space wrap>
            <Button onClick={() => { setSelected(null); setRegistrations([]); }}>Close</Button>
            {selected.status === 'SCHEDULED' && selected.availableSeats > 0 &&
              <Button type="primary" onClick={() => setRegistrationFormOpen(true)}>Register Attendee</Button>}
          </Space>
        }>
          <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Cancelled registrations remain in history." />
          <RegistrationTable registrations={registrations} onCancel={cancelRegistration} />
        </Card>
      )}
      <WorkshopForm open={workshopFormOpen} workshop={editingWorkshop} onClose={() => { setWorkshopFormOpen(false); setEditingWorkshop(null); }} onSave={saveWorkshop} />
      <RegistrationForm open={registrationFormOpen} workshop={selected} onClose={() => setRegistrationFormOpen(false)} onRegister={register} />
    </>
  );
}
