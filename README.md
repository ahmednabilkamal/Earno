# Earno

**Earno** is a mobile investment marketplace built with **Expo** and **React Native**. It connects **project owners** who want funding or partners with **investors** who browse opportunities across commercial, real estate, and investor-seeking listings.

The app is the companion client for the **Earno** backend (`earno.app`): users authenticate, discover and filter projects, save favorites, start conversations, pay publication fees through integrated checkout, manage support tickets, and receive push notifications—all with **English and Arabic** support, including **RTL** layouts for Arabic.

---

## What this repository contains

This repo is the **native iOS and Android app** (Expo SDK 54). It uses file-based routing (**Expo Router**), talks to a REST API over **Axios**, and ships features such as project creation (with media uploads), Moyasar-based payments, in-app messaging, FAQs, and account settings.

---

## Features

- **Roles**
  - **Project owner**: Create and publish projects (commercial / real estate), pay publication fees, manage listings.
  - **Investor**: Browse opportunities, filter by category and status, express interest, and post **investor-seeking** opportunities.
- **Discovery**: Home feed, search, filters (category, city, status), favorites, and saved items.
- **Engagement**: In-app chat between users around projects, notifications list (pull-to-refresh), and push notification hooks.
- **Monetization**: Coupon validation and **Moyasar** payment flow for fees and checkout.
- **Support**: Contact support, FAQs, and **support tickets** (create, list, detail).
- **Localization**: **English** and **Arabic** via **i18next**; RTL-aware screens for Arabic.
- **UX**: Tab-based navigation, skeleton loading, network error states, and a consistent Earno visual style (Cairo / Almarai fonts).

---

## Tech stack

| Area | Choice |
|------|--------|
| Runtime | [Expo](https://expo.dev) ~54, [React Native](https://reactnative.dev) |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, typed routes) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| HTTP | [Axios](https://axios-http.com/) |
| Server state / cache | [TanStack Query](https://tanstack.com/query) (where used) |
| Client state | [Zustand](https://zustand-demo.pmnd.rs/) (e.g. auth, pending project) |
| i18n | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) |
| Payments | [react-native-moyasar-sdk](https://www.npmjs.com/package/react-native-moyasar-sdk) |
| Icons | [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons, etc.) |
| Media | expo-image-picker, expo-image, expo-av / expo-video |

---

## Project structure

```text
app/                    # Routes (Expo Router)
  (tabs)/               # Main tabs: home, saved, profile, settings, …
  add-project/          # Multi-step project creation
  add-investor-project/ # Investor-seeking project flow
  chat/                 # Project messaging
  payment/              # Fees, coupons, Moyasar checkout
  notifications/        # In-app notification list
  my-tickets/           # Support tickets
  …                     # auth, project-details, search, etc.
assets/                 # Images, fonts, locale JSON (en / ar)
components/             # Shared UI (e.g. ProjectItem, sheets, Moyasar wrapper)
constants/              # API base URL, colors, copy constants
services/               # API modules (projects, auth, messages, payments, …)
store/                  # Zustand stores
utils/                  # API client, i18n, helpers
```

---

## Getting started

### Prerequisites

- Node.js (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) / `npx expo`
- For device builds: Xcode (iOS) and/or Android Studio (Android)

### Install

```bash
npm install
```

### Run

```bash
npx expo start
```

Then open in **Expo Go**, an **iOS simulator**, **Android emulator**, or a **development build** as needed.

Configure the API base URL in `constants/api.ts` if you point to a staging or local backend.

---

## License

This project is **private and proprietary**.
