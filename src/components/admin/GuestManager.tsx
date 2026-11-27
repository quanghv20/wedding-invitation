"use client";

import { useMemo, useRef, useState } from "react";
import { Alert, App, AutoComplete, Button, Flex, Input, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type { DefaultOptionType } from "antd/es/select";
import {
  ClearOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  LinkOutlined,
  MessageOutlined,
  PlusOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { WeddingContent } from "@/config/wedding";
import type { Rsvp } from "@/app/api/rsvp/route";
import {
  EXTRA_SUGGESTIONS,
  GUEST_PRESETS,
  HOST_SUGGESTIONS,
  guestUrl,
  hostsOf,
  inviteMessage,
  inviteeOf,
  type Guest,
  type GuestInput,
  type GuestPreset,
} from "@/lib/guest";
import { Section, callApi, errorText, normalize, tablePagination, useCopy } from "./ui";

const { Text } = Typography;

const BLANK: GuestInput = { title: "", name: "", extra: "", hostPronoun: "", side: "", group: "", message: "" };
/** Thứ tự cột, cũng là thứ tự điền khi dán nhiều cột từ Excel */
const FIELDS = ["title", "name", "extra", "hostPronoun", "side", "group", "message"] as const;
type Field = (typeof FIELDS)[number];

const COLUMN: Record<Field, { title: string; width: number }> = {
  title: { title: "Danh xưng", width: 150 },
  name: { title: "Tên người / nhóm *", width: 200 },
  extra: { title: "Kèm theo", width: 170 },
  hostPronoun: { title: "Cô dâu chú rể xưng", width: 160 },
  side: { title: "Khách của", width: 130 },
  group: { title: "Nhóm (để lọc)", width: 160 },
  message: { title: "Lời nhắn riêng (hiện trên thiệp)", width: 260 },
};

const SIDES = [
  { value: "", label: "Không ghi" },
  { value: "groom", label: "Nhà trai" },
  { value: "bride", label: "Nhà gái" },
];
const SIDE_TAG: Record<string, { label: string; color: string }> = {
  groom: { label: "Nhà trai", color: "blue" },
  bride: { label: "Nhà gái", color: "magenta" },
};

/** Gõ chữ khi dán từ Excel: "Nhà trai", "trai", "groom"... */
function sideFromText(text: string): GuestInput["side"] {
  const n = normalize(text.trim());
  if (["groom", "nha trai", "trai", "chu re", "nt"].includes(n)) return "groom";
  if (["bride", "nha gai", "gai", "co dau", "ng"].includes(n)) return "bride";
  return "";
}

// ---------- Ô nhập dùng chung cho bảng nhập và bảng danh sách ----------

/** Giá trị option của mẫu danh xưng: chọn thì điền cả danh xưng lẫn cách xưng hô */
const PRESET_PREFIX = "preset::";
const PRESETS = new Map<string, GuestPreset>(GUEST_PRESETS.flatMap((g) => g.items.map((p) => [PRESET_PREFIX + p.label, p] as const)));
const TITLE_OPTIONS = GUEST_PRESETS.map((group) => ({
  label: group.group,
  options: group.items.map((p) => ({
    value: PRESET_PREFIX + p.label,
    search: `${p.label} ${p.title}`,
    label: (
      <Flex justify="space-between" gap={8}>
        <span>{p.label}</span>
        <Text type="secondary" style={{ fontSize: 12 }}>
          xưng “{p.hostPronoun}”
        </Text>
      </Flex>
    ),
  })),
}));

const toOptions = (list: string[]) => list.map((value) => ({ value }));
const searchConfig = {
  filterOption: (input: string, option?: DefaultOptionType) =>
    normalize(String(option?.search ?? option?.value ?? "")).includes(normalize(input)),
};

function GuestCell({
  field,
  value,
  onPatch,
  groups,
  invalid,
}: {
  field: Field;
  value: GuestInput;
  onPatch: (changes: Partial<GuestInput>) => void;
  groups: string[];
  invalid?: boolean;
}) {
  const common = { style: { width: "100%" }, "aria-label": COLUMN[field].title };
  switch (field) {
    case "title":
      return (
        <AutoComplete
          {...common}
          value={value.title}
          options={TITLE_OPTIONS}
          showSearch={searchConfig}
          popupMatchSelectWidth={240}
          placeholder="Anh, Chị, Cô Chú..."
          onChange={(v: string) => {
            const preset = PRESETS.get(v);
            onPatch(preset ? { title: preset.title, hostPronoun: preset.hostPronoun } : { title: v });
          }}
        />
      );
    case "name":
      return (
        <Input
          {...common}
          value={value.name}
          maxLength={80}
          status={invalid ? "error" : undefined}
          placeholder="Quang Cối, lớp 12A1..."
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      );
    case "extra":
    case "hostPronoun":
    case "group":
      return (
        <AutoComplete
          {...common}
          value={value[field]}
          options={toOptions(field === "extra" ? EXTRA_SUGGESTIONS : field === "hostPronoun" ? HOST_SUGGESTIONS : groups)}
          showSearch={searchConfig}
          placeholder={field === "extra" ? "và người thương" : field === "hostPronoun" ? "chúng tôi" : "Bạn đại học"}
          onChange={(v: string) => onPatch({ [field]: v })}
        />
      );
    case "side":
      return <Select {...common} value={value.side} options={SIDES} onChange={(side) => onPatch({ side })} />;
    case "message":
      return (
        <Input
          {...common}
          value={value.message}
          maxLength={300}
          placeholder="Nhớ đến sớm nha!"
          onChange={(e) => onPatch({ message: e.target.value })}
        />
      );
  }
}

// ---------- Bảng nhập nhiều khách ----------

type Row = GuestInput & { key: number };

/** Dữ liệu dán từ Excel / Google Sheets: mỗi dòng một khách, các cột cách nhau bằng Tab */
function parsePaste(text: string, startField: Field): Partial<GuestInput>[] | null {
  if (!/[\t\n]/.test(text.trim())) return null;
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const start = FIELDS.indexOf(startField);
  return lines.map((line) => {
    const row: Partial<Record<Field, string>> = {};
    line.split("\t").forEach((cell, j) => {
      const field = FIELDS[start + j];
      if (field) row[field] = field === "side" ? sideFromText(cell) : cell.trim();
    });
    return row as Partial<GuestInput>;
  });
}

/** Dòng mới lấy sẵn danh xưng, cách xưng hô, bên và nhóm của dòng trên để nhập người cùng loại cho nhanh */
const carry = (row?: GuestInput): Partial<GuestInput> =>
  row ? { title: row.title, hostPronoun: row.hostPronoun, side: row.side, group: row.group } : {};

const hasName = (r: GuestInput) => !!r.name.trim();
/** Có gõ phần riêng của khách (không tính các cột tự điền từ dòng trên) mà quên tên */
const missingName = (r: GuestInput) => !hasName(r) && !!(r.extra.trim() || r.message.trim());

function GuestTableInput({ groups, onCreate }: { groups: string[]; onCreate: (rows: GuestInput[]) => Promise<boolean> }) {
  const { message } = App.useApp();
  const keyRef = useRef(0);
  const makeRow = (base: Partial<GuestInput> = {}): Row => ({ ...BLANK, ...base, key: ++keyRef.current });
  const [rows, setRows] = useState<Row[]>(() => [makeRow(), makeRow(), makeRow()]);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);

  const ready = rows.filter(hasName);
  const allGroups = Array.from(new Set([...groups, ...rows.map((r) => r.group.trim()).filter(Boolean)]));

  const patch = (key: number, changes: Partial<GuestInput>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const addRows = (count: number) => setRows((prev) => [...prev, ...Array.from({ length: count }, () => makeRow(carry(prev[prev.length - 1])))]);

  const onPaste = (key: number, field: Field, e: React.ClipboardEvent) => {
    const parsed = parsePaste(e.clipboardData.getData("text"), field);
    if (!parsed) return;
    e.preventDefault();
    setRows((prev) => {
      const next = [...prev];
      const start = next.findIndex((r) => r.key === key);
      parsed.forEach((values, j) => {
        const i = start + j;
        if (i < next.length) next[i] = { ...next[i], ...values };
        else next.push(makeRow({ ...carry(next[next.length - 1]), ...values }));
      });
      return next;
    });
    message.info(`Đã dán ${parsed.length} dòng`);
  };

  const submit = async () => {
    if (rows.some(missingName)) {
      setShowErrors(true);
      return message.error("Có dòng chưa nhập tên người được mời (ô đỏ)");
    }
    if (!ready.length) return message.warning("Hãy nhập ít nhất một tên người được mời");
    setBusy(true);
    try {
      if (await onCreate(ready.map(({ key: _key, ...guest }) => guest))) {
        const last = carry(ready[ready.length - 1]);
        setRows([makeRow(last), makeRow(last), makeRow(last)]);
        setShowErrors(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const columns: TableColumnsType<Row> = [
    { title: "#", key: "index", width: 48, fixed: "left", align: "center", render: (_, __, i) => <Text type="secondary">{i + 1}</Text> },
    ...FIELDS.map((field) => ({
      title: COLUMN[field].title,
      key: field,
      width: COLUMN[field].width,
      render: (_: unknown, row: Row) => (
        <div onPaste={(e) => onPaste(row.key, field, e)}>
          <GuestCell field={field} value={row} groups={allGroups} invalid={showErrors && missingName(row)} onPatch={(c) => patch(row.key, c)} />
        </div>
      ),
    })),
    {
      title: "Thiệp sẽ hiện",
      key: "preview",
      width: 240,
      render: (_, row) =>
        hasName(row) ? (
          <Text type="secondary" ellipsis={{ tooltip: true }} style={{ width: 220 }}>
            Kính mời <Text strong>{inviteeOf(row)}</Text> · {hostsOf(row)}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      key: "actions",
      width: 56,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        <Tooltip title="Xóa dòng">
          <Button
            type="text"
            icon={<DeleteOutlined />}
            disabled={rows.length === 1}
            onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Text type="secondary">
        Gõ trực tiếp vào bảng như Excel. Dán được nhiều dòng chép từ Excel / Google Sheets: dán vào cột nào thì điền từ cột đó sang phải (thứ tự
        cột như bảng). Chọn danh xưng gợi ý sẽ tự điền cách xưng hô; dòng mới tự lấy danh xưng, cách xưng, bên và nhóm của dòng trên. Dòng
        không có tên được bỏ qua.
      </Text>
      <Table<Row>
        rowKey="key"
        size="small"
        bordered
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: "max-content", y: 520 }}
      />
      <Flex wrap gap={8} align="center">
        <Button icon={<PlusOutlined />} onClick={() => addRows(1)}>
          Thêm dòng
        </Button>
        <Button onClick={() => addRows(10)}>Thêm 10 dòng</Button>
        <Popconfirm title="Xóa hết các dòng đang nhập?" okText="Xóa" cancelText="Không" onConfirm={() => setRows([makeRow(), makeRow(), makeRow()])}>
          <Button icon={<ClearOutlined />}>Xóa bảng</Button>
        </Popconfirm>
        <Flex flex={1} justify="end" align="center" gap={12} wrap>
          <Text type="secondary">{ready.length} dòng có tên</Text>
          <Button type="primary" icon={<LinkOutlined />} loading={busy} disabled={!ready.length} onClick={submit}>
            Tạo {ready.length || ""} link mời
          </Button>
        </Flex>
      </Flex>
    </Space>
  );
}

// ---------- Trang khách mời ----------

type Status = "coming" | "declined" | "none";
const STATUS_TAG: Record<Status, { label: string; color: string }> = {
  coming: { label: "Sẽ đến", color: "green" },
  declined: { label: "Không đến", color: "red" },
  none: { label: "Chưa phản hồi", color: "default" },
};

export function GuestManager({
  guests,
  rsvp,
  content,
  onChange,
  onUnauthorized,
}: {
  guests: Guest[];
  rsvp: Rsvp[];
  content: WeddingContent;
  onChange: (guests: Guest[]) => void;
  onUnauthorized: () => void;
}) {
  const { message } = App.useApp();
  const copy = useCopy();
  const [created, setCreated] = useState<Guest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GuestInput>(BLANK);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const couple = `${content.groom.name} & ${content.bride.name}`;
  const groups = useMemo(() => Array.from(new Set(guests.map((g) => g.group).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi")), [guests]);

  // RSVP mới nhất gửi từ link của từng khách (danh sách RSVP đã xếp mới nhất trước)
  const rsvpByGuest = useMemo(() => {
    const map = new Map<string, Rsvp>();
    for (const r of rsvp) if (r.guestId && !map.has(r.guestId)) map.set(r.guestId, r);
    return map;
  }, [rsvp]);
  const statusOf = (g: Guest): Status => {
    const r = rsvpByGuest.get(g.id);
    return !r ? "none" : r.attending ? "coming" : "declined";
  };

  const api = <T,>(method: string, body: unknown) => callApi<T>("/api/admin/guests", method, body, onUnauthorized);
  const linksText = (list: Guest[]) => list.map((g) => `${inviteeOf(g)}: ${guestUrl(origin, g)}`).join("\n");
  const messagesText = (list: Guest[]) => list.map((g) => inviteMessage(g, couple, guestUrl(origin, g))).join("\n\n");

  const createMany = async (rows: GuestInput[]) => {
    try {
      const result = await api<{ created: Guest[]; guests: Guest[] }>("POST", { guests: rows });
      if (!result) return false;
      onChange(result.guests);
      setCreated(result.created);
      message.success(`Đã tạo ${result.created.length} link mời`);
      return true;
    } catch (error) {
      message.error(errorText(error, "Không tạo được"));
      return false;
    }
  };

  const startEdit = (g: Guest) => {
    setEditingId(g.id);
    setDraft({ title: g.title, name: g.name, extra: g.extra, hostPronoun: g.hostPronoun, side: g.side, group: g.group, message: g.message });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!draft.name.trim()) return message.error("Hãy nhập tên người được mời");
    setSaving(true);
    try {
      const result = await api<{ guests: Guest[] }>("PUT", { ...draft, id: editingId });
      if (!result) return;
      onChange(result.guests);
      setCreated((list) => list.map((g) => result.guests.find((n) => n.id === g.id) ?? g));
      setEditingId(null);
      message.success("Đã lưu thay đổi");
    } catch (error) {
      message.error(errorText(error, "Không lưu được"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ids: string[]) => {
    try {
      const result = await api<{ guests: Guest[] }>("DELETE", ids.length === 1 ? { id: ids[0] } : { ids });
      if (!result) return;
      onChange(result.guests);
      const gone = new Set(ids);
      setCreated((list) => list.filter((g) => !gone.has(g.id)));
      setSelected((list) => list.filter((id) => !gone.has(id)));
      if (editingId && gone.has(editingId)) setEditingId(null);
      message.success(`Đã xóa ${ids.length} lời mời`);
    } catch (error) {
      message.error(errorText(error, "Không xóa được"));
    }
  };

  const q = normalize(query.trim());
  const visible = q ? guests.filter((g) => normalize(`${inviteeOf(g)} ${g.group} ${g.message} ${g.id}`).includes(q)) : guests;
  const coming = guests.filter((g) => statusOf(g) === "coming");
  const declined = guests.filter((g) => statusOf(g) === "declined");
  const comingPeople = coming.reduce((sum, g) => sum + (rsvpByGuest.get(g.id)?.guests ?? 0), 0);
  const selectedGuests = guests.filter((g) => selected.includes(g.id));

  const display = (g: Guest, field: Field) => {
    switch (field) {
      case "name":
        return <Text strong>{g.name}</Text>;
      case "hostPronoun":
        return hostsOf(g);
      case "side":
        return g.side ? <Tag color={SIDE_TAG[g.side].color}>{SIDE_TAG[g.side].label}</Tag> : <Text type="secondary">—</Text>;
      case "message":
        return g.message ? (
          <Typography.Paragraph ellipsis={{ rows: 2, tooltip: g.message }} style={{ marginBottom: 0 }}>
            {g.message}
          </Typography.Paragraph>
        ) : null;
      default:
        return g[field];
    }
  };

  const columns: TableColumnsType<Guest> = [
    ...FIELDS.map((field) => ({
      title: field === "name" ? "Tên người / nhóm" : COLUMN[field].title,
      key: field,
      width: COLUMN[field].width,
      render: (_: unknown, g: Guest) =>
        editingId === g.id ? (
          <GuestCell field={field} value={draft} groups={groups} invalid={!draft.name.trim()} onPatch={(c) => setDraft((d) => ({ ...d, ...c }))} />
        ) : (
          display(g, field)
        ),
      ...(field === "name" && { sorter: (a: Guest, b: Guest) => a.name.localeCompare(b.name, "vi") }),
      ...(field === "side" && {
        filters: [...SIDES.slice(1), SIDES[0]].map((s) => ({ text: s.label, value: s.value })),
        onFilter: (value: React.Key | boolean, g: Guest) => g.side === value,
      }),
      ...(field === "group" && {
        filters: [...groups.map((g) => ({ text: g, value: g })), { text: "(Không có nhóm)", value: "" }],
        filterSearch: true,
        onFilter: (value: React.Key | boolean, g: Guest) => g.group === value,
        sorter: (a: Guest, b: Guest) => a.group.localeCompare(b.group, "vi"),
      }),
    })),
    {
      title: "Phản hồi",
      key: "status",
      width: 150,
      filters: (Object.keys(STATUS_TAG) as Status[]).map((s) => ({ text: STATUS_TAG[s].label, value: s })),
      onFilter: (value, g) => statusOf(g) === value,
      render: (_, g) => {
        const status = statusOf(g);
        const r = rsvpByGuest.get(g.id);
        return (
          <Tag color={STATUS_TAG[status].color}>
            {STATUS_TAG[status].label}
            {status === "coming" && r ? ` · ${r.guests} người` : ""}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 210,
      fixed: "right",
      render: (_, g) => {
        if (editingId === g.id) {
          return (
            <Space size={4}>
              <Button type="primary" size="small" icon={<SaveOutlined />} loading={saving} onClick={saveEdit}>
                Lưu
              </Button>
              <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingId(null)}>
                Hủy
              </Button>
            </Space>
          );
        }
        const url = guestUrl(origin, g);
        return (
          <Space size={0}>
            <Tooltip title={`Chép link (${g.id})`}>
              <Button type="text" icon={<LinkOutlined />} onClick={() => copy(url, "Đã chép link")} />
            </Tooltip>
            <Tooltip title="Chép lời nhắn kèm link">
              <Button type="text" icon={<MessageOutlined />} onClick={() => copy(inviteMessage(g, couple, url), "Đã chép lời nhắn")} />
            </Tooltip>
            <Tooltip title="Mở thiệp của khách này">
              <Button type="text" icon={<ExportOutlined />} href={url} target="_blank" rel="noreferrer" />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button type="text" icon={<EditOutlined />} disabled={!!editingId} onClick={() => startEdit(g)} />
            </Tooltip>
            <Popconfirm
              title={`Xóa lời mời "${inviteeOf(g)}"?`}
              description='Link đã gửi sẽ hiện "Quý khách".'
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Không"
              onConfirm={() => remove([g.id])}
            >
              <Tooltip title="Xóa">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Section title="Nhập khách mời">
        <GuestTableInput groups={groups} onCreate={createMany} />
        {!!created.length && (
          <Alert
            style={{ marginTop: 16 }}
            type="success"
            showIcon
            closable={{ onClose: () => setCreated([]) }}
            title={`Đã tạo ${created.length} lời mời${created.length === 1 ? ` cho ${inviteeOf(created[0])}` : ""}`}
            description={
              <Space orientation="vertical" size="small" style={{ width: "100%" }}>
                {created.length === 1 && (
                  <Text copyable code>
                    {guestUrl(origin, created[0])}
                  </Text>
                )}
                <Flex wrap gap={8}>
                  <Button type="primary" icon={<LinkOutlined />} onClick={() => copy(created.length === 1 ? guestUrl(origin, created[0]) : linksText(created), "Đã chép link")}>
                    {created.length === 1 ? "Chép link" : `Chép ${created.length} link`}
                  </Button>
                  <Button icon={<MessageOutlined />} onClick={() => copy(messagesText(created), "Đã chép lời nhắn")}>
                    {created.length === 1 ? "Chép lời nhắn kèm link" : `Chép ${created.length} lời nhắn kèm link`}
                  </Button>
                  {created.length === 1 && (
                    <Button icon={<ExportOutlined />} href={guestUrl(origin, created[0])} target="_blank" rel="noreferrer">
                      Mở thử
                    </Button>
                  )}
                </Flex>
              </Space>
            }
          />
        )}
      </Section>

      <Section title={`Danh sách khách mời (${guests.length})`}>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Flex wrap gap={8}>
            <Tag color="green">Sẽ đến: {coming.length} ({comingPeople} người)</Tag>
            <Tag color="red">Không đến: {declined.length}</Tag>
            <Tag>Chưa phản hồi: {guests.length - coming.length - declined.length}</Tag>
          </Flex>
          <Flex wrap gap={8} align="center">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên, nhóm, lời nhắn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: "1 1 240px", maxWidth: 420 }}
            />
            {!!selectedGuests.length && (
              <Space wrap size={8}>
                <Text type="secondary">Đã chọn {selectedGuests.length}</Text>
                <Button icon={<LinkOutlined />} onClick={() => copy(linksText(selectedGuests), "Đã chép link")}>
                  Chép link
                </Button>
                <Button icon={<MessageOutlined />} onClick={() => copy(messagesText(selectedGuests), "Đã chép lời nhắn")}>
                  Chép lời nhắn
                </Button>
                <Popconfirm
                  title={`Xóa ${selectedGuests.length} lời mời đã chọn?`}
                  description='Link đã gửi sẽ hiện "Quý khách".'
                  okText="Xóa"
                  okButtonProps={{ danger: true }}
                  cancelText="Không"
                  onConfirm={() => remove(selectedGuests.map((g) => g.id))}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </Flex>
          <Table<Guest>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={visible}
            scroll={{ x: "max-content" }}
            pagination={tablePagination}
            rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]), preserveSelectedRowKeys: true }}
            locale={{ emptyText: guests.length ? "Không có khách nào khớp" : "Chưa có lời mời nào. Nhập khách vào bảng ở trên nhé." }}
          />
        </Space>
      </Section>
    </Space>
  );
}
