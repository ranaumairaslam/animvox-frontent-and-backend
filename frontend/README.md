# Animvox - Video Animation & Voice Platform

A modern web application for creating animated videos with professional voiceover capabilities. Built with Next.js, React, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.18-38B2AC)
![Node.js](https://img.shields.io/badge/Node.js-Required-green)

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Development](#development)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

## ✨ Features

- **Video Animation** - Create engaging animated videos with intuitive controls
- **Voiceover Support** - Add professional voiceover narration to your videos
- **User Dashboard** - Manage all your projects from a centralized dashboard
- **Voice Library** - Access a collection of high-quality voice options
- **Responsive Design** - Works seamlessly across desktop and mobile devices
- **Real-time Preview** - See changes instantly as you edit

## 📦 Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (Latest LTS recommended)
- **npm** or **yarn** (comes with Node.js)
- **Visual Studio Code** (or your preferred code editor)

### Recommended VS Code Extensions

- [ES7+ React/Redux/React Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets) - Enhanced React development
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - Tailwind class suggestions
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - Code quality linting

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd animvox
```

### 2. Install Dependencies

Install all required npm packages:

```bash
npm install
```

Or if you prefer to see what's being installed:

```bash
npm install next@16.1.1 react@19.2.3 react-dom@19.2.3 framer-motion@12.26.2 lucide-react@0.562.0 react-icons@5.5.0 clsx@2.1.1 tailwind-merge@3.4.0 tailwindcss@4.1.18 @tailwindcss/postcss@4 postcss@8.5.6 autoprefixer@10.4.23 eslint@9 eslint-config-next@16.1.1
```

### 3. Run the Development Server

Start the local development environment:

```bash
npm run dev
```

Open your browser and navigate to:

```
http://localhost:3000
```

The application will automatically reload as you make changes to the code.

## 📁 Project Structure

```
animvox/
├── public/                          # Static assets
│   ├── about/                      # About page images
│   ├── creators/                   # Creator assets
│   └── videos/                     # Video assets
│
├── src/
│   ├── app/                        # Next.js app directory
│   │   ├── globals.css             # Global styles
│   │   ├── layout.js               # Root layout component
│   │   ├── page.js                 # Home page
│   │   └── login/                  # Authentication pages
│   │       ├── page.js             # Login page
│   │       ├── admin-dashboard/    # Admin interface
│   │       │   └── page.js
│   │       └── tool-dashboard/     # User dashboard
│   │           ├── page.js         # Dashboard home
│   │           ├── animated-videos/page.js    # Animated video editor
│   │           ├── static-videos/page.js      # Static video editor
│   │           ├── voices/page.js             # Voice library
│   │           └── profile/page.js            # User profile
│   │
│   ├── components/                 # Reusable React components
│   │   ├── About.js               # About section
│   │   ├── Background.js          # Background component
│   │   ├── Breadcrumb.js          # Navigation breadcrumbs
│   │   ├── Creators.js            # Creator showcase
│   │   ├── CTABanner.js           # Call-to-action banner
│   │   ├── ExamplesGallery.js     # Video examples gallery
│   │   ├── Footer.js              # Site footer
│   │   ├── Header.js              # Navigation header
│   │   ├── HeroSection.js         # Hero section
│   │   ├── ModelHero.js           # Modal hero component
│   │   ├── Pricing.js             # Pricing section
│   │   ├── Video.js               # Video player component
│   │   └── ui/                    # UI component library
│   │       ├── button.jsx
│   │       └── card.jsx
│   │
│   └── lib/
│       └── utils.js               # Utility functions
│
├── Configuration Files
│   ├── package.json               # Dependencies and scripts
│   ├── next.config.mjs            # Next.js configuration
│   ├── postcss.config.mjs         # PostCSS configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   └── eslint.config.mjs          # ESLint rules
│
└── README.md                       # This file
```

## 📜 Available Scripts

In the `package.json`, you can run:

### Development

```bash
npm run dev
```
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will auto-refresh as you edit files.

### Build

```bash
npm run build
```
Compiles the application for production into the `.next` directory.

### Production

```bash
npm run start
```
Runs the production build locally (requires `npm run build` first).

### Linting

```bash
npm run lint
```
Runs ESLint to check code quality and consistency.

## 🛠 Development

### Working with Components

Components are located in `src/components/`. When creating new components:

1. Use the ES7+ React/Redux snippets for faster development
2. Follow the existing naming conventions (PascalCase for components)
3. Keep components modular and reusable
4. Use Tailwind CSS for styling

### Working with Pages

New pages should be created in `src/app/` following Next.js app router conventions:

- Each folder represents a route
- `page.js` is the default component for that route
- Use the `layout.js` for shared layouts

### Styling with Tailwind CSS

This project uses Tailwind CSS v4 for styling. Leverage Tailwind IntelliSense to autocomplete class names. For custom styles, modify the Tailwind configuration or add utility classes to `globals.css`.

### Working with Static Assets

Place static assets in the `public/` directory. They'll be served from the root URL:

```javascript
<img src="/videos/example.mp4" alt="Example" />
```

## 🏗 Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js | 16.1.1 |
| **UI Library** | React | 19.2.3 |
| **Animation** | Framer Motion | 12.26.2 |
| **Styling** | Tailwind CSS | 4.1.18 |
| **Icons** | Lucide React | 0.562.0 |
| **Icons** | React Icons | 5.5.0 |
| **Utilities** | clsx, Tailwind Merge | Latest |
| **CSS Processing** | PostCSS, Autoprefixer | Latest |
| **Linting** | ESLint | 9 |

## 📝 Environment Variables

Create a `.env.local` file in the root directory for any environment-specific variables:

```env
# Example configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🤝 Contributing

When contributing to this project:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

Please ensure your code passes linting checks before submitting a PR:

```bash
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤔 Need Help?

- Check the existing component structure for examples
- Review Next.js [documentation](https://nextjs.org/docs)
- Explore Tailwind CSS [utilities](https://tailwindcss.com/docs)
- Review Framer Motion [examples](https://www.framer.com/motion/)

---

**Happy coding!** 🎬✨