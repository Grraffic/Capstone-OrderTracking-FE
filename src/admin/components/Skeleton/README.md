# Skeleton Components for Admin Section

A comprehensive, reusable skeleton loading component system for all admin pages.

## 📁 Folder Structure

```
Skeleton/
├── base/                   # Primitive/reusable skeleton components
│   ├── SkeletonCard.jsx
│   ├── SkeletonTable.jsx
│   ├── SkeletonStats.jsx
│   ├── SkeletonText.jsx
│   └── SkeletonImage.jsx
├── pages/                  # Page-specific skeleton layouts
│   ├── DashboardSkeleton.jsx
│   ├── ItemsSkeleton.jsx
│   ├── OrdersSkeleton.jsx
│   └── SettingsSkeleton.jsx
├── index.js                # Barrel export file
└── README.md               # This file
```

## 🎯 Purpose

This skeleton component system provides loading placeholders that match the layout of actual admin pages, improving perceived performance and user experience during data loading.

## 🧩 Base Components

These are primitive, reusable building blocks that can be composed into page-specific skeletons.

### SkeletonCard

A generic card skeleton with pulsing animation effect.

**Props:**
- `height` (string): Height class (default: "h-32")
- `width` (string): Width class (default: "w-full")
- `rounded` (string): Border radius class (default: "rounded-lg")
- `className` (string): Additional custom classes

**Example:**
```jsx
<SkeletonCard height="h-40" width="w-64" />
```

### SkeletonText

Text placeholder with support for single or multiple lines.

**Props:**
- `lines` (number): Number of text lines (default: 1)
- `width` (string): Width - "full", "3/4", "1/2", "1/3", "1/4", or custom (default: "full")
- `height` (string): Height - "small", "medium", "large", or custom (default: "medium")
- `gap` (string): Gap between lines (default: "gap-2")
- `className` (string): Additional custom classes

**Example:**
```jsx
<SkeletonText lines={3} width="3/4" height="small" />
```

### SkeletonImage

Image placeholder with various shape options.

**Props:**
- `width` (string): Width class (default: "w-full")
- `height` (string): Height class (default: "h-40")
- `variant` (string): Shape - "rectangle", "circle", "square" (default: "rectangle")
- `rounded` (string): Border radius for rectangle (default: "rounded-lg")
- `className` (string): Additional custom classes

**Example:**
```jsx
<SkeletonImage variant="circle" width="w-32" height="h-32" />
```

### SkeletonStats

Stats card skeleton matching existing stats card layouts.

**Props:**
- `variant` (string): Layout - "horizontal" or "vertical" (default: "horizontal")
- `showIcon` (boolean): Show icon placeholder (default: true)
- `className` (string): Additional custom classes

**Example:**
```jsx
<SkeletonStats variant="vertical" />
```

### SkeletonTable

Table skeleton with header and configurable rows.

**Props:**
- `rows` (number): Number of table rows (default: 5)
- `columns` (number): Number of columns (default: 6)
- `showCheckbox` (boolean): Show checkbox column (default: true)
- `className` (string): Additional custom classes

**Example:**
```jsx
<SkeletonTable rows={10} columns={7} />
```

## 📄 Page-Specific Components

These compose the base components into complete page layouts.

### DashboardSkeleton

Loading skeleton for the AdminDashboard page.

**Layout:**
- Page title
- 2x2 grid of overview stats cards
- Stock Levels Chart section
- Recent Orders table

**Example:**
```jsx
import { DashboardSkeleton } from '../components/Skeleton';

const AdminDashboard = () => {
  const { data, loading } = useAdminDashboardData();
  
  if (loading) {
    return <DashboardSkeleton />;
  }
  
  return (/* actual dashboard content */);
};
```

### ItemsSkeleton

Loading skeleton for the Items page with grid/list view support.

**Props:**
- `viewMode` (string): "grid" or "list" (default: "grid")

**Layout:**
- Page title
- 5-column stats cards
- Education level filter tabs
- Search and filter controls
- Grid or list view of items

**Example:**
```jsx
import { ItemsSkeleton } from '../components/Skeleton';

const Items = () => {
  const [viewMode, setViewMode] = useState("grid");
  const { items, loading } = useItems();
  
  if (loading) {
    return <ItemsSkeleton viewMode={viewMode} />;
  }
  
  return (/* actual items content */);
};
```

### OrdersSkeleton

Loading skeleton for the Orders page.

**Layout:**
- Page title and action buttons
- Multiple sections of stats cards
- Status tabs (Processing/Claimed)
- Orders table with pagination

**Example:**
```jsx
import { OrdersSkeleton } from '../components/Skeleton';

const Orders = () => {
  const { orders, loading } = useOrders();
  
  if (loading) {
    return <OrdersSkeleton />;
  }
  
  return (/* actual orders content */);
};
```

### SettingsSkeleton

Loading skeleton for the Settings page.

**Layout:**
- Page title
- Profile image upload section
- Form fields (name, email, role)
- Action buttons

**Example:**
```jsx
import { SettingsSkeleton } from '../components/Skeleton';

const Settings = () => {
  const { profile, loading } = useAdminProfile();
  
  if (loading) {
    return <SettingsSkeleton />;
  }
  
  return (/* actual settings content */);
};
```

## 🚀 Usage

### Method 1: Import specific skeleton
```jsx
import { DashboardSkeleton } from '../components/Skeleton';

// Use in component
if (loading) return <DashboardSkeleton />;
```

### Method 2: Import base components for custom layouts
```jsx
import { SkeletonCard, SkeletonText } from '../components/Skeleton';

const CustomSkeleton = () => (
  <SkeletonCard>
    <SkeletonText lines={2} width="3/4" />
  </SkeletonCard>
);
```

### Method 3: Import all components
```jsx
import * as Skeleton from '../components/Skeleton';

if (loading) return <Skeleton.ItemsSkeleton viewMode="grid" />;
```

## 🎨 Design Features

- **Consistent Animation**: All components use a pulse animation for visual consistency
- **Responsive Design**: Matches the responsive behavior of actual components
- **Color Scheme**: Uses gray tones (bg-gray-200, bg-gray-300) matching the app's design
- **Flexible Composition**: Base components can be composed in different ways
- **Accurate Layouts**: Page-specific skeletons precisely match actual page layouts

## 🔧 Customization

All skeleton components accept a `className` prop for additional customization:

```jsx
<SkeletonCard className="my-4 mx-auto" />
<SkeletonText className="opacity-50" />
```

## 📝 Best Practices

1. **Use page-specific skeletons** for complete page loading states
2. **Use base components** for custom layouts or partial page loading
3. **Match the layout** - ensure skeleton matches the actual content layout
4. **Keep it simple** - don't over-complicate skeleton designs
5. **Test responsiveness** - verify skeletons look good at all screen sizes

## 🐛 Troubleshooting

**Skeleton doesn't match layout:**
- Compare skeleton component with actual page component
- Adjust grid columns, spacing, or sizing props

**Animation not smooth:**
- Ensure Tailwind's `animate-pulse` utility is available
- Check for CSS conflicts

**Import errors:**
- Verify file paths are correct
- Ensure barrel export (index.js) is properly configured

## 📚 Related Files

- Admin Pages: `frontend/src/admin/pages/`
- Admin Components: `frontend/src/admin/components/`
- Tailwind Config: `frontend/tailwind.config.js`
