import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isUserOrOrgPage = repositoryName.endsWith('.github.io')
const base = process.env.BASE_PATH ?? (process.env.GITHUB_REPOSITORY ? (isUserOrOrgPage ? '/' : `/${repositoryName}/`) : '/')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
