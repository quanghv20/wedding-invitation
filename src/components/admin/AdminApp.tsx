"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, App, Button, Card, Checkbox, Col, DatePicker, Flex, Form, Input, Menu, Result, Row, Select, Space, Spin, Table, Tag, Tooltip, Typography } from "antd";
import type { TableColumnsType } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  ExportOutlined,
  KeyOutlined,
  LogoutOutlined,
  PlusOutlined,
  SaveOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { EVENT_PLACES, EVENT_PLACE_LABEL, SIDE_LABEL, type EventPlace, type WeddingContent } from "@/config/wedding";
import type { Rsvp } from "@/app/api/rsvp/route";
import type { Wish } from "@/app/api/wishes/route";
import { inviteeOf, type Guest } from "@/lib/guest";
import { AdminTheme } from "./AdminTheme";
import { AlbumContext, GalleryEditor, ImageField } from "./AlbumPicker";
import { BackupManager } from "./BackupManager";
import { SUGGESTED_GALLERY_SIZE, withSuggestedImages } from "./suggestImages";
import { GuestManager } from "./GuestManager";
import { PREVIEW_READY, PREVIEW_SECTIONS, PREVIEW_UPDATE, type PreviewMessage, type PreviewSection } from "./previewProtocol";
import { Section, normalize, tablePagination, vnTime } from "./ui";

const { Text } = Typography;

const EVENT_PLACE_OPTIONS = EVENT_PLACES.map((value) => ({ value, label: EVENT_PLACE_LABEL[value] }));

type Data = { content: WeddingContent; rsvp: Rsvp[]; wishes: Wish[]; guests: Guest[]; album: string[] };
type Tab = "content" | "guests" | "rsvp" | "wishes" | "password" | "backup";

// ---------- Ô nhập của form nội dung (nằm trong <Row>) ----------

function Field({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  hint,
  full,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  /** Chiếm cả hàng (mặc định nửa hàng trên màn hình rộng, ô nhiều dòng luôn cả hàng) */
  full?: boolean;
}) {
  return (
    <Col xs={24} sm={full || multiline ? 24 : 12}>
      <Form.Item label={label} extra={hint}>
        {multiline ? (
          <Input.TextArea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </Form.Item>
    </Col>
  );
}

/** Ngày giờ lưu dạng ISO cố định múi giờ Việt Nam; chỉ sửa phần giờ đồng hồ, không đổi múi giờ */
function DateField({ label, value, onChange, full }: { label: string; value: string; onChange: (value: string) => void; full?: boolean }) {
  const parsed = value ? dayjs(value.slice(0, 16)) : null;
  return (
    <Col xs={24} sm={full ? 24 : 12}>
      <Form.Item label={label}>
        <DatePicker
          showTime={{ format: "HH:mm" }}
          format="DD/MM/YYYY HH:mm"
          value={parsed?.isValid() ? parsed : null}
          onChange={(d) => onChange(d ? `${d.format("YYYY-MM-DDTHH:mm")}:00+07:00` : "")}
          style={{ width: "100%" }}
        />
      </Form.Item>
    </Col>
  );
}

const GUTTER = 16;

function ListEditor<T>({
  items,
  onChange,
  blank,
  itemLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  itemLabel: string;
  render: (item: T, patch: (changes: Partial<T>) => void) => React.ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    next.splice(to, 0, ...next.splice(from, 1));
    onChange(next);
  };

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {items.map((item, i) => (
        <Card
          key={i}
          size="small"
          type="inner"
          title={`${itemLabel} ${i + 1}`}
          extra={
            <Space size={0}>
              <Tooltip title="Chuyển lên">
                <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => move(i, i - 1)} />
              </Tooltip>
              <Tooltip title="Chuyển xuống">
                <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={i === items.length - 1} onClick={() => move(i, i + 1)} />
              </Tooltip>
              <Tooltip title="Xóa">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => onChange(items.filter((_, j) => j !== i))} />
              </Tooltip>
            </Space>
          }
        >
          <Row gutter={GUTTER}>{render(item, (changes) => onChange(items.map((it, j) => (j === i ? { ...it, ...changes } : it))))}</Row>
        </Card>
      ))}
      <Button type="dashed" block icon={<PlusOutlined />} onClick={() => onChange([...items, blank])}>
        Thêm {itemLabel.toLowerCase()}
      </Button>
    </Space>
  );
}

