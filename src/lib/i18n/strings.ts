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
  pendingReview: { EN: "Payment gateway pending approval", VI: "Cổng thanh toán đang chờ xét duyệt" },
  paymentFailed: { EN: "Failed to initiate payment", VI: "Không khởi tạo được thanh toán" },
};

// Footer
export const FOOTER = {
  toolsHeading: { EN: "Tools", VI: "Công cụ" },
  siteHeading: { EN: "Site", VI: "Trang" },
  connectHeading: { EN: "Connect", VI: "Liên hệ" },
  litReview: { EN: "Literature Review", VI: "Tìm tài liệu" },
  mentor: { EN: "Research Mentor", VI: "AI Mentor" },
  paperChecker: { EN: "Paper Checker", VI: "Kiểm tra bài" },
  polish: { EN: "Polish", VI: "Trau chuốt" },
  workspace: { EN: "Workspace", VI: "Workspace" },
  blog: { EN: "Blog", VI: "Blog" },
  about: { EN: "About", VI: "Giới thiệu" },
  authorBlog: { EN: "Tuyến Trần, MD — Courses & Blog", VI: "Tuyến Trần, MD — Khoá học & Blog" },
  tagline: { EN: "AI for Academic · Three phases. From literature to publication.", VI: "AI for Academic · Ba giai đoạn. Từ tài liệu đến bài báo." },
  builtBy: { EN: "Built by Tuyến Trần, MD", VI: "Phát triển bởi Tuyến Trần, MD" },
};

// Payment success page
export const PAYMENT = {
  pollingTitle: { EN: "Verifying payment…", VI: "Đang xác nhận thanh toán…" },
  pollingDesc: { EN: "We're confirming your transfer with the bank. This usually takes a few seconds.", VI: "Chúng tôi đang xác nhận chuyển khoản với ngân hàng. Thường mất vài giây." },
  successTitle: { EN: "Payment successful!", VI: "Thanh toán thành công!" },
  successDesc: { EN: "Your Pro plan is now active. Welcome aboard.", VI: "Gói Pro đã được kích hoạt. Chào mừng bạn." },
  goToWorkspace: { EN: "Go to Workspace →", VI: "Vào Workspace →" },
  pendingTitle: { EN: "Still waiting for confirmation", VI: "Vẫn đang chờ xác nhận" },
  pendingDesc: { EN: "Verification is taking longer than expected. Your payment is safe — refresh in a minute or contact support.", VI: "Việc xác nhận đang lâu hơn dự kiến. Khoản thanh toán của bạn vẫn an toàn — vui lòng làm mới sau ít phút hoặc liên hệ hỗ trợ." },
  failedTitle: { EN: "Payment not received", VI: "Chưa nhận được thanh toán" },
  failedDesc: { EN: "We couldn't confirm a transfer. If you already paid, contact support with your transaction reference.", VI: "Chúng tôi chưa thể xác nhận chuyển khoản. Nếu bạn đã chuyển, vui lòng liên hệ hỗ trợ kèm mã giao dịch." },
  backToBilling: { EN: "Back to billing", VI: "Về trang thanh toán" },
  contactSupport: { EN: "Contact support", VI: "Liên hệ hỗ trợ" },
};

// Workspace UI
export const WORKSPACE = {
  signin: { EN: "Sign in", VI: "Đăng nhập" },
  newProject: { EN: "+ Project", VI: "+ Dự án" },
  pro: { EN: "⬆ Pro", VI: "⬆ Pro" },
  toolsActive: { EN: "11 tools active", VI: "11 công cụ" },
  errPrefix: { EN: "Error", VI: "Lỗi" },
  fileNeeded: { EN: "This tool needs a file. Click 📎 to attach.", VI: "Tool này cần file. Bấm 📎 để đính kèm." },
  attachFile: { EN: "Attach file (PDF/DOCX, max 10MB)", VI: "Đính kèm file (PDF/DOCX, tối đa 10MB)" },
  send: { EN: "Send", VI: "Gửi" },
  artifactsTab: { EN: "🗂 Artifacts", VI: "🗂 Tài liệu" },
  chatTab: { EN: "💬 Chat", VI: "💬 Trò chuyện" },
  noArtifacts: { EN: "No artifacts yet — start a tool to see results here.", VI: "Chưa có kết quả — chạy một tool để xem kết quả ở đây." },
  fullReport: { EN: "Open full report →", VI: "Mở báo cáo đầy đủ →" },
  copyLink: { EN: "Copy link", VI: "Sao chép link" },
  download: { EN: "Download", VI: "Tải xuống" },
  openPdf: { EN: "Open PDF →", VI: "Mở PDF →" },
  copyDoi: { EN: "Copy DOI", VI: "Sao chép DOI" },
  copied: { EN: "Copied!", VI: "Đã sao chép!" },
  showFull: { EN: "Show full text", VI: "Xem toàn văn" },
  showLess: { EN: "Show less", VI: "Thu gọn" },
  recommendation: { EN: "Recommendation", VI: "Đề xuất" },
  similarity: { EN: "Similarity", VI: "Mức trùng lặp" },
  sources: { EN: "Sources", VI: "Nguồn" },
  noSources: { EN: "No matching sources detected.", VI: "Không phát hiện nguồn nào trùng khớp." },
  totalRefs: { EN: "Total", VI: "Tổng" },
  verifiedRefs: { EN: "Verified", VI: "Đã xác minh" },
  unverifiedRefs: { EN: "Unverified", VI: "Chưa xác minh" },
  aiScore: { EN: "AI score (0=human · 100=AI)", VI: "Điểm AI (0=người · 100=AI)" },
  patterns: { EN: "Detected patterns", VI: "Mẫu phát hiện" },
  redFlags: { EN: "⚠ Red flags", VI: "⚠ Cảnh báo" },
};

// About page
export const ABOUT = {
  pageTitle: { EN: "About AI for Academic", VI: "Giới thiệu AI for Academic" },
  pageSubtitle: { EN: "Built by a clinician for clinicians. Built in public.", VI: "Được xây dựng bởi bác sĩ, cho bác sĩ. Phát triển công khai." },
};

// Common
export const COMMON = {
  exportFailed: { EN: "Export failed", VI: "Xuất file thất bại" },
  tryAgain: { EN: "Try again", VI: "Thử lại" },
  loading: { EN: "Loading…", VI: "Đang tải…" },
};
