# Welcome to the simulation of a Partners' mobile application that uses Mollie 👋

## Tech stack: 
* **Frontend:** React Native + Expo
* **Backend:** Firebase (Functions, Firestore/Realtime DB)
* **Distribution:** EAS Build (Internal), EAS Update

## Planning: 
**Timeline:** Mid-April 2025 - December 31st, 2025
**Constraint:** Approx. 4-8 hours per week

### Phase 1: Foundation (Mid-April - End of April 2025)

* **Goal:** Get the basic Expo app running locally and set up the initial Firebase backend structure.
* **Weekly Focus:** Environment setup, project initialization, basic navigation, Firebase connection.

#### Week 1 (Apr 14-20): Environment & Project Setup
- [x] Install necessary tools: Node.js (LTS), Yarn/npm, Expo CLI (`npm install -g expo-cli`), Firebase CLI (`npm install -g firebase-tools`).
- [x] Log in to Expo (`expo login`) and Firebase (`firebase login`).
- [x] Create new Expo project: `npx create-expo-app MolliePartnerSim` (choose "Blank (TypeScript)" template).
- [x] Run default app locally: `cd MolliePartnerSim && npx expo start`. Test in Expo Go or simulator/emulator.
- [x] Initialize Git repository: `git init && git add . && git commit -m "Initial project setup"`

#### Week 2 (Apr 21-27): Basic Navigation & Firebase Setup
- [x] Install React Navigation: Follow official Expo guide for `@react-navigation/native` and `@react-navigation/native-stack`.
- [X] Create placeholder screens: `HomeScreen.tsx`, `PaymentScreen.tsx`, `SettingsScreen.tsx`.
- [ ] Set up basic Stack Navigator in `App.tsx`.
- [ ] Create new project in Firebase Console.
- [ ] Add a "Web" app configuration in Firebase project; copy `firebaseConfig` object.
- [ ] Create `firebaseConfig.ts` in Expo project (add to `.gitignore`!), export config.
- [ ] Install Firebase JS SDK: `npx expo install firebase`.
- [ ] Initialize Firebase SDK in `App.tsx` or central setup file using config.

---

### Phase 2: Backend Basics & First Payment Prep (May 2025)

* **Goal:** Set up Firebase Functions, deploy a test function, and prepare backend logic for Mollie payments.
* **Weekly Focus:** Firebase Functions setup, first deploy, Mollie API key handling, basic payment creation endpoint structure.

#### Week 3 (Apr 28 - May 4): Firebase Functions Init
- [ ] In project root/subfolder, initialize Firebase Functions: `firebase init functions` (Choose TypeScript).
- [ ] Explore the generated `functions` folder structure (`src/index.ts`).

#### Week 4 (May 5-11): First Cloud Function
- [ ] Write a simple HTTP "hello world" function in `functions/src/index.ts`.
- [ ] Deploy the function: `firebase deploy --only functions`. Test the public URL.

#### Week 5 (May 12-18): Mollie API Setup (Backend)
- [ ] Get Mollie Test API key from Mollie Dashboard.
- [ ] Configure Firebase environment variable for API key: `firebase functions:config:set mollie.apikey="test_..."`.
- [ ] Install Mollie Node client in functions dir: `cd functions && npm install @mollie/api-client && cd ..`.

#### Week 6 (May 19-25): Basic Payment Creation Endpoint
- [ ] Structure a Cloud Function (`createMolliePayment`) that:
    - Initializes Mollie client (using API key from config).
    - Takes basic parameters (amount, currency - hardcoded initially).
    * Makes a basic call to `mollieClient.payments.create` (log result).
- [ ] Deploy and test triggering this function (e.g., via its URL).

---

### Phase 3: Google Pay & Apple Pay Integration (June 2025)

* **Goal:** Implement the end-to-end flow for Google Pay and Apple Pay.
* **Weekly Focus:** Researching RN payment libraries, implementing frontend triggers, connecting frontend to backend, testing native sheets.