function PersonFields({ person, onChange }: { person: WeddingContent["groom"]; onChange: (person: WeddingContent["groom"]) => void }) {
  const patch = (changes: Partial<WeddingContent["groom"]>) => onChange({ ...person, ...changes });
  return (
    <Row gutter={GUTTER}>
      <Field label="Tên hiển thị" value={person.name} onChange={(name) => patch({ name })} />
      <Field label="Họ tên đầy đủ" value={person.fullName} onChange={(fullName) => patch({ fullName })} />
      <Field label="Vai trò" value={person.role} onChange={(role) => patch({ role })} />
      <Field label="Ngày sinh" value={person.birthday} onChange={(birthday) => patch({ birthday })} />
      <Field label="Bố" value={person.parents.father} onChange={(father) => patch({ parents: { ...person.parents, father } })} />
      <Field label="Mẹ" value={person.parents.mother} onChange={(mother) => patch({ parents: { ...person.parents, mother } })} />
      <Field label="Giới thiệu" multiline value={person.bio} onChange={(bio) => patch({ bio })} />
      <ImageField label="Ảnh" value={person.photo} onChange={(photo) => patch({ photo })} />
    </Row>
  );
}

/** Khung điện thoại chạy chính các component của thiệp, hiển thị cả nội dung chưa lưu */
function PhonePreview({ content, section }: { content: WeddingContent; section: PreviewSection }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [readyCount, setReadyCount] = useState(0);
  const label = PREVIEW_SECTIONS.find((s) => s.id === section)?.label;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === PREVIEW_READY) setReadyCount((count) => count + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!readyCount) return;
    const message: PreviewMessage = { type: PREVIEW_UPDATE, content, section };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [readyCount, content, section]);

  return (
    <aside className="sticky top-[80px] hidden lg:block">
      <p className="mb-2 text-center text-xs font-medium text-muted">Xem trước: {label}</p>
      <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-xl">
        <iframe
          ref={frameRef}
          src="/admin/preview"
          title="Xem trước trên điện thoại"
          className="block h-[min(calc(100svh-200px),780px)] w-[390px] rounded-[1.75rem] bg-white"
        />
      </div>
    </aside>
  );
}

