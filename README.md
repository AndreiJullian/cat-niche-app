# 🐱 Cat Explorer

A full-stack web app for the **Free API Niche Challenge**. Cat Explorer uses **The Cat API** to display real cat breed data and cat photos.

## ✨ Features

- Search cat breeds by name
- Filter/select a breed from a dropdown
- Fetch random cats
- Display real breed information from the API
- View breed details in a modal
- Save favorite cats using browser `localStorage`
- Responsive design for desktop, tablet, and mobile
- Netlify Function used as a backend proxy so the API key is not exposed in frontend JavaScript

## 🔌 API Used

**The Cat API**

- Official website: https://thecatapi.com/
- API base URL: https://api.thecatapi.com/v1
- Main endpoints used:
  - `GET /breeds`
  - `GET /images/search`
- Authentication: `x-api-key` request header

The Cat API currently advertises a free plan with 10,000 requests/month, cat images, breed information, and facts.

## 🗂️ Project Structure

```text
cat-explorer/
├── index.html
├── style.css
├── app.js
├── package.json
├── netlify.toml
├── .env.example
├── .gitignore
├── README.md
└── netlify/
    └── functions/
        └── cats.mjs
```

## 🔐 API Key Security

The API key is **not** stored in `app.js` and should never be committed to GitHub.

The browser calls:

```text
/.netlify/functions/cats/...
```

The Netlify Function reads:

```js
process.env.CAT_API_KEY
```

and adds the key to the request sent to The Cat API.

## 🚀 Run Locally

### 1. Install Node.js

Install a current LTS version of Node.js.

### 2. Install dependencies

Inside the project folder:

```bash
npm install
```

### 3. Create your local environment file

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Mac/Linux:

```bash
cp .env.example .env
```

Then replace:

```text
CAT_API_KEY=YOUR_THE_CAT_API_KEY
```

with your real key.

### 4. Start the app

```bash
npm run dev
```

Netlify Dev will provide a local URL, normally:

```text
http://localhost:8888
```

## ☁️ Deploy to Netlify

### 1. Push the project to GitHub

Create a public GitHub repository and push this project.

Example:

```bash
git init
git add .
git commit -m "Initial Cat Explorer project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/cat-explorer.git
git push -u origin main
```

### 2. Import the repository into Netlify

In Netlify:

1. Add a new project/site.
2. Import the GitHub repository.
3. Netlify should detect the `netlify.toml` configuration.
4. Deploy the site.

### 3. Add the API key

In your Netlify project, open:

**Project configuration → Environment variables**

Create:

```text
Key: CAT_API_KEY
Value: YOUR_REAL_THE_CAT_API_KEY
```

Make sure the variable is available to Functions.

Then redeploy the site.

**Do not put the real API key in `netlify.toml`, `app.js`, or any public frontend file.**

## 🧪 Testing Checklist

Before submitting:

- [ ] Home page loads
- [ ] Cat images appear
- [ ] Breed dropdown is populated
- [ ] Breed search works
- [ ] Random Cat button works
- [ ] View Details modal works
- [ ] Favorite button works
- [ ] Favorites remain after refreshing the browser
- [ ] No API key appears in frontend source
- [ ] Netlify deployment works
- [ ] GitHub repository is public
- [ ] README explains the API and setup

## 📚 Submission

Submit these two links in Canvas:

```text
GitHub Repository:
https://github.com/YOUR-USERNAME/cat-explorer

Live App:
https://YOUR-SITE-NAME.netlify.app
```

Replace the placeholder URLs with your actual GitHub repository and Netlify site.

## Credits

Cat images and breed information are provided by **The Cat API**.

Project created for the Free API Niche Challenge.