#### Week 7 (May 26 - June 1): Research RN Payment Libraries
- [ ] **CRUCIAL:** Research Expo/RN libraries for Google Pay/Apple Pay *with Mollie*. Check Mollie docs & community resources. Choose a library.

#### Week 8 (June 2-8): Frontend UI & Backend Call
- [ ] Create simple UI on `PaymentScreen.tsx` with a "Start Payment" button.
- [ ] Implement call from Expo app (on button press) to deployed `createMolliePayment` function (use `Workspace`/`axios`). Pass dynamic amount/currency. Ensure backend returns payment ID/token.

#### Week 9-10 (June 9-22): Integrate Native Payment Sheet
- [ ] Install & configure the chosen RN payment library (from Week 7).
- [ ] Use backend response to trigger native Google Pay / Apple Pay sheet via the library.
- [ ] Handle response from native sheet (success, error, cancel).

#### Week 11-12 (June 23-30): Basic Testing & Status Check
- [ ] Add backend function `getMolliePaymentStatus(paymentId)`.
- [ ] Call status check function from frontend after successful sheet interaction. Display basic success/failure message.
- [ ] Perform initial tests: Android (Emulator/Device w/ test Google Pay) & iOS (Simulator/Device w/ Apple Dev setup - *paid account needed for device testing*).

---

### Phase 4: Mollie Components Integration (July - September 2025)

* **Goal:** Integrate embeddable Mollie Components (Credit Card).
* **Weekly Focus:** Researching Component integration in RN, implementing frontend rendering, backend adjustments, testing card payments.

#### July (Weeks 13-16): Research & Backend Prep
- [ ] **CRUCIAL:** Research how Mollie Components (JS SDK) integrate into RN/Expo (Wrapper? `WebView`?). Understand flow (client tokens?).
- [ ] Adjust/create backend functions to support Component payments (e.g., `method: 'creditcard'`) & generate tokens if needed.

#### August (Weeks 17-20): Frontend Implementation
- [ ] Install necessary libraries or set up `WebView` based on research.
- [ ] Create new screen/section to render Mollie Card Component.
- [ ] Implement logic to fetch tokens (if needed) and mount the component.

#### September (Weeks 21-24): Handling Submission & Testing
- [ ] Implement logic to get payment token/details from submitted Component.
- [ ] Send details securely to backend function to finalize payment.
- [ ] Handle success/failure responses; provide user feedback.
- [ ] Test thoroughly using Mollie's test card numbers.

---

### Phase 5: Testing, Refinement & Sharing (October - December 2025)

* **Goal:** Stabilize the MVP, improve error handling, and share via EAS Build.
* **Weekly Focus:** End-to-end testing, error handling implementation, code cleanup, EAS setup, sharing.

#### October (Weeks 25-28): Error Handling & Robustness
- [ ] Review all payment flows: add `try...catch`, handle network errors, check Mollie API errors.
- [ ] Implement user-friendly error messages.

#### November (Weeks 29-32): End-to-End Testing & Cleanup
- [ ] Test all payment methods repeatedly in Mollie test environment.
- [ ] Refactor code for clarity, consistency. Add comments.
- [ ] *(Optional Stretch Goal)* Add minimal state management if needed (e.g., Zustand, Redux Toolkit).

#### December (Weeks 33-36): EAS Build & Sharing
- [ ] Configure `eas.json` for `preview` / `internal` distribution profile.
- [ ] Ensure Apple Developer account / provisioning set up if testing iOS devices.
- [ ] Run `eas build --profile preview --platform all`.
- [ ] Share generated build links/QR codes with co-workers.
- [ ] Use `eas update` to push minor fixes based on feedback.
- [ ] Final check against MVP requirements.

## Notes
- Firebase project is created on personal gmail account, to avoid creation of Firebase project via Mollie-Developer account