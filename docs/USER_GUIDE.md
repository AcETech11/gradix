# Gradix Admin User Guide

This guide explains the standard Gradix workflow for school admins and headmasters.

## 1. Dashboard Overview

Use the dashboard to see setup progress, recent activity, pending uploads, published results, and parent access activity. Treat it as the control center for daily result operations.

## 2. School Setup

Complete onboarding before using Gradix fully:

- Enter school information.
- Upload logo and principal signature.
- Create classes.
- Create subjects.
- Assign subjects to classes.

## 3. Student Management

Add students from the Students module. Each student receives one permanent result code. Parents use this code later to check published results.

Student records should not be deleted for normal school operations. Use statuses instead:

- `active`: appears in normal templates and uploads.
- `repeated`: remains available for the selected class/year.
- `graduated`: hidden from active templates but historical reports remain available.
- `transferred`, `withdrawn`, `archived`: hidden from active templates but retained for records.

## 4. Excel Template Workflow

Open Templates, select a class, term, and academic year, then download the workbook.

The template includes:

- Student Code
- Student Name
- Admission Number
- Class
- Subject CA columns
- Subject Exam columns
- Subject Remark columns
- Instructions
- Grading Guide
- Class Subjects

Teachers should fill only CA, Exam, and Remark columns.

## 5. Result Upload

Open Uploads and upload the completed `.xlsx` workbook.

Gradix validates:

- Student code
- Student identity
- Class
- CA score from 0 to 40
- Exam score from 0 to 60
- Duplicate result rows

Fix validation errors before saving.

## 6. Publishing Results

Open Results to review saved uploads. Admins can edit scores where allowed. Admins and headmasters can publish results.

Published results become visible in the public parent result checker.

## 7. Parent Result Checker

Parents visit `/results` and enter the permanent student code. Gradix shows only published results.

If a code reaches its view limit, the parent sees a clear message to contact the school.

## 8. Report Card Printing

From the parent result page, use the print/download button. For best PDF output, disable browser headers and footers in the print dialog.

The report card can show:

- School logo
- School contact details
- Student details
- Subject results
- Performance summary
- Grading guide
- Class teacher comment
- Teacher signature
- Principal signature
- School seal/stamp area

## 9. Parent Access Monitoring

Open Parent Access to see:

- Total result views
- Students checked
- Students not checked
- Codes at limit
- Recent parent access activity
- Per-student view counts

Admins can reset views or increase access limits. Headmasters can view.

## 10. Audit Logs

Audit Logs show important system activity, including:

- Student changes
- Template generation
- Upload validation
- Result publishing
- Parent access reset
- Promotion/status changes

Use audit logs when investigating school workflow questions.

## 11. Analytics

Analytics summarizes school performance and usage. Data is scoped to the current school only.

## 12. Settings and Branding

Use Settings to update:

- School profile
- Logo
- Seal
- Principal signature
- Report title/settings
- Grading scale
- Staff roles
- Teacher signatures

Teacher accounts are optional. Schools can still use the recommended admin-upload workflow.

## 13. Class Promotion

After third term, open Promotion.

Promotion flow:

1. Select the source academic year.
2. Select the source class.
3. Enter/select the target academic year.
4. Select the target class.
5. Select students.
6. Confirm promotion.

Gradix updates the student's current class and creates an enrollment record for the new academic year. Historical result rows are not modified, so old report cards still show the original class and year.

You can also mark students as repeated, graduated, transferred, withdrawn, or archived.

## 14. Troubleshooting

- If a template has no students, confirm the students are active and in the selected class.
- If a template has no subjects, assign subjects to the class.
- If upload fails, review validation messages row by row.
- If a parent cannot view a result, confirm the result is published and the access limit has not been reached.
- If report branding is missing, check Settings and upload the relevant logo/signature/seal.
