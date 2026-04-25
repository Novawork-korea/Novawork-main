# NOVAWORK 검색등록 · 전환추적 세팅 가이드

이 파일은 사이트 업로드 후 Google Search Console, 네이버 서치어드바이저, GA4 전환 추적을 연결하기 위한 체크리스트입니다.

## 1. 배포 후 먼저 확인할 주소

- https://novawork.kr/
- https://novawork.kr/robots.txt
- https://novawork.kr/sitemap.xml
- https://novawork.kr/contact.html
- https://novawork.kr/privacy.html

`robots.txt`에는 전체 수집 허용과 sitemap 위치를 넣어두었습니다. `sitemap.xml`에는 검색에 노출할 핵심 6개 페이지만 포함했습니다. `demo-*.html` 샘플 페이지는 `noindex,follow` 상태라 sitemap에 넣지 않았습니다.

## 2. Google Search Console

1. Google Search Console에서 `https://novawork.kr/` 사이트를 추가합니다.
2. 현재 `index.html`에는 아래 Google 소유확인 메타태그가 이미 들어 있습니다.
   ```html
   <meta name="google-site-verification" content="U3IGCLatbagQVnNycpB0-aEbXabzPPUB0MZsr6Mf_no" />
   ```
3. 소유확인이 완료되면 Search Console의 `Sitemaps` 메뉴에서 아래 주소를 제출합니다.
   ```txt
   https://novawork.kr/sitemap.xml
   ```
4. URL 검사에서 `/`, `/services.html`, `/contact.html`을 각각 검사하고 색인 생성을 요청합니다.

## 3. 네이버 서치어드바이저

1. 네이버 서치어드바이저 웹마스터도구에서 `https://novawork.kr`을 등록합니다.
2. 소유확인 방식은 `HTML 태그` 방식을 선택합니다.
3. 네이버가 제공하는 메타태그를 `index.html`의 Google verification 태그 아래에 붙여 넣습니다.
   ```html
   <meta name="naver-site-verification" content="네이버에서_발급받은_값" />
   ```
4. 소유확인 후 사이트맵 주소를 제출합니다.
   ```txt
   https://novawork.kr/sitemap.xml
   ```
5. robots.txt 확인 도구에서 `User-agent: Yeti` 접근이 허용되는지 확인합니다.

## 4. GA4 또는 Google Tag Manager 연결

현재 사이트에는 전환 이벤트를 보내는 `js/modules/conversion-tracking.js`를 추가했습니다. 단, GA4 측정 ID 또는 GTM 컨테이너를 아직 넣지 않았기 때문에 실제 수집은 되지 않습니다.

### GA4를 직접 넣는 경우

GA4 속성을 만든 뒤 측정 ID가 `G-XXXXXXXXXX` 형태로 발급되면 모든 HTML 파일의 `</head>` 바로 위에 아래 코드를 넣습니다.

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Google Tag Manager를 쓰는 경우

GTM 컨테이너 코드를 발급받아 `<head>`와 `<body>` 시작 부분에 각각 삽입합니다. `conversion-tracking.js`는 `dataLayer.push()`도 같이 실행하므로 GTM 이벤트 트리거로 다음 이벤트를 받을 수 있습니다.

## 5. 사이트에서 발생시키는 이벤트 이름

- `cta_click`: 문의 페이지, 전화, 문의 버튼 등 CTA 클릭
- `click_phone`: 전화 링크 클릭
- `click_email`: 이메일 링크 클릭
- `contact_form_start`: 문의폼 입력 시작
- `generate_lead`: 문의폼 제출 성공 화면 표시 시 발생

GA4에서는 `generate_lead`를 주요 이벤트/전환으로 표시하는 것을 권장합니다. 문의폼이 Google Apps Script iframe 방식이라 서버 저장 성공까지 완벽히 검증하는 이벤트는 아니지만, 현재 프론트엔드 기준으로는 “접수 완료 메시지 표시” 시점에 발생합니다.

## 6. GA4 주요 이벤트 설정

1. GA4 관리자 화면으로 이동합니다.
2. 이벤트 메뉴에서 `generate_lead`가 들어오는지 확인합니다.
3. 들어온 뒤 `주요 이벤트로 표시` 또는 Key event 설정을 켭니다.
4. 실시간 보고서에서 문의 테스트 1건을 보내고 이벤트 발생 여부를 확인합니다.

## 7. 개인정보처리방침 관련 주의

전환 추적을 실제로 켜면 개인정보처리방침의 `쿠키 및 접속 정보` 항목을 실제 도입 도구 기준으로 다시 업데이트하는 것이 좋습니다. 현재 방침에는 향후 방문 분석 도구 도입 가능성과 이벤트 측정 범위를 안내해 두었습니다.
