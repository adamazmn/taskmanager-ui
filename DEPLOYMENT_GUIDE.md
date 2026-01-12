# Fullstack Deployment Guide (Vercel + Render)

## Prerequisites
- GitHub Account
- Vercel Account (for Frontend)
- Render Account (for Backend & Database)
- Git installed locally

---

## Part 1: Backend Deployment (Render)

1.  **Push Code to GitHub**: Ensure your `taskmanager-service` code is in a GitHub repository.
2.  **Login to Render**: Go to [render.com](https://render.com/).
3.  **create Database**:
    *   Click "New +" -> "PostgreSQL".
    *   Name it (e.g., `taskmanager-db`).
    *   Region: Choose one closest to you (e.g., Singapore).
    *   Plan: Free (if available) or Starter.
    *   **Wait for creation**.
    *   Once created, copy the **Internal Database URL** (for connecting from Render service) and keep the credentials handy (Host, Port, User, Pass, DB Name).

4.  **Create Web Service (Spring Boot)**:
    *   Click "New +" -> "Web Service".
    *   Connect your GitHub repository (`taskmanager-service`).
    *   **Runtime**: Docker.
    *   **Region**: Same as Database.
    *   **Root Directory**: `taskmanager-service`
    *   **Dockerfile Path**: `taskmanager-service/Dockerfile` (Path relative to repository root).
    *   **Build Command**: (Leave blank / Default).
    *   **Start Command**: (Leave blank / Default).
    *   **Environment Variables**:
        Add the following variables (Use values from your PostgreSQL "Connect" info):
        *   `DB_URL`: `jdbc:postgresql://<HOSTNAME>:<PORT>/<DB_NAME>` (Construct this from your DB details. Example: `jdbc:postgresql://dpg-xxxxxxxx:5432/taskmanager_db`).
        *   `DB_USERNAME`: `<DB_USER>`
        *   `DB_PASSWORD`: `<DB_PASSWORD>`
        *   `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app` (You will update this in Part 3).
        *   `PORT`: `8080`.
    *   Click "Create Web Service".

5.  **Get Backend URL**:
    *   Wait for deployment to finish.
    *   Copy the service URL from the top left (e.g., `https://taskmanager.onrender.com`).

---

## Part 2: Connect Frontend to Backend

1.  **Update Environment File**:
    *   Open `src/environments/environment.prod.ts` in VS Code.
    *   Replace the placeholder URL with your **Render Backend URL**:
        ```typescript
        export const environment = {
          production: true,
          apiUrl: 'https://taskmanager.onrender.com' 
        };
        ```
    *   **Important**: Remove any trailing slash `/` if your service appends it.
2.  **Push Changes**: Commit and push this change to GitHub.

---

## Part 3: Frontend Deployment (Vercel)

1.  **Push Code to GitHub**: Ensure your `taskmanager-ui` code is in a GitHub repository.
2.  **Login to Vercel**: Go to [vercel.com](https://vercel.com/).
3.  **Add New Project**: Click "Add New..." -> "Project".
4.  **Import Repository**: Select your `taskmanager-ui` repo.
5.  **Configure Project**:
    *   **Framework Preset**: Angular.
    *   **Build Command**: `ng build --configuration production`.
    *   **Output Directory**: `dist/taskmanager-ui/browser` (Check your `angular.json` output path. Usually `dist/taskmanager-ui/browser`).
6.  **Deploy**: Click "Deploy".
7.  **Get Frontend URL**: Once deployed, copy the domain (e.g., `taskmanager-ui.vercel.app`).

---

## Part 4: Final Configuration

1.  **Update Backend CORS**:
    *   Go back to **Render** -> Dashboard -> Select your Web Service.
    *   Go to **Environment**.
    *   Update `CORS_ALLOWED_ORIGINS` with your **Vercel Frontend URL**:
        *   Value: `https://taskmanager-ui.vercel.app` (no trailing slash).
    *   Render will automatically redeploy.

2.  **Verify**: Open your Vercel app URL. It should now connect to the Render backend and database.
