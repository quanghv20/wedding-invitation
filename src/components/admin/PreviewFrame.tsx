"use client";

import { Component, useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { WeddingContent } from "@/config/wedding";
import { isAllowedImage } from "@/lib/images";
import { WeddingProvider } from "../WeddingProvider";
import { Hero } from "../Hero";
import { Countdown } from "../Countdown";
import { Couple } from "../Couple";
import { LoveStory } from "../LoveStory";
import { Events } from "../Events";
import { Gallery } from "../Gallery";
import { Rsvp } from "../Rsvp";
import { Gift } from "../Gift";
import { Footer } from "../Footer";
import { PREVIEW_READY, PREVIEW_UPDATE, type PreviewMessage, type PreviewSection } from "./previewProtocol";

const SECTIONS: Record<PreviewSection, ComponentType> = {
  home: Hero,
  countdown: Countdown,
  couple: Couple,
  story: LoveStory,
  events: Events,
  gallery: Gallery,
  rsvp: Rsvp,
  gift: Gift,
  footer: Footer,
};

const BLANK_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

/** Nội dung đang gõ dở (ảnh chưa đủ link, ngày trống) không được làm hỏng khung xem trước */
function toRenderable(content: WeddingContent): WeddingContent {
  const image = (src: string) => (isAllowedImage(src) ? src : BLANK_IMAGE);
  const fallbackDate = Number.isNaN(Date.parse(content.date)) ? new Date().toISOString() : content.date;
  const date = (value: string) => (Number.isNaN(Date.parse(value)) ? fallbackDate : value);
  return {
    ...content,
    date: fallbackDate,
    groom: { ...content.groom, photo: image(content.groom.photo) },
    bride: { ...content.bride, photo: image(content.bride.photo) },
    hero: { image: image(content.hero.image) },
    footerImage: image(content.footerImage),
    events: content.events.map((e) => ({ ...e, image: image(e.image), start: date(e.start), end: date(e.end) })),
    story: content.story.map((s) => ({ ...s, image: image(s.image) })),
    gallery: content.gallery.filter(isAllowedImage),
  };
}

/** Lỗi hiển thị chỉ ảnh hưởng khung xem trước và tự hết khi nội dung thay đổi */
class PreviewBoundary extends Component<{ content: WeddingContent; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previous: { content: WeddingContent }) {
    if (this.state.failed && previous.content !== this.props.content) this.setState({ failed: false });
  }

  render() {
    if (this.state.failed) {
      return <p className="p-8 text-center text-sm text-muted">Thông tin đang nhập chưa đủ để xem trước phần này.</p>;
    }
    return this.props.children;
  }
}

export function PreviewFrame() {
  const [preview, setPreview] = useState<{ content: WeddingContent; section: PreviewSection } | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== PREVIEW_UPDATE) return;
      setPreview({ content: toRenderable(event.data.content), section: event.data.section });
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const section = preview?.section;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  if (!preview) return null;
  const Section = SECTIONS[preview.section];

  return (
    // Xem trước không được gửi thật: chặn form trước khi tới handler của Rsvp
    <div
      onSubmitCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <WeddingProvider content={preview.content}>
        <PreviewBoundary content={preview.content}>
          <Section key={preview.section} />
        </PreviewBoundary>
      </WeddingProvider>
    </div>
  );
}
