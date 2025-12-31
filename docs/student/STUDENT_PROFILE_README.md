# Student Profile Page

## Overview

The Student Profile page is a modern and professional component for the La Verdad OrderFlow uniform ordering system. It displays student information and activity history in a clean, responsive layout.

## Architecture

Following the established project architecture pattern:

### **Component Structure**
- **StudentProfile.jsx** - Pure UI component (JSX/styling only)
- **useStudentProfile.js** - Business logic for profile data
- **useActivityFeed.js** - Business logic for activity feed

### **Separation of Concerns**
✅ **Component**: Contains ONLY UI/JSX/styling  
✅ **Hooks**: Handle all state management, API calls, filtering, pagination  
✅ **Services**: API integration through existing `api.js`

## Features

### Left Side - Profile Card
- **Profile Image**: Circular avatar with gold border (or initials if no image)
- **Student Name**: Large, bold text in navy blue
- **Course & Year Level**: Secondary text below name
- **Student Number**: Displayed with gold label
- **Email Address**: Read-only (from OAuth - @student.laverdad.edu.ph)

### Right Side - Activity Feed
- **Navigation Tabs**: Activities, Orders, History (navy blue when active)
- **Filter Controls**: Show All, Newest, Oldest dropdown
- **Activity List**: 
  - Icons for different activity types (cart, order, claim)
  - Highlighted keywords (product names in navy, education levels in gold)
  - Relative timestamps ("2 hours ago")
- **Pagination**: Back/Next buttons with page counter

## Design System

### Colors
- **Navy Blue**: `#003363` - Primary text, borders, buttons
- **Gold**: `#C5A572` - Accents, labels, highlights
- **White**: `#ffffff` - Card backgrounds
- **Gray**: Various shades for text hierarchy and backgrounds

### Typography
- **Large Bold**: Profile name (2xl)
- **Medium**: Section labels, activity descriptions
- **Small**: Timestamps, secondary info

### Spacing & Layout
- **Border Radius**: 8-12px for cards and buttons
- **Shadows**: Subtle `shadow-md` on cards
- **Grid Layout**: 1 column (mobile) → 3 columns (desktop)
- **Profile Card**: Takes 1/3 width on desktop
- **Activity Feed**: Takes 2/3 width on desktop

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Profile card stacked above activity feed
- Full-width components
- Touch-friendly buttons

### Tablet (768px - 1024px)
- Optimized spacing
- Side-by-side layout begins

### Desktop (≥ 1024px)
- 3-column grid (1 for profile, 2 for activity)
- Maximum width constraint (7xl)
- Hover effects on interactive elements

## File Structure

```
frontend/src/student/
├── pages/
│   ├── StudentProfile.jsx          # Main profile page component
│   └── STUDENT_PROFILE_README.md   # This file
├── hooks/
│   ├── profile/
│   │   ├── useStudentProfile.js    # Profile data hook
│   │   └── useActivityFeed.js      # Activity feed hook
│   └── index.js                    # Hook exports
└── components/
    └── common/
        └── Navbar.jsx              # Updated with profile navigation
```

## Usage

### Accessing the Profile Page

1. **From Navbar Dropdown** (Desktop):
   - Click on user profile button in top-right
   - Select "My Profile" from dropdown
   - Navigates to `/student/profile`

2. **From Mobile Menu**:
   - Open mobile menu (hamburger icon)
   - Tap "My Profile"
   - Navigates to `/student/profile`

### Route Configuration

```jsx
// In App.jsx
<Route
  path="/student/profile"
  element={
    <ProtectedRoute requiredRoles={["student"]}>
      <StudentProfile />
    </ProtectedRoute>
  }
/>
```

## Data Flow

### Profile Data
1. Component mounts → `useStudentProfile` hook executes
2. Hook fetches data from `/auth/profile` endpoint
3. Data normalized and stored in state
4. Component renders with profile information

### Activity Feed
1. Component mounts → `useActivityFeed` hook executes
2. Hook fetches activities (currently using mock data)
3. Activities filtered and sorted based on user selection
4. Paginated results displayed in UI

## API Integration

### Current Implementation
- **Profile Data**: Uses existing `authAPI.getProfile()`
- **Activity Data**: Currently uses mock data (ready for backend integration)

### Future Backend Integration
Replace mock data in `useActivityFeed.js`:

```javascript
// Replace this:
const mockActivities = generateMockActivities();

// With actual API call:
const response = await api.get(`/activities/${user.id}?type=${activeTab}`);
const activities = response.data;
```

## Customization

### Adding New Activity Types
In `useActivityFeed.js`, update the `generateMockActivities` function and add icon mapping in `StudentProfile.jsx`:

```javascript
// In StudentProfile.jsx
const getActivityIcon = (type) => {
  switch (type) {
    case "cart_add": return <ShoppingCart />;
    case "checkout": return <Package />;
    case "claimed": return <CheckCircle />;
    case "new_type": return <NewIcon />; // Add new type
    default: return <ShoppingCart />;
  }
};
```

## Testing Checklist

- [ ] Navigate to profile from desktop navbar dropdown
- [ ] Navigate to profile from mobile menu
- [ ] Verify profile information displays correctly
- [ ] Test tab switching (Activities, Orders, History)
- [ ] Test filter dropdown (Show All, Newest, Oldest)
- [ ] Test pagination (Back/Next buttons)
- [ ] Verify responsive design on mobile
- [ ] Verify responsive design on tablet
- [ ] Verify responsive design on desktop
- [ ] Test with different screen sizes
- [ ] Verify loading states display correctly
- [ ] Verify error states display correctly

## Notes

- Students never see pricing information (per project requirements)
- Email is read-only (comes from Google OAuth)
- Profile images stored via OAuth (Google profile picture)
- Activity feed ready for backend API integration
- All business logic extracted to custom hooks
- Component follows established design patterns

