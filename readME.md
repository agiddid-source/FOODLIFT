# FOODLIFT --- Wholesale Order Management System (Frontend)

## Current Development Phase

- [x] Project Planning
- [x] Folder Structure
- [ ] Customer Module
- [ ] Warehouse Module
- [ ] Rider Module
- [ ] Warehouse Agent Module
- [ ] Final Integration
- [ ] QA & Bug Fixes

## Project Overview

This project is a frontend implementation of a **Wholesale Order Management System** built with:

- HTML5
- Tailwind CSS
- Vanilla JavaScript (ES6 Modules)

The application consists of four user roles:

1. Customer
2. Warehouse
3. Rider
4. Warehouse Agent

Development will be carried out **role-by-role**, starting with the **Customer** module.

---

# Project Architecture

This project follows a **Single Dashboard + Modular JavaScript** architecture.

Each user role has **one dashboard page**.

Instead of navigating between multiple pages, users remain on the same dashboard while JavaScript switches between sections and opens/closes modals.

Example:

Customer Dashboard

→ Dashboard

→ Products

→ Wallet

→ Orders

→ Profile

No unnecessary page navigation.

---

# HTML Structure

Each user role should have **one HTML dashboard**.

Example:

customer.html

├── Sidebar

├── Top Navigation

├── Dashboard Section

├── Products Section

├── Wallet Section

├── Orders Section

├── Profile Section

├── Product Modal

├── Checkout Modal

├── Wallet Modal

├── Order Details Modal

└── Success Modal


Warehouse, Rider and Warehouse Agent should follow the same structure.

---

# JavaScript Structure

Each feature should have its own JavaScript module.

Example:

customer/

dashboard.js

products.js

cart.js

wallet.js

checkout.js

orders.js

profile.js

Each module is responsible only for its own feature.

Avoid manipulating another module directly.

---

# Shared Components

Reusable UI functionality belongs inside:

js/components/

Examples:

- modal.js
- drawer.js
- toast.js
- dropdown.js
- tabs.js
- loader.js
- badge.js
- table.js

These should be reused across the entire project instead of rewriting the same functionality.

---

# Team Folder Ownership

| Team Member | Responsibility |
|------------|----------------|
| Code_Nexus | auth/, core/, utils/, main.js |
| Ghost | components/, customer/dashboard.js, customer/products.js |
| Ezzey | customer/cart.js, customer/wallet.js, customer/checkout.js |
| Jesicca | customer/orders.js, customer/profile.js, customer/qr.js, customer/timeline.js |

Developers should primarily modify files within their assigned folders.

---

# Development Rules

## 1. One Dashboard Per Role

Do not create multiple pages for one user role.

Each role should have one dashboard HTML file.

Navigation should be handled by showing and hiding sections.

---

## 2. Use Modals

Actions such as:

- Product Details
- Checkout
- Wallet Funding
- Order Details
- Confirmation Messages

should use modals instead of new pages.

---

## 3. Frontend Only

This project is **Frontend only**.

Do **not** simulate backend functionality.

Examples of backend logic that should **NOT** be implemented:

- Authentication
- Wallet funding
- Payment processing
- Inventory reservation
- Order persistence
- Email sending
- QR generation
- Database CRUD operations

JavaScript should only handle:

- UI interactions
- Navigation
- Form validation
- Tabs
- Dropdowns
- Drawers
- Modals
- Responsive menus
- Visual state updates

---

## 4. Reuse Components

Before creating a new modal, toast, drawer or helper function:

Check if it already exists.

Reuse existing components whenever possible.

Avoid duplicate implementations.

---

## 5. Keep Modules Independent

Each JavaScript module should only manage its own feature.

Example:

products.js

✓ Product interactions

✗ Wallet interactions

✗ Orders interactions

---

## 6. Naming Convention

HTML Files

kebab-case

Example:

login.html

forgot-password.html

warehouse-agent.html

---

JavaScript Files

kebab-case

Example:

product-modal.js

forgot-password.js

wallet.js

---

Variables & Functions

camelCase

Example:

walletBalance

showModal()

toggleSidebar()

---

Constants

UPPER_SNAKE_CASE

Example:

MAX_CART_ITEMS

DEFAULT_PAGE_SIZE

---

# Git Workflow

- Create a feature branch before starting work.
- Pull the latest changes before pushing.
- Commit frequently with meaningful commit messages.
- Open a Pull Request for review before merging.
- Resolve merge conflicts in your feature branch before requesting approval.
- Do not commit directly to the main branch.

---

# Architecture Notes

Why are we **not** using HTML components?

HTML does not support importing reusable HTML components like React or Vue without additional tooling.

Instead:

- Keep one HTML dashboard per role.
- Organize functionality into JavaScript modules.
- Reuse JavaScript helper functions through `js/components/`.
- Keep the HTML simple and easy to maintain.

This architecture reduces complexity, minimizes merge conflicts, and makes backend integration easier in later stages.

---

# Team Convention

> **One Dashboard. Modular JavaScript. Reusable Components. Minimal Page Navigation.**

Every user role should have a single dashboard page. Features should be separated into JavaScript modules, while shared UI behavior should be reused through the `components` folder.

This architecture keeps the project organized, scalable, and easy to maintain throughout all development phases.