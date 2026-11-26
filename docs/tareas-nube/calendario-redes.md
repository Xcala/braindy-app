# Cloud task: social calendar and results → Braindy App (daily 6:09 am Los Angeles)

You run in the cloud with a copy of the Xcala/braindy-app repository and the claude.ai connectors Metricool and Braindy. You cannot reach any computer. Do not change, commit or push anything in the repository.


Part 1 mirrors the social media calendar of Braindy's clients from Metricool into Braindy App, in the section "Calendario" (clients can only view it). Part 2 refreshes the social media numbers in the section "Resultados". Metricool keeps publishing; this task only copies from it.

Tools:
- Metricool connector: getBrandSettings, getScheduledPosts, getAnalyticsAvailableMetrics, getAnalyticsDataByMetrics.
- Braindy App connector: braindy_find_brand, braindy_social_calendar_sync, braindy_social_stats_sync, braindy_ad_stats_sync.
- If a Braindy tool that a part needs is not available, skip that part and say so in the report.

Never change, schedule or delete anything in Metricool.

PART 1: Calendar

Steps:
1. Call getBrandSettings to list the Metricool brands. Each one has an id, label, timezone and firstConnectionDate.
2. For each Metricool brand, find its Braindy brand by calling braindy_find_brand with the label. Known matches: Quimiolab 6032280 → quimiolab, Milohas 6370556 → milohas. If there is no clear match, skip the brand and mention it in the report.
3. Choose the dates to read for each brand:
   - **History, once per brand.** These Metricool ids already have their history loaded: 6032280, 6370556, 7475921, 7483838, 8027998. For any other Metricool brand that matches a Braindy brand, read from the start of the month of its firstConnectionDate up to today, and say in the report: «historia cargada para <marca> (id <id>): agregar el id a la lista de la tarea».
   - **Every run:** from 14 days ago to 60 days ahead, using today's date in the brand's timezone.
4. Go through those dates one week at a time. For each week:
   a. Call getScheduledPosts with:
      - brandId: the Metricool id;
      - fromDate: the week's first day at 00:00:00, with the brand's UTC offset;
      - toDate: the week's last day at 23:59:59, with the brand's UTC offset;
      - timezone: the brand's timezone.
      It returns both published and pending posts. If the result is too large, split the week in half.
   b. Call braindy_social_calendar_sync with:
      - brandId: the Braindy brand;
      - metricoolBrand: the Metricool id;
      - from and to: exactly the dates you read, as ISO 8601 with offset;
      - posts: each post mapped as follows.
        - id: the post id, as a string.
        - date: publicationDate.dateTime plus the brand's UTC offset for that date, as ISO 8601.
        - text: text.
        - title: youtubeData.title or facebookData.title, if either exists.
        - type: instagramData.type; if missing, facebookData.type; if missing, youtubeData.type; if all are missing, "POST".
        - draft: draft.
        - networks: the providers, each as { network, status, url: publicUrl }.
        - media: the media URLs.
        - thumb: videoThumbnailUrl, if present.
   c. If a week has no posts, still call braindy_social_calendar_sync with an empty posts list, so deleted posts disappear.

PART 2: Results (every Metricool brand: Quimiolab 6032280 → quimiolab, Milohas 6370556 → milohas, Revista Level 7475921 → revista-level, Braindy 7483838 → braindy; a new Metricool brand is included only after Nicolas turns Results on for it)

Reference: C:\Users\Mark\.claude\scheduled-tasks\sincronizar-calendario-redes\metricool-ref\fields.json maps each network's Metricool field ids (IGEV*, FBEV*, LIEV*, YTEV*, plus the posts connectors) to the keys Braindy uses. The scripts normalize.js and normalize-quimiolab.js in the same folder show how each network's rows were turned into those keys on 2026-11-05. Do not use fields marked Deprecated.

Networks:
- Quimiolab: instagram, linkedin, youtube.
- Milohas: instagram, facebook.
- Revista Level: instagram, facebook, linkedin, tiktok, youtube (not the website).
- Braindy: linkedin (Google Business Profile returned only zeros on 2026-11-05; add it as network gmb once it has data).
For tiktok and Google Business Profile, the field ids are in docs/tareas-nube/metricool-ref/fields-level-braindy.md.

