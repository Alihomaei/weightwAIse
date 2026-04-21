---
name: shadcn-ui
description: Comprehensive knowledge for working with shadcn/ui v4 components, CLI, presets, and modern UI development patterns
version: 4.0.0
---

# shadcn/ui v4 Skill

This skill provides comprehensive knowledge for working with shadcn/ui v4 components, the shadcn CLI, and modern UI development patterns.

## Overview

shadcn/ui v4 is a collection of reusable components built using Radix UI or Base UI primitives with Tailwind CSS. Components are copied directly into your project, giving you full control and ownership.

## shadcn CLI v4 Features

### Installation & Initialization

```bash
# Install shadcn CLI
npx shadcn@latest init

# Initialize with template
npx shadcn@latest init

# Available templates:
# - Next.js (with dark mode)
# - Vite (with dark mode)
# - TanStack Start
# - React Router
# - Astro
# - Laravel

# Initialize with monorepo support
npx shadcn@latest init -t next --monorepo

# Initialize with specific primitive base
npx shadcn@latest init --base radix
npx shadcn@latest init --base baseui
```

### Presets

Presets pack your entire design system config into a short code: colors, theme, icon library, fonts, radius.

```bash
# Initialize with preset
npx shadcn@latest init --preset a1Dg5eFl

# Switch presets in existing project
npx shadcn@latest init --preset ad3qkJ7
```

**What presets include:**
- Color schemes
- Theme configuration
- Icon library settings
- Font selections
- Border radius settings
- Component styling defaults

**Build presets at:** https://shadcn.com/create

### Adding Components

```bash
# Add a single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card dialog

# Preview before adding (dry run)
npx shadcn@latest add button --dry-run

# Show diff of what will change
npx shadcn@latest add button --diff

# View component payload
npx shadcn@latest add button --view
```

### Inspecting & Updating

```bash
# Show project info and installed components
npx shadcn@latest info

# Get documentation for a component
npx shadcn@latest docs combobox

# Check for component updates
npx shadcn@latest add button --diff
```

### Registry Types

The registry supports multiple content types:

1. **registry:ui** - UI components
2. **registry:base** - Complete design system payload (components, deps, CSS vars, fonts, config)
3. **registry:font** - Font configurations
4. **registry:lib** - Utility functions
5. **registry:hook** - React hooks
6. **registry:theme** - Theme configurations

## Component Patterns

### Common Component Structure

shadcn/ui components follow these patterns:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Variants using CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Using Primitives

shadcn/ui supports two primitive libraries:

#### Radix UI
```tsx
import * as Dialog from "@radix-ui/react-dialog"
import * as Select from "@radix-ui/react-select"
import * as Popover from "@radix-ui/react-popover"
```

#### Base UI
```tsx
import { Dialog } from "@base-ui/react"
import { Select } from "@base-ui/react"
import { Popover } from "@base-ui/react"
```

## Theming & Styling

### CSS Variables

shadcn/ui uses CSS variables for theming:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... other dark mode variables */
  }
}
```

### Font Configuration

```json
{
  "name": "font-inter",
  "type": "registry:font",
  "font": {
    "family": "'Inter Variable', sans-serif",
    "provider": "google",
    "import": "Inter",
    "variable": "--font-sans",
    "subsets": ["latin"]
  }
}
```

```bash
npx shadcn@latest add font-inter
```

## Agent Workflows

### When to Use shadcn CLI vs Manual Component Creation

**Use CLI when:**
- Installing official shadcn/ui components
- Setting up initial project structure
- Switching design system presets
- Installing fonts from the registry
- Getting official component implementations

**Manual creation when:**
- Creating custom components specific to the project
- Modifying existing shadcn components
- Building composite components from primitives
- Creating one-off UI elements

### Common Agent Tasks

#### 1. Starting a New Project
```bash
npx shadcn@latest init --preset <preset-code>
```

#### 2. Adding UI Components
```bash
# Check what will be added
npx shadcn@latest add <component> --diff

# Add the component
npx shadcn@latest add <component>
```

#### 3. Switching Design Systems
```bash
# Preview changes
npx shadcn@latest init --preset <new-preset> --dry-run

# Apply changes
npx shadcn@latest init --preset <new-preset>
```

#### 4. Checking Component Documentation
```bash
npx shadcn@latest docs <component>
```

#### 5. Creating Custom Components
- Use existing shadcn components as reference
- Follow the component patterns (CVA for variants, forwardRef, etc.)
- Place in `components/ui/` directory
- Use the same styling approach (Tailwind + CSS variables)

## Monorepo Support

```bash
# Initialize monorepo
npx shadcn@latest init -t next --monorepo
```

shadcn/ui v4 now supports monorepo structures. When initializing with `--monorepo`, the CLI:
- Sets up proper package structure
- Configures shared components
- Handles dependency management across packages

## Common Components & Usage

### Form Components
- Input, Textarea, Select, Checkbox, Radio, Switch
- Form (with react-hook-form integration)
- Label

### Overlay Components
- Dialog, AlertDialog
- Sheet (slide-over)
- Popover, Tooltip
- Dropdown Menu, Context Menu

### Feedback Components
- Alert, Toast
- Progress, Skeleton
- Badge, Avatar

### Layout Components
- Card, Separator
- Tabs, Accordion
- Collapsible, Aspect Ratio

### Data Display
- Table, Data Table
- Calendar, Date Picker
- Command, Combobox

## Best Practices

1. **Component Installation**: Always use `npx shadcn@latest add <component>` for official components
2. **Customization**: Modify components after installation to fit your needs
3. **Type Safety**: Leverage TypeScript and VariantProps for type-safe variants
4. **Accessibility**: shadcn/ui components are built on accessible primitives - preserve ARIA attributes
5. **Theming**: Use CSS variables for consistent theming across components
6. **Composition**: Build complex UIs by composing simple components
7. **Registry Updates**: Periodically check for updates using `--diff` flag

## Integration with Other Libraries

### Animation
- **Framer Motion**: For complex animations
- **React Bits**: For pre-built animation patterns
- **Tailwind CSS animations**: For simple transitions

### Forms
- **React Hook Form**: Official form integration
- **Zod**: Schema validation with type safety

### Data Fetching
- **TanStack Query**: Server state management
- **SWR**: Alternative data fetching

## Resources

- Documentation: https://ui.shadcn.com
- Component Examples: https://ui.shadcn.com/docs/components
- Preset Builder: https://shadcn.com/create
- GitHub: https://github.com/shadcn-ui/ui
- Radix UI Docs: https://radix-ui.com
- Base UI Docs: https://base-ui.com

## Troubleshooting

### Component Not Found
```bash
# Check available components
npx shadcn@latest add --help

# Search documentation
npx shadcn@latest docs <component-name>
```

### Style Conflicts
- Ensure Tailwind CSS is properly configured
- Check CSS variable definitions in globals.css
- Verify components.json configuration

### TypeScript Errors
- Install type definitions: `npm install -D @types/node`
- Check path aliases in tsconfig.json
- Ensure proper imports from "@/components/ui"

## Version Notes

This skill is for **shadcn/ui v4** (released March 2026). Key v4 features:
- Skills support for AI agents
- Preset system for design systems
- Enhanced CLI with --dry-run, --diff, --view flags
- Template scaffolding with dark mode
- Monorepo support
- registry:base and registry:font types
- Base UI primitive support
- Enhanced `info` and `docs` commands
