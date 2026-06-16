# Gradix Final QA Checklist

Use this checklist before every school or investor demo. Test on desktop and a phone-sized viewport.

## 1. Authentication

- Register a new school owner and verify email.
- Log in with valid admin credentials.
- Confirm invalid credentials show a clear error.
- Confirm logout redirects to `/login`.
- Confirm unauthenticated dashboard access redirects to login.

## 2. Onboarding

- Complete School Information.
- Upload logo and principal signature.
- Add classes and assign optional class teachers.
- Add subjects and assign them to classes.
- Confirm duplicate classes/subjects show friendly validation.
- Finish onboarding and reach dashboard.

## 3. Students

- Add one student with parent details.
- Confirm permanent student code is generated.
- Edit student details and class assignment.
- Search by name, admission number, and student code.
- Confirm mobile student list uses readable cards or scroll.

## 4. Templates

- Select a class with students and assigned subjects.
- Download result template.
- Confirm the workbook includes Student Code, Student Name, Admission Number, Class, and each subject CA/Exam/Remark columns.
- Confirm Instructions, Grading Guide, and Class Subjects sheets are present.
- Confirm classes without subjects show a clear error.

## 5. Uploads

- Upload a completed `.xlsx` template.
- Confirm CA validates from 0 to 40.
- Confirm Exam validates from 0 to 60.
- Confirm duplicate results are detected.
- Save valid results and confirm success feedback.
- Confirm upload errors are readable and not raw database messages.

## 6. Results

- Open result review.
- Edit a score as admin.
- Add a class teacher comment.
- Publish result as admin/headmaster.
- Confirm teacher users cannot publish.
- Confirm unpublish/archive controls follow role rules.

## 7. Parent Portal

- Open `/results`.
- Enter a lowercase or spaced student code and confirm it normalizes.
- Confirm invalid code shows a clear error.
- Confirm unpublished results do not appear.
- Confirm published result opens with correct term/year data.
- Confirm access counter increments.
- Confirm limit reached message is clear.

## 8. PDF / Report Card

- Print/download a published result.
- Confirm browser-only controls are hidden in print.
- Confirm school logo, principal name, principal signature, teacher name/signature, teacher comment, and seal area appear.
- Confirm grades match the guide: A, B, C, D, F.
- Confirm score colors are readable and labels are visible.
- Confirm a normal result fits on one page.
- In the print dialog, disable browser headers and footers.

## 9. Parent Access Monitoring

- Open `/dashboard/parent-access` as admin.
- Confirm summary cards load.
- Filter by year, term, class, and status.
- Export Excel and confirm rows match filters.
- Reset views for a student.
- Increase view limit.
- Confirm the same student code still works after reset.
- Confirm headmaster is view-only.
- Confirm teacher cannot access the page.

## 10. Audit Logs

- Confirm student create/update/archive logs appear.
- Confirm template generation/upload/result publish logs appear.
- Confirm parent access reset and limit update logs appear.
- Filter audit logs by action/entity/date.
- Export audit logs.

## 11. Analytics

- Confirm analytics page loads without blank states.
- Confirm cards/charts are scoped to the current school.
- Confirm empty analytics states are readable when no data exists.

## 12. Settings

- Update school profile fields.
- Upload logo, seal, and principal signature.
- Update report settings and grading scale.
- Upload a teacher signature from User Management.
- Confirm headmaster can view settings but cannot manage users.
- Confirm teacher accounts are clearly marked optional.

## 13. Mobile QA

- Test `/login`, `/register`, `/onboarding`, `/dashboard`, `/dashboard/students`, `/dashboard/templates`, `/dashboard/uploads`, `/dashboard/results`, `/dashboard/parent-access`, `/dashboard/audit`, `/dashboard/analytics`, `/dashboard/settings`, `/results`, and `/results/[code]`.
- Confirm no horizontal page overflow.
- Confirm modals fit inside the screen.
- Confirm sticky actions do not cover form fields.
- Confirm buttons are large enough to tap.
- Confirm tables become cards or scroll cleanly.

## 14. Security QA

- Confirm all dashboard data is scoped by current user's `school_id`.
- Confirm no action accepts client-provided `school_id`.
- Confirm public parent portal only returns published result data.
- Confirm storage paths include school scope.
- Confirm role checks happen server-side.
- Confirm teacher users cannot access settings, audit logs, parent access, publishing, or user management.

## 15. Build QA

- Run `npx.cmd tsc --noEmit`.
- Run `npm.cmd run lint`.
- Run `npm.cmd run build`.
- If build fails only on Google Fonts in a restricted environment, rerun with network access and confirm the production build passes.
