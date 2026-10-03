# PotholeMap

An end-to-end, production-grade civic infrastructure and road hazard management platform that connects citizens directly with municipal authorities. **PotholeMap** leverages automated PostGIS spatial containment, AI visual similarity vector matching (CLIP + pgvector), Redis/BullMQ background queueing, and a centralized State Machine lifecycle model to streamline defect reporting, triage, and resolution.

---

## What is PotholeMap?

**PotholeMap** is an intelligent civic reporting platform designed to transform how road hazards—such as potholes, pavement cracks, submerged road pits, and open manhole covers—are reported, dispatched, and resolved.

Citizens can submit a high-precision report in under **10 seconds** through an instant capture interface that handles parallel image upload, HTML5 GPS acquisition, and interactive pin placement. 

On the municipal side, PotholeMap automatically routes reports to the correct municipal corporation (such as Delhi NCT, BMC, BBMP, etc.) by evaluating GPS coordinates against PostGIS spatial jurisdiction polygon boundaries (`ST_Contains`). Behind the scenes, an AI background worker computes 512-dimensional image vector embeddings to identify and aggregate duplicate reports, allowing officers to merge duplicate community submissions and maintain clean, actionable triage queues.

---

## Why it exists

Traditional civic complaint tools suffer from multiple critical operational bottlenecks:

1. **Manual Dispatch Delays**: Complaints are frequently misrouted or sit in unassigned queues for weeks because non-spatial databases cannot map raw coordinates to complex municipal boundary polygons.
2. **Duplicate Report Flooding**: When multiple citizens report the same severe pothole, municipal workers are overwhelmed with duplicate tickets, leading to redundant field visits and inaccurate backlog metrics.
3. **Lack of Transparency & Accountability**: Citizens rarely receive status updates after filing a report, leading to civic frustration. Meanwhile, officers lack standardized state lifecycle rules and audit logs.

**PotholeMap solves these problems by:**
* **Automating Spatial Containment**: Using PostgreSQL + PostGIS spatial polygon operations (`ST_Contains`), every report is instantly mapped to its governing municipal jurisdiction upon submission.
* **Intelligent AI Deduplication**: Running CLIP visual vector embeddings and distance matching in background BullMQ workers to automatically identify duplicate candidates, consolidate citizen upvotes, and reduce triage overhead.
* **Strict State Lifecycle Governance**: Enforcing a centralized transition policy with immutable status logs (`ReportStatusHistory`) and audit trails (`AuditLog`) so status changes follow strict role permissions and SLA tracking.
* **Real-time Citizen Feedback**: Providing unread notification drawers, interactive status steppers, community upvoting, and live vector map visualization.

---

## Key features

### 🗺️ Interactive Vector Map & Instant Reporting
* **MapLibre GL Vector Engine**: Smooth, high-performance rendering of road hazard markers with custom status color coding (Amber for *Pending*, Blue for *Under Review*, Purple for *Verified*, Indigo for *In Progress*, Emerald for *Resolved*).
* **Point Clustering**: Automatically clusters high-density hazard areas (`cluster: true`) for performance at wide zoom levels.
* **Instant Capture Flow (< 10s)**: Direct photo upload via Uploadthing, client-side canvas compression/EXIF stripping, parallel HTML5 GPS acquisition, and mini-map pin fine-tuning (`GPS` vs `MANUAL_ADJUSTMENT`).

### 🛰️ PostGIS Geospatial Boundary Routing
* **Polygon Containment (`ST_Contains`)**: Automatically matches report latitude/longitude against active municipal service polygons to dispatch tickets to the correct municipal entity.
* **Unassigned Triage Queue**: Gracefully captures reports falling outside mapped jurisdictional polygons for administrative review.

### 🤖 AI Duplicate Detection (CLIP & pgvector)
* **Visual & Spatial Matching**: Background BullMQ workers process uploaded images through a 512-dimensional CLIP model and index vector embeddings in PostgreSQL using `pgvector` with HNSW indexes.
* **Candidate Flagging**: Calculates match confidence scores and spatial separation distance (e.g., 94% match confidence within 21m).
* **Officer Consolidation View**: Side-by-side comparison screen enabling municipal officers to merge duplicate submissions with a single click, transferring upvotes to the primary report.

