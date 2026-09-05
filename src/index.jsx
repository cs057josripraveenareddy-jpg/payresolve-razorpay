@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 44% 8%;
    --foreground: 210 20% 92%;
    --card: 222 40% 11%;
    --card-foreground: 210 20% 92%;
    --popover: 222 40% 12%;
    --popover-foreground: 210 20% 92%;
    --primary: 173 58% 45%;
    --primary-foreground: 222 47% 8%;
    --secondary: 222 30% 16%;
    --secondary-foreground: 210 20% 92%;
    --muted: 222 30% 15%;
    --muted-foreground: 215 20% 58%;
    --accent: 230 60% 62%;
    --accent-foreground: 222 47% 8%;
    --destructive: 0 72% 55%;
    --destructive-foreground: 210 20% 98%;
    --success: 142 71% 48%;
    --success-foreground: 222 47% 8%;
    --warning: 38 92% 55%;
    --warning-foreground: 222 47% 8%;
    --border: 222 30% 18%;
    --input: 222 30% 18%;
    --ring: 173 58% 45%;
    --chart-1: 173 58% 45%;
    --chart-2: 230 60% 62%;
    --chart-3: 38 92% 55%;
    --chart-4: 142 71% 48%;
    --chart-5: 280 60% 60%;
    --radius: 0.625rem;
    --font-heading: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
    --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    --sidebar-background: 222 47% 6%;
    --sidebar-foreground: 210 20% 88%;
    --sidebar-primary: 173 58% 45%;
    --sidebar-primary-foreground: 222 47% 8%;
    --sidebar-accent: 222 30% 14%;
    --sidebar-accent-foreground: 210 20% 92%;
    --sidebar-border: 222 30% 15%;
    --sidebar-ring: 173 58% 45%;
  }

  .dark {
    --background: 222 44% 8%;
    --foreground: 210 20% 92%;
    --card: 222 40% 11%;
    --card-foreground: 210 20% 92%;
    --popover: 222 40% 12%;
    --popover-foreground: 210 20% 92%;
    --primary: 173 58% 45%;
    --primary-foreground: 222 47% 8%;
    --secondary: 222 30% 16%;
    --secondary-foreground: 210 20% 92%;
    --muted: 222 30% 15%;
    --muted-foreground: 215 20% 58%;
    --accent: 230 60% 62%;
    --accent-foreground: 222 47% 8%;
    --destructive: 0 72% 55%;
    --destructive-foreground: 210 20% 98%;
    --success: 142 71% 48%;
    --success-foreground: 222 47% 8%;
    --warning: 38 92% 55%;
    --warning-foreground: 222 47% 8%;
    --border: 222 30% 18%;
    --input: 222 30% 18%;
    --ring: 173 58% 45%;
    --chart-1: 173 58% 45%;
    --chart-2: 230 60% 62%;
    --chart-3: 38 92% 55%;
    --chart-4: 142 71% 48%;
    --chart-5: 280 60% 60%;
    --sidebar-background: 222 47% 6%;
    --sidebar-foreground: 210 20% 88%;
    --sidebar-primary: 173 58% 45%;
    --sidebar-primary-foreground: 222 47% 8%;
    --sidebar-accent: 222 30% 14%;
    --sidebar-accent-foreground: 210 20% 92%;
    --sidebar-border: 222 30% 15%;
    --sidebar-ring: 173 58% 45%;
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground font-body antialiased;
  }
}