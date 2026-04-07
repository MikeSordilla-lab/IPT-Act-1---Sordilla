# My Web App

React + Vite app configured for GitHub Pages deployment.

## 1. Create A GitHub Repository

Create an empty repository on GitHub (for example, `my-web-app`).

## 2. Push This Project To GitHub

Run these commands from the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 3. Enable GitHub Pages

1. Open your GitHub repository.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.

## 4. Deploy

Every push to `main` will automatically deploy using `.github/workflows/deploy.yml`.

After deployment, your site URL will be:

`https://<your-username>.github.io/<your-repo>/`

If your repository is `<your-username>.github.io`, the URL will be:

`https://<your-username>.github.io/`

## Local Development

```bash
npm install
npm run dev
```

## Build For Production

```bash
npm run build
```