For each network:
1. **Daily numbers.** Call getAnalyticsDataByMetrics on the evolution connector for the last 10 days, through today in the brand's timezone. Each row is the metric values in the order you requested them, then the date as YYYYMMDD. Turn each row into { d: "YYYY-MM-DD", followers, views, reach, interactions, posts, stories, reels, feedPosts, engaged, gained, lost, clicks, likes, comments, shares, saves, pageViews }:
   - Include only the keys the network has.
   - accountsEngaged becomes engaged.
   - followersGained and newFollowers become gained.
   - followersLost becomes lost.
   - On LinkedIn, pageImpressions becomes pageViews.
   - Use null where a value is missing.
   - Do not invent or average any value.
2. **Posts.** Read every post of the last 45 days with the posts connectors: posts and reels on Instagram, posts and reels on Facebook, posts on LinkedIn, videos on YouTube. Do not read stories. Shape each post as { id, date, type (post|carousel|reel|video), text (first 280 characters), image, url, views, reach, likes, comments, saves, shares, interactions, engagement, watchTime }, using the same rules as normalize.js:
   - LinkedIn views are impressions, and likes are reactions.
   - LinkedIn interactions are reactions + comments + shares + clicks.
   - YouTube interactions are likes + comments + shares.
3. **Audience, Mondays only.** Read countries and cities, plus age and gender where available. On LinkedIn also read industry, seniority, function and companySize. Each row is { name, n }, where n is the share of followers per ten thousand (a 0–1 fraction × 10000, rounded). Convert ISO-2 country codes to English names. Leave out "Others" and "ZZ". On any other day, do not send the audience.
4. Call braindy_social_stats_sync with brandId, network, daily, posts and, on Mondays, audience. Days are merged with the days already stored, so 10 days is enough.

Report in Spanish and keep it short:
- Calendar: for each brand, how many posts were synced, how many are new, updated and removed, and whether its history was loaded in this run.
- Results: for each brand and network, how many days and posts were updated.
- Any brand that was skipped, and any error.
- No technical detail.

PART 2b: Ads (Meta Ads through Metricool)

Brands with ads: Milohas 6370556 → milohas (Meta ad account act_1523906969113691, USD, connected on 2026-11-10). A brand is added here only when Nicolas connects its ad account in Metricool.

For each brand with ads:
1. **History.** Already loaded for Milohas (ads-6370556). For a new ad brand, read the evolution connector from 1 June 2026 to today in 30-day pieces and send everything, and say in the report that its history was loaded. If every value comes back zero, send nothing and say so in the report.
2. **Daily numbers.** getAnalyticsDataByMetrics on network metaAds, connector evolution, for the last 10 days: FAEV01 impressions, FAEV02 reach, FAEV04 spent, FAEV05 clicks, FAEV10 conversions value. Each row → { d, impressions, reach, spend, clicks, convValue }.
3. **Campaigns.** getAnalyticsDataByMetrics on connector campaigns with FACA06 id, FACA05 name, FACA07 objective, FACA13 spent, FACA10 impressions, FACA12 reach, FACA14 clicks, FACA156 results, FACA157 results label, once per period: last 30 days, last 90 days, this month, last month, last 365 days. Each row → { id, name, objective, spend, impressions, reach, clicks, results, resultLabel } (resultLabel in Spanish and lowercase, e.g. "visitas al perfil", "vistas de la página de destino"). Keep only campaigns with spend or impressions in that period.
4. Call braindy_ad_stats_sync with brandId, platform "meta", account, currency "USD", daily and campaigns { "30": [...], "90": [...], "month": [...], "lastMonth": [...], "365": [...] }.
Report: for each brand, days updated and campaigns per period.

PART 3: Website (Google Analytics)

Call braindy_web_stats_refresh with no arguments, using the Braindy connector that runs on Cloud Run (the remote one, not the local braindy-app server: only the remote one can read Google Analytics). It refreshes every brand that has a GA property and returns one line per brand. If the tool does not exist yet, skip this part. Add the lines marked with an x to the report.
