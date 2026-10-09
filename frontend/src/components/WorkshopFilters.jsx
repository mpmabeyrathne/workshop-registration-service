import { useState } from 'react';
import { Button, DatePicker, Select, Space } from 'antd';

export default function WorkshopFilters({ onSearch }) {
  const [dates, setDates] = useState(null);
  const [status, setStatus] = useState(undefined);
  const [hasSeats, setHasSeats] = useState(undefined);

  function search() {
    onSearch({
      from: dates?.[0]?.startOf('day').toISOString(),
      to: dates?.[1]?.endOf('day').toISOString(),
      status,
      hasSeats,
    });
  }

  function reset() {
    setDates(null);
    setStatus(undefined);
    setHasSeats(undefined);
    onSearch({});
  }

  return (
    <Space wrap>
      <DatePicker.RangePicker value={dates} onChange={(value) => setDates(value ?? null)} allowClear />
      <Select placeholder="Workshop status" allowClear value={status} style={{ width: 180 }} onChange={setStatus} options={[
        { value: 'SCHEDULED', label: 'Scheduled' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'COMPLETED', label: 'Completed' },
      ]} />
      <Select placeholder="Seat availability" allowClear value={hasSeats} style={{ width: 180 }} onChange={setHasSeats} options={[
        { value: 'true', label: 'Seats available' },
        { value: 'false', label: 'Full workshops' },
      ]} />
      <Button type="primary" onClick={search}>Search</Button>
      <Button onClick={reset}>Reset</Button>
    </Space>
  );
}
