# Migration Guide: Vite.js to Next.js

This document outlines the changes made during the migration from Vite.js to Next.js.

## Summary of Changes

### 1. Package Dependencies
- **Removed**: Vite-specific dependencies (`vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`)
- **Added**: Next.js dependencies (`next`, `react`, `react-dom`)
- **Updated**: Tailwind CSS from v4 to v3 (for Next.js compatibility)
- **Added**: TypeScript types for Next.js (`@types/node`, `@types/react`, `@types/react-dom`)

### 2. Configuration Files

#### Created:
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration for Next.js
- `tailwind.config.js` - Tailwind CSS v3 configuration (converted from v4)
- `.gitignore` - Git ignore file for Next.js

#### Updated:
- `postcss.config.mjs` - Updated for Tailwind v3 with autoprefixer
- `package.json` - Updated scripts and dependencies

#### Removed:
- `vite.config.ts` - No longer needed
- `index.html` - Next.js handles HTML automatically
- `src/main.tsx` - Replaced by Next.js pages
- `src/app/App.tsx` - Replaced by Next.js pages

### 3. Project Structure

#### New Structure:
```
/pages
  /_app.tsx          # Global app wrapper
  /_document.tsx     # Custom document
  /index.tsx         # Landing page (/)
  /login.tsx         # Login page (/login)
  /signup.tsx        # Signup page (/signup)
  /dashboard
    /index.tsx       # Dashboard (/dashboard)
  /agents
    /[id].tsx        # Agent builder (/agents/:id)
  /profile.tsx       # Profile settings (/profile)
  /[other-pages].tsx # Additional routes
```

#### Preserved:
- `/src/app/components` - All React components remain unchanged
- `/src/styles` - Styles migrated to Next.js format

### 4. Routing Changes

**Before (Vite):**
- Client-side routing using React state (`useState`)
- Single `App.tsx` component handling all routes

**After (Next.js):**
- File-based routing in `/pages` directory
- Each route is a separate file
- Dynamic routes using `[id].tsx` syntax
- Navigation using Next.js `useRouter` hook

### 5. Styling Changes

#### Tailwind CSS Migration:
- Converted from Tailwind v4 (`@tailwindcss/vite`) to Tailwind v3
- Updated `tailwind.config.js` to include theme variables
- Removed Tailwind v4-specific syntax (`@theme inline`, `@source`)
- Updated `src/styles/tailwind.css` to use standard Tailwind directives

#### Style Files:
- `src/styles/index.css` - Main style entry point (imported in `_app.tsx`)
- `src/styles/theme.css` - CSS variables (simplified, removed v4 syntax)
- `src/styles/tailwind.css` - Tailwind base styles
- `src/styles/fonts.css` - Font definitions (unchanged)

### 6. Component Updates

All components in `/src/app/components` remain **unchanged** and work with Next.js:
- No Vite-specific imports found
- No `import.meta` usage
- Components use standard React patterns

### 7. Static Assets

- Created `/public` directory for static assets
- Images and other static files should be placed in `/public`
- Access them using `/filename.ext` in your code

### 8. Environment Variables

- Create `.env.local` file in the root directory
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Example: `NEXT_PUBLIC_API_URL=https://api.example.com`

## Migration Checklist

- [x] Updated package.json with Next.js dependencies
- [x] Created Next.js configuration files
- [x] Set up pages directory with routing
- [x] Created _app.tsx and _document.tsx
- [x] Migrated styles to Next.js format
- [x] Updated Tailwind CSS configuration
- [x] Removed Vite-specific files
- [x] Created public directory
- [x] Updated README.md

## Next Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Test All Routes:**
   - `/` - Landing page
   - `/login` - Login page
   - `/signup` - Signup page
   - `/dashboard` - Dashboard
   - `/agents/new` - New agent builder
   - `/agents/[id]` - Existing agent builder
   - `/profile` - Profile settings

4. **Add Environment Variables:**
   - Create `.env.local` file
   - Add any required environment variables

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

## Notes

- All components are compatible with Next.js SSR/SSG
- The theme system using `next-themes` is already set up
- No API routes were found, but you can create them in `/pages/api`
- The project uses TypeScript throughout

## Troubleshooting

If you encounter issues:

1. **Tailwind styles not working:**
   - Ensure `tailwind.config.js` content paths include all component directories
   - Check that `src/styles/index.css` is imported in `_app.tsx`

2. **Routing issues:**
   - Verify page files are in `/pages` directory
   - Check that dynamic routes use `[param].tsx` syntax

3. **Build errors:**
   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript errors with `npm run build`
