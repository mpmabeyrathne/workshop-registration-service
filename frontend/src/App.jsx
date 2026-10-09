import { useEffect, useState } from "react";
import {
  Layout,
  Card,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Modal,
  Tag,
  Typography,
  message,
  Popconfirm,
  Alert,
} from "antd";
import dayjs from "dayjs";
import { api } from "./api";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [selected, setSelected] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [workshopModal, setWorkshopModal] = useState(false);
  const [registrationModal, setRegistrationModal] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [filters, setFilters] = useState({});

  const [loginForm] = Form.useForm();
  const [workshopForm] = Form.useForm();
  const [registrationForm] = Form.useForm();
  const [userForm] = Form.useForm();

  const isManager = user?.role === "MANAGER";
  const isAdmin = user?.role === "ADMIN";
  const canRegister = ["MANAGER", "STAFF"].includes(user?.role);

  const errorMessage = (error) =>
    error.response?.data?.message || "Something went wrong";

  async function loadWorkshops(nextFilters = filters) {
    try {
      setLoading(true);
      const { data } = await api.get("/workshops", {
        params: nextFilters,
      });
      setWorkshops(data);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations(workshop) {
    try {
      const { data } = await api.get(
        `/workshops/${workshop.id}/registrations`
      );
      setRegistrations(data);
    } catch (error) {
      message.error(errorMessage(error));
    }
  }

  useEffect(() => {
    if (user && !isAdmin) {
      loadWorkshops({});
    }
  }, [user]);

  async function login(values) {
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", values);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      message.success("Login successful");
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setSelected(null);
    setRegistrations([]);
    setWorkshops([]);
  }

  async function saveWorkshop(values) {
    try {
      const payload = {
        ...values,
        startsAt: values.startsAt.toISOString(),
      };

      if (editingWorkshop) {
        await api.put(`/workshops/${editingWorkshop.id}`, payload);
      } else {
        await api.post("/workshops", payload);
      }

      message.success("Workshop saved");
      setWorkshopModal(false);
      setEditingWorkshop(null);
      workshopForm.resetFields();
      await loadWorkshops();
    } catch (error) {
      message.error(errorMessage(error));
    }
  }

  function openWorkshop(workshop = null) {
    setEditingWorkshop(workshop);
    workshopForm.resetFields();

    if (workshop) {
      workshopForm.setFieldsValue({
        ...workshop,
        startsAt: dayjs(workshop.startsAt),
      });
    } else {
      workshopForm.setFieldsValue({
        status: "SCHEDULED",
        capacity: 20,
      });
    }

    setWorkshopModal(true);
  }

  async function openRegistrations(workshop) {
    setSelected(workshop);
    await loadRegistrations(workshop);
  }

  async function register(values) {
    try {
      await api.post(
        `/workshops/${selected.id}/registrations`,
        values
      );

      message.success("Attendee registered");
      setRegistrationModal(false);
      registrationForm.resetFields();

      await loadRegistrations(selected);
      await loadWorkshops();
    } catch (error) {
      message.error(errorMessage(error));
    }
  }

  async function cancelRegistration(id) {
    try {
      await api.patch(`/registrations/${id}/cancel`);
      message.success("Registration cancelled");

      await loadRegistrations(selected);
      await loadWorkshops();
    } catch (error) {
      message.error(errorMessage(error));
    }
  }

  async function createUser(values) {
    try {
      await api.post("/users", values);
      message.success("User created");
      userForm.resetFields();
      setUserModal(false);
    } catch (error) {
      message.error(errorMessage(error));
    }
  }

  if (!user) {
    return (
      <Layout
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Card style={{ width: 380, maxWidth: "95vw" }}>
          <Title level={3}>Workshop Registration</Title>
          <Text type="secondary">Staff sign in</Text>

          <Form
            form={loginForm}
            layout="vertical"
            onFinish={login}
            style={{ marginTop: 24 }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              Sign In
            </Button>
          </Form>
        </Card>
      </Layout>
    );
  }

  const workshopColumns = [
    { title: "Code", dataIndex: "code" },
    { title: "Workshop", dataIndex: "title" },
    { title: "Instructor", dataIndex: "instructor" },
    {
      title: "Date",
      dataIndex: "startsAt",
      render: (value) => dayjs(value).format("DD MMM YYYY, hh:mm A"),
    },
    { title: "Location", dataIndex: "location" },
    {
      title: "Seats",
      render: (_, record) => (
        <Tag color={record.availableSeats > 0 ? "green" : "red"}>
          {record.availableSeats}/{record.capacity}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          <Button onClick={() => openRegistrations(record)}>
            Attendees
          </Button>

          {isManager && (
            <Button onClick={() => openWorkshop(record)}>
              Edit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const registrationColumns = [
    { title: "Name", dataIndex: "attendeeName" },
    { title: "Email", dataIndex: "attendeeEmail" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Registered By",
      render: (_, record) =>
        record.registeredByUser?.name || record.registeredBy,
    },
    {
      title: "Registered At",
      dataIndex: "registeredAt",
      render: (value) =>
        value ? dayjs(value).format("DD MMM YYYY HH:mm") : "-",
    },
    {
      title: "Cancelled By",
      render: (_, record) =>
        record.cancelledByUser?.name || record.cancelledBy || "-",
    },
    {
      title: "Cancelled At",
      dataIndex: "cancelledAt",
      render: (value) =>
        value ? dayjs(value).format("DD MMM YYYY HH:mm") : "-",
    },
    {
      title: "Action",
      render: (_, record) =>
        record.status === "ACTIVE" ? (
          <Popconfirm
            title="Cancel this registration?"
            onConfirm={() => cancelRegistration(record.id)}
          >
            <Button danger size="small">
              Cancel
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          borderBottom: "1px solid #eee",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Workshop Registration
        </Title>

        <Space>
          <Tag>{user.role}</Tag>
          <Text>{user.name}</Text>
          <Button onClick={logout}>Logout</Button>
        </Space>
      </Header>

      <Content
        style={{
          padding: 24,
          maxWidth: 1350,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {isAdmin ? (
          <Card>
            <Title level={3}>User Administration</Title>
            <Text>
              Create staff accounts and assign permissions.
            </Text>

            <div style={{ marginTop: 20 }}>
              <Button
                type="primary"
                onClick={() => setUserModal(true)}
              >
                Create User
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Space
              style={{
                marginBottom: 20,
                width: "100%",
                justifyContent: "space-between",
              }}
              wrap
            >
              <Title level={3} style={{ margin: 0 }}>
                Workshops
              </Title>

              {isManager && (
                <Button
                  type="primary"
                  onClick={() => openWorkshop()}
                >
                  Add Workshop
                </Button>
              )}
            </Space>

            <Card style={{ marginBottom: 20 }}>
              <Space wrap>
                <DatePicker.RangePicker
                  onChange={(_, dateStrings) => {
                    setFilters((previous) => ({
                      ...previous,
                      from: dateStrings[0] || undefined,
                      to: dateStrings[1]
                        ? `${dateStrings[1]}T23:59:59`
                        : undefined,
                    }));
                  }}
                />

                <Select
                  placeholder="Workshop status"
                  allowClear
                  style={{ width: 180 }}
                  options={[
                    { value: "SCHEDULED", label: "Scheduled" },
                    { value: "CANCELLED", label: "Cancelled" },
                    { value: "COMPLETED", label: "Completed" },
                  ]}
                  onChange={(status) =>
                    setFilters((previous) => ({
                      ...previous,
                      status,
                    }))
                  }
                />

                <Select
                  placeholder="Seat availability"
                  allowClear
                  style={{ width: 180 }}
                  options={[
                    { value: "true", label: "Seats available" },
                    { value: "false", label: "Full workshops" },
                  ]}
                  onChange={(hasSeats) =>
                    setFilters((previous) => ({
                      ...previous,
                      hasSeats,
                    }))
                  }
                />

                <Button
                  type="primary"
                  onClick={() => loadWorkshops(filters)}
                >
                  Search
                </Button>

                <Button
                  onClick={() => {
                    setFilters({});
                    loadWorkshops({});
                  }}
                >
                  Reset
                </Button>
              </Space>
            </Card>

            <Card>
              <Table
                rowKey="id"
                columns={workshopColumns}
                dataSource={workshops}
                loading={loading}
                scroll={{ x: 950 }}
              />
            </Card>

            {selected && (
              <Card
                style={{ marginTop: 20 }}
                title={`Registrations — ${selected.title}`}
                extra={
                  <Space>
                    <Button
                      onClick={() => {
                        setSelected(null);
                        setRegistrations([]);
                      }}
                    >
                      Close
                    </Button>

                    {canRegister &&
                      selected.status === "SCHEDULED" && (
                        <Button
                          type="primary"
                          onClick={() => {
                            registrationForm.resetFields();
                            setRegistrationModal(true);
                          }}
                        >
                          Register Attendee
                        </Button>
                      )}
                  </Space>
                }
              >
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Cancelled registrations remain in history."
                />

                <Table
                  rowKey="id"
                  columns={registrationColumns}
                  dataSource={registrations}
                  scroll={{ x: 1000 }}
                />
              </Card>
            )}
          </>
        )}

        <Modal
          title={editingWorkshop ? "Edit Workshop" : "Create Workshop"}
          open={workshopModal}
          onCancel={() => setWorkshopModal(false)}
          onOk={() => workshopForm.submit()}
          destroyOnHidden
        >
          <Form
            form={workshopForm}
            layout="vertical"
            onFinish={saveWorkshop}
          >
            <Form.Item
              name="code"
              label="Workshop Code"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="instructor"
              label="Instructor"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="startsAt"
              label="Date and Time"
              rules={[{ required: true }]}
            >
              <DatePicker
                showTime
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="capacity"
              label="Capacity"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { value: "SCHEDULED", label: "Scheduled" },
                  { value: "CANCELLED", label: "Cancelled" },
                  { value: "COMPLETED", label: "Completed" },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`Register Attendee — ${selected?.title || ""}`}
          open={registrationModal}
          onCancel={() => setRegistrationModal(false)}
          onOk={() => registrationForm.submit()}
          destroyOnHidden
        >
          <Form
            form={registrationForm}
            layout="vertical"
            onFinish={register}
          >
            <Form.Item
              name="attendeeName"
              label="Attendee Name"
              rules={[{ required: true, min: 2 }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="attendeeEmail"
              label="Email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Create User"
          open={userModal}
          onCancel={() => setUserModal(false)}
          onOk={() => userForm.submit()}
          destroyOnHidden
        >
          <Form
            form={userForm}
            layout="vertical"
            onFinish={createUser}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, min: 2 }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, min: 8 }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "ADMIN", label: "Admin" },
                  { value: "MANAGER", label: "Manager" },
                  { value: "STAFF", label: "Staff" },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}