function ContentForm({ content, section, onChange }: { content: WeddingContent; section: PreviewSection; onChange: (content: WeddingContent) => void }) {
  const update = (changes: Partial<WeddingContent>) => onChange({ ...content, ...changes });
  const album = useContext(AlbumContext);

  return (
    <Form layout="vertical" component={false}>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {section === "home" && (
          <Section title="Trang chủ">
            <Row gutter={GUTTER}>
              <Field label="Tên chú rể" value={content.groom.name} onChange={(name) => update({ groom: { ...content.groom, name } })} />
              <Field label="Tên cô dâu" value={content.bride.name} onChange={(name) => update({ bride: { ...content.bride, name } })} />
              <Field full label="Ngày âm lịch" value={content.lunarDate} onChange={(lunarDate) => update({ lunarDate })} />
              <ImageField label="Ảnh chính" value={content.hero.image} onChange={(image) => update({ hero: { image } })} />
            </Row>
            <Text type="secondary">Lịch trình và địa điểm ở trang chủ được sửa trong tab Sự kiện.</Text>
          </Section>
        )}

        {section === "countdown" && (
          <Section title="Đếm ngược & lời dẫn">
            <Row gutter={GUTTER}>
              <DateField full label="Thời điểm đếm ngược (giờ Việt Nam)" value={content.date} onChange={(date) => update({ date })} />
              <Field label="Câu trích dẫn" multiline rows={2} value={content.quote} onChange={(quote) => update({ quote })} />
              <Field label="Tác giả câu trích dẫn" value={content.quoteAuthor} onChange={(quoteAuthor) => update({ quoteAuthor })} />
            </Row>
          </Section>
        )}

        {section === "couple" && (
          <>
            <Section title="Chú rể">
              <PersonFields person={content.groom} onChange={(groom) => update({ groom })} />
            </Section>
            <Section title="Cô dâu">
              <PersonFields person={content.bride} onChange={(bride) => update({ bride })} />
            </Section>
          </>
        )}

        {section === "events" && (
          <Section title="Sự kiện">
            <Row gutter={[GUTTER, GUTTER]} style={{ marginBottom: 16 }}>
              {(["groom", "bride"] as const).map((side) => (
                <Col key={side} xs={24} sm={12}>
                  <Card size="small" type="inner" title={`Địa điểm ${SIDE_LABEL[side].toLowerCase()}`}>
                    <Row gutter={GUTTER}>
                      <Field
                        full
                        label="Tên địa điểm"
                        value={content.places[side].venue}
                        onChange={(venue) => update({ places: { ...content.places, [side]: { ...content.places[side], venue } } })}
                      />
                      <Field
                        full
                        label="Địa chỉ (dùng cho bản đồ và chỉ đường)"
                        value={content.places[side].address}
                        onChange={(address) => update({ places: { ...content.places, [side]: { ...content.places[side], address } } })}
                      />
                    </Row>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Link chung cho khách {SIDE_LABEL[side].toLowerCase()}: <Text code>/?side={side}</Text>
                    </Text>
                  </Card>
                </Col>
              ))}
              <Col span={24}>
                <Alert
                  type="info"
                  showIcon
                  title={
                    <>
                      Sự kiện chọn địa điểm &quot;Theo bên của khách&quot; thì địa chỉ hiện theo bên: link có <Text code>?side=groom</Text> /{" "}
                      <Text code>?side=bride</Text>, hoặc link mời riêng theo bên đã chọn cho khách. Không rõ bên nào thì thiệp hiện cả hai (như khung
                      xem trước).
                    </>
                  }
                />
              </Col>
            </Row>
            <ListEditor
              items={content.events}
              onChange={(events) => update({ events })}
              itemLabel="Sự kiện"
              blank={{ title: "", side: "", start: "", end: "", image: "", main: false, place: "guest" as EventPlace }}
              render={(event, patch) => (
                <>
                  <Field label="Tên sự kiện" value={event.title} onChange={(title) => patch({ title })} />
                  <Field label="Nhãn (vd: Ngày thứ nhất)" value={event.side} onChange={(side) => patch({ side })} />
                  <DateField label="Bắt đầu (giờ Việt Nam)" value={event.start} onChange={(start) => patch({ start })} />
                  <DateField label="Kết thúc (giờ Việt Nam)" value={event.end} onChange={(end) => patch({ end })} />
                  <Col xs={24} sm={12}>
                    <Form.Item label="Địa điểm">
                      <Select value={event.place} options={EVENT_PLACE_OPTIONS} onChange={(place) => patch({ place })} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label=" " colon={false}>
                      <Checkbox
                        checked={event.main}
                        onChange={(e) =>
                          update({
                            events: content.events.map((it) =>
                              it === event ? { ...it, main: e.target.checked } : { ...it, main: e.target.checked ? false : it.main },
                            ),
                          })
                        }
                      >
                        Sự kiện chính (hiển thị nổi bật ở đầu trang)
                      </Checkbox>
                    </Form.Item>
                  </Col>
                  <ImageField label="Ảnh" value={event.image} onChange={(image) => patch({ image })} />
                </>
              )}
            />
          </Section>
        )}

        {section === "story" && (
          <Section title="Chuyện tình">
            <ListEditor
              items={content.story}
              onChange={(story) => update({ story })}
              itemLabel="Chương"
              blank={{ date: "", title: "", text: "", image: "" }}
              render={(item, patch) => (
                <>
                  <Field label="Thời gian" value={item.date} onChange={(date) => patch({ date })} />
                  <Field label="Tiêu đề" value={item.title} onChange={(title) => patch({ title })} />
                  <Field label="Nội dung" multiline value={item.text} onChange={(text) => patch({ text })} />
                  <ImageField label="Ảnh" value={item.image} onChange={(image) => patch({ image })} />
                </>
              )}
            />
          </Section>
        )}

        {section === "gallery" && (
          <Section title="Album">
            <Alert
              style={{ marginBottom: 20 }}
              type="info"
              title={`Chọn ngẫu nhiên ảnh hợp với từng phần (trang chủ, cô dâu chú rể, sự kiện, chuyện tình, cuối trang) và ${SUGGESTED_GALLERY_SIZE} ảnh cho album. Bấm lại để đổi bộ khác, ưng thì bấm Lưu.`}
              action={
                <Button type="primary" icon={<SwapOutlined />} onClick={() => onChange(withSuggestedImages(content, album))}>
                  Gợi ý ngẫu nhiên
                </Button>
              }
            />
            <GalleryEditor gallery={content.gallery} order={content.galleryOrder ?? []} onChange={update} />
            <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
              Ảnh lấy từ thư mục public/albums. Ảnh thứ 4 đang hiển thị được dùng làm nền phần Xác nhận tham dự.
            </Text>
          </Section>
        )}

        {section === "rsvp" && (
          <Section title="Xác nhận tham dự">
            <Row gutter={GUTTER}>
              <Field full label="Hạn xác nhận tham dự" value={content.rsvpDeadline} onChange={(rsvpDeadline) => update({ rsvpDeadline })} />
            </Row>
            <Text type="secondary">Ảnh nền của phần này là ảnh thứ 4 trong Album. Form trong khung xem trước không gửi dữ liệu thật.</Text>
          </Section>
        )}

        {section === "footer" && (
          <Section title="Cuối trang & nhạc">
            <Row gutter={GUTTER}>
              <ImageField label="Ảnh cuối trang" value={content.footerImage} onChange={(footerImage) => update({ footerImage })} />
              <Field label="Ngày hiển thị ở cuối trang" value={content.displayDate} onChange={(displayDate) => update({ displayDate })} />
              <Field label="Nhạc nền" value={content.music} onChange={(music) => update({ music })} />
            </Row>
          </Section>
        )}

        {section === "gift" && (
          <Section title="Mừng cưới">
            <ListEditor
              items={content.gifts}
              onChange={(gifts) => update({ gifts })}
              itemLabel="Tài khoản"
              blank={{ label: "", bankId: "", bankName: "", accountNo: "", accountName: "" }}
              render={(gift, patch) => (
                <>
                  <Field label="Tiêu đề" value={gift.label} onChange={(label) => patch({ label })} />
                  <Field label="Tên ngân hàng" value={gift.bankName} onChange={(bankName) => patch({ bankName })} />
                  <Field label="Mã VietQR (VCB, TCB, MB...)" value={gift.bankId} onChange={(bankId) => patch({ bankId })} />
                  <Field label="Số tài khoản" value={gift.accountNo} onChange={(accountNo) => patch({ accountNo })} />
                  <Field label="Chủ tài khoản" value={gift.accountName} onChange={(accountName) => patch({ accountName })} />
                </>
              )}
            />
          </Section>
        )}
      </Space>
    </Form>
  );
}

