# Welcome to your Lovable project

## Arabic automation setup (ChatGPT + n8n + GitHub + Netlify)

For the full Arabic step-by-step setup guide (including webhook/OpenAPI schema and Custom GPT setup), see:

- [`docs/n8n-chatgpt-netlify-setup-ar.md`](docs/n8n-chatgpt-netlify-setup-ar.md)

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

### Netlify + `netlify-purge-cloudflare-on-deploy` troubleshooting

If a Netlify deploy fails during the plugin `onPostBuild` hook with:

`Error: Could not determine auth method. Please review the plugin README file and verify your environment variables.`

the Cloudflare purge plugin is enabled but required environment variables are missing or misnamed.

Per the plugin README, configure one auth method in Netlify (**Site settings → Build & deploy → Environment**):

1. API token (recommended):
   - `CLOUDFLARE_ZONE_ID`
   - `CLOUDFLARE_API_TOKEN`
2. API key (legacy):
   - `CLOUDFLARE_ZONE_ID`
   - `CLOUDFLARE_API_KEY`
   - `CLOUDFLARE_EMAIL`

Variable names must match exactly for this plugin. If you no longer need the purge step, remove the plugin from your Netlify plugin/site configuration.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
