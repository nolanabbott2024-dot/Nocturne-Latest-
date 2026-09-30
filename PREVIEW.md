# Nocturne Preview-First Workflow

## Live preview

Open the current web/TV frontend here before requesting an APK:

https://nocturne-latest.vercel.app

Source changes on `main` continue to run the web build and TV navigation verification, but they no longer automatically start the Android APK workflow.

## APK release

After the preview looks correct, trigger the Android build either:

1. manually with **Build Android APK → Run workflow** in GitHub Actions, or
2. by updating `.github/apk-build-request.txt` with the commit SHA that should be packaged.

The APK workflow always checks out the latest approved `main` source and bundles the React TV frontend into the Android app before Gradle packaging.

This keeps the workflow:

**edit → preview → verify → approve → APK**
