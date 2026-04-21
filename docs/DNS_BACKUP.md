# DNS backup — aiforacademic.world (pre-migration to Vercel)

**Date**: 2026-04-16
**Source**: Hostinger DNS panel (hpanel.hostinger.com/external-domain/aiforacademic.world/dns)
**Context**: Đổi nameservers từ Hostinger → Vercel (ns1.vercel-dns.com / ns2.vercel-dns.com).
Sau khi nameservers active ở Vercel, cần re-add các records dưới đây vào **Vercel DNS**
(vercel.com/tuyentran-mds-projects/aiforacademic/settings/domains → aiforacademic.world → DNS Records).

---

## ❌ BỎ (không add lại — Vercel tự xử)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 153.92.8.126 | 1800 |
| AAAA | @ | 2a02:4780:6:2080:0:2663:20e0:2 | 1800 |
| CNAME | www | aiforacademic.world | 300 |

→ Vercel auto-setup A @ 76.76.21.21 + CNAME www khi domain verified.

---

## ✅ ADD LẠI vào Vercel DNS (8 records — giữ email Hostinger hoạt động)

### MX (email receive — QUAN TRỌNG)
| Type | Name | Priority | Value | TTL |
|------|------|----------|-------|-----|
| MX | @ | 5 | mx1.hostinger.com | 14400 |
| MX | @ | 10 | mx2.hostinger.com | 14400 |

### TXT (email auth)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | @ | `"v=spf1 include:_spf.mail.hostinger.com ~all"` | 3600 |
| TXT | _dmarc | `"v=DMARC1; p=none"` | 3600 |

### CNAME DKIM (email signing)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | hostingermail-a._domainkey | hostingermail-a.dkim.mail.hostinger.com | 300 |
| CNAME | hostingermail-b._domainkey | hostingermail-b.dkim.mail.hostinger.com | 300 |
| CNAME | hostingermail-c._domainkey | hostingermail-c.dkim.mail.hostinger.com | 300 |

### CNAME (email client auto-config — optional but recommended)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | autodiscover | autodiscover.mail.hostinger.com | 300 |
| CNAME | autoconfig | autoconfig.mail.hostinger.com | 300 |

---

## Nameservers change instructions

Ở Hostinger panel của `aiforacademic.world`:
1. Tab **Nameservers** (hoặc "Change nameservers")
2. Chọn **Use custom nameservers** (KHÔNG dùng Hostinger default)
3. Nameserver 1: `ns1.vercel-dns.com`
4. Nameserver 2: `ns2.vercel-dns.com`
5. Save

Propagation: 1-24h (thường 1-2h).

---

## Verify sau khi active

```bash
dig aiforacademic.world NS           # should show ns*.vercel-dns.com
dig aiforacademic.world A            # should show 76.76.21.21
dig aiforacademic.world MX           # should show mx1/mx2.hostinger.com
dig _dmarc.aiforacademic.world TXT   # should show DMARC
```

---

## RIC subdomain (check.aiforacademic.world) — setup SAU

Sau khi nameservers Vercel active, add trong Vercel DNS:
- Type: CNAME, Name: `check`, Value: <URL Vercel của RIC project>
  (hoặc A record IP nếu deploy ở Cloud Run)
