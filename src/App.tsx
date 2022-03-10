import React from "react";
import { DateTime, Duration } from "luxon";
import {
  Layout,
  Modal,
  Button,
  Tooltip,
  Typography,
  Table,
  Space,
  TimePicker,
  Row,
  Col,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import "./App.css";

const { Content } = Layout;
const { Title, Text } = Typography;

type Shift = {
  start: string;
  end: string;
  values?: any;
};

type Item = {
  date: string;
  firstShift: Shift;
  secondShift?: Shift;
  total: number;
};

type State = {
  showModal: boolean;
  editing: number;
  items: Array<Item>;
  tempItem: Partial<Item> | null;
};

export default class App extends React.Component<any, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      items: [],
      editing: -1,
      // items: examples,
      showModal: false,

      tempItem: null,
    };

    this.onAdd = this.onAdd.bind(this);
    this.onShowModal = this.onShowModal.bind(this);
  }

  get columns() {
    return [
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
        render: (date: string) => DateTime.fromISO(date).toFormat("dd-MM-yyyy"),
      },
      {
        title: "First Shift",
        dataIndex: "firstShift",
        key: "firstShift",
        render: (shift: Shift) => {
          const { start, end } = shift;
          return (
            <Text>
              {start} - {end}
            </Text>
          );
        },
      },
      {
        title: "Second Shift",
        dataIndex: "secondShift",
        key: "secondShift",
        render: (shift?: Shift) => {
          if (!shift) return "-";

          const { start, end } = shift;
          return <Text>{`${start} - ${end}`}</Text>;
        },
      },
      {
        title: "Total",
        dataIndex: "total",
        key: "total",
        render: (total: number) => `${total.toFixed(2)}h`,
      },
      {
        title: "Actions",
        dataIndex: "actions",
        key: "actions",
        width: 100,
        render: (text: any, record: any, index: number) => {
          return (
            <Space>
              <Tooltip title="Edit">
                <Button
                  onClick={() => this.onEdit(index)}
                  type="primary"
                  shape="circle"
                  icon={<EditOutlined />}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  onClick={() => this.onDelete(index)}
                  type="primary"
                  danger
                  shape="circle"
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ];
  }

  onShowModal() {
    const tempItem = {
      date: DateTime.now().toISO(),
      total: 0,
    };

    this.setState({ showModal: true, tempItem });
  }

  calculateShift(shift?: Shift) {
    let total = 0;

    if (shift?.start && shift?.end) {
      const start = Duration.fromISOTime(shift.start);
      const end = Duration.fromISOTime(shift.end);

      total += end.as("hours") - start.as("hours");
    }

    return { shift, total };
  }

  onAdd() {
    const { items, tempItem, editing } = this.state;

    if (!tempItem) return;

    try {
      const { date } = tempItem;
      const item = { date, total: 0 } as Item;

      const firstShift = this.calculateShift(tempItem.firstShift);
      const secondShift = this.calculateShift(tempItem.secondShift);

      if (firstShift.shift) item.firstShift = firstShift.shift;
      if (secondShift.shift) item.secondShift = secondShift.shift;

      item.total = firstShift.total + secondShift.total;

      if (editing === -1) {
        items.push(item);
      } else {
        items[editing] = item;
      }

      this.setState({
        items: [...items],
        showModal: false,
        tempItem: null,
        editing: -1,
      });
    } catch (err) {
      // TODO: show error?
    }
  }

  onEdit(index: number) {
    const { items } = this.state;
    const item = items[index];

    this.setState({
      showModal: true,
      tempItem: Object.assign({}, item),
      editing: index,
    });
  }

  onDelete(index: number) {
    const { items } = this.state;
    const newList = [...items];
    newList.splice(index, 1);
    this.setState({ items: newList });
  }

  renderModalAdd() {
    const { showModal, tempItem } = this.state;

    return (
      <Modal
        title="Create Item"
        centered
        visible={showModal}
        onOk={this.onAdd}
        onCancel={() => this.setState({ showModal: false, tempItem: null })}
      >
        <Row key={`${tempItem?.date}`} gutter={24}>
          <Col span={12}>
            <Text>First Shift</Text>
            <TimePicker.RangePicker
              format="HH:mm"
              value={tempItem?.firstShift?.values}
              onChange={(values, formatStrings) => {
                const [start, end] = formatStrings;

                if (!tempItem) return;

                tempItem.firstShift = { start, end, values };
                this.setState({ tempItem });
              }}
            />
          </Col>
          <Col span={12}>
            <Text>Second Shift</Text>
            <TimePicker.RangePicker
              format="HH:mm"
              value={tempItem?.secondShift?.values}
              onChange={(values, formatStrings) => {
                const [start, end] = formatStrings || [];

                if (!tempItem) return;

                tempItem.secondShift = { start, end, values };
                this.setState({ tempItem });
              }}
            />
          </Col>
        </Row>
      </Modal>
    );
  }

  render() {
    const { items } = this.state;

    const total = items.reduce((acc, value) => acc + value.total, 0);
    const totalHours = Duration.fromObject({
      hours: total,
      minutes: 0,
    }).toFormat("hh:mm");

    return (
      <Layout>
        <div style={{ backgroundColor: "white" }}>
          <Title level={3}>Total Hours</Title>
          <Title>
            {totalHours} ({total.toFixed(2)}h)
          </Title>
        </div>
        <Content>
          <Space direction="horizontal" align="end">
            <Button onClick={this.onShowModal} type="primary">
              Add
            </Button>
            <Button onClick={() => this.setState({ items: [] })}>Clear</Button>
          </Space>
          <Table
            columns={this.columns}
            dataSource={items}
            pagination={false}
            rowKey={(value) => value.date}
          />
        </Content>
        {this.renderModalAdd()}
      </Layout>
    );
  }
}