### 🔄 Centralized State Machine Lifecycle
* **Enforced Workflow Policy**:
  `PENDING` ➔ `UNDER_REVIEW` ➔ `VERIFIED` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `REPAIR_COMPLETED` ➔ `RESOLVED`
* **Immutable Log Trail**: Records every transition, actor, timestamp, and required notes/reasons into `ReportStatusHistory`.
* **SLA Escalation**: Automatic background triggers flag reports remaining unaddressed past threshold SLA limits.

### 🔔 Community Engagement & Notifications
* **Social Civic Voting**: One-click upvotes with optimistic UI updates to help municipalities prioritize high-impact road hazards.
* **Discussion Threads & Following**: Comment threads and subscription controls for real-time progress updates.
* **Notification Hub**: Header notification bell with unread counter badge and drawer categorizing lifecycle updates (`STATUS_UPDATE`, `DUPLICATE_MERGE`, `NEW_COMMENT`).

### 🏛️ Multi-Tenant Municipal & Super Admin Portals
* **Officer Triage Queue**: Dedicated municipal dashboard with priority/severity sorting, jurisdictional boundary overlays, and transition controls.
* **Super Admin Portal**: Complete platform management including CRUD for Municipal Corporations, PostGIS boundary map visualizers, staff roster assignments, and platform-wide audit logs.

---

## How it works (high level)

```mermaid
flowchart TD
    A[Citizen Snaps & Uploads Photo] --> B[Client Compression & GPS Acquisition]
    B --> C[POST /api/potholes Submission]
    C --> D{PostGIS ST_Contains Check}
    
    D -- Polygon Match --> E[Assign to Municipal Corporation]
    D -- No Match --> F[Route to Unassigned Queue]
    
    E --> G[Enqueue BullMQ Background Task]
    G --> H[CLIP AI Embedding Generator & Vector Search]
    H --> I{Similarity > Threshold?}
    
    I -- Yes --> J[Flag Duplicate Candidate Pair]
    I -- No --> K[Place in Officer Triage Queue]
    
    K --> L[Officer Reviews & Verifies Report]
    L --> M[State Machine Lifecycle Transition]
    M --> N[Assign Field Officer & Complete Repair]
    N --> O[RESOLVED & Citizen Notification Sent]
```

1. **Report Capture & Dispatch**: A citizen submits a report. The Next.js API receives latitude, longitude, and photo URL, immediately running a spatial `ST_Contains` query against `Jurisdiction` boundary polygons in PostgreSQL to assign the appropriate municipality.
2. **Background AI Processing**: The API enqueues a background job via Redis & BullMQ. A dedicated worker computes 512-dimensional CLIP embeddings for the image and searches existing database records using `pgvector` HNSW indexes and spatial distance formulas.
3. **Duplicate Resolution**: If a near-identical report is detected nearby, a `DuplicateCandidate` record is generated. Officers can review the side-by-side comparison on their portal to merge or dismiss the candidate.
4. **Triage & Repair Progression**: Authorized municipal officers review reports in their jurisdictional triage queue, executing status transitions (`UNDER_REVIEW` → `VERIFIED` → `IN_PROGRESS` → `RESOLVED`) through the Central Transition Policy.
5. **Notification & Audit**: Every status change updates the immutable `ReportStatusHistory`, triggers notifications to interested citizens, and records privileged actions in the system `AuditLog`.

---

## Screenshots

### 1. Citizen Interface & Interactive Vector Map
![Citizen Landing & Live Map](public/screenshots/01-landing-and-map.png)

### 2. Officer Triage Queue & AI Duplicate Resolution
![Officer Triage & AI Duplicate Detection](public/screenshots/02-officer-triage-and-duplicates.png)

### 3. Executive Overview & SLA Escalation Dashboard
![Admin Overview & SLA Escalation Alerts](public/screenshots/03-admin-overview-and-escalations.png)

### 4. Jurisdiction Polygon Management & Municipalities Roster
![Jurisdiction Polygon Boundaries & Municipalities Roster](public/screenshots/04-jurisdictions-and-municipalities.png)

### 5. Immutable Platform Audit Logs
![Immutable Platform Audit Logs](public/screenshots/05-immutable-audit-logs.png)

---

## Getting started

