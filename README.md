# SeeMenu: A Community-driven Restaurant and Food Menu Discovery Platform (WIP)

**SeeMenu is a community-driven restaurant and food menu discovery platform designed for Bangladesh.**

Finding restaurant menus often means searching through scattered social media posts and listings. SeeMenu aims to make that process easier by bringing restaurant information and menu photos into one accessible platform, with community contributions and moderation.

## Features

### Implemented

* **Responsive landing page:** Initial restaurant listings and search interface built with React.
* **Search and filtering:** Search fields filter the current sample restaurant listings, with an empty-results state.
* **User authentication:** Signup with email verification, login, and logout using Supabase Auth.
* **Role-aware routing:** Initial protected routes for Contributor, Moderator, and Admin roles.
* **PostgreSQL schema:** Initial tables for profiles, restaurants, menu images, comments, votes, reports, restaurant requests, and notifications.
* **Express backend:** Node.js and Express server with a working API health-check endpoint.
* **Responsive foundation:** Initial mobile layout issues addressed.

## Tech Stack

| Component      | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Frontend       | React.js, Vite                                             |
| Styling        | Tailwind CSS                                               |
| Routing        | React Router                                               |
| Backend        | Node.js, Express.js                                        |
| API            | REST                                                       |
| Database       | Supabase PostgreSQL                                        |
| Authentication | Supabase Auth                                              |
| Access control | Role-aware routing and PostgreSQL Row Level Security (RLS) |
| Image storage  | Supabase Storage — planned for menu uploads                |

## User Roles

| Role        | Intended responsibilities                        |
| ----------- | ------------------------------------------------ |
| Contributor | Submit restaurant information and menu photos    |
| Moderator   | Review submissions and reports                   |
| Admin       | Manage users, permissions, and platform activity |

The roles and initial route protection are part of the current implementation. Full moderation and administration workflows remain under development. Authorization must also be enforced at the database or backend level.

## Database Schema

The initial database includes the following tables:

* `profiles`
* `restaurants`
* `menu_images`
* `comments`
* `restaurant_votes`
* `menu_image_votes`
* `reports`
* `restaurant_requests`
* `notifications`

These tables provide the foundation for restaurant discovery, user contributions, community feedback, moderation, and notifications. The existence of a table does not imply that its associated feature is complete.

## Project Structure

```text
SeeMenu/
├── client/       # React frontend
├── server/       # Node.js and Express backend
└── README.md
```

## Design Philosophy

SeeMenu prioritizes usability, readability, and accessibility.

* Warm ivory backgrounds with soft mint, pink, and teal accents.
* Minimalist layouts with subtle brutalist and retro/vintage influences.
* Straightforward navigation and practical search.
* Responsive layouts without unnecessary visual effects or decorative clutter.
