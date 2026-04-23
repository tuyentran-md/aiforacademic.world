import type { Lang } from "@/lib/i18n";

export function t(lang: Lang, en: string, vi: string): string {
  return lang === "VI" ? vi : en;
}

// Nav
export const NAV = {
  workspace: { EN: "Workspace", VI: "Workspace" },
  tools:     { EN: "Tools", VI: "Công cụ" },
  resources: { EN: "Resources", VI: "Tài liệu" },
  blog:      { EN: "Blog", VI: "Blog" },
  about:     { EN: "About", VI: "Giới thiệu" },
};

// Home page
export const HOME = {
  tagline:   { EN: "AI · Research · Academic", VI: "AI · Nghiên cứu · Học thuật" },
  headline:  { EN: "AI tools for academic works.", VI: "Công cụ AI cho nghiên cứu khoa học." },
  subhead:   { EN: "Three phases. From literature to publication.", VI: "Ba giai đoạn. Từ tài liệu đến bài báo." },
  ctaTry:    { EN: "Try Workspace free →", VI: "Thử Workspace miễn phí →" },
  ctaBrowse: { EN: "Browse tools", VI: "Xem công cụ" },
  howTitle:  { EN: "How it works", VI: "Cách hoạt động" },
  step1t:    { EN: "Gather literature", VI: "Tìm tài liệu" },
  step1d:    { EN: "Search, fetch full-text, translate abstracts and PDFs into Vietnamese.", VI: "Tìm kiếm, lấy toàn văn, dịch tóm tắt và PDF sang tiếng Việt." },
  step2t:    { EN: "Draft with AI mentor", VI: "Soạn thảo với AI" },
  step2d:    { EN: "Validate your idea, generate a PICO protocol, stream a manuscript draft.", VI: "Kiểm tra ý tưởng, tạo đề cương PICO, soạn bản thảo nhanh." },
  step3t:    { EN: "Check before submit", VI: "Kiểm tra trước khi nộp" },
  step3d:    { EN: "Citation audit, AI detection, plagiarism scan, editor-style peer review.", VI: "Kiểm tra trích dẫn, phát hiện AI, quét đạo văn, phản biện chuyên sâu." },
  statPapers:  { EN: "papers checked", VI: "bài báo kiểm tra" },
  statRefs:    { EN: "fabricated refs found", VI: "tài liệu giả mạo" },
  statDoctors: { EN: "doctors onboard", VI: "bác sĩ đang dùng" },
};

// Tools page
export const TOOLS = {
  sectionLabel: { EN: "Tools", VI: "Công cụ" },
  headline:     { EN: "Three phases. One toolkit.", VI: "Ba giai đoạn. Một bộ công cụ." },
  subhead: {
    EN: "Each tool works standalone — upload, get result, done. Or use the",
    VI: "Mỗi công cụ hoạt động độc lập — tải lên, nhận kết quả. Hoặc dùng",
  },
  workspaceLink:  { EN: "Workspace", VI: "Workspace" },
  subheadSuffix: {
    EN: "for a guided, project-scoped conversation with AI that chains all tools automatically.",
    VI: "để trò chuyện có hướng dẫn, chạy tự động toàn bộ quy trình.",
  },
  learnMore: { EN: "Learn more →", VI: "Tìm hiểu thêm →" },
  tryFree:   { EN: "Try free →", VI: "Dùng miễn phí →" },
};

// Billing page
export const BILLING = {
  headline:    { EN: "Simple, transparent pricing", VI: "Giá đơn giản, minh bạch" },
  subhead:     { EN: "Start free. Upgrade when your research workflow needs it.", VI: "Bắt đầu miễn phí. Nâng cấp khi nghiên cứu của bạn cần thêm." },
  monthly:     { EN: "Monthly", VI: "Hàng tháng" },
  yearly:      { EN: "Yearly (Save $20)", VI: "Hàng năm (Tiết kiệm $20)" },
  qrLabel:     { EN: "QR Code (Vietnam)", VI: "Mã QR (Nội Địa)" },
  qrDesc:      { EN: "Quick payment via bank transfer QR. Best for Vietnam users.", VI: "Thanh toán nhanh qua chuyển khoản QR code. Phù hợp cho người dùng Việt Nam." },
  qrFeat1:     { EN: "Momo, Viettel Pay supported", VI: "Hỗ trợ Momo, Viettel Pay" },
  qrFeat2:     { EN: "All banks: VCB, TCB, MB...", VI: "Hỗ trợ tất cả ngân hàng VCB, TCB, MB..." },
  qrFeat3:     { EN: "Auto-activate in ~1 minute", VI: "Tự động kích hoạt sau ~1 phút" },
  qrCta:       { EN: "Upgrade with QR →", VI: "Nâng cấp Pro với QR →" },
  qrCtaLogin:  { EN: "Sign in to Upgrade", VI: "Đăng nhập để Nâng cấp" },
  qrLoading:   { EN: "Creating QR code...", VI: "Đang tạo mã QR..." },
  cardLabel:   { EN: "Credit Card (International)", VI: "Thẻ tín dụng (Quốc Tế)" },
  cardDesc:    { EN: "Pay via LemonSqueezy (Paddle). For international users or credit card payment.", VI: "Thanh toán qua cổng LemonSqueezy (Paddle). Dành cho người dùng quốc tế hoặc dùng thẻ tín dụng." },
  cardFeat1:   { EN: "Visa, Mastercard supported", VI: "Hỗ trợ thẻ Visa, Mastercard" },
  cardFeat2:   { EN: "Apple Pay, Google Pay", VI: "Hỗ trợ Apple Pay, Google Pay" },
  cardCta:     { EN: "Pay by card →", VI: "Thanh toán thẻ →" },
  comingSoon:  { EN: "Coming Soon", VI: "Sắp ra mắt" },
  month:       { EN: "month", VI: "tháng" },
  year:        { EN: "year", VI: "năm" },
  recommended: { EN: "Recommended", VI: "Khuyên dùng" },
};