// ---------- Xác nhận tham dự & lời chúc ----------

const byTime = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

function RsvpList({ items, invited }: { items: Rsvp[]; invited: Guest[] }) {
  const [query, setQuery] = useState("");
  const guestById = useMemo(() => new Map(invited.map((g) => [g.id, g])), [invited]);
  const coming = items.filter((r) => r.attending);
  const people = coming.reduce((sum, r) => sum + r.guests, 0);
  const q = normalize(query.trim());
  const visible = q ? items.filter((r) => normalize(`${r.name} ${r.phone} ${r.note}`).includes(q)) : items;

  const columns: TableColumnsType<Rsvp> = [
    {
      title: "Tên",
      key: "name",
      width: 220,
      sorter: (a, b) => a.name.localeCompare(b.name, "vi"),
      render: (_, r) => (
        <>
          <Text strong>{r.name}</Text>
          {r.guestId && guestById.has(r.guestId) && (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Link mời: {inviteeOf(guestById.get(r.guestId))}
            </Text>
          )}
        </>
      ),
    },
    { title: "Điện thoại", dataIndex: "phone", width: 130 },
    {
      title: "Tham dự",
      key: "attending",
      width: 110,
      filters: [
        { text: "Có", value: true },
        { text: "Không", value: false },
      ],
      onFilter: (value, r) => r.attending === value,
      render: (_, r) => (r.attending ? <Tag color="green">Có</Tag> : <Tag color="red">Không</Tag>),
    },
    { title: "Số người", key: "guests", width: 100, align: "right", sorter: (a, b) => a.guests - b.guests, render: (_, r) => (r.attending ? r.guests : "") },
    {
      title: "Bên",
      key: "side",
      width: 110,
      filters: Object.entries(SIDE_LABEL).map(([value, text]) => ({ text, value })),
      onFilter: (value, r) => r.side === value,
      render: (_, r) => SIDE_LABEL[r.side as keyof typeof SIDE_LABEL] ?? r.side,
    },
    { title: "Ghi chú", dataIndex: "note", width: 240 },
    {
      title: "Thời gian",
      key: "createdAt",
      width: 170,
      sorter: byTime,
      render: (_, r) => <Text type="secondary">{vnTime(r.createdAt)}</Text>,
    },
  ];

  return (
    <Section title="Xác nhận tham dự">
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Flex wrap gap={8}>
          <Tag>{items.length} phản hồi</Tag>
          <Tag color="green">{coming.length} sẽ đến</Tag>
          <Tag color="gold">Tổng {people} khách</Tag>
        </Flex>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên, số điện thoại, ghi chú..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        <Table<Rsvp> rowKey="id" size="middle" columns={columns} dataSource={visible} scroll={{ x: "max-content" }} pagination={tablePagination} />
      </Space>
    </Section>
  );
}