### Prerequisites
* **Node.js**: `v20.x` or higher
* **PostgreSQL**: `v15+` with **PostGIS** and **pgvector** extensions enabled (or Neon / Supabase PostgreSQL)
* **Redis**: `v6+` (for BullMQ queues and rate limiting)
* **Docker** (optional, recommended for running Redis locally)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/codefixxx/Pothole_map.git
cd pothole-map
npm install
```

### 2. Start Redis Container
If running Redis locally using Docker:
```bash
docker run -d --name pothole_redis -p 6379:6379 redis:7-alpine
```
*(Or use Docker Compose to spin up services: `docker compose -f docker-compose.prod.yml up -d redis`)*

### 3. Environment Variables Configuration
Create or update your `.env` file in the root directory:
```env
# Database Connections (PostgreSQL with PostGIS + pgvector)
DATABASE_URL="postgresql://user:password@host:5432/pothole_db?sslmode=verify-full"
DIRECT_URL="postgresql://user:password@host:5432/pothole_db?sslmode=verify-full"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-32-char-random-auth-secret-key"
BETTER_AUTH_BASE_URL="http://localhost:3000"
NODE_ENV="development"
APP_DEBUG="true"

# OAuth & Authentication Providers
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Transport (Nodemailer)
NODEMAILER_USER="your-email@gmail.com"
NODEMAILER_APP_PASSWORD="your-gmail-app-password"

# File & Image Upload (Uploadthing)
UPLOADTHING_TOKEN="eyJhcGlLZXkiOiJza19saXZlX..."

# Redis Cache & BullMQ Queue
REDIS_URL="redis://127.0.0.1:6379"
```

### 4. Database Migrations & Seeding
```bash
# Apply Prisma database migrations
npx prisma migrate dev

# Seed demonstration data (municipalities, jurisdictions, test reports)
npx tsx prisma/seed.ts
```

### 5. Running the Application & Background Worker

To run the complete platform locally, execute the web app and background worker processes:

1. **Start the Next.js Web Application**:
   ```bash
   npm run dev
   ```
   *Access the web app at [http://localhost:3000](http://localhost:3000).*

2. **Start the BullMQ Background Worker** *(in a second terminal)*:
   ```bash
   npm run worker
   ```
   *Processes background image embeddings, CLIP duplicate detection, and notification routing.*

### 6. Running Tests & Quality Assurance
```bash
# Run core unit and integration tests
npm test

# Run Playwright End-to-End UI tests
npm run test:e2e

# Run k6 load and spike performance tests
npm run test:k6
```

---

## User roles

| Role | Access Level | Primary Responsibilities & Features |
| :--- | :--- | :--- |
| 👤 **Citizen / User** | Public / Authenticated | • File road hazard reports (< 10s flow with photo & GPS).<br>• Drag/fine-tune marker placement (`GPS` vs `MANUAL_ADJUSTMENT`).<br>• Explore interactive vector map, search, and filter defects.<br>• Upvote reports, post comments, follow progress, and receive notifications.<br>• View personal civic contribution stats on Citizen Dashboard (`/dashboard`). |
| 👮 **Municipality Officer** | Municipal Portal | • Access assigned jurisdictional triage queue (`/municipality/dashboard`).<br>• Execute status transitions via Central Transition Policy with mandatory notes.<br>• Review side-by-side AI duplicate candidates and merge duplicate reports.<br>• Attach repair completion photos and resolution details. |
| 👔 **Municipality Manager** | Municipal Portal | • All Officer permissions plus team roster management.<br>• Assign/reassign reports to officers or field repair units.<br>• Monitor jurisdiction backlog, priority hazards, and SLA escalation alerts. |
| ⚡ **Super Admin** | Admin Portal | • Full platform management via Super Admin Portal (`/admin/dashboard`).<br>• CRUD operations for Municipal Corporations and PostGIS polygon `Jurisdiction` boundaries.<br>• Promote/assign user roles (`OFFICER`, `MANAGER`).<br>• Inspect immutable system-wide `AuditLog` trails and global analytics. |

---

## Contributing

We welcome contributions to **PotholeMap**! To contribute:

1. **Fork the Repository** and create a descriptive feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Follow Coding Standards**:
   * Ensure UI components strictly follow **shadcn/ui** design principles (New York style, Neutral palette).
   * Maintain TypeScript strictness and ensure proper error handling with `AppError` classes.
   * Write clean, self-documenting code with clear comments.
3. **Verify Your Changes**:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   ```
4. **Submit a Pull Request**: Provide a clear overview of changes, rationale, and visual screenshots for UI modifications.

