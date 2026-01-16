<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
# Screenshot
<img width="1200" height="475" alt="ScreenShot1" src="https://github.com/jonzobrist/geoguard/blob/d6ac47af7c86692b8be1bffcb01d6aaf2d0f488c/images/geoguard-firewall-generator.png" />


Much thanks to ipverse on Github for the country-ip-blocks - https://github.com/ipverse/country-ip-blocks.git
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ch5lH_iD6POWnck3-NYhmlSZYJgeuOqF

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `pnpm install && pnpm approve-builds`
   Clone https://github.com/mkorthof/ipset-country and re-arrange it by running the process.sh script
   Select the things to approve and then answer yes.
2. ## not needed: Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