function WishList({ items }: { items: Wish[] }) {
  const columns: TableColumnsType<Wish> = [
    { title: "Tên", key: "name", width: 200, render: (_, w) => <Text strong>{w.name}</Text> },
    { title: "Lời chúc", dataIndex: "message" },
    {
      title: "Thời gian",
      key: "createdAt",
      width: 170,
      sorter: byTime,
      render: (_, w) => <Text type="secondary">{vnTime(w.createdAt)}</Text>,
    },
  ];
  return (
    <Section title={`Lời chúc (${items.length})`}>
      <Table<Wish>
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={items}
        scroll={{ x: 640 }}
        pagination={tablePagination}
        locale={{ emptyText: "Chưa có lời chúc nào." }}
      />
    </Section>
  );
}

// ---------- Đăng nhập & mật khẩu ----------

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (res.ok) return onLoggedIn();
      setError((await res.json().catch(() => null))?.error ?? "Có lỗi xảy ra");
    } catch {
      setError("Không kết nối được tới server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-ivory px-4">
      <Card style={{ width: "100%", maxWidth: 380 }}>
        <h1 className="mb-6 text-center font-serif text-3xl font-semibold text-wine">Quản trị thiệp</h1>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="username" rules={[{ required: true, message: "Nhập tài khoản" }]}>
            <Input size="large" autoComplete="username" placeholder="Tài khoản" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
            <Input.Password size="large" autoComplete="current-password" placeholder="Mật khẩu" />
          </Form.Item>
          {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" size="large" block loading={busy}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </main>
  );
}

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };

function PasswordForm({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PasswordValues>();
  const [busy, setBusy] = useState(false);

  const onFinish = async (values: PasswordValues) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/session", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) return message.error((await res.json().catch(() => null))?.error ?? "Có lỗi xảy ra");
      form.resetFields();
      message.success("Đã đổi mật khẩu");
    } catch {
      message.error("Không kết nối được tới server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Đổi mật khẩu">
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 380 }}>
        <Form.Item name="currentPassword" label="Mật khẩu cũ" rules={[{ required: true, message: "Nhập mật khẩu cũ" }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Nhập mật khẩu mới" },
            { min: 8, message: "Ít nhất 8 ký tự" },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Nhập lại mật khẩu mới" },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || value === getFieldValue("newPassword") ? Promise.resolve() : Promise.reject(new Error("Mật khẩu xác nhận không khớp")),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={busy}>
          Đổi mật khẩu
        </Button>
      </Form>
    </Section>
  );
}

// ---------- Khung trang ----------

function AdminShell() {
  const { message } = App.useApp();
  const [status, setStatus] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [data, setData] = useState<Data | null>(null);
  /** Nội dung đã lưu trên server, để biết đang có thay đổi chưa lưu */
  const [savedContent, setSavedContent] = useState("");
  const [tab, setTab] = useState<Tab>("content");
  const [section, setSection] = useState<PreviewSection>("home");
  const [saving, setSaving] = useState(false);

  const receive = useCallback((next: Data) => {
    setData(next);
    setSavedContent(JSON.stringify(next.content));
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/data", { cache: "no-store" });
      if (res.status === 401) return setStatus("login");
      if (!res.ok) return setStatus("error");
      receive(await res.json());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [receive]);

  /** Tải lại dữ liệu ngầm (sau khi khôi phục backup), không xóa màn hình đang xem */
  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/data", { cache: "no-store" }).catch(() => null);
    if (res?.status === 401) return setStatus("login");
    if (res?.ok) receive(await res.json());
  }, [receive]);

  const unauthorized = useCallback(() => setStatus("login"), []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!data && JSON.stringify(data.content) !== savedContent;

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data.content) });
      if (res.status === 401) return setStatus("login");
      const result = await res.json().catch(() => null);
      if (!res.ok) return message.error(result?.error ?? "Không lưu được");
      setData({ ...data, content: result.content });
      setSavedContent(JSON.stringify(result.content));
      message.success("Đã lưu, thiệp đã cập nhật");
    } catch {
      message.error("Không kết nối được tới server");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
    setData(null);
    setStatus("login");
  };

  if (status === "login") return <LoginForm onLoggedIn={load} />;
  if (status === "error") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-ivory">
        <Result
          status="error"
          title="Không tải được dữ liệu từ database"
          extra={
            <Button type="primary" onClick={load}>
              Thử lại
            </Button>
          }
        />
      </main>
    );
  }
  if (status === "loading" || !data) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-ivory">
        <Spin size="large" />
      </main>
    );
  }

  const menuItems = [
    { key: "content", label: "Nội dung thiệp" },
    { key: "guests", label: `Khách mời (${data.guests.length})` },
    { key: "rsvp", label: `Xác nhận (${data.rsvp.length})` },
    { key: "wishes", label: `Lời chúc (${data.wishes.length})` },
  ];
  const iconTab = (id: Tab, title: string, icon: React.ReactNode) => (
    <Tooltip title={title}>
      <Button type={tab === id ? "primary" : "text"} ghost={tab === id} shape="circle" icon={icon} aria-label={title} onClick={() => setTab(id)} />
    </Tooltip>
  );

  return (
    <div className="min-h-svh bg-ivory text-ink">
      <header className="sticky top-0 z-20 border-b border-gold/20 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4">
          <h1 className="shrink-0 font-serif text-xl font-semibold text-wine">Quản trị thiệp</h1>
          <Menu
            mode="horizontal"
            selectedKeys={[tab]}
            items={menuItems}
            onClick={({ key }) => setTab(key as Tab)}
            style={{ flex: 1, minWidth: 0, borderBottom: "none" }}
          />
          <Space size={4}>
            <Tooltip title="Xem thiệp">
              <Button type="text" shape="circle" icon={<ExportOutlined />} href="/" target="_blank" rel="noreferrer" aria-label="Xem thiệp" />
            </Tooltip>
            {iconTab("password", "Đổi mật khẩu", <KeyOutlined />)}
            {iconTab("backup", "Sao lưu & khôi phục", <CloudServerOutlined />)}
            <Tooltip title="Đăng xuất">
              <Button type="text" shape="circle" icon={<LogoutOutlined />} onClick={logout} aria-label="Đăng xuất" />
            </Tooltip>
          </Space>
        </div>
      </header>

      <main className={`mx-auto px-4 py-6 pb-28 ${tab === "password" || tab === "backup" ? "max-w-5xl" : "max-w-[1400px]"}`}>
        {tab === "content" && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              {/* Tự xuống dòng khi hẹp để luôn thấy đủ các phần (Tabs của antd sẽ giấu bớt vào nút "...") */}
              <nav aria-label="Phần cần chỉnh sửa" style={{ marginBottom: 20 }}>
                <Flex wrap gap={8}>
                  {PREVIEW_SECTIONS.map((s) => (
                    <Button
                      key={s.id}
                      shape="round"
                      type={section === s.id ? "primary" : "default"}
                      aria-pressed={section === s.id}
                      onClick={() => setSection(s.id)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </Flex>
              </nav>
              <AlbumContext value={data.album}>
                <ContentForm content={data.content} section={section} onChange={(content) => setData({ ...data, content })} />
              </AlbumContext>
            </div>
            <PhonePreview content={data.content} section={section} />
          </div>
        )}
        {tab === "guests" && (
          <GuestManager guests={data.guests} rsvp={data.rsvp} content={data.content} onChange={(guests) => setData({ ...data, guests })} onUnauthorized={unauthorized} />
        )}
        {tab === "rsvp" && <RsvpList items={data.rsvp} invited={data.guests} />}
        {tab === "wishes" && <WishList items={data.wishes} />}
        {tab === "password" && <PasswordForm onUnauthorized={unauthorized} />}
        {tab === "backup" && <BackupManager onUnauthorized={unauthorized} onRestored={reload} />}
      </main>

      {tab === "content" && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gold/20 bg-white/95">
          <Flex style={{ maxWidth: 1400, margin: "0 auto", padding: "16px" }} justify="end" align="center" gap={12}>
            {dirty && <Tag color="warning">Có thay đổi chưa lưu</Tag>}
            <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={save}>
              Lưu
            </Button>
          </Flex>
        </div>
      )}
    </div>
  );
}

export function AdminApp() {
  return (
    <AdminTheme>
      <AdminShell />
    </AdminTheme>
  );
}
